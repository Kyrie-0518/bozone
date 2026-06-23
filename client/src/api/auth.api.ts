/**
 * 认证相关 API
 * 对应后端: /api/auth/jwt/*
 */
import { post, get } from './request'

export interface LoginParams {
  email: string
  password: string
}

export interface LoginResult {
  token: string
  user: {
    id: string
    name: string
    email: string
    role: string
  }
}

export interface UserInfo {
  id: string
  name: string
  email: string
  role: string
  avatar?: string
}

/** 用户登录 */
export function loginApi(data: LoginParams) {
  return post<LoginResult>('/auth/jwt/login', data)
}

/** 用户注册 */
export function registerApi(data: { email: string; password: string; name: string }) {
  return post('/auth/jwt/register', data)
}

/** 获取当前用户信息 */
export function getUserProfileApi() {
  return get<UserInfo>('/auth/jwt/profile')
}

/** 更新用户信息 */
export function updateProfileApi(data: Partial<UserInfo>) {
  return put<UserInfo>('/auth/jwt/profile', data)
}
