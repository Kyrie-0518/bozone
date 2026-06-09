import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from './db.js'
import * as schema from './db-schema.js'

// ── Ensure auth tables exist ──
export async function initAuth() {
  const { default: mysql } = await import('mysql2/promise')
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'bozone',
  })
  try {
    const queries = [
      `CREATE TABLE IF NOT EXISTS user (
        id VARCHAR(36) PRIMARY KEY NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        email_verified TINYINT(1) NOT NULL DEFAULT 0,
        image TEXT,
        two_factor_enabled TINYINT(1),
        created_at VARCHAR(100) NOT NULL,
        updated_at VARCHAR(100) NOT NULL,
        phone_number VARCHAR(50),
        phone_number_verified TINYINT(1) NOT NULL DEFAULT 0,
        banned TINYINT(1),
        ban_reason TEXT,
        ban_expires VARCHAR(100),
        role VARCHAR(50),
        username VARCHAR(255),
        disable_reset_password TINYINT(1),
        provider VARCHAR(50),
        last_login VARCHAR(100)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS session (
        id VARCHAR(36) PRIMARY KEY NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        token VARCHAR(255) NOT NULL UNIQUE,
        expires_at VARCHAR(100) NOT NULL,
        ip_address VARCHAR(50),
        user_agent TEXT,
        active_organization_id VARCHAR(36),
        created_at VARCHAR(100) NOT NULL,
        updated_at VARCHAR(100) NOT NULL,
        FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS account (
        id VARCHAR(36) PRIMARY KEY NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        account_id VARCHAR(255) NOT NULL,
        provider_id VARCHAR(255) NOT NULL,
        access_token TEXT,
        refresh_token TEXT,
        access_token_expires_at VARCHAR(100),
        refresh_token_expires_at VARCHAR(100),
        scope TEXT,
        id_token TEXT,
        password TEXT,
        created_at VARCHAR(100) NOT NULL,
        updated_at VARCHAR(100) NOT NULL,
        FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS verification (
        id VARCHAR(36) PRIMARY KEY NOT NULL,
        identifier VARCHAR(255) NOT NULL,
        value VARCHAR(255) NOT NULL,
        expires_at VARCHAR(100) NOT NULL,
        created_at VARCHAR(100),
        updated_at VARCHAR(100)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    ]

    for (const q of queries) {
      await conn.execute(q)
    }
    console.log('[Auth] Tables ready.')
  } finally {
    await conn.end()
  }
}

export const auth = betterAuth({
  baseURL: process.env.FRONTEND_URL || 'http://localhost:5174',
  trustedOrigins: [
    'http://localhost:5174', 'http://localhost:5173',
    'http://8.138.36.120', 'https://8.138.36.120',
    'http://8.138.36.120:3001',
  ],
  secret: 'bozone-dev-secret-change-in-production',
  database: drizzleAdapter(db, { provider: 'mysql', schema }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  phoneNumber: {
    enabled: true,
    otp: {
      enabled: true,
      length: 6,
      expiresIn: 300,
      sendOTP: async ({ phoneNumber, code }: { phoneNumber: string; code: string }) => {
        console.log(`[Bozone OTP] ${phoneNumber} → ${code}`)
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  rateLimit: {
    window: 60,        // 60 seconds window (default was 15s)
    max: 100,          // allow 100 requests per window (default was 5)
  },
})
