/**
 * 仪表盘 API
 * 对应后端: /api/dashboard
 */
import { get } from './request'

export interface DashboardStats {
  todayRevenue: number
  todayOrders: number
  todayProfit: number
  roi: number
  revenueChange: number
  ordersChange: number
}

export interface ProfitTrendItem {
  date: string
  profit: number
  roi: number
  revenue: number
}

export interface TopProduct {
  id: number
  name: string
  image?: string
  totalSales: number
  totalProfit: number
}

export interface RecentOrder {
  id: string
  orderId: string
  shopName: string
  productName: string
  totalAmount: number
  profit: number
  status: string
  createdAt: string
}

/** 获取仪表盘统计数据 */
export function getDashboardStatsApi() {
  return get<DashboardStats>('/dashboard/stats')
}

/** 获取利润趋势 (30天) */
export function getProfitTrendApi(days = 30) {
  return get<ProfitTrendItem[]>('/dashboard/profit-trend', { params: { days } })
}

/** 获取热销商品 Top10 */
export function getTopProductsApi(limit = 10) {
  return get<TopProduct[]>('/dashboard/top-products', { params: { limit } })
}

/** 获取最近订单 */
export function getRecentOrdersApi(limit = 10) {
  return get<RecentOrder[]>('/dashboard/recent-orders', { params: { limit } })
}
