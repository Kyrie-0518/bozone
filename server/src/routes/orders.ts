import { Hono } from 'hono'
import { db } from '../db.js'
import { order as orderTable, orderItem } from '../db-schema.js'
import { eq, like, desc } from 'drizzle-orm'

const app = new Hono()

app.get('/', async (c) => {
  const q = c.req.query('q') || ''
  const status = c.req.query('status') || ''
  const shopId = c.req.query('shopId') || ''
  const query = db.select().from(orderTable).$dynamic()
  if (q) query.where(like(orderTable.orderNo, `%${q}%`))
  if (status) query.where(eq(orderTable.status, status))
  if (shopId) query.where(eq(orderTable.shopId, Number(shopId)))
  const rows = await query
  return c.json({ success: true, data: rows })
})

app.get('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const [orderRow] = await db.select().from(orderTable).where(eq(orderTable.id, id)).limit(1)
  if (!orderRow) return c.json({ success: false, error: 'Not found' }, 404)
  const items = await db.select().from(orderItem).where(eq(orderItem.orderId, id))
  return c.json({ success: true, data: { ...orderRow, items } })
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
