// ── Audit Log Auto-Recording Middleware ──
// Automatically logs all /api/* requests (except /api/auth) with user info
import type { Context, Next } from 'hono'
import { createClient } from '@libsql/client'
import path from 'path'
import { fileURLToPath } from 'url'
import { auth } from '../auth.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = `file:${path.join(__dirname, '..', '..', 'data', 'bozone.db')}`

// Skip logging for these paths
const SKIP_PATHS = [
  '/api/auth',
  '/api/audit-logs', // don't log the log viewer itself
]

function shouldSkip(path: string): boolean {
  return SKIP_PATHS.some(p => path.startsWith(p))
}

async function insertLog(entry: {
  userId: string | null
  username: string
  action: string
  method: string
  path: string
  detail: string
  ip: string
}) {
  try {
    const client = createClient({ url: dbPath })
    await client.execute({
      sql: `INSERT INTO "audit_log" ("user_id", "username", "action", "method", "path", "detail", "ip", "created_at")
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        entry.userId,
        entry.username,
        entry.action,
        entry.method,
        entry.path,
        entry.detail,
        entry.ip,
        new Date().toISOString(),
      ],
    })
    client.close()
  } catch {
    // Silently fail — audit log should never break the request
  }
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
    const action = `${method} ${pathname}`

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

    // Don't await — fire and forget to avoid slowing response
    insertLog({
      userId,
      username,
      action: actionName,
      method,
      path: pathname,
      detail: `${statusCode} ${duration}ms`,
      ip,
    }).catch(() => {})
  }
}
