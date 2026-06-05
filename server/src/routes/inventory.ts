import { Hono } from 'hono'
import { db } from '../db.js'
import { inventory, inventoryMovement, shipment } from '../db-schema.js'
import { eq, like } from 'drizzle-orm'

const app = new Hono()

// ── Inventory ──
app.get('/stock', async (c) => {
  const q = c.req.query('q') || ''
  const warehouse = c.req.query('warehouse') || ''
  let query = db.select().from(inventory)
  if (warehouse) query = query.where(eq(inventory.warehouse, warehouse))
  const rows = await query.all()
  return c.json({ success: true, data: rows })
})

app.post('/stock', async (c) => {
  const body = await c.req.json()
  const result = await db.insert(inventory).values({
    productId: body.productId, warehouse: body.warehouse || '默认仓库',
    location: body.location || '', quantity: body.quantity || 0,
    safetyStock: body.safetyStock || 0, updatedAt: new Date().toISOString(),
  }).returning()
  return c.json({ success: true, data: result[0] })
})

app.put('/stock/:id', async (c) => {
  const body = await c.req.json()
  const result = await db.update(inventory).set({ ...body, updatedAt: new Date().toISOString() }).where(eq(inventory.id, Number(c.req.param('id')))).returning()
  return c.json({ success: true, data: result[0] })
})

// ── Movements ──
app.get('/movements', async (c) => {
  const rows = await db.select().from(inventoryMovement).all()
  return c.json({ success: true, data: rows })
})

app.post('/movements', async (c) => {
  const body = await c.req.json()
  const result = await db.insert(inventoryMovement).values({
    productId: body.productId, type: body.type,
    quantity: body.quantity, source: body.source || '',
    operator: body.operator || '', remark: body.remark || '',
    createdAt: new Date().toISOString(),
  }).returning()
  // Update stock
  const inv = await db.select().from(inventory).where(eq(inventory.productId, body.productId)).limit(1)
  if (inv.length) {
    const delta = body.type === '入库' ? body.quantity : -body.quantity
    await db.update(inventory).set({ quantity: inv[0].quantity + delta, updatedAt: new Date().toISOString() }).where(eq(inventory.id, inv[0].id))
  }
  return c.json({ success: true, data: result[0] })
})

// ── Shipments ──
app.get('/shipments', async (c) => {
  const rows = await db.select().from(shipment).all()
  return c.json({ success: true, data: rows })
})

app.post('/shipments', async (c) => {
  const body = await c.req.json()
  const result = await db.insert(shipment).values({
    orderId: body.orderId || null, trackingNo: body.trackingNo || '',
    carrier: body.carrier || '', origin: body.origin || '',
    destination: body.destination || '', weight: body.weight || 0,
    estimatedDelivery: body.estimatedDelivery || null, status: body.status || 'pending',
    createdAt: new Date().toISOString(),
  }).returning()
  return c.json({ success: true, data: result[0] })
})

export default app
