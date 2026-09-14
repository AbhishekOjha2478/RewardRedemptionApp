import type { AuthUser, LoginResponse } from '../types/models'

const ACCESS_TOKEN_KEY = 'aurum.accessToken'
const REFRESH_TOKEN_KEY = 'aurum.refreshToken'
const USER_KEY = 'aurum.user'

function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    return
  }
}

export function getAccessToken(): string | null {
  return read(ACCESS_TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  return read(REFRESH_TOKEN_KEY)
}

export function getStoredUser(): AuthUser | null {
  const raw = read(USER_KEY)
  if (!raw) {
    return null
  }
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export function saveSession(response: LoginResponse) {
  write(ACCESS_TOKEN_KEY, response.accessToken)
  write(REFRESH_TOKEN_KEY, response.refreshToken)
  write(USER_KEY, JSON.stringify(response.user))
}

export function saveTokens(accessToken: string, refreshToken: string) {
  write(ACCESS_TOKEN_KEY, accessToken)
  write(REFRESH_TOKEN_KEY, refreshToken)
}

export function clearSession() {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  } catch {
    return
  }
}
