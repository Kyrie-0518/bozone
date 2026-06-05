import { Hono } from 'hono'
import { db } from '../db.js'
import { adCampaign } from '../db-schema.js'
import { eq, like } from 'drizzle-orm'

const app = new Hono()

app.get('/', async (c) => {
  const q = c.req.query('q') || ''
  const status = c.req.query('status') || ''
  const query = db.select().from(adCampaign).$dynamic()
  if (q) query.where(like(adCampaign.name, `%${q}%`))
  if (status) query.where(eq(adCampaign.status, status))
  const rows = await query
  return c.json({ success: true, data: rows })
})

app.post('/', async (c) => {
  const body = await c.req.json()
  const now = new Date().toISOString()
  const [inserted] = await db.insert(adCampaign).values({
    name: body.name, objective: body.objective || 'conversion',
    budget: body.budget || 0, spent: 0, impressions: 0,
    clicks: 0, ctr: 0, conversions: 0, cpa: 0, roas: 0,
    status: body.status || 'draft', createdAt: now, updatedAt: now,
  }).$returningId()
  const [row] = await db.select().from(adCampaign).where(eq(adCampaign.id, inserted.id)).limit(1)
  return c.json({ success: true, data: row })
})

app.put('/:id', async (c) => {
  const body = await c.req.json()
  const id = Number(c.req.param('id'))
  await db.update(adCampaign).set({ ...body, updatedAt: new Date().toISOString() }).where(eq(adCampaign.id, id))
  const [row] = await db.select().from(adCampaign).where(eq(adCampaign.id, id)).limit(1)
  return c.json({ success: true, data: row })
})

app.delete('/:id', async (c) => {
  await db.delete(adCampaign).where(eq(adCampaign.id, Number(c.req.param('id'))))
  return c.json({ success: true })
})

export default app
