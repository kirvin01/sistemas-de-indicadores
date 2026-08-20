/** Colores semánticos solo para series de datos (alta saturación en ink, no en fondos). */
export const chartTheme = {
  /** Serie comparativa (denominador) */
  comparative: '#0EA5E9',
  /** Serie principal / avance (numerador o %) */
  progress: '#0F766E',
  /** Logro esperado / meta */
  meta: '#059669',
  /** Valor umbral */
  umbral: '#D97706',
  /** Meta / alerta (legado) */
  alert: '#E11D48',
  grid: 'rgba(30, 41, 59, 0.07)',
  axis: '#64748B',
  title: '#1E293B',
  border: '#E2E8F0',
  tooltipShadow: '0 10px 28px -16px rgba(15, 23, 42, 0.28)',
} as const

export const cardSurface =
  'rounded-xl border border-border/80 bg-card shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-16px_rgba(15,23,42,0.12)]'
