import { db } from '../db.js'
import { tiktokShop, product as productTable, syncLog } from '../db-schema.js'
import { apiCall } from './tiktok-auth.js'
import { eq, and } from 'drizzle-orm'

interface TikTokProductDetail {
  product_id: string
  product_status: string
  title: string
  description?: string
  create_time?: number
  category?: { id: string; name: string }
  skus?: Array<{
    id: string
    seller_sku: string
    name: string
    price: { amount: string; currency: string }
    stock: number
    package_weight: number
    image?: { thumb_url: string }
  }>
  main_images?: Array<{ url: string }>
  package_weight?: number
}

// Sync products for a specific shop
export async function syncShopProducts(shopRow: typeof tiktokShop.$inferSelect): Promise<{
  total: number; success: number; fail: number
}> {
  const now = new Date().toISOString()
  const syncRun = await db.insert(syncLog).values({
    shopId: shopRow.id,
    type: 'product',
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
    // 1. Search products
    const searchResult = await apiCall(
      '/product/202309/products/search',
      token,
      shopCipher,
      {
        method: 'POST',
        body: { page_size: 100 },
      },
    )

    const productList: Array<{ product_id: string; product_status: string }> =
      searchResult?.data?.products || searchResult?.data?.product_list || []

    total = productList.length
    console.log(`[ProductSync] Found ${total} products for shop ${shopRow.shopId}`)

    // 2. For each product, get details and upsert
    for (const brief of productList) {
      try {
        const detail = await apiCall(
          `/product/202309/products/${brief.product_id}`,
          token,
          shopCipher,
          { method: 'GET' },
        )

        const tkProduct: TikTokProductDetail = detail?.data || detail
        if (!tkProduct || !tkProduct.product_id) {
          fail++
          continue
        }

        // Map status
        const statusMap: Record<string, string> = {
          ACTIVE: '上架', INACTIVE: '下架',
          FROZEN: '冻结', DELETED: '已删除',
        }

        // Build SKUs JSON
        const skus = (tkProduct.skus || []).map(s => ({
          id: s.id,
          sellerSku: s.seller_sku || '',
          name: s.name || '',
          price: parseFloat(s.price?.amount || '0'),
          stock: s.stock || 0,
          weight: s.package_weight || 0,
          image: s.image?.thumb_url || '',
        }))

        // Main images
        const mainImage = tkProduct.main_images?.[0]?.url || ''
        const allImages = (tkProduct.main_images || []).map(i => i.url)

        // Total stock sum
        const totalStock = skus.reduce((sum, s) => sum + s.stock, 0)

        // Total weight (use product-level or first SKU)
        const totalWeight = tkProduct.package_weight || skus[0]?.weight || 0

        // Lowest SKU price as default sell price
        const minPrice = skus.length > 0
          ? Math.min(...skus.map(s => s.price))
          : 0

        const productData = {
          name: tkProduct.title || '',
          sku: skus[0]?.sellerSku || '',
          image: mainImage,
          images: JSON.stringify(allImages),
          category: tkProduct.category?.name || '',
          weight: totalWeight,
          stock: totalStock,
          sellPrice: minPrice,
          platformProductId: tkProduct.product_id,
          status: statusMap[tkProduct.product_status] || tkProduct.product_status,
          shopId: shopRow.id,
          updatedAt: now,
        }

        // Upsert by platform_product_id
        const existing = await db.select().from(productTable)
          .where(eq(productTable.platformProductId, tkProduct.product_id))
          .limit(1)

        if (existing.length > 0) {
          await db.update(productTable).set(productData)
            .where(eq(productTable.id, existing[0].id))
        } else {
          await db.insert(productTable).values({
            ...productData,
            createdAt: now,
            costPrice: existing.length > 0 ? existing[0].costPrice : 0, // keep existing cost
          } as any)
        }

        success++
        if (success % 10 === 0) {
          console.log(`[ProductSync] Progress: ${success}/${total}`)
        }
      } catch (e: any) {
        console.error(`[ProductSync] Failed product ${brief.product_id}:`, e.message)
        fail++
      }
    }

    // Update sync timestamp
    await db.update(tiktokShop).set({
      lastSyncedAt: now,
      updatedAt: now,
    }).where(eq(tiktokShop.id, shopRow.id))

  } catch (e: any) {
    console.error('[ProductSync] Sync failed:', e.message)
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
