import { db } from '../db.js'
import { tiktokShop, order, orderItem, syncLog, product as productTable } from '../db-schema.js'
import { apiCall, refreshToken } from './tiktok-auth.js'
import { eq, and } from 'drizzle-orm'

interface TikTokOrder {
  order_id: string
  order_status: string
  create_time: number
  update_time: number
  buyer_name?: string
  order_lines?: Array<{
    id: string
    sku_id: string
    seller_sku: string
    product_name: string
    sku_name: string
    quantity: number
    price: { amount: string; currency: string }
  }>
  payment?: {
    total_amount: string
    currency: string
    shipping_fee: string
    platform_discount: string
    tax: string
  }
  delivery?: {
    recipient_name: string
    tracking_number: string
    shipping_provider: string
  }
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
    // 1. Search orders (last 7 days)
    // NOTE per SDK: page_size/sort_order/sort_field/shop_cipher are QUERY params,
    //   only filter fields like create_time_ge go in JSON body
    const fromTime = Math.floor(Date.now() / 1000) - 7 * 86400
    const searchResult = await apiCall(
      '/order/202309/orders/search',
      token,
      shopCipher,
      {
        method: 'POST',
        // Query params are set via extraParams in apiCall → call()
        // We need to pass page_size/sort as query params
        body: {
          create_time_ge: fromTime,
        },
        _extraQuery: { page_size: '50', sort_field: 'create_time', sort_order: 'ASC' },
      } as any,
    )

    const orderList: Array<{ order_id: string; order_status: string }> =
      searchResult?.data?.orders || searchResult?.data?.order_list || []

    total = orderList.length
    console.log(`[OrderSync] Found ${total} orders for shop ${shopRow.shopId}`)

    // 2. For each order, get details and upsert
    for (const brief of orderList) {
      try {
        // Get order detail
        const detail = await apiCall(
          `/order/202309/orders/${brief.order_id}`,
          token,
          shopCipher,
          { method: 'GET' },
        )

        const tkOrder: TikTokOrder = detail?.data || detail
        if (!tkOrder || !tkOrder.order_id) {
          fail++
          continue
        }

        // Check if already exists
        const existing = await db.select().from(order)
          .where(eq(order.orderNo, tkOrder.order_id))
          .limit(1)

        const orderData = {
          orderNo: tkOrder.order_id,
          shopId: shopRow.id,
          buyerName: tkOrder.buyer_name || tkOrder.delivery?.recipient_name || '',
          status: mapOrderStatus(tkOrder.order_status),
          paymentStatus: tkOrder.order_status === 'UNPAID' ? 'unpaid' : 'paid',
          logisticsStatus: tkOrder.order_status || '',
          trackingNo: tkOrder.delivery?.tracking_number || '',
          carrier: tkOrder.delivery?.shipping_provider || '',
          itemTotal: parseFloat(tkOrder.payment?.total_amount || '0'),
          shippingFee: parseFloat(tkOrder.payment?.shipping_fee || '0'),
          discount: parseFloat(tkOrder.payment?.platform_discount || '0'),
          taxes: parseFloat(tkOrder.payment?.tax || '0'),
          actualAmount: parseFloat(tkOrder.payment?.total_amount || '0'),
          currency: tkOrder.payment?.currency || 'MYR',
          orderTime: tkOrder.create_time
            ? new Date(tkOrder.create_time * 1000).toISOString()
            : now,
          updatedAt: now,
        }

        if (existing.length > 0) {
          // Update
          await db.update(order).set(orderData).where(eq(order.id, existing[0].id))

          // Remove old items & reinsert
          await db.delete(orderItem).where(eq(orderItem.orderId, existing[0].id))
        } else {
          // Insert
          const insertResult = await db.insert(order).values({
            ...orderData,
            createdAt: now,
          } as any)
          const newOrderId = Number((insertResult as any).insertId)

          // Insert order items
          const lines = tkOrder.order_lines || []
          for (const line of lines) {
            // Try to match product by seller_sku
            let pId: number | null = null
            if (line.seller_sku) {
              const products = await db.select().from(productTable)
                .where(eq(productTable.sku, line.seller_sku))
                .limit(1)
              if (products.length > 0) pId = products[0].id
            }

            const itemPrice = parseFloat(line.price?.amount || '0')
            await db.insert(orderItem).values({
              orderId: newOrderId,
              productId: pId as any,
              sku: line.seller_sku || line.sku_id,
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
        console.error(`[OrderSync] Failed order ${brief.order_id}:`, e.message)
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
    if (syncRun) {
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
