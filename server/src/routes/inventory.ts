import { Hono } from 'hono'
import { db } from '../db.js'
import { inventory, inventoryMovement, shipment } from '../db-schema.js'
import { eq } from 'drizzle-orm'

const app = new Hono()

// ── Inventory ──
app.get('/stock', async (c) => {
  const warehouse = c.req.query('warehouse') || ''
  const query = db.select().from(inventory).$dynamic()
  if (warehouse) query.where(eq(inventory.warehouse, warehouse))
  const rows = await query
  return c.json({ success: true, data: rows })
})

app.post('/stock', async (c) => {
  const body = await c.req.json()
  const [inserted] = await db.insert(inventory).values({
    productId: body.productId, warehouse: body.warehouse || '默认仓库',
    location: body.location || '', quantity: body.quantity || 0,
    safetyStock: body.safetyStock || 0, updatedAt: new Date().toISOString(),
  }).$returningId()
  const [row] = await db.select().from(inventory).where(eq(inventory.id, inserted.id)).limit(1)
  return c.json({ success: true, data: row })
})

app.put('/stock/:id', async (c) => {
  const body = await c.req.json()
  const id = Number(c.req.param('id'))
  await db.update(inventory).set({ ...body, updatedAt: new Date().toISOString() }).where(eq(inventory.id, id))
  const [row] = await db.select().from(inventory).where(eq(inventory.id, id)).limit(1)
  return c.json({ success: true, data: row })
})

// ── Movements ──
app.get('/movements', async (c) => {
  const rows = await db.select().from(inventoryMovement)
  return c.json({ success: true, data: rows })
})

app.post('/movements', async (c) => {
  const body = await c.req.json()
  const [inserted] = await db.insert(inventoryMovement).values({
    productId: body.productId, type: body.type,
    quantity: body.quantity, source: body.source || '',
    operator: body.operator || '', remark: body.remark || '',
    createdAt: new Date().toISOString(),
  }).$returningId()

  // Update stock
  const inv = await db.select().from(inventory).where(eq(inventory.productId, body.productId)).limit(1)
  if (inv.length) {
    const delta = body.type === '入库' ? body.quantity : -body.quantity
    await db.update(inventory).set({ quantity: (inv[0].quantity as number) + delta, updatedAt: new Date().toISOString() }).where(eq(inventory.id, inv[0].id))
  }

  const [row] = await db.select().from(inventoryMovement).where(eq(inventoryMovement.id, inserted.id)).limit(1)
  return c.json({ success: true, data: row })
})

// ── Shipments ──
app.get('/shipments', async (c) => {
  const rows = await db.select().from(shipment)
  return c.json({ success: true, data: rows })
})

app.post('/shipments', async (c) => {
  const body = await c.req.json()
  const [inserted] = await db.insert(shipment).values({
    orderId: body.orderId || null, trackingNo: body.trackingNo || '',
    carrier: body.carrier || '', origin: body.origin || '',
    destination: body.destination || '', weight: body.weight || 0,
    estimatedDelivery: body.estimatedDelivery || null, status: body.status || 'pending',
    createdAt: new Date().toISOString(),
  }).$returningId()
  const [row] = await db.select().from(shipment).where(eq(shipment.id, inserted.id)).limit(1)
  return c.json({ success: true, data: row })
})

export default app
