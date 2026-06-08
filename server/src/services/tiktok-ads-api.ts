/**
 * TikTok Business API (Ads) — 数据调用服务
 * 
 * 封装所有广告相关的 TikTok API 调用：
 * - 报表数据 (ReportingApi)
 * - Campaign 管理 (CampaignCreationApi)
 * - 广告组管理 (AdgroupApi)
 * 
 * 注意：当前版本先用 HTTP 直接调用（和 Shop API 同模式）
 * 后续可迁移到官方 npm SDK: tiktok-business-api-sdk-official
 */

import { getValidAdsToken } from './tiktok-ads-auth'

const BASE_URL = 'https://business-api.tiktok.com'

interface AdsApiResponse<T = any> {
  code: number
  message: string
  request_id: string
  data: T
}

/**
 * 通用 API 调用方法（带签名）
 */
async function adsApiCall<T>(
  advertiserId: string,
  path: string,
  method: 'GET' | 'POST' = 'GET',
  body?: Record<string, any>
): Promise<AdsApiResponse<T>> {
  const accessToken = await getValidAdsToken(advertiserId)

  const url = `${BASE_URL}${path}`
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Access-Token': accessToken,
    },
  }
  if (body && method === 'POST') options.body = JSON.stringify(body)

  const res = await fetch(url, options)
  const data = await res.json()

  if (data.code !== 0) {
    console.error(`[AdsAPI] ${path} error:`, data.message || JSON.stringify(data))
  }

  return data
}

// ══════════════════════════════════════
// 📊 报告数据接口
// ══════════════════════════════════════

export interface AdMetricsRow {
  stat_time_day?: string
  campaign_id?: string
  campaign_name?: string
  adgroup_id?: string
  adgroup_name?: string
  ad_id?: string
  ad_name?: string
  spend?: number          // 花费
  impressions?: number   // 展示量
  clicks?: number        // 点击量
  ctr?: number           // 点击率
  cpc?: number           // 点击成本
  cpm?: number           // 千次展示成本
  conversion?: number    // 转化数
  cost_per_conversion?: number  // 转化成本
  roas?: number          // 广告回报率
  revenue?: number       // 收益
  orders?: number        // 订单数
  realtime_conversions?: number
}

/** 拉取广告报表数据 */
export async function getAdReport(
  advertiserId: string,
  params: {
    startDate: string
    endDate: string
    dimensions?: string[]
    metrics?: string[]
    pageSize?: number
  }
): Promise<AdMetricsRow[]> {
  const res = await adsApiCall<{ list: AdMetricsRow[]; page_info: Record<string, any> }>(
    advertiserId,
    '/open_api/v1.3/report/integrated/get/',
    'POST', {
      advertiser_id: advertiserId,
      date_range: {
        start_date: params.startDate.replace(/-/g, ''),
        end_date: params.endDate.replace(/-/g, ''),
      },
      dimensions: params.dimensions || ['stat_time_day'],
      metrics: params.metrics || [
        'spend', 'impressions', 'clicks', 'ctr', 'cpc', 'cpm',
        'conversion', 'cost_per_conversion', 'roas',
      ],
      page_size: params.pageSize || 100,
    }
  )

  return res.data?.list || []
}

/** 获取广告概览汇总（今日 / 近7日 / 近30日） */
export async function getAdDashboard(
  advertiserId: string,
  days: number = 7
): Promise<{
  summary: AdMetricsRow
  dailyData: AdMetricsRow[]
}> {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - days)

  const formatDate = (d: Date) => d.toISOString().split('T')[0]

  const rows = await getAdReport(advertiserId, {
    startDate: formatDate(start),
    endDate: formatDate(end),
    dimensions: ['stat_time_day'],
  })

  // 汇总计算
  const summary: AdMetricsRow = rows.reduce((acc, row) => ({
    spend: (acc.spend || 0) + (row.spend || 0),
    impressions: (acc.impressions || 0) + (row.impressions || 0),
    clicks: (acc.clicks || 0) + (row.clicks || 0),
    conversion: (acc.conversion || 0) + (row.conversion || 0),
    revenue: (acc.revenue || 0) + (row.revenue || 0),
    orders: (acc.orders || 0) + (row.orders || 0),
  }), {} as AdMetricsRow)

  // 计算衍生指标
  if (summary) {
    summary.ctr = summary.impressions > 0 ? (summary.clicks! / summary.impressions!) * 100 : 0
    summary.cpc = summary.clicks > 0 ? summary.spend! / summary.clicks! : 0
    summary.cpa = summary.conversion! > 0 ? summary.spend! / summary.conversion! : 0
    summary.roas = summary.spend! > 0 ? summary.revenue! / summary.spend! : 0
  }

  return { summary: summary || {}, dailyData: rows }
}

// ══════════════════════════════════════
// 📢 Campaign 接口
// ══════════════════════════════════════

/** 获取 Campaign 列表 */
export async function getCampaigns(
  advertiserId: string,
  filtering?: { statuses?: string[] }
): Promise<any[]> {
  const body: Record<string, any> = { advertiser_id: advertiserId, page_size: 100 }
  if (filtering?.statuses) body.filtering = { ...filtering }

  const res = await adsApiCall<{ list: any[]; page_info: any }>(
    advertiserId,
    '/open_api/v1.3/campaign/get/',
    'POST',
    body
  )
  return res.data?.list || []
}

// ══════════════════════════════════════
// 🎨 Creative/Ad 接口
// ══════════════════════════════════════

/** 获取广告创意列表 */
export async function getCreatives(advertiserId: string): Promise<any[]> {
  const res = await adsApiCall<{ list: any[]; page_info: any }>(
    advertiserId,
    '/open_api/v1.3/ad/get/',
    'POST',
    { advertiser_id: advertiserId, page_size: 100 }
  )
  return res.data?.list || []
}

/** 测试连通性 */
export async function testConnection(advertiserId: string): Promise<boolean> {
  try {
    const token = await getValidAdsToken(advertiserId)
    const res = await adsApiCall(advertiserId, '/open_api/v1.3/user/info/', 'GET')
    return res.code === 0
  } catch (e) {
    return false
  }
}
