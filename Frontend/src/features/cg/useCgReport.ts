import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { pickDefaultMes } from '@/features/cg/cgFormatters'
import {
  buildChartData,
  buildChartTitle,
  buildTendenciaData,
  resolveChartRefs,
  selectTotal,
  type CgModo,
} from '@/features/cg/cgReportModel'
import { ApiError } from '@/lib/api'
import { cgApi, cgAvanceTone, type CgFiltros, type CgResumenRow, type CgTablaCompleta, type CgTablaRedes } from '@/lib/cgApi'

export function useCgReport(slug: string) {
  const [filtros, setFiltros] = useState<CgFiltros | null>(null)
  const [anio, setAnio] = useState<number | null>(null)
  const [mes, setMes] = useState('')
  const [seguro, setSeguro] = useState('')
  const [provincia, setProvincia] = useState('all')
  const [red, setRed] = useState('all')
  const [microred, setMicrored] = useState('all')
  const [busqueda, setBusqueda] = useState('')
  const [modo, setModo] = useState<CgModo>('redes')
  const [vista, setVista] = useState<'jerarquica' | 'plana'>('jerarquica')
  const [tabla, setTabla] = useState<CgTablaCompleta | null>(null)
  const [redes, setRedes] = useState<CgTablaRedes | null>(null)
  const [resumen, setResumen] = useState<CgResumenRow[]>([])
  const [loadingFiltros, setLoadingFiltros] = useState(true)
  const [loadingData, setLoadingData] = useState(false)

  const isRedes = modo === 'redes'

  useEffect(() => {
    if (!slug) return
    const controller = new AbortController()
    setLoadingFiltros(true)
    setFiltros(null)
    setTabla(null)
    setRedes(null)
    void cgApi
      .filtros(slug, undefined, { signal: controller.signal })
      .then((f) => {
        setFiltros(f)
        setAnio(f.anios[f.anios.length - 1] ?? new Date().getFullYear())
        setMes(pickDefaultMes(f.meses))
        setSeguro(
          f.has_seguro
            ? (f.default_seguro ??
                f.seguros?.find((s) => s.toUpperCase() === 'MINSA') ??
                f.seguros?.[0] ??
                '')
            : '',
        )
        setProvincia('all')
        setRed('all')
        setMicrored('all')
        setBusqueda('')
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        toast.error(err instanceof ApiError ? err.message : 'Error al cargar filtros')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingFiltros(false)
      })
    return () => controller.abort()
  }, [slug])

  useEffect(() => {
    if (!slug || anio == null) return
    const controller = new AbortController()
    void cgApi
      .filtros(slug, { anio, mes: mes || undefined }, { signal: controller.signal })
      .then((f) => {
        setFiltros((prev) =>
          prev
            ? {
                ...f,
                anios: prev.anios.length ? prev.anios : f.anios,
                meses: prev.meses.length ? prev.meses : f.meses,
                seguros: f.seguros?.length ? f.seguros : prev.seguros,
                has_seguro: f.has_seguro ?? prev.has_seguro,
                default_seguro: f.default_seguro ?? prev.default_seguro,
              }
            : f,
        )
        setSeguro((prev) => {
          if (!f.has_seguro) return ''
          const list = f.seguros ?? []
          if (prev && list.includes(prev)) return prev
          return f.default_seguro ?? list.find((s) => s.toUpperCase() === 'MINSA') ?? list[0] ?? ''
        })
        setProvincia('all')
        setRed('all')
        setMicrored('all')
      })
      .catch(() => {})
    return () => controller.abort()
  }, [slug, anio, mes])

  const loadData = useCallback(
    async (signal?: AbortSignal) => {
      if (!slug || !anio) return
      if (filtros && filtros.meses.length > 0 && !mes) return
      if (filtros?.has_seguro && filtros.seguros && filtros.seguros.length > 0 && !seguro) return
      setLoadingData(true)
      const params = {
        anio,
        mes: mes || undefined,
        seguro: filtros?.has_seguro && seguro ? seguro : undefined,
      }
      try {
        const resumenP = cgApi.resumen(
          slug,
          { anio, seguro: params.seguro },
          { signal },
        )
        if (modo === 'redes') {
          const [r, s] = await Promise.all([
            cgApi.tablaRedes(slug, params, { signal }),
            resumenP,
          ])
          setRedes(r)
          setTabla(null)
          setResumen(s.data)
        } else {
          const [t, s] = await Promise.all([
            cgApi.tablaCompleta(slug, params, { signal }),
            resumenP,
          ])
          setTabla(t)
          setRedes(null)
          setResumen(s.data)
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        toast.error(err instanceof ApiError ? err.message : 'Error al cargar el reporte')
      } finally {
        setLoadingData(false)
      }
    },
    [slug, anio, mes, modo, filtros, seguro],
  )

  useEffect(() => {
    const controller = new AbortController()
    void loadData(controller.signal)
    return () => controller.abort()
  }, [loadData])

  const provinciasUnicas = useMemo(() => {
    if (!filtros) return []
    return [...new Set(filtros.provincias.map((p) => p.provincia))].sort((a, b) =>
      a.localeCompare(b, 'es'),
    )
  }, [filtros])

  const microredesFiltradas = useMemo(() => {
    if (!filtros) return []
    if (red === 'all') return filtros.microredes
    return filtros.microredes.filter((m) => m.red === red)
  }, [filtros, red])

  const kind = filtros?.kind
  const metaFallback = (isRedes ? redes?.total.meta : tabla?.total.meta) ?? filtros?.meta_pct ?? 0
  const total = useMemo(
    () => selectTotal(isRedes, redes, tabla, red, microred, provincia),
    [isRedes, redes, tabla, red, microred, provincia],
  )

  const chartData = useMemo(
    () => buildChartData(isRedes, redes, tabla, red, microred, provincia),
    [isRedes, redes, tabla, red, microred, provincia],
  )

  const chartTitle = useMemo(
    () => buildChartTitle(isRedes, red, microred, provincia),
    [isRedes, red, microred, provincia],
  )

  const tendenciaData = useMemo(() => buildTendenciaData(resumen), [resumen])

  const chartRefs = useMemo(
    () =>
      filtros
        ? resolveChartRefs(slug, kind, total, filtros, metaFallback)
        : null,
    [slug, kind, total, filtros, metaFallback],
  )

  const kpiTone = cgAvanceTone(total?.avance_pct, metaFallback || 50, kind)
  const mesLabel = isRedes ? redes?.mes : tabla?.mes
  const anioLabel = isRedes ? redes?.anio : tabla?.anio
  const fuenteAplicada = (isRedes ? redes?.fuente : tabla?.fuente) ?? filtros?.fuente_aplicada

  return {
    filtros,
    loadingFiltros,
    loadingData,
    anio,
    setAnio,
    mes,
    setMes,
    seguro,
    setSeguro,
    provincia,
    setProvincia,
    red,
    setRed,
    microred,
    setMicrored,
    busqueda,
    setBusqueda,
    modo,
    setModo,
    vista,
    setVista,
    isRedes,
    kind,
    metaFallback,
    total,
    kpiTone,
    chartData,
    chartTitle,
    tendenciaData,
    chartRefs,
    mesLabel,
    anioLabel,
    fuenteAplicada,
    provinciasUnicas,
    microredesFiltradas,
    tabla,
    redes,
  }
}
