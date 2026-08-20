const MESES_ES = [
  'ENERO',
  'FEBRERO',
  'MARZO',
  'ABRIL',
  'MAYO',
  'JUNIO',
  'JULIO',
  'AGOSTO',
  'SEPTIEMBRE',
  'OCTUBRE',
  'NOVIEMBRE',
  'DICIEMBRE',
] as const

export function mesRank(mes: string) {
  return MESES_ES.indexOf(mes.toUpperCase() as (typeof MESES_ES)[number])
}

/** Mes calendario actual si existe en datos; si no, el más reciente disponible ≤ hoy. */
export function pickDefaultMes(meses: string[]): string {
  if (!meses.length) return ''
  const normalized = meses.map((m) => m.toUpperCase())
  const current = MESES_ES[new Date().getMonth()]
  if (normalized.includes(current)) return current

  const curIdx = new Date().getMonth()
  const sorted = [...normalized].sort((a, b) => mesRank(a) - mesRank(b))
  const atOrBefore = sorted.filter((m) => mesRank(m) <= curIdx)
  if (atOrBefore.length) return atOrBefore[atOrBefore.length - 1]
  return sorted[sorted.length - 1] ?? meses[meses.length - 1]
}

export function fmtPct(v: number | null | undefined) {
  if (v == null) return '—'
  return `${Number(v).toFixed(2)}%`
}

export function fmtMetaLabel(
  meta: number | null | undefined,
  kind?: string,
  slug?: string,
) {
  if (slug === 'cg18') return '12–30 egresos/cama'
  if (meta == null) return null
  if (kind === 'ratio_raw' || kind === 'rate_10k') return String(meta)
  if (kind === 'ratio_pct' || kind === 'inverse_pct' || kind === 'dual_ratio') {
    return `${Number(meta).toFixed(2)}%`
  }
  return String(meta)
}

export function fmtLogro(v: number | null | undefined, kind?: string) {
  if (v == null) return '—'
  if (kind === 'ratio_raw' || kind === 'rate_10k') return Number(v).toFixed(2)
  return fmtPct(v)
}

export function shortLabel(value: string, max = 11) {
  const t = value.trim()
  if (t.length <= max) return t
  return `${t.slice(0, max)}…`
}
