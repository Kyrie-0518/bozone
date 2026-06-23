/**
 * 财务核算 API
 * 对应后端: /api/finance
 */
import { get, post, put } from './request'

export interface FinanceOverview {
  totalRevenue: number
  totalCost: number
  totalProfit: number
  avgProfitRate: number
  orderCount: number
}

export interface ProfitRecord {
  id: number
  orderId: string
  date: string
  revenue: number
  cost: number
  profit: number
  profitRate: number
}

export interface CostItem {
  id: number
  name: string
  type: 'fixed' | 'percentage' | 'per_order' | 'per_kg'
  value: number
  applyTo: string
}

export interface FinanceParams {
  dateFrom?: string
  dateTo?: string
  shopId?: number
}

/** 获取财务概览 */
export function getFinanceOverviewApi(params?: FinanceParams) {
  return get<FinanceOverview>('/finance/overview', { params })
}

/** 获取利润记录列表 */
export function getProfitRecordsApi(params?: FinanceParams & { page?: number; pageSize?: number }) {
  return get<{ data: ProfitRecord[]; total: number }>('/finance/profits', { params })
}

/** 获取费用项模板 */
export function getCostItemsApi() {
  return get<CostItem[]>('/finance/cost-items')
}

/** 更新费用项 */
export function updateCostItemApi(id: number, data: Partial<CostItem>) {
  return put(`/finance/cost-items/${id}`, data)
}
