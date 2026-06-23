/**
 * 用户状态管理 (Pinia)
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { loginApi, getUserProfileApi, LoginParams } from '@/api/auth.api'
import { getToken, setToken, removeToken, getUserInfo, setUserInfo } from '@/utils/auth'

export interface UserInfo {
  id: string
  name: string
  email: string
  role: string
  avatar?: string
}

export const useUserStore = defineStore('user', () => {
  // State
  const token = ref(getToken())
  const userInfo = ref<UserInfo | null>(getUserInfo())

  // Getters
  const isLoggedIn = computed(() => !!token.value)
  const role = computed(() => userInfo.value?.role || '')
  const isAdmin = computed(() => role.value === 'admin')
  const isManager = computed(() => ['admin', 'manager'].includes(role.value))
  const isFinance = computed(() => ['admin', 'manager', 'finance'].includes(role.value))

  // Actions
  async function login(credentials: LoginParams) {
    try {
      const res: any = await loginApi(credentials)
      const data = res.data || res
      token.value = data.token
      userInfo.value = data.user
      setToken(data.token)
      setUserInfo(data.user)
      return true
    } catch (error) {
      console.error('Login failed:', error)
      return false
    }
  }

  async function fetchUserProfile() {
    try {
      const res: any = await getUserProfileApi()
      const user = res.data || res
      userInfo.value = user
      setUserInfo(user)
    } catch (error) {
      console.error('Fetch profile failed:', error)
    }
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    removeToken()
  }

  function hasPermission(requiredRole: string): boolean {
    const roleHierarchy: Record<string, number> = {
      admin: 4,
      manager: 3,
      finance: 2,
      operator: 1,
    }
    const userLevel = roleHierarchy[role.value] || 0
    const requiredLevel = roleHierarchy[requiredRole] || 0
    return userLevel >= requiredLevel
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    role,
    isAdmin,
    isManager,
    isFinance,
    login,
    fetchUserProfile,
    logout,
    hasPermission,
  }
})
