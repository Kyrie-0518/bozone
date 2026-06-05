import crypto from 'node:crypto'

// ── Dynamic config (read fresh every call, not module-level cached) ──
function getConfig() {
  return {
    APP_KEY: process.env.TIKTOK_APP_KEY || '',
    APP_SECRET: process.env.TIKTOK_APP_SECRET || '',
    SERVICE_ID: process.env.TIKTOK_SERVICE_ID || process.env.TIKTOK_APP_KEY || '',
    REDIRECT_URI: process.env.TIKTOK_REDIRECT_URI || '',
    IS_SANDBOX: process.env.TIKTOK_ENV === 'sandbox',
    API_BASE: process.env.TIKTOK_API_BASE || (process.env.TIKTOK_ENV === 'sandbox'
      ? 'https://open-api-sandbox.tiktokglobalshop.com'
      : 'https://open-api.tiktokglobalshop.com'),
    AUTH_HOST: 'https://auth.tiktok-shops.com',
    SCOPES: ['seller.order', 'seller.product', 'seller.shop', 'seller.finance'].join(','),
  }
}

// ── State store ──
const stateStore = new Map<string, { createdAt: number }>()
const STATE_TTL_MS = 5 * 60 * 1000
setInterval(() => {
  const now = Date.now()
  for (const [k, v] of stateStore) if (now - v.createdAt > STATE_TTL_MS) stateStore.delete(k)
}, 60_000)

function generateState(): string {
  const { APP_SECRET } = getConfig()
  const uuid = crypto.randomUUID()
  const sig = crypto.createHmac('sha256', APP_SECRET).update(uuid).digest('hex').slice(0, 16)
  const state = `${uuid}.${sig}`
  stateStore.set(state, { createdAt: Date.now() })
  return state
}

function verifyState(state: string): boolean {
  const entry = stateStore.get(state)
  if (!entry) return false
  stateStore.delete(state)
  return Date.now() - entry.createdAt <= STATE_TTL_MS
}

// ── Official TikTok signing ──
function officialSign(appSecret: string, params: Record<string, string>, path: string, body?: any): string {
  const sortedKeys = Object.keys(params)
    .filter(k => k !== 'sign' && k !== 'access_token')
    .sort()
  const paramString = sortedKeys.map(k => `${k}${params[k]}`).join('')
  let signString = `${path}${paramString}`
  if (body && typeof body === 'object' && Object.keys(body).length > 0) {
    signString += JSON.stringify(body)
  }
  const wrapped = `${appSecret}${signString}${appSecret}`
  return crypto.createHmac('sha256', appSecret).update(wrapped).digest('hex')
}

// ── Generic API call ──
async function signedRequest(
  appKey: string, appSecret: string,
  path: string, accessToken: string,
  extraParams: Record<string, string> = {},
  opts?: { method?: string; body?: any }
) {
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const params: Record<string, string> = {
    app_key: appKey,
    sign_method: 'HMAC-SHA256',
    timestamp,
    ...extraParams,
  }
  const sign = officialSign(appSecret, params, path, opts?.body)
  params.sign = sign

  const qs = new URLSearchParams(params).toString()
  const url = `${getConfig().API_BASE}${path}?${qs}`

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
  try { json = JSON.parse(text) } catch { throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`) }
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

// ── Build authorization URL ──
export function buildAuthUrl(): { authUrl: string; state: string } {
  const { APP_KEY, APP_SECRET, SERVICE_ID, REDIRECT_URI, SCOPES } = getConfig()

  if (!APP_KEY || !APP_SECRET || !REDIRECT_URI) {
    throw new Error(`TikTok OAuth not configured: APP_KEY=${APP_KEY ? 'set' : 'MISSING'}, SECRET=${APP_SECRET ? 'set' : 'MISSING'}, REDIRECT=${REDIRECT_URI || 'MISSING'}`)
  }

  const state = generateState()
  const authUrl = `https://services.tiktokshop.com/open/authorize?service_id=${SERVICE_ID}&state=${state}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${SCOPES}`

  console.log('[TikTok] Auth URL generated:', authUrl.slice(0, 120), '...')
  return { authUrl, state }
}

// ── Exchange code ──
export async function exchangeCode(code: string): Promise<TokenResponse> {
  const { APP_KEY, APP_SECRET, AUTH_HOST, SCOPES } = getConfig()
  const params = new URLSearchParams({
    app_key: APP_KEY, app_secret: APP_SECRET,
    auth_code: code, grant_type: 'authorized_code',
  })
  const url = `${AUTH_HOST}/api/v2/token/get?${params.toString()}`

  const res = await fetch(url)
  const text = await res.text()
  if (!res.ok) throw new Error(`Token exchange failed HTTP ${res.status}: ${text}`)

  const json = JSON.parse(text)
  if (json.code !== 0) throw new Error(json.message || JSON.stringify(json))

  const d = json.data
  const accessToken = d.access_token
  const refreshTokenStr = d.refresh_token

  let shopId = ''
  let shopCipher = ''
  try {
    const shopsResult = await signedRequest(APP_KEY, APP_SECRET, '/authorization/202309/shops', accessToken)
    const shops = (shopsResult.data as any)?.shops || []
    if (shops.length > 0) {
      shopId = shops[0].id || shops[0].shop_id || ''
      shopCipher = shops[0].cipher || shops[0].shop_cipher || ''
    }
  } catch (e: any) {
    console.warn('[TikTok] Could not fetch shop list:', e.message)
  }

  return {
    access_token: accessToken,
    refresh_token: refreshTokenStr,
    shop_id: shopId || d.open_id?.split('_')?.[0] || d.shop_id || '',
    shop_cipher: shopCipher,
    shop_name: d.seller_name || d.shop_name || '',
    expires_in: d.access_token_expire_in
      ? Math.floor((d.access_token_expire_in - Date.now() / 1000))
      : 86400,
    scope: SCOPES,
  }
}

// ── Refresh token ──
export async function refreshToken(refreshTokenStr: string) {
  const { APP_KEY, APP_SECRET, AUTH_HOST } = getConfig()
  const params = new URLSearchParams({
    app_key: APP_KEY, app_secret: APP_SECRET,
    refresh_token: refreshTokenStr, grant_type: 'refresh_token',
  })
  const url = `${AUTH_HOST}/api/v2/token/refresh?${params.toString()}`

  const res = await fetch(url)
  const text = await res.text()
  if (!res.ok) throw new Error(`Refresh failed HTTP ${res.status}: ${text}`)

  const json = JSON.parse(text)
  if (json.code !== 0) throw new Error(json.message || JSON.stringify(json))

  const d = json.data
  return {
    access_token: d.access_token,
    refresh_token: d.refresh_token || refreshTokenStr,
    expires_in: d.access_token_expire_in
      ? Math.floor((d.access_token_expire_in - Date.now() / 1000))
      : 86400,
  }
}

// ── API call with shop_cipher ──
export async function apiCall(
  endpoint: string, accessToken: string, shopCipher: string,
  opts?: { method?: string; body?: any; skipShopCipher?: boolean }
) {
  const { APP_KEY, APP_SECRET } = getConfig()
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  const extraParams: Record<string, string> = {}
  if (!opts?.skipShopCipher && shopCipher) {
    extraParams.shop_cipher = shopCipher
  }
  const result = await signedRequest(APP_KEY, APP_SECRET, path, accessToken, extraParams, opts)
  if (result?.code !== undefined && result.code !== 0) {
    throw new Error(result.message || JSON.stringify(result))
  }
  return result
}

// ── Test connection ──
export async function testConnection(accessToken: string, _shopCipher: string) {
  const { APP_KEY, APP_SECRET } = getConfig()
  return signedRequest(APP_KEY, APP_SECRET, '/authorization/202309/shops', accessToken)
}

// ── Get authorized shops ──
async function getAuthorizedShops(accessToken: string): Promise<Array<{ id: string; name: string; cipher: string; region: string }>> {
  const { APP_KEY, APP_SECRET } = getConfig()
  const result = await signedRequest(APP_KEY, APP_SECRET, '/authorization/202309/shops', accessToken)
  const shops = (result.data as any)?.shops || []
  return shops.map((shop: any) => ({
    id: shop.id || shop.shop_id || '',
    name: shop.name || shop.shop_name || '',
    cipher: shop.cipher || shop.shop_cipher || '',
    region: shop.region || shop.shop_region || '',
  }))
}

export { verifyState, getAuthorizedShops }
