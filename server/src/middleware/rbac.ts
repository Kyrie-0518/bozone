/**
 * Role-Based Access Control Middleware — JWT-based (raw SQL version)
 */
import type { Context, Next } from 'hono'
import mysql from 'mysql2/promise'
import { extractToken, verifyToken, type JWTPayload } from '../auth-jwt.js'

// Role hierarchy: higher index = more permissions
const ROLE_HIERARCHY: Record<string, number> = {
  admin: 4,
  manager: 3,
  finance: 2,
  operator: 1,
}

export type Role = 'admin' | 'manager' | 'finance' | 'operator'

// ── Get user from JWT token (raw SQL — no Drizzle dependency on user table) ──
async function getCurrentUser(c: Context): Promise<JWTPayload | null> {
  const token = extractToken(c.req.header('Authorization'))
  if (!token) return null

  const payload = verifyToken(token)
  if (!payload) return null

  // Refresh role from DB in case it was changed
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'bozone',
    })
    try {
      const [rows] = await conn.execute(
        'SELECT role, name, email FROM `user` WHERE id = ? LIMIT 1',
        [payload.userId]
      )
      const u = (rows as any[])[0]
      if (!u) return payload
      return {
        ...payload,
        name: u.name || payload.email,
        role: (u.role as string) || 'operator',
      }
    } finally {
      await conn.end()
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
