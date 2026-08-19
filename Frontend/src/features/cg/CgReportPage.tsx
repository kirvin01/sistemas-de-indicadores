import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Activity,
  ArrowLeft,
  Filter,
  Handshake,
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
  cgApi,
  cgAvanceTone,
  type CgFiltros,
  type CgResumenRow,
  type CgTablaCompleta,
  type CgTablaRedes,
  type CgTotal,
} from '@/lib/cgApi'
import { cardSurface } from '@/lib/chartTheme'
import { cn } from '@/lib/utils'
import {
  FedAvanceBarChart,
  FedTendenciaChart,
  type AvanceBarRow,
} from '@/features/fed/FedCharts'
import { FedRedesTable, FedTerritorialTable } from '@/features/fed/FedDataTables'
import { CgToolbar } from '@/features/cg/CgToolbar'
import type { FedTablaCompleta, FedTablaRedes } from '@/lib/fedApi'

type Modo = 'territorial' | 'redes'
type VistaTabla = 'jerarquica' | 'plana'

function fmtPct(v: number | null | undefined) {
  if (v == null) return '—'
  return `${Number(v).toFixed(2)}%`
}

function fmtLogro(v: number | null | undefined, kind?: string) {
  if (v == null) return '—'
  if (kind === 'ratio_raw') return Number(v).toFixed(2)
  if (kind === 'rate_10k') return Number(v).toFixed(2)
  return fmtPct(v)
}

function shortLabel(value: string, max = 11) {
  const t = value.trim()
  if (t.length <= max) return t
  return `${t.slice(0, max)}…`
}

function rollTotal(
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

export function CgReportPage() {
  const { slug = '' } = useParams()
  const [filtros, setFiltros] = useState<CgFiltros | null>(null)
  const [anio, setAnio] = useState<number | null>(null)
  const [mes, setMes] = useState('')
  const [fuente, setFuente] = useState('')
  const [provincia, setProvincia] = useState('all')
  const [red, setRed] = useState('all')
  const [microred, setMicrored] = useState('all')
  const [busqueda, setBusqueda] = useState('')
  const [modo, setModo] = useState<Modo>('redes')
  const [vista, setVista] = useState<VistaTabla>('jerarquica')
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
        setMes(f.meses[0] ?? '')
        setFuente(f.default_fuente ?? f.fuentes[0] ?? '')
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
    if (!slug || !fuente) return
    const controller = new AbortController()
    void cgApi
      .filtros(slug, { fuente }, { signal: controller.signal })
      .then((f) => {
        setFiltros((prev) =>
          prev
            ? {
                ...f,
                fuentes: prev.fuentes.length ? prev.fuentes : f.fuentes,
              }
            : f,
        )
        setAnio((y) => (f.anios.includes(y as number) ? y : (f.anios[f.anios.length - 1] ?? y)))
        setMes((m) => (f.meses.includes(m) ? m : (f.meses[0] ?? m)))
      })
      .catch(() => {
        /* el loadData mostrará error si no hay datos */
      })
    return () => controller.abort()
  }, [slug, fuente])
    async (signal?: AbortSignal) => {
      if (!slug || !anio || !mes) return
      setLoadingData(true)
      const params = { anio, mes, fuente: fuente || undefined }
      try {
        const resumenP = cgApi.resumen(slug, { anio, fuente: params.fuente }, { signal })
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
    [slug, anio, mes, modo, fuente],
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
  const meta = (isRedes ? redes?.total.meta : tabla?.total.meta) ?? filtros?.meta_pct ?? 0

  const total = useMemo(() => {
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
  }, [isRedes, redes, tabla, red, microred, provincia])

  const mesLabel = isRedes ? redes?.mes : tabla?.mes
  const anioLabel = isRedes ? redes?.anio : tabla?.anio

  const chartData: AvanceBarRow[] = useMemo(() => {
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
  }, [isRedes, redes, tabla, red, microred, provincia])

  const chartTitle = useMemo(() => {
    if (isRedes) {
      if (red !== 'all' && microred !== 'all') return 'Logro por Establecimiento'
      if (red !== 'all') return 'Logro por Microred'
      return 'Logro por Red'
    }
    if (provincia !== 'all') return 'Logro por Distrito'
    return 'Logro por Provincia'
  }, [isRedes, red, microred, provincia])

  const tendenciaData = useMemo(
    () =>
      resumen.map((r) => ({
        name: String(r.MES).slice(0, 3).toUpperCase(),
        'Avance %': Number(r.avance_pct),
      })),
    [resumen],
  )

  if (loadingFiltros) {
    return (
      <div className="space-y-4">
        <CgToolbar />
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
        <CgToolbar />
        <Link
          to="/cg"
          className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm hover:bg-muted"
        >
          <ArrowLeft className="size-4" />
          Volver a CG
        </Link>
        <p className="text-muted-foreground">No se pudo cargar el indicador.</p>
      </div>
    )
  }

  const kpiTone = cgAvanceTone(total?.avance_pct, meta || 50, kind)
  const tendenciaMeta = kind === 'rate_10k' || kind === 'ratio_raw' ? meta || 0 : meta || 100

  return (
    <div className="space-y-6 md:space-y-8">
      <CgToolbar
        fuente={fuente}
        fuentes={filtros.fuentes}
        onFuenteChange={setFuente}
      />

      <div className="space-y-4">
        <Link
          to="/cg"
          className="-ml-2 inline-flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Convenio de Gestión
        </Link>
        <div className="flex items-start gap-4">
          <div className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Handshake className="size-5" />
          </div>
          <div className="min-w-0 space-y-1.5">
            <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              {filtros.codigo}
              {fuente ? ` · ${fuente}` : ''}
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-slate-800 md:text-3xl">
              {filtros.nombre}
            </h2>
            {filtros.descripcion ? (
              <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
                {filtros.descripcion}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <div className={cn('inline-flex p-1', cardSurface)}>
          <button
            type="button"
            onClick={() => setModo('territorial')}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors',
              modo === 'territorial'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <Activity className="size-4" />
            Organización Territorial
          </button>
          <button
            type="button"
            onClick={() => setModo('redes')}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors',
              modo === 'redes'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <Network className="size-4" />
            Redes Integradas de Salud
          </button>
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
          {isRedes ? (
            <>
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
            </>
          ) : (
            <div className="min-w-[180px] flex-1 space-y-1.5 sm:max-w-xs">
              <Label>Provincia</Label>
              <Select value={provincia} onValueChange={(v) => setProvincia(v ?? 'all')}>
                <SelectTrigger className="h-9 w-full rounded-xl">
                  <SelectValue placeholder="Provincia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {provinciasUnicas.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="relative min-w-[200px] flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder={isRedes ? 'Buscar establecimiento...' : 'Buscar distrito...'}
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
        <div className="grid gap-4 lg:grid-cols-12 lg:gap-6">
          <div
            className={cn(
              'relative flex flex-col justify-center overflow-hidden p-5 lg:col-span-3',
              cardSurface,
            )}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-sky-500 to-primary/40" />
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                <TrendingUp className="size-3.5 text-primary" />
                <span>Logro</span>
              </div>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                {mesLabel ?? mes} {anioLabel ?? anio}
              </span>
            </div>
            <p
              className={cn(
                'text-4xl font-black tracking-tight tabular-nums md:text-5xl',
                kpiTone === 'success' && 'text-teal-700',
                kpiTone === 'warning' && 'text-amber-600',
                kpiTone === 'danger' && 'text-rose-600',
                kpiTone === 'neutral' && 'text-slate-800',
              )}
            >
              {fmtLogro(total?.avance_pct, kind)}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Cumplimiento {fmtPct(total?.cumplimiento_pct)}
              {total?.meta != null ? ` · Meta ${fmtLogro(total.meta, kind)}` : ''}
              {total?.umbral != null ? ` · Umbral ${fmtLogro(total.umbral, kind)}` : ''}
            </p>
            {kind === 'dual_ratio' && total?.extras ? (
              <p className="mt-1 text-xs text-muted-foreground">
                UCI {fmtPct(Number(total.extras.logro_uci))} · cumplimiento{' '}
                {fmtPct(Number(total.extras.cumplimiento_uci))}
              </p>
            ) : null}
            <div className="my-4 h-px bg-border" />
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-sky-50/80 px-3 py-2">
                <p className="text-[11px] font-medium text-sky-800/70">Denominador</p>
                <p className="mt-0.5 text-lg font-bold text-slate-800 tabular-nums">
                  {total?.denominador?.toLocaleString('es-PE') ?? '—'}
                </p>
              </div>
              <div className="rounded-lg bg-teal-50/80 px-3 py-2">
                <p className="text-[11px] font-medium text-teal-800/70">Numerador</p>
                <p className="mt-0.5 text-lg font-bold text-slate-800 tabular-nums">
                  {total?.numerador?.toLocaleString('es-PE') ?? '—'}
                </p>
              </div>
            </div>
          </div>
          <div className="lg:col-span-5">
            <FedAvanceBarChart titulo={chartTitle} data={chartData} />
          </div>
          <div className="lg:col-span-4">
            <FedTendenciaChart data={tendenciaData} meta={tendenciaMeta} />
          </div>
        </div>
      )}

      <div className={cn('overflow-hidden', cardSurface)}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 bg-slate-50/80 px-4 py-3 md:px-5">
          <div className="flex flex-wrap items-center gap-2">
            {isRedes ? (
              <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-slate-700">
                {redes?.establecimientos.length ?? 0} establecimientos ·{' '}
                {redes?.microredes.length ?? 0} microrredes · {redes?.redes.length ?? 0} redes
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">
                {tabla?.distritos.length ?? 0} distritos · {tabla?.provincias.length ?? 0}{' '}
                provincias
              </span>
            )}
          </div>
          <div className="flex gap-1.5">
            {(['jerarquica', 'plana'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setVista(v)}
                className={cn(
                  'rounded-lg border px-3 py-1 text-xs font-semibold transition-colors',
                  vista === v
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-muted-foreground hover:bg-muted',
                )}
              >
                {v === 'jerarquica' ? 'Vista jerárquica' : 'Vista plana'}
              </button>
            ))}
          </div>
        </div>
        {loadingData ? (
          <div className="flex h-32 items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
            Cargando tabla…
          </div>
        ) : isRedes && redes ? (
          <FedRedesTable
            redes={redes as unknown as FedTablaRedes}
            busqueda={busqueda}
            meta={meta || 100}
            vista={vista}
          />
        ) : !isRedes && tabla ? (
          <FedTerritorialTable
            tabla={tabla as unknown as FedTablaCompleta}
            busqueda={busqueda}
            meta={meta || 100}
            vista={vista}
          />
        ) : (
          <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
            Sin datos para los filtros seleccionados.
          </div>
        )}
      </div>
    </div>
  )
}
