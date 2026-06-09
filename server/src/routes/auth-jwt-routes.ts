/**
 * JWT Auth Routes — pure raw SQL version.
 * Bypasses Drizzle ORM for user table to avoid schema mismatch issues.
 * POST /api/auth/jwt/login     → email + password → JWT token
 * POST /api/auth/jwt/register  → name + email + password → create user + JWT
 * GET  /api/auth/jwt/me        → verify token, return user info
 */
import { Hono } from 'hono'
import mysql from 'mysql2/promise'
import { hashPassword, signToken, extractToken, verifyToken, verifyPassword } from '../auth-jwt.js'

const app = new Hono()

// ── Raw DB connection (same config as db.ts) ──
function getDb(): Promise<mysql.Connection> {
  return mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'bozone',
  })
}

// POST /api/auth/jwt/login
app.post('/login', async (c) => {
  const { email, password } = await c.req.json()
  if (!email || !password) {
    return c.json({ error: '请输入邮箱和密码' }, 400)
  }

  const conn = await getDb()
  try {
    // Raw SQL: only select columns we know exist
    const [rows] = await conn.execute(
      'SELECT id, name, email, role, password FROM `user` WHERE email = ? LIMIT 1',
      [email]
    )
    const u = (rows as any[])[0]
    if (!u) {
      return c.json({ error: '邮箱或密码错误' }, 401)
    }

    // Verify password
    let valid = false
    if (u.password && typeof u.password === 'string' && u.password.includes(':')) {
      // scrypt format: salt:key
      valid = await verifyPassword(password, u.password)
    }
    if (!valid) {
      return c.json({ error: '邮箱或密码错误' }, 401)
    }

    const token = signToken({ userId: u.id, email: u.email, role: u.role || 'operator' })

    // Update last login
    await conn.execute("UPDATE `user` SET last_login = ? WHERE id = ?", [new Date().toISOString(), u.id])

    return c.json({
      success: true,
      token,
      user: { id: u.id, name: u.name, email: u.email, role: u.role || 'operator' },
    })
  } finally {
    await conn.end()
  }
})

// POST /api/auth/jwt/register
app.post('/register', async (c) => {
  const { name, email, password } = await c.req.json()
  if (!name || !email || !password) {
    return c.json({ error: '请填写完整信息' }, 400)
  }
  if (password.length < 6) {
    return c.json({ error: '密码至少需要6个字符' }, 400)
  }

  const conn = await getDb()
  try {
    const [existing] = await conn.execute('SELECT id FROM `user` WHERE email = ? LIMIT 1', [email])
    if ((existing as any[]).length > 0) {
      return c.json({ error: '该邮箱已被注册' }, 409)
    }

    const id = crypto.randomUUID()
    const hashedPw = await hashPassword(password)
    const now = new Date().toISOString()

    await conn.execute(
      'INSERT INTO `user` (id, name, email, password, role, created_at, updated_at, email_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name, email, hashedPw, 'operator', now, now, 1]
    )

    const token = signToken({ userId: id, email, role: 'operator' })

    return c.json({ success: true, token, user: { id, name, email, role: 'operator' } }, 201)
  } finally {
    await conn.end()
  }
})

// GET /api/auth/jwt/me — verify token & return current user
app.get('/me', (c) => {
  const token = extractToken(c.req.header('Authorization'))
  if (!token) {
    return c.json({ error: '未提供认证令牌' }, 401)
  }
  const payload = verifyToken(token)
  if (!payload) {
    return c.json({ error: '令牌无效或已过期' }, 401)
  }
  return c.json({ success: true, user: payload })
})

export default app
