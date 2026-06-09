/**
 * Pure JWT Authentication — no cookies, no BetterAuth dependency.
 * Token stored in localStorage on client, sent via Authorization header.
 */
import jwt from 'jsonwebtoken'
import crypto from 'node:crypto'

const JWT_SECRET = process.env.JWT_SECRET || 'bozone-dev-jwt-secret-change-me!'
const TOKEN_EXPIRY = '7d' // 7 days

// ── Password hashing (Node.js built-in crypto, zero deps) ──
const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1, maxmem: 128 * 1024 * 1024 } as const
const SALT_LENGTH = 32
const KEY_LENGTH = 64

export async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(SALT_LENGTH).toString('hex')
    crypto.scrypt(password, salt, KEY_LENGTH, SCRYPT_OPTIONS, (err, derivedKey) => {
      if (err) return reject(err)
      resolve(`${salt}:${derivedKey.toString('hex')}`)
    })
  })
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  return new Promise((resolve) => {
    crypto.scrypt(password, salt, KEY_LENGTH, SCRYPT_OPTIONS, (_err, derivedKey) => {
      resolve(derivedKey.toString('hex') === hash)
    })
  })
}

// ── JWT ──
export interface JWTPayload {
  userId: string
  email: string
  role: string
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch {
    return null
  }
}

// ── Extract token from Authorization header ──
export function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null
  return authHeader.slice(7)
}
