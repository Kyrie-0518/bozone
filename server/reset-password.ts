/**
 * One-time password reset script
 * Usage: npx tsx reset-password.ts <email> <new_password>
 * Run in server/ directory (reads .env for DB config)
 */
import 'dotenv/config'
import mysql from 'mysql2/promise'
import { hash } from '@node-rs/bcrypt'

const email = process.argv[2] || 'admin@bozone.cn'
const newPassword = process.argv[3] || 'admin123'

const conn = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'bozone',
})

const hashed = await hash(newPassword, 10)
const [result] = await conn.execute('UPDATE user SET password = ? WHERE email = ?', [hashed, email])
console.log(`Password reset: ${email} → rows affected: ${(result as any).affectedRows}`)
await conn.end()
process.exit(0)
