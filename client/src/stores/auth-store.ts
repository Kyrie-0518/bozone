import { create } from 'zustand'
import { getUser, getToken, clearAuth } from '@/lib/auth-client'
import type { AuthUser as JWTUser } from '@/lib/auth-client'

interface AuthState {
  auth: {
    user: JWTUser | null
    setUser: (user: JWTUser | null) => void
    accessToken: string
    setAccessToken: (token: string) => void
    resetAccessToken: () => void
    reset: () => void
  }
}

export const useAuthStore = create<AuthState>()(() => {
  // Initialize from localStorage (JWT-based, not cookie)
  const initToken = getToken() || ''
  return {
    auth: {
      user: getUser(),
      setUser: (user) =>
        set((state) => ({ ...state, auth: { ...state.auth, user } })),
      accessToken: initToken,
      setAccessToken: (_accessToken) => {
        // Token is managed by auth-client via localStorage
      },
      resetAccessToken: () => {
        clearAuth()
        set((state) => ({ ...state, auth: { ...state.auth, accessToken: '', user: null } }))
      },
      reset: () => {
        clearAuth()
        set((state) => ({
          ...state,
          auth: { ...state.auth, user: null, accessToken: '' },
        }))
      },
    },
  }
})
