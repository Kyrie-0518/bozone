import { db } from '../db.js'
import { tiktokShop, order, orderItem, syncLog, product as productTable } from '../db-schema.js'
import { apiCall, refreshToken } from './tiktok-auth.js'
import { eq, and } from 'drizzle-orm'

// TikTok OrderSearch response shape (per official SDK)
interface TKOrderBrief {
  id: string
  status: string
  createTime?: number
  updateTime?: number
  buyerNickname?: string
  payment?: {
    amount?: { currency: string; value_string: string }
    platform_discount?: { currency: string; value_string: string }
    shipping_fee?: { currency: string; value_string: string }
    tax?: { currency: string; value_string: string }
    transaction_amount?: { currency: string; value_string: string }
  }
  lineItems?: Array<{
    id: string
    sku_id?: string
    seller_sku: string
    product_name: string
    sku_name?: string
    quantity: number
    price?: {
      amount?: { currency: string; value_string: string }
    }
  }>
  recipientAddress?: {
    name?: string
  }
  trackingNumber?: string
  shippingProvider?: string
}

// TikTok order status → local status mapping
function mapOrderStatus(tkStatus: string): string {
  const map: Record<string, string> = {
    UNPAID: '待付款',
    ON_HOLD: '审核中',
    AWAITING_SHIPMENT: '待发货',
    PARTIALLY_SHIPPING: '部分发货',
    AWAITING_COLLECTION: '待取件',
    IN_TRANSIT: '运输中',
    DELIVERED: '已签收',
    COMPLETED: '已完成',
    CANCELLED: '已取消',
    RETURN_REQUESTED: '退货申请',
    RETURN_IN_PROGRESS: '退货中',
  }
  return map[tkStatus] || tkStatus
}

// Extract numeric value from TikTok price object (handles nested amount wrapper)
function extractAmount(val: any): number {
  if (!val) return 0
  // Direct: { value_string: "10.99" }
  if (val.value_string) return parseFloat(val.value_string) || 0
  // Nested: { amount: { value_string: "10.99" } }
  if (val.amount?.value_string) return parseFloat(val.amount.value_string) || 0
  // Fallback: try parsing as string/number directly
  return parseFloat(String(val)) || 0
}

// Sync orders for a specific shop
export async function syncShopOrders(shopRow: typeof tiktokShop.$inferSelect): Promise<{
  total: number; success: number; fail: number
}> {
  const now = new Date().toISOString()
  const syncRun = await db.insert(syncLog).values({
    shopId: shopRow.id,
    type: 'order',
    status: 'running',
    total: 0,
    success: 0,
    fail: 0,
    startedAt: now,
    createdAt: now,
  } as any)
  const logId = Number((syncRun as any).insertId || 0)

  let token = shopRow.accessToken
  const shopCipher = shopRow.shopCipher
  let total = 0, success = 0, fail = 0

  try {
    // 1. Search orders (last 7 days) — per SDK spec:
    //    Query params: page_size, sort_field, sort_order, shop_cipher
    //    Body: create_time_ge (Unix timestamp filter)
    const fromTime = Math.floor(Date.now() / 1000) - 7 * 86400
    console.log(`[OrderSync] Searching orders from ${new Date(fromTime * 1000).toISOString()} ...`)

    const searchResult = await apiCall(
      '/order/202309/orders/search',
      token,
      shopCipher,
      {
        method: 'POST',
        body: { create_time_ge: fromTime },
        _extraQuery: { page_size: '50', sort_field: 'create_time', sort_order: 'DESC' },
      } as any,
    )

    // Response structure: { data: { orders: [...], next_page_token: "..." } }
    const orderList: TKOrderBrief[] = searchResult?.data?.orders || []
    total = orderList.length
    console.log(`[OrderSync] Found ${total} orders for shop ${shopRow.shopId}`)

    // 2. Each search result already has full details — upsert directly
    for (const tkOrder of orderList) {
      try {
        const orderId = tkOrder.id
        if (!orderId) {
          console.warn('[OrderSync] Skipping order without id')
          fail++
          continue
        }

        // Payment extraction
        const pay = tkOrder.payment || {}
        const totalAmt = extractAmount(pay.amount) || extractAmount({ value_string: String((pay as any).transaction_amount || (pay as any).total_amount) })
        const shipFee = extractAmount(pay.shipping_fee)
        const discount = extractAmount(pay.platform_discount)
        const taxes = extractAmount(pay.tax)

        const orderData = {
          orderNo: orderId,
          shopId: shopRow.id,
          buyerName: tkOrder.buyerNickname || tkOrder.recipientAddress?.name || '',
          status: mapOrderStatus(tkOrder.status),
          paymentStatus: tkOrder.status === 'UNPAID' ? 'unpaid' : 'paid',
          logisticsStatus: tkOrder.status || '',
          trackingNo: tkOrder.trackingNumber || '',
          carrier: tkOrder.shippingProvider || '',
          itemTotal: totalAmt,
          shippingFee: shipFee,
          discount: discount,
          taxes: taxes,
          actualAmount: Math.max(0, totalAmt - discount),
          currency: pay.amount?.currency || 'MYR',
          orderTime: tkOrder.createTime ? new Date(tkOrder.createTime * 1000).toISOString() : now,
          updatedAt: now,
        }

        // Check if already exists
        const existing = await db.select().from(order)
          .where(eq(order.orderNo, orderId))
          .limit(1)

        if (existing.length > 0) {
          // Update
          await db.update(order).set(orderData).where(eq(order.id, existing[0].id))

          // Remove old items & reinsert
          await db.delete(orderItem).where(eq(orderItem.orderId, existing[0].id))

          // Re-insert items
          const lines = tkOrder.lineItems || []
          for (const line of lines) {
            let pId: number | null = null
            if (line.seller_sku) {
              const products = await db.select().from(productTable)
                .where(eq(productTable.sku, line.seller_sku)).limit(1)
              if (products.length > 0) pId = products[0].id
            }

            const itemPrice = extractAmount(line.price)
            await db.insert(orderItem).values({
              orderId: existing[0].id,
              productId: pId as any,
              sku: line.seller_sku || line.sku_id || '',
              productName: line.product_name || line.sku_name || '',
              quantity: line.quantity || 1,
              unitPrice: itemPrice,
              subtotal: itemPrice * (line.quantity || 1),
            } as any)
          }
        } else {
          // Insert
          const insertResult = await db.insert(order).values({
            ...orderData,
            createdAt: now,
          } as any)
          const newOrderId = Number((insertResult as any).insertId)

          // Insert items
          const lines = tkOrder.lineItems || []
          for (const line of lines) {
            let pId: number | null = null
            if (line.seller_sku) {
              const products = await db.select().from(productTable)
                .where(eq(productTable.sku, line.seller_sku)).limit(1)
              if (products.length > 0) pId = products[0].id
            }

            const itemPrice = extractAmount(line.price)
            await db.insert(orderItem).values({
              orderId: newOrderId,
              productId: pId as any,
              sku: line.seller_sku || line.sku_id || '',
              productName: line.product_name || line.sku_name || '',
              quantity: line.quantity || 1,
              unitPrice: itemPrice,
              subtotal: itemPrice * (line.quantity || 1),
            } as any)
          }
        }

        success++
        if (success % 10 === 0) {
          console.log(`[OrderSync] Progress: ${success}/${total}`)
        }
      } catch (e: any) {
        console.error(`[OrderSync] Failed order ${tkOrder.id}:`, e.message?.slice(0, 200))
        fail++
      }
    }

    // Update sync timestamp
    await db.update(tiktokShop).set({
      lastSyncedAt: now,
      updatedAt: now,
    }).where(eq(tiktokShop.id, shopRow.id))

  } catch (e: any) {
    console.error('[OrderSync] Sync failed:', e.message)
    if (logId) {
      await db.update(syncLog).set({
        status: 'failed',
        error: e.message,
        total,
        success,
        fail,
        finishedAt: new Date().toISOString(),
      }).where(eq(syncLog.id, logId))
    }
    return { total, success, fail }
  }

  // Update sync log
  if (logId) {
    await db.update(syncLog).set({
      status: 'completed',
      total,
      success,
      fail,
      finishedAt: new Date().toISOString(),
    }).where(eq(syncLog.id, logId))
  }

  console.log(`[OrderSync] Done: ${success} success, ${fail} fail`)
  return { total, success, fail }
}

// Sync all enabled shops
export async function syncAllShops(): Promise<Record<number, { total: number; success: number; fail: number }>> {
  const shops = await db.select().from(tiktokShop).where(eq(tiktokShop.syncEnabled, true))
  const results: Record<number, { total: number; success: number; fail: number }> = {}

  for (const shop of shops) {
    if (!shop.accessToken || !shop.shopCipher) {
      console.log(`[OrderSync] Skipping shop ${shop.shopId}: missing token or cipher`)
      continue
    }
    console.log(`[OrderSync] Syncing shop: ${shop.name || shop.shopId}`)
    results[shop.id] = await syncShopOrders(shop)
    // Delay between shops to avoid rate limiting
    await new Promise(r => setTimeout(r, 2000))
  }

  return results
}
