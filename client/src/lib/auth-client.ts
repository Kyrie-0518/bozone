import { createAuthClient } from 'better-auth/react'

// Must match api.ts BASE URL so cookies are same-origin
const getBaseUrl = () => {
  if (typeof window === 'undefined') return ''
  const hostname = window.location.hostname
  // Local dev → localhost:3001; Production → server IP:3001
  return hostname === 'localhost'
    ? 'http://localhost:3001'
    : `http://${hostname}:3001`
}

export const authClient = createAuthClient({
  baseURL: getBaseUrl(),
})

export const { signIn, signUp, signOut, useSession, resetPassword } = authClient
