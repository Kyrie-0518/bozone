import { Hono } from 'hono'
import { db } from '../db.js'
import { influencer, tiktokShop } from '../db-schema.js'
import { eq, like } from 'drizzle-orm'
import { searchCreators, getCreatorPerformance, type CreatorSearchParams } from '../services/tiktok-influencer.js'

const app = new Hono()

app.get('/', async (c) => {
  const q = c.req.query('q') || ''
  const rows = q
    ? await db.select().from(influencer).where(like(influencer.name, `%${q}%`))
    : await db.select().from(influencer)
  return c.json({ success: true, data: rows })
})

// AS-001: Search creators on TikTok Marketplace
app.get('/tiktok/search', async (c) => {
  const keyword = c.req.query('keyword') || undefined
  const pageSize = Number(c.req.query('pageSize') || '20')
  const pageToken = c.req.query('pageToken') || undefined
  const region = c.req.query('region') || undefined
  const followerMin = c.req.query('followerMin') !== undefined ? Number(c.req.query('followerMin')) : undefined

  // Get first enabled shop's token
  const shops = await db.select().from(tiktokShop).limit(1)
  if (!shops[0]?.accessToken) {
    return c.json({ success: false, error: 'No connected shop found. Please connect a TikTok Shop first.' }, 400)
  }
  const shop = shops[0]

  const params: CreatorSearchParams = {
    keyword,
    pageSize: [12, 20].includes(pageSize) ? pageSize : 20,
    pageToken,
    region,
    followerMin,
  }

  try {
    const result = await searchCreators(params, shop.accessToken, shop.shopCipher)
    return c.json({ success: true, data: result })
  } catch (e: any) {
    console.error('[Influencer] Search error:', e.message)
    return c.json({ success: false, error: e.message || 'Failed to search creators' }, 502)
  }
})

// AS-002: Get creator full performance detail
app.get('/tiktok/:creatorId/performance', async (c) => {
  const creatorId = c.req.param('creatorId')
  if (!creatorId) return c.json({ success: false, error: 'creatorId required' }, 400)

  const shops = await db.select().from(tiktokShop).limit(1)
  if (!shops[0]?.accessToken) {
    return c.json({ success: false, error: 'No connected shop' }, 400)
  }

  try {
    const result = await getCreatorPerformance(creatorId, shops[0].accessToken, shops[0].shopCipher)
    if (!result) return c.json({ success: false, error: 'Creator not found or API error' }, 404)
    return c.json({ success: true, data: result })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 502)
  }
})

app.get('/:id', async (c) => {
  const rows = await db.select().from(influencer).where(eq(influencer.id, Number(c.req.param('id')))).limit(1)
  if (!rows.length) return c.json({ success: false, error: 'Not found' }, 404)
  return c.json({ success: true, data: rows[0] })
})

app.post('/', async (c) => {
  const body = await c.req.json()
  const now = new Date().toISOString()
  const [inserted] = await db.insert(influencer).values({
    name: body.name, tiktokId: body.tiktokId || '',
    followers: body.followers || 0, country: body.country || 'MY',
    contactInfo: body.contactInfo || '', contactChannel: body.contactChannel || '',
    productId: body.productId || null, commissionRate: body.commissionRate || 0,
    cooperationStatus: body.cooperationStatus || '未联系',
    remark: body.remark || '', createdAt: now, updatedAt: now,
  }).$returningId()
  const [row] = await db.select().from(influencer).where(eq(influencer.id, inserted.id)).limit(1)
  return c.json({ success: true, data: row })
})

app.put('/:id', async (c) => {
  const body = await c.req.json()
  const id = Number(c.req.param('id'))
  await db.update(influencer).set({ ...body, updatedAt: new Date().toISOString() }).where(eq(influencer.id, id))
  const [row] = await db.select().from(influencer).where(eq(influencer.id, id)).limit(1)
  return c.json({ success: true, data: row })
})

app.delete('/:id', async (c) => {
  await db.delete(influencer).where(eq(influencer.id, Number(c.req.param('id'))))
  return c.json({ success: true })
})

export default app
