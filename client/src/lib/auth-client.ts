import { createAuthClient } from 'better-auth/react'

// Same-origin: must match api.ts BASE so cookies work
export const authClient = createAuthClient({
  baseURL: '',
})

export const { signIn, signUp, signOut, useSession, resetPassword } = authClient
