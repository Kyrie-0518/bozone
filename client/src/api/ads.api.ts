/**
 * 广告管理 API
 * 对应后端: /api/ads
 */
import { get, post, put } from './request'

export interface AdCampaign {
  id: number
  name: string
  type: 'traffic' | 'conversion' | 'app_promo'
  status: 'active' | 'paused' | 'completed'
  budget?: number
  spend: number
  impressions: number
  clicks: number
  ctr: number
  conversions: number
  costPerConversion: number
  roas?: number
  startDate: string
  endDate?: string
}

/** 获取广告活动列表 */
export function getAdCampaignsApi(params?: { page?: number; status?: string }) {
  return get<{ data: AdCampaign[]; total: number }>('/ads/campaigns', { params })
}

/** 获取广告效果数据 */
export function getAdStatsApi(params?: { campaignId?: number; dateFrom?: string; dateTo?: string }) {
  return get('/ads/stats', { params })
}
