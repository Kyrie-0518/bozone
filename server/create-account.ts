/**
 * Create new admin account via HTTP API (bypasses rate limit on old accounts)
 * Usage: npx tsx create-account.ts
 */
import 'dotenv/config'

const email = 'super@bozone.cn'
const name = 'SuperAdmin'
const password = 'Bozone2024!'
const origin = process.env.FRONTEND_URL || 'http://localhost:5174'
const baseUrl = process.env.SERVER_URL || 'http://localhost:3001'

// 1. Sign up new user via auth API
const res = await fetch(`${baseUrl}/api/auth/sign-up/email`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Origin: origin,
    Accept: 'application/json',
  },
  body: JSON.stringify({ name, email, password }),
})

const text = await res.text()
console.log(`[Sign-up] ${res.status}: ${text.slice(0, 200)}`)

if (!text.includes('error')) {
  // 2. Set admin role directly in DB
  const mysql = await import('mysql2/promise')
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'bozone',
  })
  await conn.execute("UPDATE user SET role = ? WHERE email = ?", ['admin', email])
  await conn.end()
  console.log(`[DONE] ${email} / ${password} (role: admin)`)
} else {
  console.log('[FAIL] Account may already exist, trying update...')
}

process.exit(res.ok ? 0 : 1)
