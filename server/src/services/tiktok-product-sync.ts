import { db } from '../db.js'
import { tiktokShop, product as productTable, syncLog } from '../db-schema.js'
import { apiCall } from './tiktok-auth.js'
import { eq, and } from 'drizzle-orm'

// Per SDK ProductSearch response
interface TKProductBrief {
  id: string
  title?: string
  status?: string
  create_time?: number
  update_time?: number
  skus?: Array<{
    id: string
    sellerSku?: string
    price?: {
      currency?: string
      salePrice?: string
      taxExclusivePrice?: string
    }
    inventory?: Array<{
      quantity?: number
      warehouseId?: string
    }>
    image?: any
  }>
  images?: Array<any>
  description?: string
}

function extractPrice(sku: any): number {
  if (!sku?.price) return 0
  // SDK: price.salePrice is a plain string like "10.99"
  const p = sku.price.salePrice || sku.price.taxExclusivePrice || ''
  return parseFloat(String(p)) || 0
}

function extractStock(sku: any): number {
  if (!sku?.inventory?.length) return 0
  // Sum across all warehouses
  return sku.inventory.reduce((sum: number, inv: any) => sum + (inv.quantity || 0), 0)
}

const statusMap: Record<string, string> = {
  ACTIVE: '上架', ACTIVATE: '上架',
  INACTIVE: '下架', SELLER_DEACTIVATED: '下架', PLATFORM_DEACTIVATED: '下架',
  FROZEN: '冻结', FREEZE: '冻结',
  DELETED: '已删除',
  DRAFT: '草稿', PENDING: '审核中', FAILED: '驳回',
  SCHEDULED: '定时发布',
}

// Sync products for a specific shop (with pagination)
export async function syncShopProducts(shopRow: typeof tiktokShop.$inferSelect): Promise<{
  total: number; success: number; fail: number
}> {
  const now = new Date().toISOString()
  const syncRun = await db.insert(syncLog).values({
    shopId: shopRow.id, type: 'product', status: 'running',
    total: 0, success: 0, fail: 0, startedAt: now, createdAt: now,
  } as any)
  const logId = Number((syncRun as any).insertId || 0)

  const token = shopRow.accessToken
  const shopCipher = shopRow.shopCipher
  let total = 0, success = 0, fail = 0

  try {
    console.log(`[ProductSync] Searching ALL products for shop ${shopRow.shopId} ...`)

    const allProducts: TKProductBrief[] = []
    let pageToken = ''
    let pageCount = 0
    const MAX_PAGES = 100

    do {
      const queryExtras: Record<string, string> = { page_size: '50' }
      if (pageToken) queryExtras.page_token = pageToken

      // Per SDK: page_size/page_token/shop_cipher are QUERY params
      const searchResult = await apiCall(
        '/product/202309/products/search',
        token,
        shopCipher,
        {
          method: 'POST',
          _extraQuery: queryExtras,
        } as any,
      )

      const pageList: TKProductBrief[] = searchResult?.data?.products || searchResult?.data?.product_list || []
      allProducts.push(...pageList)
      pageToken = searchResult?.data?.next_page_token || ''
      pageCount++

      console.log(`[ProductSync] Page ${pageCount}: got ${pageList.length} products, total=${allProducts.length}, hasMore=${!!pageToken}`)

      if (pageToken) await new Promise(r => setTimeout(r, 500))
    } while (pageToken && pageCount < MAX_PAGES)

    total = allProducts.length
    console.log(`[ProductSync] Found ${total} products for shop ${shopRow.shopId}`)

    // Upsert each product
    for (const tkProd of allProducts) {
      try {
        const productId = tkProd.id
        if (!productId) { fail++; continue }

        // Use correct SDK field names: title, sellerSku, price.salePrice, inventory[].quantity
        const skus = tkProd.skus || []
        
        let mainImage = ''
        if (tkProd.images?.length) {
          mainImage = typeof tkProd.images[0] === 'string' ? tkProd.images[0] : tkProd.images[0]?.url || ''
        }
        if (!mainImage && skus[0]?.image) {
          const img = skus[0].image
          mainImage = typeof img === 'string' ? img : img?.url || ''
        }

        const allImages = (tkProd.images || []).map((i: any) => 
          typeof i === 'string' ? i : i.url
        ).filter(Boolean)

        const totalStock = skus.reduce((sum, s) => sum + extractStock(s), 0)
        const minPrice = skus.length > 0
          ? Math.min(...skus.map(s => extractPrice(s)))
          : 0

        const firstSku = skus[0] || {}
        const productData = {
          name: tkProd.title || '',
          sku: firstSku.sellerSku || productId,
          image: mainImage,
          images: JSON.stringify(allImages),
          category: '',  // search response doesn't include category name
          weight: 0,     // search response doesn't include weight
          stock: totalStock,
          sellPrice: minPrice,
          platformProductId: productId,
          status: statusMap[tkProd.status || ''] || tkProd.status || '未知',
          shopId: shopRow.id,
          updatedAt: now,
        }

        const existing = await db.select().from(productTable)
          .where(eq(productTable.platformProductId, productId))
          .limit(1)

        if (existing.length > 0) {
          await db.update(productTable).set(productData)
            .where(eq(productTable.id, existing[0].id))
        } else {
          await db.insert(productTable).values({
            ...productData, createdAt: now, costPrice: 0,
          } as any)
        }

        success++
        if (success % 10 === 0) {
          console.log(`[ProductSync] Progress: ${success}/${total}`)
        }
      } catch (e: any) {
        console.error(`[ProductSync] Failed product ${tkProd.id}:`, e.message?.slice(0, 200))
        fail++
      }
    }

    await db.update(tiktokShop).set({ lastSyncedAt: now, updatedAt: now })
      .where(eq(tiktokShop.id, shopRow.id))

  } catch (e: any) {
    console.error('[ProductSync] Sync failed:', e.message)
    if (logId) {
      await db.update(syncLog).set({
        status: 'failed', error: e.message, total, success, fail,
        finishedAt: new Date().toISOString(),
      }).where(eq(syncLog.id, logId))
    }
    return { total, success, fail }
  }

  if (logId) {
    await db.update(syncLog).set({
      status: 'completed', total, success, fail,
      finishedAt: new Date().toISOString(),
    }).where(eq(syncLog.id, logId))
  }

  console.log(`[ProductSync] Done: ${success} success, ${fail} fail`)
  return { total, success, fail }
}

// Sync all enabled shops
export async function syncAllProducts(): Promise<Record<number, { total: number; success: number; fail: number }>> {
  const shops = await db.select().from(tiktokShop).where(eq(tiktokShop.syncEnabled, true))
  const results: Record<number, { total: number; success: number; fail: number }> = {}

  for (const shop of shops) {
    if (!shop.accessToken || !shop.shopCipher) {
      console.log(`[ProductSync] Skipping shop ${shop.shopId}: missing token or cipher`)
      continue
    }
    console.log(`[ProductSync] Syncing shop: ${shop.name || shop.shopId}`)
    results[shop.id] = await syncShopProducts(shop)
    await new Promise(r => setTimeout(r, 2000))
  }

  return results
}
