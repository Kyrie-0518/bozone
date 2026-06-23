/**
 * 达人 BD API
 * 对应后端: /api/influencers
 */
import { get, post, put, del } from './request'

export interface Influencer {
  id: number
  name: string
  tiktokId: string
  followers?: number
  country?: string
  contactInfo?: string
  status: 'new' | 'contacted' | 'sample_sent' | 'cooperating' | 'terminated'
  productsCount?: number
  gmvTotal?: number
  commissionRate?: number
  notes?: string
  createdAt: string
}

export interface InfluencerListParams {
  page?: number
  pageSize?: number
  status?: string
  country?: string
  keyword?: string
}

/** 获取达人列表 */
export function getInfluencerListApi(params?: InfluencerListParams) {
  return get<{ data: Influencer[]; total: number }>('/influencers', { params })
}

/** 获取达人详情 */
export function getInfluencerDetailApi(id: number) {
  return get<Influencer>(`/influencers/${id}`)
}

/** 创建达人记录 */
export function createInfluencerApi(data: Partial<Influencer>) {
  return post<Influencer>('/influencers', data)
}

/** 更新达人信息 */
export function updateInfluencerApi(id: number, data: Partial<Influencer>) {
  return put(`/influencers/${id}`, data)
}

/** 删除达人记录 */
export function deleteInfluencerApi(id: number) {
  return del(`/influencers/${id}`)
}
