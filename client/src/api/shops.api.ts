/**
 * 店铺管理 API
 * 对应后端: /api/tiktok/*
 */
import { get, post, put, del } from './request'

export interface TikTokShop {
  id: number
  name: string
  region: string
  shopId: string
  status: 'active' | 'inactive' | 'error'
  syncEnabled: boolean
  lastSyncedAt?: string
  todayOrders?: number
  todayRevenue?: number
  createdAt: string
}

/** 获取店铺列表 */
export function getShopsApi() {
  return get<TikTokShop[]>('/tiktok/shops')
}

/** 获取店铺详情 */
export function getShopDetailApi(id: number) {
  return get<TikTokShop>(`/tiktok/shops/${id}`)
}

/** 更新店铺设置 */
export function updateShopApi(id: number, data: Partial<TikTokShop>) {
  return put(`/tiktok/shops/${id}`, data)
}

/** 手动触发同步 */
export function triggerSyncApi(shopId?: number) {
  return post('/sync/orders', { shopId })
}
