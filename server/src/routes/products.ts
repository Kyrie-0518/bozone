import { Hono } from 'hono'
import { db } from '../db.js'
import { product as productTable } from '../db-schema.js'
import { eq, like } from 'drizzle-orm'

const app = new Hono()

app.get('/', async (c) => {
  const q = c.req.query('q') || ''
  const rows = q
    ? await db.select().from(productTable).where(like(productTable.name, `%${q}%`))
    : await db.select().from(productTable)
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
  const [inserted] = await db.insert(productTable).values({
    name: body.name, sku: body.sku || '', image: body.image || '',
    images: body.images || '', category: body.category || '',
    weight: body.weight || 0, stock: body.stock || 0,
    sellPrice: body.sellPrice || 0, costPrice: body.costPrice || 0,
    platformProductId: body.platformProductId || null,
    status: body.status || '上架',
    supplierId: body.supplierId || null, shopId: body.shopId || null,
    createdAt: now, updatedAt: now,
  }).$returningId()
  const [row] = await db.select().from(productTable).where(eq(productTable.id, inserted.id)).limit(1)
  return c.json({ success: true, data: row })
})

app.put('/:id', async (c) => {
  const body = await c.req.json()
  const id = Number(c.req.param('id'))
  const now = new Date().toISOString()
  await db.update(productTable).set({ ...body, updatedAt: now }).where(eq(productTable.id, id))
  const [row] = await db.select().from(productTable).where(eq(productTable.id, id)).limit(1)
  return c.json({ success: true, data: row })
})

app.delete('/:id', async (c) => {
  await db.delete(productTable).where(eq(productTable.id, Number(c.req.param('id'))))
  return c.json({ success: true })
})

export default app
