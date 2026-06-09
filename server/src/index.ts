import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { initBusinessTables, db } from './db.js'
import { user as userTable } from './db-schema.js'
import { eq } from 'drizzle-orm'
import { auditLogger } from './middleware/audit-logger.js'
import { requireRole } from './middleware/rbac.js'
import { hashPassword } from './auth-jwt.js'
import cron from 'node-cron'
import * as schema from './db-schema.js'
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
import jwtAuthRoutes from './routes/auth-jwt-routes.js'
import { syncAllShops } from './services/tiktok-order-sync.js'
import { syncAllProducts } from './services/tiktok-product-sync.js'

const app = new Hono()
const port = 3001

// ── Static file serving (SPA: serve client/dist) ──
const __dirname = dirname(fileURLToPath(import.meta.url))
// __dirname = server/src/, go up to project root then into client/dist
const DIST_DIR = join(__dirname, '../../client/dist')

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

async function serveSPA(): Promise<Response> {
  try {
    const body = await readFile(join(DIST_DIR, 'index.html'))
    return new Response(body, { headers: { 'Content-Type': MIME_TYPES['.html'] } })
  } catch {
    return new Response('Frontend not built. Run: cd client && npm run build', { status: 503 })
  }
}

// ── CORS (allow all origins in production since we serve static files too) ──
app.use('*', cors({
  origin: (_origin) => '*',
  credentials: true,
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  maxAge: 86400,
}))

// ── JWT Auth Routes (public — no RBAC needed for login/register) ──
app.route('/api/auth/jwt', jwtAuthRoutes)

// ── Audit Logger (auto-log all /api/* except auth) ──
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
  const staticRes = await serveStatic(pathname)
  if (staticRes) return staticRes
  return serveSPA()
})

// ── Auto-migration: add password column to user table (BetterAuth → JWT migration) ──
// MySQL doesn't support ADD COLUMN IF NOT EXISTS, so we check first
try {
  const mysql = await import('mysql2/promise')
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'bozone',
  })
  
  // Check if password column exists
  const [rows] = await conn.execute(
    "SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user' AND COLUMN_NAME = 'password'"
  )
  const exists = (rows as any[])[0]?.cnt > 0
  
  if (!exists) {
    // MySQL compatible: add column without IF NOT EXISTS
    await conn.execute(`ALTER TABLE \`user\` ADD COLUMN \`password\` TEXT NULL AFTER \`lastLogin\``)
    console.log('[Migrate] user.password column ADDED.')
  } else {
    console.log('[Migrate] user.password column already exists.')
  }
  
  await conn.end()
} catch (e: any) {
  console.warn('[Migrate] Error:', e.message)
}

// ── Init DB & Start ──
await initBusinessTables()

serve({ fetch: app.fetch, port }, async () => {
  console.log(`[Bozone] Server ready at http://localhost:${port}`)
  console.log(`[Bozone] Auth mode: JWT (localStorage)`)

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

  // ── Seed accounts with scrypt-hashed passwords ──
  seed().catch(console.error)
})

// ── Seed (JWT version: ensure accounts have scrypt-hashed passwords) ──
async function seed() {
  const accounts = [
    { name: '管理员', email: 'admin@bozone.cn', password: 'admin123', role: 'admin' },
    { name: 'Kyrie', email: 'kyrie@bozone.cn', password: 'kyrie123', role: 'admin' },
    { name: '运营测试', email: 'ops@bozone.cn', password: 'ops2024test', role: 'operator' },
    { name: '超级账号', email: 'super@bozone.cn', password: 'Bozone2024!', role: 'admin' },
  ]

  console.log('[Seed] Ensuring accounts with JWT passwords...')
  for (const acc of accounts) {
    try {
      const existing = await db.select({ id: userTable.id, pw: userTable.password }).from(userTable).where(eq(userTable.email, acc.email)).limit(1)
      const hashedPw = await hashPassword(acc.password)
      const now = new Date().toISOString()

      if (existing.length > 0) {
        // Update existing user — always set fresh password (handles BetterAuth migration)
        await db.update(userTable).set({
          name: acc.name,
          password: hashedPw,
          role: acc.role,
          updatedAt: now,
        }).where(eq(userTable.id, existing[0].id))
        console.log(`  ✏️  ${acc.email} updated with JWT password`)
      } else {
        // Insert new user
        const id = crypto.randomUUID()
        await db.insert(userTable).values({
          id, name: acc.name, email: acc.email,
          password: hashedPw, role: acc.role,
          createdAt: now, updatedAt: now, emailVerified: 1,
        })
        console.log(`  ✅ ${acc.email} created (${acc.role})`)
      }
    } catch (e: any) {
      console.error(`  ❌ ${acc.email} → ${e.message}`)
    }
  }

  console.log('[Seed] Done. Use super@bozone.cn / Bozone2024! to login.')
}
