/**
 * 商品管理 API
 * 对应后端: /api/products
 */
import { get, post, put, del } from './request'

export interface Product {
  id: number
  name: string
  sku: string
  image: string
  images?: string
  category?: string
  weight?: number
  stock: number
  sellPrice: number
  costPrice: number
  profitRate: number
  platformProductId?: string
  status: 'active' | 'inactive' | 'draft'
  shopId?: number
  shopName?: string
  createdAt: string
  updatedAt: string
}

export interface ProductListParams {
  page?: number
  pageSize?: number
  shopId?: number
  category?: string
  status?: string
  keyword?: string
}

export interface ProductListResult {
  data: Product[]
  total: number
}

/** 获取商品列表 */
export function getProductListApi(params?: ProductListParams) {
  return get<ProductListResult>('/products', { params })
}

/** 获取商品详情 */
export function getProductDetailApi(id: number) {
  return get<Product>(`/products/${id}`)
}

/** 创建商品 */
export function createProductApi(data: Partial<Product>) {
  return post<Product>('/products', data)
}

/** 更新商品 */
export function updateProductApi(id: number, data: Partial<Product>) {
  return put(`/products/${id}`, data)
}

/** 删除商品 */
export function deleteProductApi(id: number) {
  return del(`/products/${id}`)
}
