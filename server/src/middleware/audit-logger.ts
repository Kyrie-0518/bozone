// ── Audit Log Auto-Recording Middleware ──
// Automatically logs all /api/* requests (except /api/auth) with user info
import type { Context, Next } from 'hono'
import { db } from '../db.js'
import { auditLog } from '../db-schema.js'
import { auth } from '../auth.js'

// Skip logging for these paths
const SKIP_PATHS = [
  '/api/auth',
  '/api/audit-logs', // don't log the log viewer itself
]

function shouldSkip(path: string): boolean {
  return SKIP_PATHS.some(p => path.startsWith(p))
}

export function auditLogger() {
  return async (c: Context, next: Next) => {
    const startTime = Date.now()
    const method = c.req.method
    const pathname = new URL(c.req.url).pathname

    if (shouldSkip(pathname)) {
      return next()
    }

    // Try to identify the user
    let userId: string | null = null
    let username = 'anonymous'
    try {
      const session = await auth.api.getSession({ headers: c.req.raw.headers })
      if (session?.user) {
        userId = session.user.id
        username = session.user.name || session.user.email || 'unknown'
      }
    } catch {
      // User not authenticated — still log the request
    }

    // Get client IP
    const ip = c.req.header('x-forwarded-for') ||
               c.req.header('x-real-ip') ||
               '127.0.0.1'

    // Proceed with request
    await next()

    // Log after response
    const duration = Date.now() - startTime
    const statusCode = c.res.status

    // Generate readable action name from path
    const parts = pathname.split('/').filter(Boolean)
    let actionName = method
    if (parts.length >= 2) {
      const resource = parts[1] // e.g., 'orders', 'products'
      const id = parts[2] // optional ID
      const subAction = parts[3] // optional sub-resource
      if (method === 'GET') actionName = id ? `查看${resource}详情` : `浏览${resource}列表`
      else if (method === 'POST') actionName = subAction ? `${resource}/${subAction}` : `创建${resource}`
      else if (method === 'PUT' || method === 'PATCH') actionName = `更新${resource}`
      else if (method === 'DELETE') actionName = `删除${resource}`
    }

    // Use shared db connection (not fire-and-forget new connection)
    try {
      await db.insert(auditLog).values({
        userId,
        username,
        action: actionName,
        method,
        path: pathname,
        detail: `${statusCode} ${duration}ms`,
        ip,
        createdAt: new Date().toISOString(),
      })
    } catch (e) {
      // Log to console for debugging but never break the request
      console.error('[Audit] Failed to log:', pathname, (e as Error).message)
    }
  }
}
