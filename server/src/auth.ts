import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'
import * as schema from './db-schema.js'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = `file:${path.join(__dirname, '..', 'data', 'bozone.db')}`

const turso = createClient({ url: dbPath })
const db = drizzle(turso)

// ── Ensure tables exist ──
export async function initAuth() {
  const initClient = createClient({ url: dbPath })
  try {
    await initClient.batch([
      `CREATE TABLE IF NOT EXISTS "user" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "name" TEXT NOT NULL,
        "email" TEXT NOT NULL UNIQUE,
        "email_verified" INTEGER NOT NULL DEFAULT 0,
        "image" TEXT,
        "two_factor_enabled" INTEGER,
        "created_at" INTEGER NOT NULL,
        "updated_at" INTEGER NOT NULL,
        "phone_number" TEXT,
        "phone_number_verified" INTEGER NOT NULL DEFAULT 0,
        "banned" INTEGER,
        "ban_reason" TEXT,
        "ban_expires" INTEGER,
        "role" TEXT,
        "username" TEXT,
        "disable_reset_password" INTEGER,
        "provider" TEXT,
        "last_login" INTEGER
      )`,
      `CREATE TABLE IF NOT EXISTS "session" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "token" TEXT NOT NULL UNIQUE,
        "expires_at" INTEGER NOT NULL,
        "ip_address" TEXT,
        "user_agent" TEXT,
        "active_organization_id" TEXT,
        "created_at" INTEGER NOT NULL,
        "updated_at" INTEGER NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS "account" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "account_id" TEXT NOT NULL,
        "provider_id" TEXT NOT NULL,
        "access_token" TEXT,
        "refresh_token" TEXT,
        "access_token_expires_at" INTEGER,
        "refresh_token_expires_at" INTEGER,
        "scope" TEXT,
        "id_token" TEXT,
        "password" TEXT,
        "created_at" INTEGER NOT NULL,
        "updated_at" INTEGER NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS "verification" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "identifier" TEXT NOT NULL,
        "value" TEXT NOT NULL,
        "expires_at" INTEGER NOT NULL,
        "created_at" INTEGER,
        "updated_at" INTEGER
      )`,
    ])
    console.log('[Auth] Tables ready.')
  } finally {
    initClient.close()
  }
}

export const auth = betterAuth({
  baseURL: 'http://localhost:5174',
  secret: 'bozone-dev-secret-change-in-production',
  database: drizzleAdapter(db, { provider: 'sqlite', schema }),
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
      sendOTP: async ({ phoneNumber, code }) => {
        console.log(`[Bozone OTP] ${phoneNumber} → ${code}`)
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
})
