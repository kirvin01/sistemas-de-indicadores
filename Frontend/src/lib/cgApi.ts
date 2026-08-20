import { apiFetch } from '@/lib/api'

export type CgIndicator = {
  slug: string
  codigo: string
  nombre: string
  grupo: string
  bloque: string
  meta_pct: number
  meta_variable?: boolean
  umbral: number | null
  kind: string
  patron: string
  descripcion: string
}

export type CgFiltros = {
  anios: number[]
  meses: string[]
  departamentos: string[]
  provincias: { departamento: string; provincia: string }[]
  redes: string[]
  microredes: { red: string; microred: string }[]
  fuentes: string[]
  fuente_aplicada: string | null
  has_seguro?: boolean
  seguros?: string[]
  default_seguro?: string | null
  meta_pct: number
  umbral: number | null
  kind: string
  codigo: string
  nombre: string
  descripcion: string
  extras: string[]
}

export type CgTotal = {
  denominador: number
  numerador: number
  avance_pct: number
  cumplimiento_pct: number | null
  umbral: number | null
  meta: number | null
  extras?: Record<string, number>
  logro_uci?: number
  cumplimiento_uci?: number
}

export type CgTablaCompleta = {
  anio: number
  mes: string | null
  fuente?: string | null
  kind: string
  total: CgTotal
  provincias: Array<{
    DEPARTAMENTO: string
    PROVINCIA: string
    denominador: number
    numerador: number
    avance_pct: number
    cumplimiento_pct: number | null
  }>
  distritos: Array<{
    DEPARTAMENTO: string
    PROVINCIA: string
    DISTRITO: string
    denominador: number
    numerador: number
    avance_pct: number
    cumplimiento_pct: number | null
  }>
}

export type CgTablaRedes = {
  anio: number
  mes: string | null
  fuente?: string | null
  kind: string
  total: CgTotal
  redes: Array<{ RED: string; denominador: number; numerador: number; avance_pct: number }>
  microredes: Array<{
    RED: string
    MICRORED: string
    denominador: number
    numerador: number
    avance_pct: number
  }>
  establecimientos: Array<{
    RED: string
    MICRORED: string
    ESTABLECIMIENTO: string
    denominador: number
    numerador: number
    avance_pct: number
  }>
}

export type CgResumenRow = {
  año: number
  MES: string
  fuente?: string | null
  total_denominador: number
  total_numerador: number
  avance_pct: number
  cumplimiento_pct: number | null
}

export type CgConfigRow = {
  id: number
  fuente: string
  fecha: string | null
  fecha_fmt: string | null
}

function qs(params: Record<string, string | number | undefined | null>) {
  const q = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== '') q.set(k, String(v))
  })
  return q.toString()
}

export const cgApi = {
  list: () => apiFetch<{ result: CgIndicator[] }>('/cg/indicadores'),
  config: () => apiFetch<{ result: CgConfigRow[] }>('/cg/config'),
  filtros: (slug: string, params?: { anio?: number; mes?: string }, init?: RequestInit) =>
    apiFetch<CgFiltros>(`/cg/${slug}/filtros?${qs(params ?? {})}`, init),
  tablaCompleta: (
    slug: string,
    params: { anio: number; mes?: string; seguro?: string },
    init?: RequestInit,
  ) => apiFetch<CgTablaCompleta>(`/cg/${slug}/tabla-completa?${qs(params)}`, init),
  tablaRedes: (
    slug: string,
    params: { anio: number; mes?: string; seguro?: string },
    init?: RequestInit,
  ) => apiFetch<CgTablaRedes>(`/cg/${slug}/tabla-redes?${qs(params)}`, init),
  resumen: (
    slug: string,
    params: { anio?: number; seguro?: string },
    init?: RequestInit,
  ) => apiFetch<{ data: CgResumenRow[] }>(`/cg/${slug}/resumen?${qs(params)}`, init),
}

export function cgAvanceTone(
  pct: number | null | undefined,
  meta = 50,
  kind?: string,
): 'success' | 'warning' | 'danger' | 'neutral' {
  if (pct == null) return 'neutral'
  if (kind === 'inverse_pct') {
    if (pct <= meta) return 'success'
    if (pct <= meta * 1.5) return 'warning'
    return 'danger'
  }
  if (pct >= meta) return 'success'
  if (pct >= meta * 0.75) return 'warning'
  return 'danger'
}
