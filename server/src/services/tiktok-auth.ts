/**
 * TikTok Shop Partner API Service
 * Based on official TikTok Shop Node.js SDK
 * Ref: https://partner.tiktokshop.com/docv2/page/67c83e0799a75104986ae498
 */
import crypto from 'node:crypto'

// ── Env helpers (read fresh each call) ──
function env(key: string, fallback = ''): string {
  return process.env[key] || fallback
}

// ── App key used for API signing (this is the 应用密钥 from Partner Center) ──
// Note: This is DIFFERENT from service_id (授权ID) used in OAuth auth URL!
function apiAppKey(): string {
  return env('TIKTOK_APP_KEY') // Always use APP_KEY for API signing (6k44pdou0umit)
}

// ── Official signing: https://partner.tiktokshop.com/docv2/page/67c83e0799a75104986ae498 ──
function sign(params: Record<string, string>, path: string, body?: any): string {
  const appSecret = env('TIKTOK_APP_SECRET')
  if (!appSecret) throw new Error('TIKTOK_APP_SECRET missing')

  // Step 1-2: sort keys, concat {key}{value}
  const sorted = Object.keys(params)
    .filter(k => k !== 'sign' && k !== 'access_token')
    .sort()
    .map(k => `${k}${params[k]}`)
    .join('')

  // Step 3: prepend path
  let str = `${path}${sorted}`

  // Step 4: append request body JSON (if not multipart)
  if (body && typeof body === 'object' && Object.keys(body).length > 0) {
    str += JSON.stringify(body)
  }

  // Step 5-6: wrap with app_secret, then HMAC-SHA256 with app_secret as key
  const wrapped = `${appSecret}${str}${appSecret}`
  return crypto.createHmac('sha256', appSecret).update(wrapped).digest('hex')
}

// ── Generic signed API call (matches SDK's generateSign + fetch) ──
async function call(
  path: string, accessToken: string,
  extraParams: Record<string, string> = {},
  opts?: { method?: string; body?: any }
) {
  const appKey = apiAppKey()
  const apiBase = env('TIKTOK_API_BASE', 'https://open-api.tiktokglobalshop.com')

  const timestamp = Math.floor(Date.now() / 1000).toString()
  const params: Record<string, string> = { app_key: appKey, sign_method: 'HMAC-SHA256', timestamp, ...extraParams }
  
  // Debug: log all query params before signing
  if (path.includes('/search') || path.includes('products')) {
    console.log(`[TikTok API] ${opts?.method || 'GET'} ${path} params:`, JSON.stringify(Object.keys(params)), 'body:', !!opts?.body)
  }
  
  params.sign = sign(params, path, opts?.body)

  const url = `${apiBase}${path}?${new URLSearchParams(params)}`

  console.log(`[TikTok API] ${opts?.method || 'GET'} ${path} app_key=${appKey.slice(0,8)}...`)

  const res = await fetch(url, {
    method: opts?.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-tts-access-token': accessToken,
    },
    body: opts?.body ? JSON.stringify(opts?.body) : undefined,
  })

  const text = await res.text()
  let json: any
  try { json = JSON.parse(text) } catch { throw new Error(`HTTP ${res.status}: ${text.slice(0, 300)}`) }
  if (json.code !== undefined && json.code !== 0) {
    throw new Error(json.message || json.msg || JSON.stringify(json))
  }
  return json
}

// ── Types ──
export interface TokenResponse {
  access_token: string; refresh_token: string; shop_id: string
  shop_cipher: string; shop_name?: string; expires_in: number; scope: string
}

// ── State store (CSRF protection) ──
const states = new Map<string, number>()
setInterval(() => { const now = Date.now(); for (const [k, t] of states) if (now - t > 300_000) states.delete(k) }, 60000)

function makeState(): string {
  const s = `${crypto.randomUUID()}.${crypto.randomBytes(8).toString('hex')}`
  states.set(s, Date.now())
  return s
}
export function verifyState(s: string): boolean {
  if (!states.has(s)) return false
  states.delete(s)
  return true
}

// ── OAuth: Generate authorization URL ──
export function buildAuthUrl(): { authUrl: string; state: string } {
  const appKey = env('TIKTOK_APP_KEY')
  const appSecret = env('TIKTOK_APP_SECRET')
  const redirectUri = env('TIKTOK_REDIRECT_URI')
  // service_id (授权ID) is DIFFERENT from app_key (应用密钥)!
  // From Partner Center: 授权ID=764444..., 应用密钥=6k44pdou0umit
  const serviceId = env('TIKTOK_SERVICE_ID', appKey)

  if (!appKey || !appSecret || !redirectUri) {
    throw new Error(
      `TikTok OAuth config missing: APP_KEY=${appKey ? 'OK' : '✗'}, ` +
      `SECRET=${appSecret ? 'OK' : '✗'}, REDIRECT=${redirectUri || '✗'}`
    )
  }

  const state = makeState()
  const scopes = ['seller.order', 'seller.product', 'seller.shop', 'seller.finance'].join(',')

  const url = `https://services.tiktokshop.com/open/authorize?service_id=${serviceId}&state=${state}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}`

  console.log(`[TikTok] Auth URL: service_id=${serviceId.slice(0, 8)}... (APP_KEY=${appKey.slice(0,8)}...) redirect=${redirectUri.slice(0, 40)}...`)
  return { authUrl: url, state }
}

// ── OAuth: Exchange auth code for token ──
const AUTH_HOST = 'https://auth.tiktok-shops.com'

export async function exchangeCode(code: string): Promise<TokenResponse> {
  const appKey = apiAppKey()
  const appSecret = env('TIKTOK_APP_SECRET')

  const params = new URLSearchParams({ app_key: appKey, app_secret: appSecret, auth_code: code, grant_type: 'authorized_code' })
  const url = `${AUTH_HOST}/api/v2/token/get?${params}`

  console.log('[TikTok] Exchanging code for token...')
  const res = await fetch(url)
  const json: any = await res.json()

  if (json.code !== 0) throw new Error(json.message || 'Token exchange failed')

  const d = json.data
  const token = d.access_token
  const expiresIn = d.access_token_expire_in ? Math.floor((d.access_token_expire_in - Date.now() / 1000)) : 86400

  // Fetch shop info
  let shopId = '', shopCipher = ''
  try {
    const shopsJson = await call('/authorization/202309/shops', token)
    const shops = shopsJson?.data?.shops || []
    if (shops.length > 0) {
      shopId = shops[0].id || shops[0].shop_id || ''
      shopCipher = shops[0].cipher || shops[0].shop_cipher || ''
    }
  } catch { /* non-fatal */ }

  return {
    access_token: token,
    refresh_token: d.refresh_token || '',
    shop_id: shopId || d.open_id?.split('_')?.[0] || '',
    shop_cipher: shopCipher,
    shop_name: d.seller_name || d.shop_name || '',
    expires_in: expiresIn,
    scope: '',
  }
}

// ── OAuth: Refresh token ──
export async function refreshToken(refreshTokenStr: string) {
  const appKey = apiAppKey()
  const appSecret = env('TIKTOK_APP_SECRET')

  const params = new URLSearchParams({ app_key: appKey, app_secret: appSecret, refresh_token: refreshTokenStr, grant_type: 'authorized_code' })
  const url = `${AUTH_HOST}/api/v2/token/refresh?${params}`

  const res = await fetch(url)
  const json: any = await res.json()
  if (json.code !== 0) throw new Error(json.message || 'Refresh failed')

  const d = json.data
  return {
    access_token: d.access_token,
    refresh_token: d.refresh_token || refreshTokenStr,
    expires_in: d.access_token_expire_in ? Math.floor((d.access_token_expire_in - Date.now() / 1000)) : 86400,
  }
}

// ── Generic API call (with shop_cipher) ──
export async function apiCall(endpoint: string, accessToken: string, shopCipher: string, opts?: { method?: string; body?: any; _extraQuery?: Record<string, string> }) {
  const extra: Record<string, string> = {}
  if (shopCipher) extra.shop_cipher = shopCipher
  // Merge extra query params (e.g., page_size, sort_order for orders/search)
  if (opts?._extraQuery) Object.assign(extra, opts._extraQuery)
  return call(endpoint, accessToken, extra, opts)
}

// ── Test connection ──
export async function testConnection(accessToken: string, _shopCipher?: string) {
  // Try multiple endpoints to verify token works
  const errors: string[] = []
  
  // Try 1: Get authorized shops
  try {
    const result = await call('/authorization/202309/shops', accessToken)
    console.log('[Test] /authorization/202309/shops OK:', JSON.stringify(result).slice(0, 200))
    return { endpoint: 'shops', data: result }
  } catch (e: any) {
    errors.push(`shops: ${e.message}`)
    console.warn('[Test] /authorization/202309/shops failed:', e.message)
  }

  // Try 2: Get shop info with cipher
  if (_shopCipher) {
    try {
      const result = await apiCall('/authorization/202309/shops', accessToken, _shopCipher)
      console.log('[Test] shops with cipher OK:', JSON.stringify(result).slice(0, 200))
      return { endpoint: 'shops_with_cipher', data: result }
    } catch (e: any) {
      errors.push(`shops_cipher: ${e.message}`)
      console.warn('[Test] shops with cipher failed:', e.message)
    }
  }

  // Try 3: Simple order list (just to verify token validity)
  try {
    const result = await call('/order/202309/orders/list', accessToken, { page_size: '1' })
    console.log('[Test] orders/list OK')
    return { endpoint: 'orders', data: result }
  } catch (e: any) {
    errors.push(`orders: ${e.message}`)
    console.warn('[Test] orders/list failed:', e.message)
  }

  throw new Error(`所有API端点均失败: ${errors.join('; ')}`)
}

// ── Get authorized shops ──
export async function getAuthorizedShops(accessToken: string) {
  const result = await call('/authorization/202309/shops', accessToken)
  return ((result?.data as any)?.shops || []).map((shop: any) => ({
    id: shop.id || shop.shop_id || '',
    name: shop.name || shop.shop_name || '',
    cipher: shop.cipher || shop.shop_cipher || '',
    region: shop.region || shop.shop_region || '',
  }))
}
