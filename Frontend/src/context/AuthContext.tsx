import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useIdleTimeout } from '@/hooks/useIdleTimeout'
import {
  authApi,
  getExpiresAt,
  getToken,
  setToken,
  type Me,
} from '@/lib/api'

const IDLE_MS = 5 * 60 * 1000

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
  const navigate = useNavigate()

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
  }, [])

  const endSession = useCallback(
    (message: string) => {
      logout()
      toast.message(message)
      navigate('/login', { replace: true })
    },
    [logout, navigate],
  )

  const refresh = useCallback(async () => {
    const token = getToken()
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }
    const expiresAt = getExpiresAt()
    if (expiresAt != null && Date.now() >= expiresAt) {
      setToken(null)
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

  useEffect(() => {
    const onUnauthorized = () => {
      endSession('Sesión expirada. Inicie sesión nuevamente.')
    }
    window.addEventListener('auth:unauthorized', onUnauthorized)
    return () => window.removeEventListener('auth:unauthorized', onUnauthorized)
  }, [endSession])

  useIdleTimeout(Boolean(user), IDLE_MS, () => {
    endSession('Sesión bloqueada por inactividad.')
  })

  const login = useCallback(async (username: string, password: string) => {
    const token = await authApi.login(username, password)
    setToken(token.access_token, token.expires_in)
    const me = await authApi.me()
    setUser(me)
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
