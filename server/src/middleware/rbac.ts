// ── Role-Based Access Control Middleware ──
import type { Context, Next } from 'hono'
import { auth } from '../auth.js'
import { db } from '../db.js'
import { user } from '../db-schema.js'
import { eq } from 'drizzle-orm'

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
    const rows = await db
      .select({ role: user.role, name: user.name, email: user.email })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1)

    const u = rows[0]
    return {
      id: session.user.id,
      email: u?.email || session.user.email || '',
      name: u?.name || session.user.name || '',
      role: (u?.role as string) || 'operator',
    }
  } catch {
    return null
  }
}

// Middleware: require authentication
export async function requireAuth(c: Context, next: Next) {
  const mw = await withAuth()
  return mw(c, next)
}

// Middleware factory: require minimum role
export function requireRole(minRole: Role) {
  const minLevel = ROLE_HIERARCHY[minRole] ?? 0

  return async (c: Context, next: Next) => {
    const currentUser = await getCurrentUser(c)
    if (!currentUser) {
      return c.json({ error: '未登录或登录已过期' }, 401)
    }

    const userLevel = ROLE_HIERARCHY[currentUser.role] ?? 0
    if (userLevel < minLevel) {
      return c.json({ error: '权限不足' }, 403)
    }

    // Attach user to context for downstream use
    c.set('currentUser', currentUser)
    await next()
  }
}

// Middleware: authenticated only (any role)
export async function withAuth() {
  return async (c: Context, next: Next) => {
    const currentUser = await getCurrentUser(c)
    if (!currentUser) {
      return c.json({ error: '未登录或登录已过期' }, 401)
    }
    c.set('currentUser', currentUser)
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
