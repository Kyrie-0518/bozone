import { Hono } from 'hono'
import { db } from '../db.js'
import { setting } from '../db-schema.js'
import { eq } from 'drizzle-orm'

const app = new Hono()

app.get('/:key', async (c) => {
  const rows = await db.select().from(setting).where(eq(setting.key, c.req.param('key'))).limit(1)
  if (!rows.length) return c.json({ success: true, data: null })
  return c.json({ success: true, data: safeParse(rows[0].value) })
})

app.put('/:key', async (c) => {
  const body = await c.req.json()
  const key = c.req.param('key')
  const v = typeof body === 'object' ? JSON.stringify(body) : String(body)
  const existing = await db.select().from(setting).where(eq(setting.key, key)).limit(1)
  if (existing.length) {
    await db.update(setting).set({ value: v }).where(eq(setting.key, key))
  } else {
    await db.insert(setting).values({ key, value: v })
  }
  return c.json({ success: true })
})

function safeParse(v: string) { try { return JSON.parse(v) } catch { return v } }

export default app
