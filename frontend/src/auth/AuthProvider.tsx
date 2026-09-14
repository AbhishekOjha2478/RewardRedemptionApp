import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { api, setUnauthorizedHandler } from '../api/client'
import { AuthContext } from './AuthContext'
import type { AuthContextValue } from './AuthContext'
import type { AuthUser, LoginResponse } from '../types/models'
import { clearSession, getRefreshToken, getStoredUser, saveSession } from './tokenStorage'

interface AuthProviderProps {
  children: ReactNode
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const navigate = useNavigate()
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser())

  const applySession = useCallback((response: LoginResponse) => {
    saveSession(response)
    setUser(response.user)
  }, [])

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken()
    if (refreshToken) {
      try {
        await api.post('/auth/logout', { refreshToken })
      } catch {
        setUser(null)
      }
    }
    clearSession()
    setUser(null)
    navigate('/login', { replace: true })
  }, [navigate])

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null)
      navigate('/login', { replace: true })
    })
  }, [navigate])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isAdmin: user?.role === 'ADMIN_CES',
      applySession,
      logout,
    }),
    [user, applySession, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
