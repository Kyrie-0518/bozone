// ── Role-Based Access Control Middleware ──
import type { Context, Next } from 'hono'
import { auth } from '../auth.js'
import { createClient } from '@libsql/client'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = `file:${path.join(__dirname, '..', '..', 'data', 'bozone.db')}`

// Role hierarchy: higher index = more permissions
const ROLE_HIERARCHY: Record<string, number> = {
  admin: 4,
  manager: 3,
  finance: 2,
  operator: 1,
}

export type Role = 'admin' | 'manager' | 'finance' | 'operator'

// Get user from session + query role from DB
async function getCurrentUser(c: Context) {
  try {
    const session = await auth.api.getSession({ headers: c.req.raw.headers })
    if (!session?.user) return null

    // Read role from DB (Better-Auth session may not include custom fields)
    const client = createClient({ url: dbPath })
    try {
      const rows = await client.execute({
        sql: 'SELECT role, name, email FROM "user" WHERE id = ?',
        args: [session.user.id],
      })
      const user = rows.rows[0] as any
      return {
        id: session.user.id,
        email: user?.email || session.user.email || '',
        name: user?.name || session.user.name || '',
        role: (user?.role as string) || 'operator',
      }
    } finally {
      client.close()
    }
  } catch {
    return null
  }
}

// Middleware: require authentication
export function requireAuth(c: Context, next: Next): Promise<Response | void> {
  return withAuth()(c, next)
}

// Middleware factory: require minimum role
export function requireRole(minRole: Role) {
  const minLevel = ROLE_HIERARCHY[minRole] ?? 0

  return async (c: Context, next: Next) => {
    const user = await getCurrentUser(c)
    if (!user) {
      return c.json({ error: '未登录或登录已过期' }, 401)
    }

    const userLevel = ROLE_HIERARCHY[user.role] ?? 0
    if (userLevel < minLevel) {
      return c.json({ error: '权限不足' }, 403)
    }

    // Attach user to context for downstream use
    c.set('currentUser', user)
    await next()
  }
}

// Middleware: authenticated only (any role)
export async function withAuth() {
  return async (c: Context, next: Next) => {
    const user = await getCurrentUser(c)
    if (!user) {
      return c.json({ error: '未登录或登录已过期' }, 401)
    }
    c.set('currentUser', user)
    await next()
  }
}

// Export role constants for route definition
export const ROLES = {
  ADMIN: 'admin' as Role,
  MANAGER: 'manager' as Role,
  FINANCE: 'finance' as Role,
  OPERATOR: 'operator' as Role,
}

// Route-level role requirements map
export const routeRoles: Record<string, Role> = {
  '/api/tiktok': 'manager',
  '/api/products': 'manager',
  '/api/orders': 'operator',
  '/api/finance': 'finance',
  '/api/influencers': 'operator',
  '/api/materials': 'operator',
  '/api/inventory': 'manager',
  '/api/ads': 'manager',
  '/api/audit-logs': 'admin',
  '/api/settings': 'admin',
  '/api/dashboard': 'operator',
}
