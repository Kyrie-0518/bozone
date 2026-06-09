/**
 * Create new admin account (bypasses rate limit on old accounts)
 * Usage: npx tsx create-account.ts
 */
import 'dotenv/config'
import mysql from 'mysql2/promise'
import { hash } from '@node-rs/bcrypt'

const conn = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'bozone',
})

const email = 'super@bozone.cn'
const password = 'Bozone2024!'
const hashed = await hash(password, 10)

// Check if exists
const [rows] = await conn.execute('SELECT id FROM user WHERE email = ?', [email]) as any[]
if (rows.length > 0) {
  // Update existing
  await conn.execute('UPDATE user SET password = ? WHERE email = ?', [hashed, email])
  console.log(`[UPDATE] ${email} → password updated`)
} else {
  // Insert new
  const id = crypto.randomUUID()
  await conn.execute(
    'INSERT INTO user (id, name, email, password, email_verified, role) VALUES (?, ?, ?, ?, 1, ?)',
    [id, 'SuperAdmin', email, hashed, 'admin']
  )
  console.log(`[CREATE] ${email} / ${password}`)
}

await conn.end()
process.exit(0)
