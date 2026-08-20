import type { AvanceBarRow } from '@/features/fed/FedCharts'
import type {
  CgFiltros,
  CgResumenRow,
  CgTablaCompleta,
  CgTablaRedes,
  CgTotal,
} from '@/lib/cgApi'
import { shortLabel } from '@/features/cg/cgFormatters'

export type CgModo = 'territorial' | 'redes'

export function rollTotal(
  rows: Array<{ numerador: number; denominador: number; avance_pct: number }>,
): CgTotal | undefined {
  if (!rows.length) return undefined
  const numerador = rows.reduce((s, r) => s + Number(r.numerador || 0), 0)
  const denominador = rows.reduce((s, r) => s + Number(r.denominador || 0), 0)
  return {
    numerador,
    denominador,
    avance_pct: denominador > 0 ? Math.round((numerador / denominador) * 10000) / 100 : 0,
    cumplimiento_pct: null,
    umbral: null,
    meta: null,
  }
}

export function selectTotal(
  isRedes: boolean,
  redes: CgTablaRedes | null,
  tabla: CgTablaCompleta | null,
  red: string,
  microred: string,
  provincia: string,
): CgTotal | undefined {
  if (isRedes && redes) {
    if (red !== 'all' && microred !== 'all') {
      return (
        rollTotal(
          redes.establecimientos.filter((e) => e.RED === red && e.MICRORED === microred),
        ) ?? redes.total
      )
    }
    if (red !== 'all') {
      const row = redes.redes.find((r) => r.RED === red)
      return row
        ? {
            ...redes.total,
            numerador: Number(row.numerador),
            denominador: Number(row.denominador),
            avance_pct: Number(row.avance_pct),
          }
        : redes.total
    }
    return redes.total
  }
  if (!isRedes && tabla) {
    if (provincia !== 'all') {
      const row = tabla.provincias.find((p) => p.PROVINCIA === provincia)
      return row
        ? {
            ...tabla.total,
            numerador: Number(row.numerador),
            denominador: Number(row.denominador),
            avance_pct: Number(row.avance_pct),
            cumplimiento_pct: row.cumplimiento_pct,
          }
        : tabla.total
    }
    return tabla.total
  }
  return undefined
}

export function buildChartData(
  isRedes: boolean,
  redes: CgTablaRedes | null,
  tabla: CgTablaCompleta | null,
  red: string,
  microred: string,
  provincia: string,
): AvanceBarRow[] {
  if (isRedes && redes) {
    if (red !== 'all' && microred !== 'all') {
      return redes.establecimientos
        .filter((e) => e.RED === red && e.MICRORED === microred)
        .map((e) => ({
          name: shortLabel(e.ESTABLECIMIENTO, 14),
          Denominador: Number(e.denominador),
          Numerador: Number(e.numerador),
          avance_pct: Number(e.avance_pct),
        }))
    }
    if (red !== 'all') {
      return redes.microredes
        .filter((m) => m.RED === red)
        .map((m) => ({
          name: shortLabel(m.MICRORED),
          Denominador: Number(m.denominador),
          Numerador: Number(m.numerador),
          avance_pct: Number(m.avance_pct),
        }))
    }
    return redes.redes.map((r) => ({
      name: shortLabel(r.RED),
      Denominador: Number(r.denominador),
      Numerador: Number(r.numerador),
      avance_pct: Number(r.avance_pct),
    }))
  }
  if (!isRedes && tabla) {
    if (provincia !== 'all') {
      return tabla.distritos
        .filter((d) => d.PROVINCIA === provincia)
        .map((d) => ({
          name: shortLabel(d.DISTRITO),
          Denominador: Number(d.denominador),
          Numerador: Number(d.numerador),
          avance_pct: Number(d.avance_pct),
        }))
    }
    return tabla.provincias.map((p) => ({
      name: shortLabel(p.PROVINCIA),
      Denominador: Number(p.denominador),
      Numerador: Number(p.numerador),
      avance_pct: Number(p.avance_pct),
    }))
  }
  return []
}

export function buildChartTitle(
  isRedes: boolean,
  red: string,
  microred: string,
  provincia: string,
) {
  if (isRedes) {
    if (red !== 'all' && microred !== 'all') return 'Logro por Establecimiento'
    if (red !== 'all') return 'Logro por Microred'
    return 'Logro por Red'
  }
  if (provincia !== 'all') return 'Logro por Distrito'
  return 'Logro por Provincia'
}

export function buildTendenciaData(resumen: CgResumenRow[]) {
  return resumen.map((r) => ({
    name: String(r.MES).slice(0, 3).toUpperCase(),
    'Avance %': Number(r.avance_pct),
  }))
}

export type ChartRefs = {
  refMeta: number | null
  refUmbral: number | null
  chartUnit: string
  chartPercentScale: boolean
  tendenciaMeta: number
}

export function resolveChartRefs(
  slug: string,
  kind: string | undefined,
  total: CgTotal | undefined,
  filtros: CgFiltros,
  metaFallback: number,
): ChartRefs {
  const refMeta = slug === 'cg18' ? 30 : (total?.meta ?? metaFallback || null)
  const refUmbral = slug === 'cg18' ? 12 : (total?.umbral ?? filtros.umbral ?? null)
  const chartUnit = kind === 'rate_10k' || kind === 'ratio_raw' ? '' : '%'
  const tendenciaMeta =
    kind === 'rate_10k' || kind === 'ratio_raw'
      ? Number(refMeta) || 0
      : Number(refMeta) || 100
  return {
    refMeta,
    refUmbral,
    chartUnit,
    chartPercentScale: chartUnit === '%',
    tendenciaMeta,
  }
}
