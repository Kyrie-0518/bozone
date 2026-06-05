import { Hono } from 'hono'
import { db } from '../db.js'
import { product as productTable } from '../db-schema.js'
import { eq, like, sql } from 'drizzle-orm'

const app = new Hono()

app.get('/', async (c) => {
  const q = c.req.query('q') || ''
  const rows = q
    ? await db.select().from(productTable).where(like(productTable.name, `%${q}%`)).all()
    : await db.select().from(productTable).all()
  return c.json({ success: true, data: rows })
})

app.get('/:id', async (c) => {
  const rows = await db.select().from(productTable).where(eq(productTable.id, Number(c.req.param('id')))).limit(1)
  if (!rows.length) return c.json({ success: false, error: 'Not found' }, 404)
  return c.json({ success: true, data: rows[0] })
})

app.post('/', async (c) => {
  const body = await c.req.json()
  const now = new Date().toISOString()
  const result = await db.insert(productTable).values({
    name: body.name, sku: body.sku || '', image: body.image || '',
    weight: body.weight || 0, stock: body.stock || 0,
    sellPrice: body.sellPrice || 0, costPrice: body.costPrice || 0,
    supplierId: body.supplierId || null, shopId: body.shopId || null,
    createdAt: now, updatedAt: now,
  }).returning()
  return c.json({ success: true, data: result[0] })
})

app.put('/:id', async (c) => {
  const body = await c.req.json()
  const now = new Date().toISOString()
  const result = await db.update(productTable).set({
    ...body, updatedAt: now,
  }).where(eq(productTable.id, Number(c.req.param('id')))).returning()
  return c.json({ success: true, data: result[0] })
})

app.delete('/:id', async (c) => {
  await db.delete(productTable).where(eq(productTable.id, Number(c.req.param('id'))))
  return c.json({ success: true })
})

export default app
