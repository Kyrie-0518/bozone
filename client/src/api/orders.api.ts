/**
 * 订单管理 API
 * 对应后端: /api/orders
 */
import { get, post, put } from './request'

export interface Order {
  id: number
  orderId: string
  shopId: number
  shopName?: string
  productId?: number
  productName?: string
  productImage?: string
  status: 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled' | 'refunded'
  totalAmount: number
  shippingFee: number
  platformDiscount: number
  sellerDiscount: number
  finalAmount: number
  costTotal: number
  profit: number
  profitRate: number
  currency: string
  buyerName?: string
  trackingNumber?: string
  createdAt: string
  shippedAt?: string
  completedAt?: string
}

export interface OrderListParams {
  page?: number
  pageSize?: number
  shopId?: number
  status?: string
  keyword?: string
  dateFrom?: string
  dateTo?: string
}

export interface OrderListResult {
  data: Order[]
  total: number
  page: number
  pageSize: number
}

export interface OrderDetail extends Order {
  items?: OrderItem[]
  costs?: OrderCost[]
}

export interface OrderItem {
  id: number
  productId: number
  productName: string
  skuName: string
  quantity: number
  price: number
  total: number
}

export interface OrderCost {
  id: number
  type: string
  typeName: string
  amount: number
  description?: string
}

/** 获取订单列表 */
export function getOrderListApi(params: OrderListParams) {
  return get<OrderListResult>('/orders', { params })
}

/** 获取订单详情 */
export function getOrderDetailApi(id: number) {
  return get<OrderDetail>(`/orders/${id}`)
}

/** 更新订单状态 */
export function updateOrderStatusApi(id: number, status: string, data?: any) {
  return put(`/orders/${id}/status`, { status, ...data })
}

/** 批量操作订单 */
export function batchUpdateOrdersApi(ids: number[], action: string, data?: any) {
  return post('/orders/batch', { ids, action, ...data })
}
