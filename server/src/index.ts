import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { auth, initAuth } from './auth.js'
import { initBusinessTables } from './db.js'
import { auditLogger } from './middleware/audit-logger.js'
import { requireRole } from './middleware/rbac.js'
import tiktokShopsRoutes from './routes/tiktok-shops.js'
import productsRoutes from './routes/products.js'
import ordersRoutes from './routes/orders.js'
import financeRoutes from './routes/finance.js'
import influencersRoutes from './routes/influencers.js'
import materialsRoutes from './routes/materials.js'
import inventoryRoutes from './routes/inventory.js'
import adsRoutes from './routes/ads.js'
import dashboardRoutes from './routes/dashboard.js'
import auditLogsRoutes from './routes/audit-logs.js'
import settingsRoutes from './routes/settings-api.js'

const app = new Hono()

app.use('*', cors({
  origin: ['http://localhost:5174', 'http://localhost:5173', 'http://8.138.36.120', 'http://127.0.0.1:5174'],
  credentials: true,
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}))

// ── Auth (before audit logger to avoid logging auth requests) ──
app.on(['POST', 'GET'], '/api/auth/**', (c) => auth.handler(c.req.raw))

// ── Audit Logger (auto-log all /api/* requests) ──
app.use('/api/*', auditLogger())

// ── Business Routes (with RBAC) ──
// Authentication required for all business routes via requireRole
app.route('/api/tiktok', requireRole('manager'), tiktokShopsRoutes)
app.route('/api/products', requireRole('manager'), productsRoutes)
app.route('/api/orders', requireRole('operator'), ordersRoutes)
app.route('/api/finance', requireRole('finance'), financeRoutes)
app.route('/api/influencers', requireRole('operator'), influencersRoutes)
app.route('/api/materials', requireRole('operator'), materialsRoutes)
app.route('/api/inventory', requireRole('manager'), inventoryRoutes)
app.route('/api/ads', requireRole('manager'), adsRoutes)
app.route('/api/dashboard', requireRole('operator'), dashboardRoutes)
app.route('/api/audit-logs', requireRole('admin'), auditLogsRoutes)
app.route('/api/settings', requireRole('admin'), settingsRoutes)

const port = 3001

await initAuth()
await initBusinessTables()

serve({ fetch: app.fetch, port }, async () => {
  console.log(`[Bozone] Server ready at http://localhost:${port}`)
  seed().catch(console.error)
})

// ── Seed ──
import { createClient } from '@libsql/client'
const seedDb = createClient({ url: `file:${new URL('../data/bozone.db', import.meta.url).pathname}` })

async function seed() {
  await seedDb.execute("CREATE TABLE IF NOT EXISTS _seed (key TEXT PRIMARY KEY, value TEXT)")
  const r = await seedDb.execute("SELECT value FROM _seed WHERE key='seeded'")
  if (r.rows.length > 0) { console.log('[Seed] Skipped.'); return }

  const accounts = [
    { name: '管理员', email: 'admin@bozone.cn', password: 'admin123', role: 'admin' },
    { name: 'Kyrie', email: 'kyrie@bozone.cn', password: 'kyrie123', role: 'manager' },
  ]

  console.log('[Seed] Creating dev accounts...')
  for (const acc of accounts) {
    try {
      const res = await fetch(`http://localhost:${port}/api/auth/sign-up/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:5174' },
        body: JSON.stringify({ name: acc.name, email: acc.email, password: acc.password }),
      })
      const text = await res.text()
      console.log(`  ${acc.email} → ${res.ok && !text.includes('error') ? 'OK' : 'FAIL'}`)
      // Set role after sign-up
      if (res.ok) {
        await seedDb.execute({
          sql: 'UPDATE "user" SET role = ? WHERE email = ?',
          args: [acc.role, acc.email],
        })
        console.log(`  Role set: ${acc.email} → ${acc.role}`)
      }
    } catch (e: any) {
      console.error(`  ${acc.email} → ${e.message}`)
    }
  }
  await seedDb.execute("INSERT INTO _seed (key, value) VALUES ('seeded', '1')")
  console.log('[Seed] Done.')
}
