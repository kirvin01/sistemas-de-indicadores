import { apiFetch } from '@/lib/api'

export type FedIndicator = {
  slug: string
  codigo: string
  nombre: string
  grupo: string
  bloque: string
  meta_pct: number
  patron: string
}

export type FedFiltros = {
  anios: number[]
  meses: string[]
  departamentos: string[]
  provincias: { departamento: string; provincia: string }[]
  redes: string[]
  microredes: { red: string; microred: string }[]
  categorias: string[]
  meta_pct: number
  codigo: string
  nombre: string
}

export type FedTotal = {
  denominador: number
  numerador: number
  avance_pct: number
}

export type FedTablaCompleta = {
  anio: number
  mes: string
  total: FedTotal
  provincias: Array<{
    DEPARTAMENTO: string
    PROVINCIA: string
    denominador: number
    numerador: number
    avance_pct: number
  }>
  distritos: Array<{
    DEPARTAMENTO: string
    PROVINCIA: string
    DISTRITO: string
    denominador: number
    numerador: number
    avance_pct: number
  }>
}

export type FedTablaRedes = {
  anio: number
  mes: string
  total: FedTotal
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

export type FedResumenRow = {
  año: number
  MES: string
  total_denominador: number
  total_numerador: number
  avance_pct: number
}

function qs(params: Record<string, string | number | undefined | null>) {
  const q = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== '') q.set(k, String(v))
  })
  return q.toString()
}

export const fedApi = {
  list: () => apiFetch<{ result: FedIndicator[] }>('/fed/indicadores'),
  filtros: (slug: string, init?: RequestInit) =>
    apiFetch<FedFiltros>(`/fed/${slug}/filtros`, init),
  tablaCompleta: (
    slug: string,
    params: {
      anio: number
      mes: string
      departamento?: string
      provincia?: string
      red?: string
      microred?: string
      categoria?: string
    },
    init?: RequestInit,
  ) =>
    apiFetch<FedTablaCompleta>(`/fed/${slug}/tabla-completa?${qs(params)}`, init),
  tablaRedes: (
    slug: string,
    params: {
      anio: number
      mes: string
      departamento?: string
      provincia?: string
      red?: string
      microred?: string
      categoria?: string
    },
    init?: RequestInit,
  ) => apiFetch<FedTablaRedes>(`/fed/${slug}/tabla-redes?${qs(params)}`, init),
  resumen: (
    slug: string,
    params: { anio?: number; departamento?: string; red?: string },
    init?: RequestInit,
  ) => apiFetch<{ data: FedResumenRow[] }>(`/fed/${slug}/resumen?${qs(params)}`, init),
}

export function avanceTone(
  pct: number | null | undefined,
  meta = 40.7,
): 'success' | 'warning' | 'danger' | 'neutral' {
  if (pct == null) return 'neutral'
  if (pct >= meta) return 'success'
  if (pct >= meta * 0.75) return 'warning'
  return 'danger'
}
