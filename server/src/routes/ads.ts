/**
 * TikTok Ads API 路由
 * 
 * 端点列表:
 *   GET  /api/ads/accounts          — 列出所有广告账户
 *   POST /api/ads/accounts          — 新增/授权广告账户
 *   GET  /api/ads/accounts/:id     — 获取单个账户详情
 *   PUT  /api/ads/accounts/:id     — 更新账户配置
 *   DELETE /api/ads/accounts/:id  — 删除/解绑账户
 *   POST /api/ads/accounts/:id/test — 测试连通性
 *   POST /api/ads/accounts/:id/sync — 手动同步数据
 *   GET  /api/ads/dashboard        — 广告概览数据（花费/ROI等）
 *   GET  /api/ads/campaigns        — Campaign 列表
 *   GET  /api/ads/creatives       — 创意素材列表
 *   GET  /api/ads/report          — 自定义报表查询
 */

import { Hono } from 'hono'
import { db } from '../db.js'
import { tiktokAdAccount, adCampaign } from '../db-schema.js'
import { eq } from 'drizzle-orm'
import {
  getAdDashboard,
  getCampaigns,
  getCreatives,
  getAdReport,
  testConnection as testAdsConnection,
} from '../services/tiktok-ads-api'

const app = new Hono()

// ══════════════════════════════════════
// 📦 广告账户管理 (ADS-004)
// ══════════════════════════════════════

/** 列出所有广告账户 */
app.get('/accounts', async (c) => {
  const accounts = await db.select().from(tiktokAdAccount).orderBy(tiktokAdAccount.id)
  // 隐藏敏感信息
  const safe = accounts.map(({ appSecret, accessToken, refreshToken, ...rest }) => ({
    ...rest,
    hasToken: !!accessToken,
    tokenStatus: accessToken ? (new Date(rest.tokenExpiresAt || 0) > new Date() ? '有效' : '已过期') : '未授权',
  }))
  return c.json({ success: true, data: safe })
})

/** 新增/授权广告账户 */
app.post('/accounts', async (c) => {
  const body = await c.req.json()
  const now = new Date().toISOString()

  // 检查 advertiser_id 是否已存在
  const [existing] = await db.select().from(tiktokAdAccount)
    .where(eq(tiktokAdAccount.advertiserId, body.advertiserId))

  if (existing) {
    return c.json({ success: false, error: `广告账户 ${body.advertiserId} 已存在` }, 409)
  }

  const [inserted] = await db.insert(tiktokAdAccount).values({
    advertiserId: body.advertiserId,
    displayName: body.displayName || body.advertiserId,
    appId: body.appId,
    appSecret: body.appSecret,
    refreshToken: body.refreshToken || '',
    region: body.region || 'MY',
    currency: body.currency || 'MYR',
    timezone: body.timezone,
    status: body.refreshToken ? 'active' : 'expired',
    createdAt: now,
    updatedAt: now,
  }).$returningId()

  const [row] = await db.select().from(tiktokAdAccount).where(eq(tiktokAdAccount.id, inserted.id))
  return c.json({ success: true, data: row })
})

/** 更新账户 */
app.put('/accounts/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const body = await c.req.json()
  
  // 允许更新的字段白名单
  const allowed = ['displayName', 'region', 'currency', 'timezone', 'refreshToken']
  const updateData: Record<string, any> = { updatedAt: new Date().toISOString() }
  for (const key of allowed) {
    if (body[key] !== undefined) updateData[key] = body[key]
  }

  await db.update(tiktokAdAccount).set(updateData).where(eq(tiktokAdAccount.id, id))
  const [row] = await db.select().from(tiktokAdAccount).where(eq(tiktokAdAccount.id, id))
  return c.json({ success: true, data: row })
})

/** 测试连通性 */
app.post('/accounts/:id/test', async (c) => {
  const id = Number(c.req.param('id'))
  const [account] = await db.select().from(tiktokAdAccount).where(eq(tiktokAdAccount.id, id))
  if (!account) return c.json({ success: false, error: '账户不存在' }, 404)

  try {
    const ok = await testAdsConnection(account.advertiserId)
    await db.update(tiktokAdAccount).set({
      status: ok ? 'active' : 'error',
      lastSyncedAt: new Date().toISOString(),
      errorMessage: ok ? null : '连接测试失败',
      updatedAt: new Date().toISOString(),
    }).where(eq(tiktokAdAccount.id, id))
    
    return c.json({
      success: true,
      data: { connected: ok, testedAt: new Date().toISOString(), displayName: account.displayName },
      message: ok ? '连接成功！可以开始同步数据了' : '连接失败，请检查 App ID / Secret 和 Refresh Token',
    })
  } catch (e: any) {
    return c.json({ success: false, connected: false, error: e.message }, 500)
  }
})

/** 删除/解绑账户 */
app.delete('/accounts/:id', async (c) => {
  const id = Number(c.req.param('id'))
  await db.delete(tiktokAdAccount).where(eq(tiktokAdAccount.id, id))
  return c.json({ success: true })
})

// ══════════════════════════════════════
// 📊 广告概览 (ADS-005)
// ══════════════════════════════════════

/** 广告概览仪表盘数据 */
app.get('/dashboard', async (c) => {
  const days = Math.min(Number(c.req.query('days') || 7), 90)
  const advertiserId = c.req.query('advertiserId') as string | undefined

  if (!advertiserId) {
    // 没有指定账户时返回空数据 + 账户列表提示
    const accounts = await db.select({
      id: tiktokAdAccount.id,
      advertiserId: tiktokAdAccount.advertiserId,
      displayName: tiktokAdAccount.displayName,
      status: tiktokAdAccount.status,
    }).from(tiktokAdAccount).limit(5)

    return c.json({
      success: true,
      data: { summary: {}, dailyData: [], accounts, message: '请先在"账户中心"授权并选择一个账户' },
    })
  }

  try {
    const dashboard = await getAdDashboard(advertiserId, days)
    return c.json({ success: true, data: dashboard })
  } catch (e: any) {
    console.error('[Ads Dashboard]', e.message)
    return c.json({
      success: false,
      error: e.message,
      data: { summary: {}, dailyData: [] },
    })
  }
})

// ══════════════════════════════════════
// 📢 Campaign 列表 (保留原有CRUD)
// ══════════════════════════════════════

app.get('/campaigns', async (c) => {
  const q = c.req.query('q') || ''
  const status = c.req.query('status') || ''
  const advertiserId = c.req.query('advertiserId') as string | undefined

  if (advertiserId) {
    // 尝试从 TikTok API 获取真实数据
    try {
      const campaigns = await getCampaigns(advertiserId)
      let filtered = campaigns
      if (q) filtered = filtered.filter((c: any) => c.campaign_name?.includes(q))
      if (status) filtered = filtered.filter((c: any) => c.operation_status === status)
      return c.json({ success: true, data: filtered, source: 'tiktok_api' })
    } catch (e) {
      console.error('[Ads Campaigns API]', e)
      // API 失败时 fallback 到本地数据库
    }
  }

  // 本地数据库 fallback
  const query = db.select().from(adCampaign).$dynamic()
  if (q) query.where(`name LIKE '%${q}%'`)
  if (status) query.where(eq(adCampaign.status, status))
  const rows = await query
  return c.json({ success: true, data: rows, source: 'local_db' })
})

app.post('/campaigns', async (c) => {
  const body = await c.req.json()
  const now = new Date().toISOString()
  const [inserted] = await db.insert(adCampaign).values({
    name: body.name, objective: body.objective || 'conversion',
    budget: body.budget || 0, spent: 0, impressions: 0,
    clicks: 0, ctr: 0, conversions: 0, cpa: 0, roas: 0,
    status: body.status || 'draft', createdAt: now, updatedAt: now,
  }).$returningId()
  const [row] = await db.select().from(adCampaign).where(eq(adCampaign.id, inserted.id)).limit(1)
  return c.json({ success: true, data: row })
})

app.put('/campaigns/:id', async (c) => {
  const body = await c.req.json()
  const id = Number(c.req.param('id'))
  await db.update(adCampaign).set({ ...body, updatedAt: new Date().toISOString() }).where(eq(adCampaign.id, id))
  const [row] = await db.select().from(adCampaign).where(eq(adCampaign.id, id)).limit(1)
  return c.json({ success: true, data: row })
})

app.delete('/campaigns/:id', async (c) => {
  await db.delete(adCampaign).where(eq(adCampaign.id, Number(c.req.param('id'))))
  return c.json({ success: true })
})

// ══════════════════════════════════════
// 🎨 创意素材
// ══════════════════════════════════════

app.get('/creatives', async (c) => {
  const advertiserId = c.req.query('advertiserId') as string | undefined

  if (advertiserId) {
    try {
      const creatives = await getCreatives(advertiserId)
      return c.json({ success: true, data: creatives, source: 'tiktok_api' })
    } catch (e: any) {
      console.error('[Ads Creatives API]', e)
    }
  }

  // 无数据或API失败时返回空数组
  return c.json({ success: true, data: [], source: 'empty' })
})

// ══════════════════════════════════════
// 📈 报表查询
// ══════════════════════════════════════

app.get('/report', async (c) => {
  const advertiserId = c.req.query('advertiserId') as string
  const startDate = c.req.query('start') as string || ''
  const endDate = c.req.query('end') as string || ''

  if (!advertiserId || !startDate || !endDate) {
    return c.json({ success: false, error: '缺少参数: advertiserId, start, end' }, 400)
  }

  try {
    const rows = await getAdReport(advertiserId, { startDate, endDate })
    return c.json({ success: true, data: rows })
  } catch (e: any) {
    return c.json({ success: false, error: e.message, data: [] })
  }
})

// ══════════════════════════════════════
// 🔙 兼容原有路由 (保持向后兼容)
// ══════════════════════════════════════

app.get('/', async (c) => {
  const q = c.req.query('q') || ''
  const status = c.req.query('status') || ''
  const query = db.select().from(adCampaign).$dynamic()
  if (q) query.where(`name LIKE '%${q}%'`)
  if (status) query.where(eq(adCampaign.status, status))
  const rows = await query
  return c.json({ success: true, data: rows })
})

export default app
