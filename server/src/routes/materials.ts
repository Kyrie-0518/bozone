import { Hono } from 'hono'
import { db } from '../db.js'
import { material } from '../db-schema.js'
import { eq, like } from 'drizzle-orm'

const app = new Hono()

app.get('/', async (c) => {
  const q = c.req.query('q') || ''
  const category = c.req.query('category') || ''
  const query = db.select().from(material).$dynamic()
  if (q) query.where(like(material.name, `%${q}%`))
  if (category) query.where(eq(material.category, category))
  const rows = await query
  return c.json({ success: true, data: rows.map(r => ({ ...r, tags: safeParse(r.tags) })) })
})

app.post('/', async (c) => {
  const body = await c.req.json()
  const now = new Date().toISOString()
  const [inserted] = await db.insert(material).values({
    name: body.name, category: body.category || '默认',
    fileType: body.fileType, fileUrl: body.fileUrl || '',
    fileSize: body.fileSize || 0, tags: JSON.stringify(body.tags || []),
    createdAt: now,
  }).$returningId()
  const [row] = await db.select().from(material).where(eq(material.id, inserted.id)).limit(1)
  return c.json({ success: true, data: row })
})

app.delete('/:id', async (c) => {
  await db.delete(material).where(eq(material.id, Number(c.req.param('id'))))
  return c.json({ success: true })
})

function safeParse(v: unknown) { try { return typeof v === 'string' ? JSON.parse(v) : v } catch { return [] } }

export default app
