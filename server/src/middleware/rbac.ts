/**
 * Role-Based Access Control Middleware — JWT-based (no cookies, no sessions)
 */
import type { Context, Next } from 'hono'
import { db } from '../db.js'
import { user } from '../db-schema.js'
import { eq } from 'drizzle-orm'
import { extractToken, verifyToken, type JWTPayload } from '../auth-jwt.js'

// Role hierarchy: higher index = more permissions
const ROLE_HIERARCHY: Record<string, number> = {
  admin: 4,
  manager: 3,
  finance: 2,
  operator: 1,
}

export type Role = 'admin' | 'manager' | 'finance' | 'operator'

// ── Get user from JWT token ──
async function getCurrentUser(c: Context): Promise<JWTPayload | null> {
  const token = extractToken(c.req.header('Authorization'))
  if (!token) return null

  const payload = verifyToken(token)
  if (!payload) return null

  // Refresh role from DB in case it was changed
  try {
    const rows = await db
      .select({ role: user.role, name: user.name, email: user.email })
      .from(user)
      .where(eq(user.id, payload.userId))
      .limit(1)
    const u = rows[0]
    if (!u) return null
    return {
      ...payload,
      name: u.name || payload.email,
      role: (u.role as string) || 'operator',
    }
  } catch {
    return payload
  }
}

// ── Middleware: require any authenticated user ──
export async function withAuth() {
  return async (c: Context, next: Next) => {
    const currentUser = await getCurrentUser(c)
    if (!currentUser) {
      return c.json({ error: '未登录或令牌已过期', code: 'UNAUTHORIZED' }, 401)
    }
    c.set('currentUser', currentUser)
    await next()
  }
}

// ── Middleware: require minimum role level ──
export function requireRole(minRole: Role) {
  const minLevel = ROLE_HIERARCHY[minRole] ?? 0
  return async (c: Context, next: Next) => {
    const currentUser = await getCurrentUser(c)
    if (!currentUser) {
      return c.json({ error: '未登录或令牌已过期', code: 'UNAUTHORIZED' }, 401)
    }
    const userLevel = ROLE_HIERARCHY[currentUser.role] ?? 0
    if (userLevel < minLevel) {
      return c.json({ error: '权限不足', code: 'FORBIDDEN' }, 403)
    }
    c.set('currentUser', currentUser)
    await next()
  }
}

export const ROLES = {
  ADMIN: 'admin' as Role,
  MANAGER: 'manager' as Role,
  FINANCE: 'finance' as Role,
  OPERATOR: 'operator' as Role,
}
