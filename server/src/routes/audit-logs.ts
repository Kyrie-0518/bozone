import { Hono } from 'hono'
import { db } from '../db.js'
import { auditLog } from '../db-schema.js'
import { sql } from 'drizzle-orm'

const app = new Hono()

app.get('/', async (c) => {
  const limit = Number(c.req.query('limit') || '100')
  const rows = await db.select().from(auditLog).orderBy(sql`created_at DESC`).limit(limit).all()
  return c.json({ success: true, data: rows })
})

app.post('/', async (c) => {
  const body = await c.req.json()
  const result = await db.insert(auditLog).values({
    userId: body.userId || null, username: body.username || '',
    action: body.action, method: body.method || '', path: body.path || '',
    detail: body.detail || '', ip: body.ip || '',
    createdAt: new Date().toISOString(),
  }).returning()
  return c.json({ success: true, data: result[0] })
})

export default app
