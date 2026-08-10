import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { authApi, getToken, setToken, type Me } from '@/lib/api'

type AuthContextValue = {
  user: Me | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  can: (permission: string) => boolean
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function hasPermission(user: Me | null, permission: string): boolean {
  if (!user) return false
  const codes = user.permissions
  if (codes.includes('*')) return true
  if (codes.includes(permission)) return true
  const [module] = permission.split(':')
  return codes.includes(`${module}:*`)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Me | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const token = getToken()
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      const me = await authApi.me()
      setUser(me)
    } catch {
      setToken(null)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const login = useCallback(async (username: string, password: string) => {
    const token = await authApi.login(username, password)
    setToken(token.access_token)
    const me = await authApi.me()
    setUser(me)
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      can: (permission: string) => hasPermission(user, permission),
      refresh,
    }),
    [user, loading, login, logout, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
