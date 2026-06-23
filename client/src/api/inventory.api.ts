/**
 * 库存管理 API
 * 对应后端: /api/inventory
 */
import { get, post, put } from './request'

export interface InventoryItem {
  id: number
  productId: number
  productName: string
  sku: string
  warehouse?: string
  quantity: number
  reservedQuantity: number
  availableQuantity: number
  safetyStock: number
  status: 'normal' | 'low' | 'out_of_stock'
  lastUpdated: string
}

/** 获取库存列表 */
export function getInventoryListApi(params?: { page?: number; status?: string; keyword?: string }) {
  return get<{ data: InventoryItem[]; total: number }>('/inventory', { params })
}

/** 更新库存数量 */
export function updateInventoryApi(id: number, data: { quantity: number; type: string; note?: string }) {
  return put(`/inventory/${id}`, data)
}

/** 获取库存预警列表 */
export function getInventoryAlertsApi() {
  return get<InventoryItem[]>('/inventory/alerts')
}
