import { Hono } from 'hono'
import { db } from '../db.js'
import { tiktokShop } from '../db-schema.js'
import {
  buildAuthUrl, exchangeCode, verifyState, refreshToken,
  testConnection, getAuthorizedShops,
} from '../services/tiktok-auth.js'
import { eq } from 'drizzle-orm'

const IS_SANDBOX = process.env.TIKTOK_ENV === 'sandbox'

const app = new Hono()
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5174'

// ── 1. Generate authorization URL ──
app.post('/auth-url', async (c) => {
  try {
    const { authUrl } = buildAuthUrl()
    return c.json({ success: true, authUrl })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// ── 2. OAuth callback (TikTok redirects here) ──
app.get('/callback', async (c) => {
  const code = c.req.query('code')
  const state = c.req.query('state')
  const error = c.req.query('error')

  if (error) {
    return c.redirect(`${FRONTEND_URL}/shops?auth=error&message=${encodeURIComponent(error)}`)
  }
  if (!code || !state) {
    return c.redirect(`${FRONTEND_URL}/shops?auth=error&message=missing_params`)
  }
  if (!verifyState(state)) {
    return c.redirect(`${FRONTEND_URL}/shops?auth=error&message=invalid_state`)
  }

  try {
    const token = await exchangeCode(code)
    await upsertShop(token)
    return c.redirect(`${FRONTEND_URL}/shops?auth=success&shop=${encodeURIComponent(token.shop_id)}`)
  } catch (e: any) {
    console.error('[TikTok OAuth] callback error:', e)
    return c.redirect(`${FRONTEND_URL}/shops?auth=error&message=${encodeURIComponent(e.message)}`)
  }
})

// ── 2b. OAuth callback POST (manual code submission from frontend) ──
app.post('/callback', async (c) => {
  try {
    const { code } = await c.req.json()
    if (!code) return c.json({ success: false, error: 'Missing code' }, 400)
    const token = await exchangeCode(code)
    await upsertShop(token)
    return c.json({ success: true, shop_id: token.shop_id })
  } catch (e: any) {
    console.error('[TikTok OAuth] manual callback error:', e)
    return c.json({ success: false, error: e.message }, 500)
  }
})

// ── 3. Sandbox: Direct token injection (no OAuth needed) ──
app.post('/sandbox/inject-token', async (c) => {
  if (!IS_SANDBOX) {
    return c.json({ success: false, error: 'Only available in sandbox mode' }, 403)
  }

  try {
    const {
      access_token, refresh_token, shop_id, shop_cipher,
      shop_name, expires_in
    } = await c.req.json()

    if (!access_token || !shop_id || !shop_cipher) {
      return c.json({ success: false, error: 'Missing required fields: access_token, shop_id, shop_cipher' }, 400)
    }

    await upsertShop({
      access_token,
      refresh_token: refresh_token || '',
      shop_id,
      shop_cipher,
      shop_name: shop_name || '',
      expires_in: expires_in || 86400,
      scope: '',
    })

    return c.json({ success: true, message: 'Shop token injected', shop_id })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// ── 4. Manual token refresh ──
app.post('/refresh', async (c) => {
  try {
    const { shop_id } = await c.req.json()
    if (!shop_id) return c.json({ success: false, error: 'Missing shop_id' }, 400)

    const rows = await db.select().from(tiktokShop).where(eq(tiktokShop.shopId, shop_id)).limit(1)
    if (rows.length === 0) return c.json({ success: false, error: 'Shop not found' }, 404)

    const shop = rows[0]
    if (!shop.refreshToken) return c.json({ success: false, error: 'No refresh token available' }, 400)

    const newToken = await refreshToken(shop.refreshToken)
    const expiresAt = new Date(Date.now() + newToken.expires_in * 1000).toISOString()

    await db.update(tiktokShop).set({
      accessToken: newToken.access_token,
      refreshToken: newToken.refresh_token,
      tokenExpiresAt: expiresAt,
      updatedAt: new Date().toISOString(),
    }).where(eq(tiktokShop.shopId, shop_id))

    return c.json({ success: true, message: 'Token refreshed' })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// ── 5. Test API connection ──
app.post('/test', async (c) => {
  try {
    const { id } = await c.req.json()
    if (!id) return c.json({ success: false, error: 'Missing shop id' }, 400)

    const rows = await db.select().from(tiktokShop).where(eq(tiktokShop.id, id)).limit(1)
    if (rows.length === 0) return c.json({ success: false, error: 'Shop not found' }, 404)

    const shop = rows[0]
    let cipher = shop.shopCipher

    // Auto-fetch cipher if missing
    if (!cipher && shop.accessToken) {
      try {
        const shops = await getAuthorizedShops(shop.accessToken)
        if (shops.length > 0) {
          cipher = shops[0].cipher
          await db.update(tiktokShop).set({
            shopCipher: cipher,
            updatedAt: new Date().toISOString(),
          }).where(eq(tiktokShop.id, id))
          console.log('[Test] Auto-filled cipher for shop:', shop.shopId)
        }
      } catch (e: any) {
        console.warn('[Test] Could not auto-fill cipher:', e.message)
      }
    }

    if (!cipher) {
      return c.json({ success: false, error: '缺少店铺 cipher，请在 Partner Center 查看店铺信息' }, 400)
    }

    console.log('[Test] Testing connection for shop:', shop.shopId)
    const result = await testConnection(shop.accessToken, cipher)
    return c.json({ success: true, result })
  } catch (e: any) {
    console.error('[Test] Error:', e.message)
    return c.json({ success: false, error: e.message || 'Connection test failed' }, 500)
  }
})

// ── 6. List all shops ──
app.get('/', async (c) => {
  const rows = await db.select().from(tiktokShop).all()
  const safe = rows.map((r) => ({
    ...r,
    appSecret: '***',
    accessToken: '***',
    refreshToken: '***',
  }))
  return c.json({ success: true, shops: safe })
})

// ── 7. Get single shop ──
app.get('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const rows = await db.select().from(tiktokShop).where(eq(tiktokShop.id, id)).limit(1)
  if (rows.length === 0) return c.json({ success: false, error: 'Not found' }, 404)
  return c.json({ success: true, shop: rows[0] })
})

// ── 7b. Update shop metadata (name, region, cipher) ──
app.patch('/:id/metadata', async (c) => {
  try {
    const id = Number(c.req.param('id'))
    const body = await c.req.json()
    const updates: Record<string, any> = { updatedAt: new Date().toISOString() }
    if (body.name) updates.name = body.name
    if (body.region) updates.region = body.region
    if (body.cipher) updates.shopCipher = body.cipher
    await db.update(tiktokShop).set(updates).where(eq(tiktokShop.id, id))
    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// ── 8. Delete shop ──
app.delete('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  await db.delete(tiktokShop).where(eq(tiktokShop.id, id))
  return c.json({ success: true })
})

// ── Helper: upsert shop ──
async function upsertShop(token: {
  access_token: string
  refresh_token: string
  shop_id: string
  shop_cipher: string
  shop_name?: string
  expires_in: number
  scope: string
}) {
  const existing = await db.select().from(tiktokShop).where(eq(tiktokShop.shopId, token.shop_id)).limit(1)
  const now = new Date().toISOString()
  const expiresAt = new Date(Date.now() + token.expires_in * 1000).toISOString()

  if (existing.length > 0) {
    const updateData: Record<string, any> = {
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      tokenExpiresAt: expiresAt,
      syncEnabled: true,
      updatedAt: now,
    }
    // Don't overwrite existing cipher with empty value
    if (token.shop_cipher) updateData.shopCipher = token.shop_cipher
    await db.update(tiktokShop).set(updateData).where(eq(tiktokShop.shopId, token.shop_id))
  } else {
    await db.insert(tiktokShop).values({
      name: token.shop_name || `Shop ${token.shop_id.slice(-6)}`,
      region: 'MY',
      shopId: token.shop_id,
      shopCipher: token.shop_cipher,
      appKey: process.env.TIKTOK_APP_KEY || '',
      appSecret: process.env.TIKTOK_APP_SECRET || '',
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      tokenExpiresAt: expiresAt,
      apiVersion: '202309',
      syncEnabled: true,
      createdAt: now,
      updatedAt: now,
    })
  }
}

export default app
