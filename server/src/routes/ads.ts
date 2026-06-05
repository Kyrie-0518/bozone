import { Hono } from 'hono'
import { db } from '../db.js'
import { adCampaign } from '../db-schema.js'
import { eq, like } from 'drizzle-orm'

const app = new Hono()

app.get('/', async (c) => {
  const q = c.req.query('q') || ''
  const status = c.req.query('status') || ''
  let query = db.select().from(adCampaign)
  if (q) query = query.where(like(adCampaign.name, `%${q}%`))
  if (status) query = query.where(eq(adCampaign.status, status))
  const rows = await query.all()
  return c.json({ success: true, data: rows })
})

app.post('/', async (c) => {
  const body = await c.req.json()
  const now = new Date().toISOString()
  const result = await db.insert(adCampaign).values({
    name: body.name, objective: body.objective || 'conversion',
    budget: body.budget || 0, spent: 0, impressions: 0,
    clicks: 0, ctr: 0, conversions: 0, cpa: 0, roas: 0,
    status: body.status || 'draft', createdAt: now, updatedAt: now,
  }).returning()
  return c.json({ success: true, data: result[0] })
})

app.put('/:id', async (c) => {
  const body = await c.req.json()
  const result = await db.update(adCampaign).set({ ...body, updatedAt: new Date().toISOString() }).where(eq(adCampaign.id, Number(c.req.param('id')))).returning()
  return c.json({ success: true, data: result[0] })
})

app.delete('/:id', async (c) => {
  await db.delete(adCampaign).where(eq(adCampaign.id, Number(c.req.param('id'))))
  return c.json({ success: true })
})

export default app
