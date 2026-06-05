import { Hono } from 'hono'
import { db } from '../db.js'
import { costItem, exchangeRate } from '../db-schema.js'
import { eq, and } from 'drizzle-orm'

const app = new Hono()

// ── Cost Items ──
app.get('/cost-items', async (c) => {
  const rows = await db.select().from(costItem)
  return c.json({ success: true, data: rows })
})

app.post('/cost-items', async (c) => {
  const body = await c.req.json()
  const now = new Date().toISOString()
  const [inserted] = await db.insert(costItem).values({
    name: body.name, chargeType: body.chargeType || 'fixed',
    value: body.value || 0, currency: body.currency || 'RMB',
    formula: body.formula || '', scope: body.scope || 'all',
    createdAt: now, updatedAt: now,
  }).$returningId()
  const [row] = await db.select().from(costItem).where(eq(costItem.id, inserted.id)).limit(1)
  return c.json({ success: true, data: row })
})

app.put('/cost-items/:id', async (c) => {
  const body = await c.req.json()
  const id = Number(c.req.param('id'))
  const now = new Date().toISOString()
  await db.update(costItem).set({ ...body, updatedAt: now }).where(eq(costItem.id, id))
  const [row] = await db.select().from(costItem).where(eq(costItem.id, id)).limit(1)
  return c.json({ success: true, data: row })
})

app.delete('/cost-items/:id', async (c) => {
  await db.delete(costItem).where(eq(costItem.id, Number(c.req.param('id'))))
  return c.json({ success: true })
})

// ── Exchange Rates ──
app.get('/exchange-rate', async (c) => {
  const rows = await db.select().from(exchangeRate)
  return c.json({ success: true, data: rows })
})

app.put('/exchange-rate', async (c) => {
  const body = await c.req.json()
  const now = new Date().toISOString()
  const existing = await db.select().from(exchangeRate)
    .where(and(
      eq(exchangeRate.fromCurrency, body.fromCurrency),
      eq(exchangeRate.toCurrency, body.toCurrency),
    ))
    .limit(1)
  if (existing.length) {
    await db.update(exchangeRate).set({ rate: body.rate, updatedAt: now }).where(eq(exchangeRate.id, existing[0].id))
  } else {
    await db.insert(exchangeRate).values({ fromCurrency: body.fromCurrency, toCurrency: body.toCurrency, rate: body.rate, updatedAt: now })
  }
  return c.json({ success: true })
})

export default app
