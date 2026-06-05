import { Hono } from 'hono'
import { db } from '../db.js'
import { tiktokShop, syncLog } from '../db-schema.js'
import { eq, desc } from 'drizzle-orm'
import { syncShopOrders, syncAllShops } from '../services/tiktok-order-sync.js'
import { syncShopProducts, syncAllProducts } from '../services/tiktok-product-sync.js'

const app = new Hono()

// ── Trigger order sync for all shops ──
app.post('/orders', async (c) => {
  try {
    const results = await syncAllShops()
    return c.json({ success: true, results })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// ── Trigger order sync for a specific shop ──
app.post('/orders/:shopId', async (c) => {
  try {
    const shopId = Number(c.req.param('shopId'))
    const rows = await db.select().from(tiktokShop).where(eq(tiktokShop.id, shopId)).limit(1)
    if (rows.length === 0) return c.json({ success: false, error: 'Shop not found' }, 404)
    const result = await syncShopOrders(rows[0])
    return c.json({ success: true, result })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// ── Trigger product sync for all shops ──
app.post('/products', async (c) => {
  try {
    const results = await syncAllProducts()
    return c.json({ success: true, results })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// ── Trigger product sync for a specific shop ──
app.post('/products/:shopId', async (c) => {
  try {
    const shopId = Number(c.req.param('shopId'))
    const rows = await db.select().from(tiktokShop).where(eq(tiktokShop.id, shopId)).limit(1)
    if (rows.length === 0) return c.json({ success: false, error: 'Shop not found' }, 404)
    const result = await syncShopProducts(rows[0])
    return c.json({ success: true, result })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// ── Get sync logs ──
app.get('/logs', async (c) => {
  const limit = Number(c.req.query('limit') || 50)
  const rows = await db.select().from(syncLog)
    .orderBy(desc(syncLog.id))
    .limit(limit)
  return c.json({ success: true, data: rows })
})

export default app
