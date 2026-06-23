/**
 * 素材库 API
 * 对应后端: /api/materials
 */
import { get, post, del } from './request'

export interface Material {
  id: number
  name: string
  type: 'image' | 'video'
  url: string
  thumbnail?: string
  size?: number
  category?: string
  tags?: string[]
  productId?: number
  status: 'active' | 'archived'
  createdAt: string
}

/** 获取素材列表 */
export function getMaterialListApi(params?: { type?: string; category?: string; keyword?: string; page?: number }) {
  return get<{ data: Material[]; total: number }>('/materials', { params })
}

/** 上传素材 */
export function uploadMaterialApi(file: File, data?: any) {
  const formData = new FormData()
  formData.append('file', file)
  Object.keys(data || {}).forEach(key => {
    formData.append(key, data![key])
  })
  return post<Material>('/materials/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

/** 删除素材 */
export function deleteMaterialApi(id: number) {
  return del(`/materials/${id}`)
}
