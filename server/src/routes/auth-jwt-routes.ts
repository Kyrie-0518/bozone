/**
 * JWT Auth Routes — replace BetterAuth session-based auth.
 * POST /api/auth/jwt/login     → email + password → JWT token
 * POST /api/auth/jwt/register  → name + email + password → create user + JWT
 * GET  /api/auth/jwt/me        → verify token, return user info
 */
import { Hono } from 'hono'
import { db } from '../db.js'
import { user } from '../db-schema.js'
import { eq } from 'drizzle-orm'
import { hashPassword, signToken, extractToken, verifyToken } from '../auth-jwt.js'

const app = new Hono()

// POST /api/auth/jwt/login
app.post('/login', async (c) => {
  const { email, password } = await c.req.json()
  if (!email || !password) {
    return c.json({ error: '请输入邮箱和密码' }, 400)
  }

  const rows = await db.select().from(user).where(eq(user.email, email)).limit(1)
  const u = rows[0]
  if (!u) {
    return c.json({ error: '邮箱或密码错误' }, 401)
  }

  // account.password stores the bcrypt/scrypt hash
  const valid = await verifyPassword(password, u.password || '')
  if (!valid) {
    return c.json({ error: '邮箱或密码错误' }, 401)
  }

  const token = signToken({
    userId: u.id,
    email: u.email,
    role: u.role || 'operator',
  })

  // Update last login
  await db.update(user).set({ lastLogin: new Date().toISOString() }).where(eq(user.id, u.id))

  return c.json({
    success: true,
    token,
    user: { id: u.id, name: u.name, email: u.email, role: u.role || 'operator' },
  })
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

  const existing = await db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1)
  if (existing.length > 0) {
    return c.json({ error: '该邮箱已被注册' }, 409)
  }

  const id = crypto.randomUUID()
  const hashedPw = await hashPassword(password)
  const now = new Date().toISOString()

  await db.insert(user).values({
    id,
    name,
    email,
    password: hashedPw,
    role: 'operator',
    createdAt: now,
    updatedAt: now,
    emailVerified: 1,
  })

  const token = signToken({ userId: id, email, role: 'operator' })

  return c.json({
    success: true,
    token,
    user: { id, name, email, role: 'operator' },
  }, 201)
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
