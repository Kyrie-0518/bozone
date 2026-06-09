import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { readFile, readdir, stat } from 'node:fs/promises'
import { extname, join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { auth, initAuth } from './auth.js'
import { initBusinessTables, db } from './db.js'
import { user } from './db-schema.js'
import { eq } from 'drizzle-orm'
import { auditLogger } from './middleware/audit-logger.js'
import { requireRole } from './middleware/rbac.js'
import cron from 'node-cron'
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
import syncRoutes from './routes/sync.js'
import { syncAllShops } from './services/tiktok-order-sync.js'
import { syncAllProducts } from './services/tiktok-product-sync.js'

const app = new Hono()

app.use('*', cors({
  origin: (origin) => {
    // Allow no-origin (server-to-server) or listed origins
    const allowed = ['http://localhost:5174', 'http://localhost:5173', 'http://8.138.36.120', 'http://127.0.0.1:5174', 'https://8.138.36.120']
    return !origin || allowed.includes(origin) ? (origin || 'http://8.138.36.120') : null
  },
  credentials: true,
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  maxAge: 86400,
}))

// ── Auth (before audit logger to avoid logging auth requests) ──
app.all('/api/auth/*', (c) => auth.handler(c.req.raw))

// ── Audit Logger (auto-log all /api/* requests) ──
app.use('/api/*', auditLogger())

// ── Business Routes (with RBAC) ──
app.use('/api/tiktok/*', requireRole('manager'))
app.route('/api/tiktok', tiktokShopsRoutes)

app.use('/api/products/*', requireRole('manager'))
app.route('/api/products', productsRoutes)

app.use('/api/orders/*', requireRole('operator'))
app.route('/api/orders', ordersRoutes)

app.use('/api/finance/*', requireRole('finance'))
app.route('/api/finance', financeRoutes)

app.use('/api/influencers/*', requireRole('operator'))
app.route('/api/influencers', influencersRoutes)

app.use('/api/materials/*', requireRole('operator'))
app.route('/api/materials', materialsRoutes)

app.use('/api/inventory/*', requireRole('manager'))
app.route('/api/inventory', inventoryRoutes)

app.use('/api/ads/*', requireRole('manager'))
app.route('/api/ads', adsRoutes)

app.use('/api/dashboard/*', requireRole('operator'))
app.route('/api/dashboard', dashboardRoutes)

app.use('/api/audit-logs/*', requireRole('admin'))
app.route('/api/audit-logs', auditLogsRoutes)

app.use('/api/settings/*', requireRole('admin'))
app.route('/api/settings', settingsRoutes)

app.use('/api/sync/*', requireRole('manager'))
app.route('/api/sync', syncRoutes)

// ── Static file serving (catch-all after all /api routes) ──
app.get('*', async (c) => {
  const pathname = c.req.path
  // Try serving static file first
  const staticRes = await serveStatic(pathname)
  if (staticRes) return staticRes
  // SPA fallback for client-side routing
  return serveSPA()
})

const port = 3001

// ── Static file serving (SPA: serve client/dist) ──
const __dirname = dirname(fileURLToPath(import.meta.url))
const DIST_DIR = join(__dirname, '../client/dist')

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
}

async function serveStatic(pathname: string): Promise<Response | null> {
  // Security: block path traversal
  if (pathname.includes('..')) return null
  let filePath = join(DIST_DIR, pathname)
  try {
    const s = await stat(filePath)
    if (s.isDirectory()) filePath = join(filePath, 'index.html')
    const ext = extname(filePath)
    const body = await readFile(filePath)
    return new Response(body, {
      headers: { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' },
    })
  } catch {
    return null
  }
}

// SPA fallback: for non-API routes that don't match a file, serve index.html
async function serveSPA(): Promise<Response> {
  try {
    const body = await readFile(join(DIST_DIR, 'index.html'))
    return new Response(body, { headers: { 'Content-Type': MIME_TYPES['.html'] } })
  } catch {
    return new Response('Frontend not built. Run: cd client && npm run build', { status: 503 })
  }
}

await initAuth()
await initBusinessTables()

serve({ fetch: app.fetch, port }, async () => {
  console.log(`[Bozone] Server ready at http://localhost:${port}`)

  // ── Cron: auto-sync orders every 10 minutes ──
  cron.schedule('*/10 * * * *', async () => {
    try {
      console.log('[Cron] Auto-syncing orders...')
      await syncAllShops()
    } catch (e: any) {
      console.error('[Cron] Order sync failed:', e.message)
    }
  })

  // ── Cron: auto-sync products every 2 hours ──
  cron.schedule('0 */2 * * *', async () => {
    try {
      console.log('[Cron] Auto-syncing products...')
      await syncAllProducts()
    } catch (e: any) {
      console.error('[Cron] Product sync failed:', e.message)
    }
  })

  // ── Cron: daily token refresh at 3 AM ──
  cron.schedule('0 3 * * *', async () => {
    try {
      console.log('[Cron] Refreshing expired tokens...')
      const shops = await db.select().from(schema.tiktokShop).where(eq(schema.tiktokShop.syncEnabled, true))
      for (const shop of shops) {
        const { refreshToken: rt } = await import('./services/tiktok-auth.js')
        try {
          const newToken = await rt(shop.refreshToken)
          const expiresAt = new Date(Date.now() + newToken.expires_in * 1000).toISOString()
          await db.update(schema.tiktokShop).set({
            accessToken: newToken.access_token,
            refreshToken: newToken.refresh_token,
            tokenExpiresAt: expiresAt,
            updatedAt: new Date().toISOString(),
          }).where(eq(schema.tiktokShop.id, shop.id))
          console.log(`[Cron] Token refreshed for shop ${shop.shopId}`)
        } catch (e: any) {
          console.warn(`[Cron] Token refresh failed for ${shop.shopId}:`, e.message)
        }
      }
    } catch (e: any) {
      console.error('[Cron] Token refresh failed:', e.message)
    }
  })

  console.log('[Cron] Scheduled: orders */10min, products */2h, token-refresh 3AM')

  seed().catch(console.error)
})

// ── Seed ──
import * as schema from './db-schema.js'
import { mysqlTable } from 'drizzle-orm/mysql-core'

async function seed() {
  // Check if already seeded
  const existing = await db.select().from(schema.setting).where(eq(schema.setting.key, 'seeded'))
  if (existing.length > 0) { console.log('[Seed] Skipped.'); return }

  const accounts = [
    { name: '管理员', email: 'admin@bozone.cn', password: 'admin123', role: 'admin' },
    { name: 'Kyrie', email: 'kyrie@bozone.cn', password: 'kyrie123', role: 'admin' },
    { name: '运营测试', email: 'ops@bozone.cn', password: 'ops2024test', role: 'operator' },
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
        await db.update(schema.user)
          .set({ role: acc.role } as any)
          .where(eq(schema.user.email, acc.email))
        console.log(`  Role set: ${acc.email} → ${acc.role}`)
      }
    } catch (e: any) {
      console.error(`  ${acc.email} → ${e.message}`)
    }
  }
  // Mark as seeded
  await db.insert(schema.setting).values({ key: 'seeded', value: '1' })
  console.log('[Seed] Done.')
}
