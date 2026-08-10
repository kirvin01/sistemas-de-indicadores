const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? 'http://127.0.0.1:8001/api'

const TOKEN_KEY = 'sisindicadores_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json()
    if (typeof data?.detail === 'string') return data.detail
    if (typeof data?.message === 'string') return data.message
    return JSON.stringify(data)
  } catch {
    return res.statusText || 'Error de red'
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json')
  }
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(`${API_URL}${path.startsWith('/') ? path : `/${path}`}`, {
    ...init,
    headers,
  })

  if (res.status === 401) {
    setToken(null)
  }

  if (!res.ok) {
    throw new ApiError(res.status, await parseError(res))
  }

  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export type TokenResponse = {
  access_token: string
  token_type: string
  expires_in: number
}

export type Me = {
  id: number
  username: string
  profile: string
  profile_id: number
  permissions: string[]
  disabled: boolean
}

export type Usuario = {
  id: number
  username: string
  profile: string
  profile_id: number
  disabled: boolean
}

export type Perfil = {
  id: number
  codigo: string
  nombre: string
  activo: boolean
  permisos: string[]
}

export type Permiso = {
  id: number
  codigo: string
  nombre: string
  descripcion?: string | null
}

export const authApi = {
  login: (username: string, password: string) =>
    apiFetch<TokenResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  me: () => apiFetch<Me>('/auth/me'),
}

export const usersApi = {
  list: () => apiFetch<Usuario[]>('/usuarios'),
  create: (body: { username: string; password: string; profile_id: number; disabled?: boolean }) =>
    apiFetch<Usuario>('/usuarios', { method: 'POST', body: JSON.stringify(body) }),
  update: (
    id: number,
    body: { username: string; profile_id: number; disabled: boolean; password?: string | null },
  ) => apiFetch<Usuario>(`/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  remove: (id: number) => apiFetch<{ message: string }>(`/usuarios/${id}`, { method: 'DELETE' }),
}

export const profilesApi = {
  list: () => apiFetch<Perfil[]>('/perfiles'),
  permissions: () => apiFetch<Permiso[]>('/perfiles/permisos'),
  create: (body: { codigo: string; nombre: string; activo: boolean; permisos: string[] }) =>
    apiFetch<Perfil>('/perfiles', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: number, body: { nombre: string; activo: boolean; permisos: string[] }) =>
    apiFetch<Perfil>(`/perfiles/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
}

export type Paciente = {
  abrev_tipo_doc: string
  numero_documento: string
  fecha_nacimiento: string
  genero: string
  edad: number
}

export type Atencion = {
  n: number
  id_cita: string
  f_atencion: string
  codigo_item: string
  descripcion_item: string
  lab1: string
  lab2: string
  lab3: string
  f_registro: string
  f_modificacion: string
  establecimiento: string
  distrito_provincia: string
  sistema: string
  registrador: string
}

export const patientsApi = {
  search: (ndoc: string, init?: RequestInit) =>
    apiFetch<{ result: Paciente[] }>(`/paciente?ndoc=${encodeURIComponent(ndoc)}`, init),
  atenciones: (
    params: {
      ndoc: string
      anio: number
      mes?: number
      codigo?: string
      offset?: number
      per_page?: number
    },
    init?: RequestInit,
  ) => {
    const q = new URLSearchParams({
      ndoc: params.ndoc,
      anio: String(params.anio),
      offset: String(params.offset ?? 0),
      per_page: String(params.per_page ?? 25),
    })
    if (params.mes != null) q.set('mes', String(params.mes))
    const codigo = params.codigo?.trim()
    if (codigo && codigo.toLowerCase() !== 'todo' && codigo.toLowerCase() !== 'todos') {
      q.set('codigo', codigo)
    }
    return apiFetch<{ result: Atencion[] }>(`/atenciones?${q.toString()}`, init)
  },
}
