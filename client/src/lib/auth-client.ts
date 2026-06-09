/**
 * JWT Auth Client — pure localStorage + Authorization header.
 * No cookies. No BetterAuth. Works perfectly across origins.
 */

const TOKEN_KEY = 'bozone_jwt_token'
const USER_KEY = 'bozone_user'

export interface AuthUser {
  userId: string
  email: string
  name: string
  role: string
}

// ── Token management ──
function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

function clearAuth() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

// ── User info ──
function getUser(): AuthUser | null {
  const raw = typeof window !== 'undefined' ? localStorage.getItem(USER_KEY) : null
  return raw ? JSON.parse(raw) : null
}

function setUser(user: AuthUser) {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

// ── Auth state (reactive for components) ──
let authListeners: (() => void)[] = []

export function onAuthChange(fn: () => void): () => void {
  authListeners.push(fn)
  return () => { authListeners = authListeners.filter(l => l !== fn) }
}

function notifyListeners() { authListeners.forEach(fn => fn()) }

// ── Public API (drop-in replacement for BetterAuth) ──

/** Login with email/password */
export async function signIn(options: { email: string; password: string }): Promise<{
  error?: { message: string }
  data?: { user: AuthUser; token: string }
}> {
  try {
    const res = await fetch('/api/auth/jwt/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: options.email, password: options.password }),
    })
    const data = await res.json()
    if (!res.ok || data.error) {
      return { error: { message: data.error || '登录失败' } }
    }
    setToken(data.token)
    setUser(data.user)
    notifyListeners()
    return { data: { user: data.user, token: data.token } }
  } catch {
    return { error: { message: '网络错误，请检查连接' } }
  }
}

/** Sign out */
export async function signOut() {
  clearAuth()
  notifyListeners()
  // Call server to invalidate token (optional, token will expire naturally)
  // For now just clear local storage
}

/** Get current authenticated user */
export function useSession(): {
  user: AuthUser | null
  isPending: false
} {
  return { user: getUser(), isPending: false }
}

/** Check if user is logged in */
export function isAuthenticated(): boolean {
  return !!getToken()
}

/** Register new account */
export async function signUp(options: { name: string; email: string; password: string }): Promise<{
  error?: { message: string }
  data?: { user: AuthUser; token: string }
}> {
  try {
    const res = await fetch('/api/auth/jwt/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    })
    const data = await res.json()
    if (!res.ok || data.error) {
      return { error: { message: data.error || '注册失败' } }
    }
    setToken(data.token)
    setUser(data.user)
    notifyListeners()
    return { data: { user: data.user, token: data.token } }
  } catch {
    return { error: { message: '网络错误，请检查连接' } }
  }
}

// ── Export as object matching BetterAuth shape for easy migration ──
const authClient = {
  signIn,
  signOut,
  signUp,
  useSession,
}
// Also export named functions for direct imports
export default authClient

// ── Helper: attach JWT to fetch requests ──
export function authHeaders(): Record<string, string> {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}
