import { Hono } from 'hono'

// This route handles the OAuth callback directly
// It accepts the TikTok code and state from query params
// and exchanges them for an access token, then redirects
const app = new Hono()

app.get('/', async (c) => {
  const code = c.req.query('code')
  const state = c.req.query('state')
  const fromPage = c.req.query('fromPage')

  // If from auth-callback.html page, process directly
  if (fromPage === '1' && code) {
    try {
      const { exchangeCode } = await import('../services/tiktok-auth.js')
      const { db } = await import('../db.js')
      const { tiktokShop } = await import('../db-schema.js')
      const { eq } = await import('drizzle-orm')

      const token = await exchangeCode(code)

      const existing = await db.select().from(tiktokShop).where(eq(tiktokShop.shopId, token.shop_id)).limit(1)
      const now = new Date().toISOString()
      const expiresAt = new Date(Date.now() + token.expires_in * 1000).toISOString()

      if (existing.length > 0) {
        await db.update(tiktokShop).set({
          accessToken: token.access_token, refreshToken: token.refresh_token,
          shopCipher: token.shop_cipher, tokenExpiresAt: expiresAt,
          syncEnabled: true, updatedAt: now,
        }).where(eq(tiktokShop.shopId, token.shop_id))
      } else {
        await db.insert(tiktokShop).values({
          name: token.shop_name || `Shop ${token.shop_id.slice(-6)}`,
          region: 'MY', shopId: token.shop_id, shopCipher: token.shop_cipher,
          appKey: process.env.TIKTOK_APP_KEY || '', appSecret: process.env.TIKTOK_APP_SECRET || '',
          accessToken: token.access_token, refreshToken: token.refresh_token,
          tokenExpiresAt: expiresAt, apiVersion: '202309',
          syncEnabled: true, createdAt: now, updatedAt: now,
        })
      }

      return c.json({ success: true, shop_name: token.shop_name })
    } catch (e: any) {
      console.error('[Direct callback] error:', e)
      return c.json({ success: false, error: e.message }, 500)
    }
  }

  // Fallback to standard redirect
  const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5174'
  if (!code || !state) {
    return c.redirect(`${FRONTEND_URL}/shops?auth=error&message=missing_params`)
  }
  return c.redirect(`${FRONTEND_URL}/shops?auth=error&message=unknown_flow`)
})

export default app
