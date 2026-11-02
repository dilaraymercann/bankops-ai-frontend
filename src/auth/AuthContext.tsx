import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { apiFetch, UNAUTHORIZED_EVENT } from '@/api/client'
import type { LoginResponse, UserSummary } from '@/api/types'
import { clearSession, loadSession, saveSession } from './session'

interface AuthContextValue {
  user: UserSummary | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [user, setUser] = useState<UserSummary | null>(() => loadSession()?.user ?? null)

  const logout = useCallback(() => {
    clearSession()
    setUser(null)
    // Önceki kullanıcının verisi bir sonraki kullanıcıya görünmesin
    queryClient.clear()
  }, [queryClient])

  const login = useCallback(async (username: string, password: string) => {
    const response = await apiFetch<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
    saveSession(response)
    setUser(response.user)
  }, [])

  // Token süresi dolarsa ya da sunucu 401 dönerse oturum kapatılır
  useEffect(() => {
    window.addEventListener(UNAUTHORIZED_EVENT, logout)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, logout)
  }, [logout])

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth, AuthProvider içinde kullanılmalıdır')
  return context
}
