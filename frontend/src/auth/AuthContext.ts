import { createContext } from 'react'
import type { AuthUser, LoginResponse } from '../types/models'

export interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  isAdmin: boolean
  applySession: (response: LoginResponse) => void
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
