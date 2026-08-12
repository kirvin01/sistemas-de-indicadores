import { apiFetch } from '@/lib/api'

export type NutricionIndicator = {
  slug: string
  codigo: string
  nombre: string
  grupo: string
  bloque: string
  patron: string
}

export type NutricionFiltros = {
  anios: number[]
  meses: string[]
  redes: string[]
  microredes: { red: string; microred: string }[]
  codigo: string
  nombre: string
}

export type NutricionTotal = {
  denominador: number
  numerador: number
  avance_pct: number
}

export type NutricionTablaRedes = {
  anio: number
  mes: string
  total: NutricionTotal
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

export type NutricionResumenRow = {
  anio: number
  MES: string
  total_denominador: number
  total_numerador: number
  avance_pct: number
}

export type NutricionConfigRow = {
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

export const nutricionApi = {
  list: () => apiFetch<{ result: NutricionIndicator[] }>('/nutricion/indicadores'),
  config: () => apiFetch<{ result: NutricionConfigRow[] }>('/nutricion/config'),
  filtros: (slug: string, init?: RequestInit) =>
    apiFetch<NutricionFiltros>(`/nutricion/${slug}/filtros`, init),
  tablaRedes: (
    slug: string,
    params: { anio: number; mes: string; red?: string; microred?: string },
    init?: RequestInit,
  ) => apiFetch<NutricionTablaRedes>(`/nutricion/${slug}/tabla-redes?${qs(params)}`, init),
  resumen: (
    slug: string,
    params: { anio?: number; red?: string },
    init?: RequestInit,
  ) =>
    apiFetch<{ data: NutricionResumenRow[] }>(
      `/nutricion/${slug}/resumen?${qs(params)}`,
      init,
    ),
}

export function nutricionAvanceTone(
  pct: number | null | undefined,
): 'success' | 'warning' | 'danger' | 'neutral' {
  if (pct == null) return 'neutral'
  if (pct >= 100) return 'success'
  if (pct >= 75) return 'warning'
  return 'danger'
}
