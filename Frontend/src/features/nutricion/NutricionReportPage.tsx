import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Apple,
  ArrowLeft,
  Filter,
  Loader2,
  Network,
  Search,
  TrendingUp,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ApiError } from '@/lib/api'
import {
  nutricionApi,
  nutricionAvanceTone,
  type NutricionFiltros,
  type NutricionResumenRow,
  type NutricionTablaRedes,
} from '@/lib/nutricionApi'
import { cardSurface } from '@/lib/chartTheme'
import { cn } from '@/lib/utils'
import {
  FedAvanceBarChart,
  FedTendenciaChart,
  type AvanceBarRow,
} from '@/features/fed/FedCharts'
import { FedRedesTable } from '@/features/fed/FedDataTables'
import { NutricionToolbar } from '@/features/nutricion/NutricionToolbar'
import type { FedTablaRedes } from '@/lib/fedApi'

type VistaTabla = 'jerarquica' | 'plana'

function fmtPct(v: number | null | undefined) {
  if (v == null) return '—'
  return `${Number(v).toFixed(2)}%`
}

function fmtN(v: number | null | undefined) {
  if (v == null) return '—'
  return Number(v).toLocaleString('es-PE', { maximumFractionDigits: 2 })
}

function shortLabel(value: string, max = 11) {
  const t = value.trim()
  if (t.length <= max) return t
  return `${t.slice(0, max)}…`
}

export function NutricionReportPage() {
  const { slug = '' } = useParams()
  const [filtros, setFiltros] = useState<NutricionFiltros | null>(null)
  const [anio, setAnio] = useState<number | null>(null)
  const [mes, setMes] = useState('')
  const [red, setRed] = useState('all')
  const [microred, setMicrored] = useState('all')
  const [busqueda, setBusqueda] = useState('')
  const [vista, setVista] = useState<VistaTabla>('jerarquica')
  const [redes, setRedes] = useState<NutricionTablaRedes | null>(null)
  const [resumen, setResumen] = useState<NutricionResumenRow[]>([])
  const [loadingFiltros, setLoadingFiltros] = useState(true)
  const [loadingData, setLoadingData] = useState(false)

  useEffect(() => {
    if (!slug) return
    const controller = new AbortController()
    setLoadingFiltros(true)
    setFiltros(null)
    setRedes(null)
    void nutricionApi
      .filtros(slug, { signal: controller.signal })
      .then((f) => {
        setFiltros(f)
        setAnio(f.anios[f.anios.length - 1] ?? new Date().getFullYear())
        setMes(f.meses[0] ?? '')
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

  const loadData = useCallback(
    async (signal?: AbortSignal) => {
      if (!slug || !anio || !mes) return
      setLoadingData(true)
      // Sin red/microred en API: filtrado client-side (cambio de filtro instantáneo)
      const params = { anio, mes }
      try {
        const [t, s] = await Promise.all([
          nutricionApi.tablaRedes(slug, params, { signal }),
          nutricionApi.resumen(slug, { anio }, { signal }),
        ])
        setRedes(t)
        setResumen(s.data)
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        toast.error(err instanceof ApiError ? err.message : 'Error al cargar el reporte')
      } finally {
        setLoadingData(false)
      }
    },
    [slug, anio, mes],
  )

  useEffect(() => {
    const controller = new AbortController()
    void loadData(controller.signal)
    return () => controller.abort()
  }, [loadData])

  const microredesFiltradas = useMemo(() => {
    if (!filtros) return []
    if (red === 'all') return filtros.microredes
    return filtros.microredes.filter((m) => m.red === red)
  }, [filtros, red])

  const metaRef = 100

  const total = useMemo(() => {
    if (!redes) return undefined
    if (red !== 'all' && microred !== 'all') {
      const rows = redes.establecimientos.filter(
        (e) => e.RED === red && e.MICRORED === microred,
      )
      const numerador = rows.reduce((s, r) => s + Number(r.numerador || 0), 0)
      const denominador = rows.reduce((s, r) => s + Number(r.denominador || 0), 0)
      return {
        numerador,
        denominador,
        avance_pct: denominador > 0 ? Math.round((numerador / denominador) * 10000) / 100 : 0,
      }
    }
    if (red !== 'all') {
      const row = redes.redes.find((r) => r.RED === red)
      return row
        ? {
            numerador: Number(row.numerador),
            denominador: Number(row.denominador),
            avance_pct: Number(row.avance_pct),
          }
        : undefined
    }
    return redes.total
  }, [redes, red, microred])

  const chartData: AvanceBarRow[] = useMemo(() => {
    if (!redes) return []
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
  }, [redes, red, microred])

  const chartTitle = useMemo(() => {
    if (red !== 'all' && microred !== 'all') return 'Avance por Establecimiento'
    if (red !== 'all') return 'Avance por Microred'
    return 'Avance por Red'
  }, [red, microred])

  const tendenciaData = useMemo(
    () =>
      resumen.map((r) => ({
        name: String(r.MES).slice(0, 3).toUpperCase(),
        'Avance %': Number(r.avance_pct),
      })),
    [resumen],
  )

  const kpiTone = nutricionAvanceTone(total?.avance_pct)

  if (loadingFiltros) {
    return (
      <div className="space-y-4">
        <NutricionToolbar />
        <div className="flex h-48 items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="size-5 animate-spin text-emerald-800" />
          Cargando indicador…
        </div>
      </div>
    )
  }

  if (!filtros) {
    return (
      <div className="space-y-4">
        <NutricionToolbar />
        <Link
          to="/nutricion"
          className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm hover:bg-muted"
        >
          <ArrowLeft className="size-4" />
          Volver a Nutrición
        </Link>
        <p className="text-muted-foreground">No se pudo cargar el indicador.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <NutricionToolbar />

      <div className="space-y-4">
        <Link
          to="/nutricion"
          className="-ml-2 inline-flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Nutrición
        </Link>
        <div className="flex items-start gap-4">
          <div className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Apple className="size-5" />
          </div>
          <div className="min-w-0 space-y-1.5">
            <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              {filtros.codigo}
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-slate-800 md:text-3xl">
              {filtros.nombre}
            </h2>
            <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
              Redes Integradas de Salud · Meta anual por establecimiento · Avance acumulado
              de enero al mes seleccionado
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <div className={cn('inline-flex items-center gap-2 px-4 py-2.5', cardSurface)}>
          <Network className="size-4 text-primary" />
          <span className="text-sm font-semibold text-slate-800">
            Redes Integradas de Salud
          </span>
        </div>
      </div>

      <div className={cn('p-4 md:p-5', cardSurface)}>
        <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
          <Filter className="size-4" />
          Filtros
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-[110px] space-y-1.5">
            <Label>Año</Label>
            <Select
              value={anio != null ? String(anio) : undefined}
              onValueChange={(v) => setAnio(Number(v))}
            >
              <SelectTrigger className="h-9 w-full rounded-xl">
                <SelectValue placeholder="Año" />
              </SelectTrigger>
              <SelectContent>
                {filtros.anios.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-[140px] space-y-1.5">
            <Label>Mes</Label>
            <Select value={mes} onValueChange={(v) => setMes(v ?? '')}>
              <SelectTrigger className="h-9 w-full rounded-xl">
                <SelectValue placeholder="Mes" />
              </SelectTrigger>
              <SelectContent>
                {filtros.meses.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[160px] flex-1 space-y-1.5 sm:max-w-xs">
            <Label>Red</Label>
            <Select
              value={red}
              onValueChange={(v) => {
                setRed(v ?? 'all')
                setMicrored('all')
              }}
            >
              <SelectTrigger className="h-9 w-full rounded-xl">
                <SelectValue placeholder="Red" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {filtros.redes.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[160px] flex-1 space-y-1.5 sm:max-w-xs">
            <Label>Microred</Label>
            <Select
              value={microred}
              onValueChange={(v) => setMicrored(v ?? 'all')}
              disabled={red === 'all'}
            >
              <SelectTrigger className="h-9 w-full rounded-xl">
                <SelectValue placeholder="Microred" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {microredesFiltradas.map((m) => (
                  <SelectItem key={`${m.red}-${m.microred}`} value={m.microred}>
                    {m.microred}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="relative min-w-[200px] flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar establecimiento..."
              className="h-9 rounded-xl pl-9"
            />
          </div>
        </div>
      </div>

      {loadingData ? (
        <div className="flex h-48 items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="size-5 animate-spin text-emerald-800" />
          Cargando datos…
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <div className={cn('p-4', cardSurface)}>
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Avance
              </p>
              <p
                className={cn(
                  'mt-1 text-3xl font-bold tabular-nums',
                  kpiTone === 'success' && 'text-emerald-700',
                  kpiTone === 'warning' && 'text-amber-600',
                  kpiTone === 'danger' && 'text-rose-600',
                )}
              >
                {fmtPct(total?.avance_pct)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {redes?.mes} {redes?.anio}
              </p>
            </div>
            <div className={cn('p-4', cardSurface)}>
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Meta anual (Σ máx. EESS)
              </p>
              <p className="mt-1 text-3xl font-bold tabular-nums text-slate-800">
                {fmtN(total?.denominador)}
              </p>
            </div>
            <div className={cn('p-4', cardSurface)}>
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Avance acumulado (Σ)
              </p>
              <p className="mt-1 text-3xl font-bold tabular-nums text-slate-800">
                {fmtN(total?.numerador)}
              </p>
            </div>
            <div className={cn('p-4', cardSurface)}>
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Referencia
              </p>
              <p className="mt-1 flex items-center gap-2 text-3xl font-bold text-slate-800">
                <TrendingUp className="size-6 text-primary" />
                100%
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <FedAvanceBarChart titulo={chartTitle} data={chartData} />
            <FedTendenciaChart data={tendenciaData} meta={metaRef} />
          </div>

          <div className={cn('overflow-hidden', cardSurface)}>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 px-4 py-3">
              <p className="text-sm font-semibold text-slate-800">Detalle por redes</p>
              <div className="inline-flex rounded-lg bg-muted p-0.5">
                <button
                  type="button"
                  onClick={() => setVista('jerarquica')}
                  className={cn(
                    'rounded-md px-3 py-1 text-xs font-semibold',
                    vista === 'jerarquica' ? 'bg-white text-slate-900 shadow-sm' : 'text-muted-foreground',
                  )}
                >
                  Jerárquica
                </button>
                <button
                  type="button"
                  onClick={() => setVista('plana')}
                  className={cn(
                    'rounded-md px-3 py-1 text-xs font-semibold',
                    vista === 'plana' ? 'bg-white text-slate-900 shadow-sm' : 'text-muted-foreground',
                  )}
                >
                  Plana
                </button>
              </div>
            </div>
            <div className="p-2 md:p-3">
              {redes ? (
                <FedRedesTable
                  redes={redes as unknown as FedTablaRedes}
                  busqueda={busqueda}
                  meta={metaRef}
                  vista={vista}
                />
              ) : null}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
