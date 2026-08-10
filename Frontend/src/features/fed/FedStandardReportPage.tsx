import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Activity,
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
  fedApi,
  type FedFiltros,
  type FedResumenRow,
  type FedTablaCompleta,
  type FedTablaRedes,
} from '@/lib/fedApi'
import { cn } from '@/lib/utils'
import {
  FedAvanceBarChart,
  FedTendenciaChart,
  type AvanceBarRow,
} from '@/features/fed/FedCharts'
import { FedRedesTable, FedTerritorialTable } from '@/features/fed/FedDataTables'

type Modo = 'territorial' | 'redes'
type VistaTabla = 'jerarquica' | 'plana'

const DESC_BY_SLUG: Record<string, string> = {
  mc0101:
    'Porcentaje de mujeres con parto institucional, procedentes de los distritos de quintiles 1 y 2 de pobreza departamental que durante su gestación recibieron el paquete integrado de servicios.',
  mc0201:
    'Paquete integrado de servicios para niñas y niños menores de 12 meses.',
  mc0301: 'Paquete básico de atención del recién nacido a nivel departamental.',
  si0101: 'Gestantes con primera atención prenatal (APN).',
  si0102: 'Gestantes con anemia y seguimiento de hemoglobina.',
  si0103: 'Mujeres con parto institucional sin anemia.',
  si0201: 'Niñas y niños de 6 meses con hierro y dosaje de hemoglobina.',
  si0202: 'Niñas y niños de 6 meses prematuros o con bajo peso.',
  si0203: 'Niñas y niños de 12 meses con anemia.',
  si0204: 'Niñas y niños de 12 meses sin anemia.',
  si0301: 'Adolescentes mujeres de 12 a 17 años con dosaje de hemoglobina.',
  si0302: 'Adolescentes mujeres de 12 a 17 años sin anemia.',
  vi0101: 'Gestantes con tamizaje de violencia.',
  vi0102: 'Gestantes con diagnóstico de violencia y paquete terapéutico.',
}

function fmtPct(v: number | null | undefined) {
  if (v == null) return '—'
  return `${Number(v).toFixed(2)}%`
}

function shortLabel(value: string, max = 11) {
  const t = value.trim()
  if (t.length <= max) return t
  return `${t.slice(0, max)}…`
}

export function FedStandardReportPage() {
  const { slug = '' } = useParams()
  const [filtros, setFiltros] = useState<FedFiltros | null>(null)
  const [anio, setAnio] = useState<number | null>(null)
  const [mes, setMes] = useState<string>('')
  const [provincia, setProvincia] = useState<string>('all')
  const [red, setRed] = useState<string>('all')
  const [microred, setMicrored] = useState<string>('all')
  const [busqueda, setBusqueda] = useState('')
  const [modo, setModo] = useState<Modo>('redes')
  const [vista, setVista] = useState<VistaTabla>('jerarquica')

  const [tabla, setTabla] = useState<FedTablaCompleta | null>(null)
  const [redes, setRedes] = useState<FedTablaRedes | null>(null)
  const [resumen, setResumen] = useState<FedResumenRow[]>([])
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
    void fedApi
      .filtros(slug, { signal: controller.signal })
      .then((f) => {
        setFiltros(f)
        const y = f.anios[f.anios.length - 1] ?? new Date().getFullYear()
        setAnio(y)
        setMes(f.meses[0] ?? '')
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

  const loadData = useCallback(
    async (signal?: AbortSignal) => {
      if (!slug || !anio || !mes) return
      setLoadingData(true)
      const params = {
        anio,
        mes,
        provincia: modo === 'territorial' && provincia !== 'all' ? provincia : undefined,
        red: modo === 'redes' && red !== 'all' ? red : undefined,
        microred: modo === 'redes' && microred !== 'all' ? microred : undefined,
      }
      try {
        const [t, r, s] = await Promise.all([
          fedApi.tablaCompleta(slug, params, { signal }),
          fedApi.tablaRedes(slug, params, { signal }),
          fedApi.resumen(
            slug,
            {
              anio,
              red: params.red,
            },
            { signal },
          ),
        ])
        setTabla(t)
        setRedes(r)
        setResumen(s.data)
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        toast.error(err instanceof ApiError ? err.message : 'Error al cargar el reporte')
      } finally {
        setLoadingData(false)
      }
    },
    [slug, anio, mes, provincia, red, microred, modo],
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

  const meta = filtros?.meta_pct ?? 40.7
  const total = isRedes ? redes?.total : tabla?.total
  const mesLabel = isRedes ? redes?.mes : tabla?.mes
  const anioLabel = isRedes ? redes?.anio : tabla?.anio

  const chartData: AvanceBarRow[] = useMemo(() => {
    if (isRedes && redes) {
      // Red seleccionada + microred → establecimientos de esa microred
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
      // Solo Red seleccionada → avance por microred
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
      // Provincia seleccionada → avance por distrito
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
      if (red !== 'all' && microred !== 'all') return 'Avance por Establecimiento'
      if (red !== 'all') return 'Avance por Microred'
      return 'Avance por Red'
    }
    if (provincia !== 'all') return 'Avance por Distrito'
    return 'Avance por Provincia'
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
      <div className="flex h-48 items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="size-5 animate-spin text-emerald-800" />
        Cargando indicador…
      </div>
    )
  }

  if (!filtros) {
    return (
      <div className="space-y-4">
        <Link
          to="/fed"
          className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm hover:bg-muted"
        >
          <ArrowLeft className="size-4" />
          Volver a FED
        </Link>
        <p className="text-muted-foreground">No se pudo cargar el indicador.</p>
      </div>
    )
  }

  const titulo = filtros.nombre
  const descripcionExtra = DESC_BY_SLUG[slug]
  const mostrarExtra =
    Boolean(descripcionExtra) &&
    descripcionExtra!.trim().toLowerCase() !== titulo.trim().toLowerCase()

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="space-y-3">
        <Link
          to="/fed"
          className="-ml-2 inline-flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Indicador FED
        </Link>
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-full',
              isRedes ? 'bg-emerald-800/10 text-emerald-800' : 'bg-blue-700/10 text-blue-700',
            )}
          >
            <Activity className="size-5" />
          </div>
          <div className="min-w-0 space-y-1">
            <p
              className={cn(
                'text-sm font-semibold tracking-wide',
                isRedes ? 'text-emerald-800/80' : 'text-blue-700/80',
              )}
            >
              FED {filtros.codigo}
            </p>
            <h2 className="text-3xl font-bold tracking-tight">{titulo}</h2>
            {mostrarExtra && (
              <p className="max-w-4xl text-sm leading-relaxed text-muted-foreground">
                {descripcionExtra}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-2xl border border-border/80 bg-card p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setModo('territorial')}
            className={cn(
              'inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors',
              modo === 'territorial'
                ? 'bg-blue-700 text-white shadow-sm'
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
              'inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors',
              modo === 'redes'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <Network className="size-4" />
            Redes Integradas de Salud
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div
        className={cn(
          'rounded-2xl border bg-card p-4 shadow-sm',
          isRedes ? 'border-emerald-800/15' : 'border-blue-700/15',
        )}
      >
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

      {/* KPI + gráficos */}
      {loadingData ? (
        <div className="flex h-48 items-center justify-center gap-2 text-muted-foreground">
          <Loader2
            className={cn('size-5 animate-spin', isRedes ? 'text-emerald-800' : 'text-blue-700')}
          />
          Cargando datos…
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-12">
          <div
            className={cn(
              'flex flex-col justify-center rounded-2xl p-5 text-white shadow-md lg:col-span-3',
              isRedes
                ? 'bg-gradient-to-br from-emerald-900 to-emerald-700'
                : 'bg-gradient-to-br from-blue-800 to-blue-600',
            )}
          >
            <div className="mb-2 flex items-center gap-2 text-sm text-white/85">
              <TrendingUp className="size-4 opacity-90" />
              <span>
                Avance Global · {mesLabel ?? mes} {anioLabel ?? anio}
              </span>
            </div>
            <p className="text-4xl font-black tracking-tight tabular-nums">
              {fmtPct(total?.avance_pct)}
            </p>
            <div className="my-3 h-px bg-white/25" />
            <div className="grid grid-cols-2 gap-2 text-center">
              <div>
                <p className="text-xs text-white/70">Denominador</p>
                <p className="text-lg font-bold tabular-nums">
                  {total?.denominador?.toLocaleString('es-PE') ?? '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-white/70">Numerador</p>
                <p className="text-lg font-bold tabular-nums">
                  {total?.numerador?.toLocaleString('es-PE') ?? '—'}
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <FedAvanceBarChart titulo={chartTitle} data={chartData} />
          </div>

          <div className="lg:col-span-4">
            <FedTendenciaChart data={tendenciaData} meta={meta} />
          </div>
        </div>
      )}

      {/* Tabla detalle */}
      <div
        className={cn(
          'overflow-hidden rounded-2xl border bg-card shadow-sm',
          isRedes ? 'border-emerald-800/15' : 'border-blue-700/15',
        )}
      >
        <div
          className={cn(
            'flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3',
            isRedes
              ? 'border-emerald-800/10 bg-emerald-800/[0.03]'
              : 'border-blue-700/10 bg-blue-700/[0.03]',
          )}
        >
          <div className="flex flex-wrap items-center gap-2">
            {isRedes ? (
              <span className="rounded-full border border-emerald-800/30 px-3 py-1 text-xs font-medium text-emerald-900">
                {redes?.establecimientos.length ?? 0} establecimientos ·{' '}
                {redes?.microredes.length ?? 0} microrredes · {redes?.redes.length ?? 0} redes (
                {mes} {anio})
              </span>
            ) : (
              <>
                <span className="text-sm text-muted-foreground">
                  {tabla?.distritos.length ?? 0} distritos · {tabla?.provincias.length ?? 0}{' '}
                  provincias
                </span>
                <span className="rounded-full border border-blue-700/30 bg-blue-700 px-2.5 py-0.5 text-xs font-medium text-white">
                  {mes} {anio}
                </span>
              </>
            )}
          </div>

          <div className="flex gap-1.5">
            {(['jerarquica', 'plana'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setVista(v)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
                  vista === v
                    ? isRedes
                      ? 'border-emerald-800 bg-emerald-800 text-white'
                      : 'border-blue-700 bg-blue-700 text-white'
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
          <FedRedesTable redes={redes} busqueda={busqueda} meta={meta} vista={vista} />
        ) : !isRedes && tabla ? (
          <FedTerritorialTable tabla={tabla} busqueda={busqueda} meta={meta} vista={vista} />
        ) : (
          <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
            Sin datos para los filtros seleccionados.
          </div>
        )}
      </div>
    </div>
  )
}
