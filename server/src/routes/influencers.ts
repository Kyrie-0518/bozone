import { Hono } from 'hono'
import { db } from '../db.js'
import { influencer } from '../db-schema.js'
import { eq, like } from 'drizzle-orm'

const app = new Hono()

app.get('/', async (c) => {
  const q = c.req.query('q') || ''
  const rows = q
    ? await db.select().from(influencer).where(like(influencer.name, `%${q}%`))
    : await db.select().from(influencer)
  return c.json({ success: true, data: rows })
})

app.get('/:id', async (c) => {
  const rows = await db.select().from(influencer).where(eq(influencer.id, Number(c.req.param('id')))).limit(1)
  if (!rows.length) return c.json({ success: false, error: 'Not found' }, 404)
  return c.json({ success: true, data: rows[0] })
})

app.post('/', async (c) => {
  const body = await c.req.json()
  const now = new Date().toISOString()
  const [inserted] = await db.insert(influencer).values({
    name: body.name, tiktokId: body.tiktokId || '',
    followers: body.followers || 0, country: body.country || 'MY',
    contactInfo: body.contactInfo || '', contactChannel: body.contactChannel || '',
    productId: body.productId || null, commissionRate: body.commissionRate || 0,
    cooperationStatus: body.cooperationStatus || '未联系',
    remark: body.remark || '', createdAt: now, updatedAt: now,
  }).$returningId()
  const [row] = await db.select().from(influencer).where(eq(influencer.id, inserted.id)).limit(1)
  return c.json({ success: true, data: row })
})

app.put('/:id', async (c) => {
  const body = await c.req.json()
  const id = Number(c.req.param('id'))
  await db.update(influencer).set({ ...body, updatedAt: new Date().toISOString() }).where(eq(influencer.id, id))
  const [row] = await db.select().from(influencer).where(eq(influencer.id, id)).limit(1)
  return c.json({ success: true, data: row })
})

app.delete('/:id', async (c) => {
  await db.delete(influencer).where(eq(influencer.id, Number(c.req.param('id'))))
  return c.json({ success: true })
})

export default app
