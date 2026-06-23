/**
 * 操作审计日志 API
 * 对应后端: /api/audit-logs
 */
import { get } from './request'

export interface AuditLog {
  id: number
  userId: string
  userName?: string
  method: string
  path: string
  statusCode: number
  ip?: string
  userAgent?: string
  requestBody?: string
  responseTime?: number
  createdAt: string
}

export interface AuditLogListParams {
  page?: number
  pageSize?: number
  userId?: string
  method?: string
  path?: string
  dateFrom?: string
  dateTo?: string
}

/** 获取审计日志列表 */
export function getAuditLogsApi(params?: AuditLogListParams) {
  return get<{ data: AuditLog[]; total: number }>('/audit-logs', { params })
}
