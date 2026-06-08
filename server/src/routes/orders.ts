import { Hono } from 'hono'
import { db } from '../db.js'
import { order as orderTable, orderItem, tiktokShop } from '../db-schema.js'
import { eq, like, desc } from 'drizzle-orm'
import { fetchOrderPriceDetail } from '../services/tiktok-order-sync.js'

const app = new Hono()

app.get('/', async (c) => {
  const q = c.req.query('q') || ''
  const status = c.req.query('status') || ''
  const shopId = c.req.query('shopId') || ''
  let baseQuery = db.select({
    id: orderTable.id,
    orderNo: orderTable.orderNo,
    shopId: orderTable.shopId,
    buyerName: orderTable.buyerName,
    status: orderTable.status,
    paymentStatus: orderTable.paymentStatus,
    logisticsStatus: orderTable.logisticsStatus,
    trackingNo: orderTable.trackingNo,
    carrier: orderTable.carrier,
    itemTotal: orderTable.itemTotal,
    shippingFee: orderTable.shippingFee,
    discount: orderTable.discount,
    taxes: orderTable.taxes,
    actualAmount: orderTable.actualAmount,
    currency: orderTable.currency,
    remark: orderTable.remark,
    orderTime: orderTable.orderTime,
    shipDeadline: orderTable.shipDeadline,
    createdAt: orderTable.createdAt,
    updatedAt: orderTable.updatedAt,
  }).from(orderTable).$dynamic()
  if (q) baseQuery.where(like(orderTable.orderNo, `%${q}%`))
  if (status) baseQuery.where(eq(orderTable.status, status))
  if (shopId) baseQuery.where(eq(orderTable.shopId, Number(shopId)))

  const rows = await baseQuery.orderBy(desc(orderTable.createdAt))

  // Attach items for each order
  const result = await Promise.all(rows.map(async (row: any) => {
    const items = await db.select().from(orderItem).where(eq(orderItem.orderId, row.id))
    return { ...row, items }
  }))

  return c.json({ success: true, data: result })
})

app.get('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const [orderRow] = await db.select().from(orderTable).where(eq(orderTable.id, id)).limit(1)
  if (!orderRow) return c.json({ success: false, error: 'Not found' }, 404)
  const items = await db.select().from(orderItem).where(eq(orderItem.orderId, id))
  return c.json({ success: true, data: { ...orderRow, items } })
})

// O-004: Fetch price detail from TikTok API
app.get('/:id/price-detail', async (c) => {
  const id = Number(c.req.param('id'))
  // 1. Get local order
  const [orderRow] = await db.select().from(orderTable).where(eq(orderTable.id, id)).limit(1)
  if (!orderRow) return c.json({ success: false, error: 'Order not found' }, 404)

  // 2. Find shop for token/cipher
  if (!orderRow.shopId) {
    return c.json({ success: false, error: 'Order has no associated shop' }, 400)
  }
  const [shopRow] = await db.select().from(tiktokShop).where(eq(tiktokShop.id, orderRow.shopId)).limit(1)
  if (!shopRow?.accessToken) {
    return c.json({ success: false, error: 'Shop token not available' }, 400)
  }

  // 3. Call TikTok price_detail API
  const detail = await fetchOrderPriceDetail(
    orderRow.orderNo,
    shopRow.accessToken,
    shopRow.shopCipher,
  )

  if (!detail) {
    return c.json({ success: false, error: 'Failed to fetch price detail from TikTok' }, 502)
  }

  return c.json({ success: true, data: detail })
})

app.post('/', async (c) => {
  const body = await c.req.json()
  const now = new Date().toISOString()
  const [inserted] = await db.insert(orderTable).values({
    orderNo: body.orderNo || `ORD${Date.now()}`,
    shopId: body.shopId || null,
    buyerName: body.buyerName || '',
    status: body.status || 'pending',
    paymentStatus: body.paymentStatus || 'unpaid',
    itemTotal: body.itemTotal || 0,
    shippingFee: body.shippingFee || 0,
    discount: body.discount || 0,
    taxes: body.taxes || 0,
    actualAmount: body.actualAmount || 0,
    currency: body.currency || 'MYR',
    remark: body.remark || '',
    orderTime: body.orderTime || now,
    createdAt: now, updatedAt: now,
  }).$returningId()

  const [orderRow] = await db.select().from(orderTable).where(eq(orderTable.id, inserted.id)).limit(1)

  if (body.items?.length) {
    await db.insert(orderItem).values(
      body.items.map((i: any) => ({
        orderId: orderRow.id,
        productId: i.productId || null,
        sku: i.sku || '',
        productName: i.productName || '',
        image: i.image || '', // O-001: SKU 商品图
        quantity: i.quantity || 1,
        unitPrice: i.unitPrice || 0,
        subtotal: i.subtotal || 0,
      }))
    )
  }
  return c.json({ success: true, data: orderRow })
})

app.put('/:id', async (c) => {
  const body = await c.req.json()
  const id = Number(c.req.param('id'))
  const now = new Date().toISOString()
  await db.update(orderTable).set({ ...body, updatedAt: now }).where(eq(orderTable.id, id))
  const [row] = await db.select().from(orderTable).where(eq(orderTable.id, id)).limit(1)
  return c.json({ success: true, data: row })
})

app.delete('/:id', async (c) => {
  await db.delete(orderTable).where(eq(orderTable.id, Number(c.req.param('id'))))
  return c.json({ success: true })
})

export default app
