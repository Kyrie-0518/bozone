/**
 * Axios 请求封装
 * - 自动注入 JWT Token
 * - 统一错误处理
 * - 响应拦截器
 */
import axios from 'axios'
import { Message } from '@arco-design/web-vue'
import { getToken, removeToken } from '@/utils/auth'
import type { AxiosRequestConfig, AxiosResponse } from 'axios'

// 创建实例
const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器 - 注入 Token
service.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    const token = getToken()
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    console.error('Request Error:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器 - 统一处理
service.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data

    // 后端返回格式: { code: 0, message: 'ok', data: ... } 或直接返回数据
    if (res && typeof res === 'object' && 'code' in res) {
      if (res.code !== undefined && res.code !== 0 && res.code !== 200) {
        Message.error(res.message || '请求失败')

        // Token 过期或未授权
        if (res.code === 401 || res.code === 403) {
          removeToken()
          window.location.href = '/login'
        }

        return Promise.reject(new Error(res.message || 'Error'))
      }
    }

    return res
  },
  (error) => {
    console.error('Response Error:', error)

    let errorMessage = '网络异常'
    if (error.response) {
      switch (error.response.status) {
        case 401:
          errorMessage = '登录已过期，请重新登录'
          removeToken()
          window.location.href = '/login'
          break
        case 403:
          errorMessage = '没有权限访问'
          break
        case 404:
          errorMessage = '请求资源不存在'
          break
        case 500:
          errorMessage = '服务器内部错误'
          break
        default:
          errorMessage = error.response.data?.message || `请求失败 (${error.response.status})`
      }
    } else if (error.message.includes('timeout')) {
      errorMessage = '请求超时，请稍后重试'
    }

    Message.error(errorMessage)
    return Promise.reject(error)
  }
)

export default service

// 导出便捷方法
export function get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return service.get(url, config)
}

export function post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  return service.post(url, data, config)
}

export function put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  return service.put(url, data, config)
}

export function del<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return service.delete(url, config)
}
