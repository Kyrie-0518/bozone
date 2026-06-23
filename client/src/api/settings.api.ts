/**
 * 系统设置 API
 * 对应后端: /api/settings
 */
import { get, put, post } from './request'

export interface SystemSettings {
  siteName?: string
  defaultCurrency?: string
  exchangeRates?: Record<string, number>
}

export interface UserProfile {
  id: string
  name: string
  email: string
  role: string
  avatar?: string
}

/** 获取系统设置 */
export function getSettingsApi() {
  return get<SystemSettings>('/settings')
}

/** 更新系统设置 */
export function updateSettingsApi(data: Partial<SystemSettings>) {
  return put('/settings', data)
}

/** 获取用户列表 */
export function getUserListApi(params?: { page?: number; keyword?: string }) {
  return get<{ data: UserProfile[]; total: number }>('/settings/users', { params })
}

/** 创建用户 */
export function createUserApi(data: { email: string; password: string; name: string; role: string }) {
  return post('/settings/users', data)
}

/** 更新用户 */
export function updateUserApi(id: string, data: Partial<UserProfile>) {
  return put(`/settings/users/${id}`, data)
}
