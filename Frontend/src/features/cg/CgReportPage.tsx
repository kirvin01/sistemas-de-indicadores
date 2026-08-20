import { Link, useParams } from 'react-router-dom'
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
import { fmtLogro, fmtMetaLabel, fmtPct } from '@/features/cg/cgFormatters'
import { CgToolbar } from '@/features/cg/CgToolbar'
import { useCgReport } from '@/features/cg/useCgReport'
import { FedAvanceBarChart, FedTendenciaChart } from '@/features/fed/FedCharts'
import { FedRedesTable, FedTerritorialTable } from '@/features/fed/FedDataTables'
import { cardSurface } from '@/lib/chartTheme'
import type { FedTablaCompleta, FedTablaRedes } from '@/lib/fedApi'
import { cn } from '@/lib/utils'

export function CgReportPage() {
  const { slug = '' } = useParams()
  const r = useCgReport(slug)

  if (r.loadingFiltros) {
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

  if (!r.filtros) {
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

  const { filtros, chartRefs } = r
  const fuenteLabel = r.fuenteAplicada ? `Data ${r.fuenteAplicada}` : null
  const fuenteEsNacional = (r.fuenteAplicada ?? '').toLowerCase() === 'nacional'
  const fuenteEsRegional = (r.fuenteAplicada ?? '').toLowerCase() === 'regional'

  return (
    <div className="space-y-6 md:space-y-8">
      <CgToolbar />

      <div className="space-y-4">
        <Link
          to="/cg"
          className="-ml-2 inline-flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Convenio de Gestión
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <div className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Handshake className="size-5" />
            </div>
            <div className="min-w-0 space-y-1.5">
              <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                {filtros.codigo}
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
          {fuenteLabel ? (
            <div
              className={cn(
                'shrink-0 rounded-xl border px-4 py-3 shadow-sm transition-colors',
                fuenteEsNacional && 'border-emerald-200 bg-emerald-50',
                fuenteEsRegional && 'border-amber-200 bg-amber-50',
                !fuenteEsNacional && !fuenteEsRegional && 'border-slate-200 bg-white',
              )}
            >
              <p
                className={cn(
                  'text-[10px] font-semibold tracking-[0.14em] uppercase',
                  fuenteEsNacional && 'text-emerald-700/70',
                  fuenteEsRegional && 'text-amber-700/70',
                  !fuenteEsNacional && !fuenteEsRegional && 'text-muted-foreground',
                )}
              >
                Fuente
              </p>
              <p
                className={cn(
                  'text-sm font-bold',
                  fuenteEsNacional && 'text-emerald-800',
                  fuenteEsRegional && 'text-amber-800',
                  !fuenteEsNacional && !fuenteEsRegional && 'text-slate-800',
                )}
              >
                {fuenteLabel}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex justify-center">
        <div className={cn('inline-flex p-1', cardSurface)}>
          <button
            type="button"
            onClick={() => r.setModo('territorial')}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors',
              r.modo === 'territorial'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <Activity className="size-4" />
            Organización Territorial
          </button>
          <button
            type="button"
            onClick={() => r.setModo('redes')}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors',
              r.modo === 'redes'
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
              value={r.anio != null ? String(r.anio) : undefined}
              onValueChange={(v) => r.setAnio(Number(v))}
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
          {filtros.meses.length > 0 ? (
            <div className="w-[140px] space-y-1.5">
              <Label>Mes</Label>
              <Select value={r.mes} onValueChange={(v) => r.setMes(v ?? '')}>
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
          ) : (
            <p className="text-xs text-muted-foreground">Sin desglose mensual (dato anual).</p>
          )}
          {r.isRedes ? (
            <>
              <div className="min-w-[160px] flex-1 space-y-1.5 sm:max-w-xs">
                <Label>Red</Label>
                <Select
                  value={r.red}
                  onValueChange={(v) => {
                    r.setRed(v ?? 'all')
                    r.setMicrored('all')
                  }}
                >
                  <SelectTrigger className="h-9 w-full rounded-xl">
                    <SelectValue placeholder="Red" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {filtros.redes.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-[160px] flex-1 space-y-1.5 sm:max-w-xs">
                <Label>Microred</Label>
                <Select
                  value={r.microred}
                  onValueChange={(v) => r.setMicrored(v ?? 'all')}
                  disabled={r.red === 'all'}
                >
                  <SelectTrigger className="h-9 w-full rounded-xl">
                    <SelectValue placeholder="Microred" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {r.microredesFiltradas.map((m) => (
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
              <Select value={r.provincia} onValueChange={(v) => r.setProvincia(v ?? 'all')}>
                <SelectTrigger className="h-9 w-full rounded-xl">
                  <SelectValue placeholder="Provincia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {r.provinciasUnicas.map((p) => (
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
              value={r.busqueda}
              onChange={(e) => r.setBusqueda(e.target.value)}
              placeholder={r.isRedes ? 'Buscar establecimiento...' : 'Buscar distrito...'}
              className="h-9 rounded-xl pl-9"
            />
          </div>
        </div>
      </div>

      {r.loadingData ? (
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
                {r.mesLabel ?? r.mes} {r.anioLabel ?? r.anio}
              </span>
            </div>
            <p
              className={cn(
                'text-4xl font-black tracking-tight tabular-nums md:text-5xl',
                r.kpiTone === 'success' && 'text-teal-700',
                r.kpiTone === 'warning' && 'text-amber-600',
                r.kpiTone === 'danger' && 'text-rose-600',
                r.kpiTone === 'neutral' && 'text-slate-800',
              )}
            >
              {fmtLogro(r.total?.avance_pct, r.kind)}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Cumplimiento{' '}
                <span className="font-semibold text-slate-700">
                  {fmtPct(r.total?.cumplimiento_pct)}
                </span>
              </span>
              {chartRefs && fmtMetaLabel(chartRefs.refMeta, r.kind, slug) ? (
                <span className="inline-flex items-center rounded-md border border-emerald-200/80 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 shadow-sm">
                  Meta {fmtMetaLabel(chartRefs.refMeta, r.kind, slug)}
                </span>
              ) : null}
              {chartRefs?.refUmbral != null ? (
                <span className="inline-flex items-center rounded-md border border-amber-200/80 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700 shadow-sm">
                  Umbral {fmtLogro(chartRefs.refUmbral, r.kind)}
                </span>
              ) : null}
            </div>
            {r.kind === 'dual_ratio' && r.total?.extras ? (
              <p className="mt-1 text-xs text-muted-foreground">
                UCI {fmtPct(Number(r.total.extras.logro_uci))} · cumplimiento{' '}
                {fmtPct(Number(r.total.extras.cumplimiento_uci))}
              </p>
            ) : null}
            <div className="my-4 h-px bg-border" />
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-sky-50/80 px-3 py-2">
                <p className="text-[11px] font-medium text-sky-800/70">Denominador</p>
                <p className="mt-0.5 text-lg font-bold text-slate-800 tabular-nums">
                  {r.total?.denominador?.toLocaleString('es-PE') ?? '—'}
                </p>
              </div>
              <div className="rounded-lg bg-teal-50/80 px-3 py-2">
                <p className="text-[11px] font-medium text-teal-800/70">Numerador</p>
                <p className="mt-0.5 text-lg font-bold text-slate-800 tabular-nums">
                  {r.total?.numerador?.toLocaleString('es-PE') ?? '—'}
                </p>
              </div>
            </div>
          </div>
          <div className="lg:col-span-5">
            <FedAvanceBarChart titulo={r.chartTitle} data={r.chartData} />
          </div>
          <div className="lg:col-span-4">
            {chartRefs ? (
              <FedTendenciaChart
                data={r.tendenciaData}
                meta={chartRefs.tendenciaMeta}
                umbral={chartRefs.refUmbral}
                unit={chartRefs.chartUnit}
                percentScale={chartRefs.chartPercentScale}
              />
            ) : null}
          </div>
        </div>
      )}

      <div className={cn('overflow-hidden', cardSurface)}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 bg-slate-50/80 px-4 py-3 md:px-5">
          <div className="flex flex-wrap items-center gap-2">
            {r.isRedes ? (
              <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-slate-700">
                {r.redes?.establecimientos.length ?? 0} establecimientos ·{' '}
                {r.redes?.microredes.length ?? 0} microrredes · {r.redes?.redes.length ?? 0} redes
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">
                {r.tabla?.distritos.length ?? 0} distritos · {r.tabla?.provincias.length ?? 0}{' '}
                provincias
              </span>
            )}
          </div>
          <div className="flex gap-1.5">
            {(['jerarquica', 'plana'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => r.setVista(v)}
                className={cn(
                  'rounded-lg border px-3 py-1 text-xs font-semibold transition-colors',
                  r.vista === v
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-muted-foreground hover:bg-muted',
                )}
              >
                {v === 'jerarquica' ? 'Vista jerárquica' : 'Vista plana'}
              </button>
            ))}
          </div>
        </div>
        {r.loadingData ? (
          <div className="flex h-32 items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
            Cargando tabla…
          </div>
        ) : r.isRedes && r.redes ? (
          <FedRedesTable
            redes={r.redes as unknown as FedTablaRedes}
            busqueda={r.busqueda}
            meta={r.metaFallback || 100}
            vista={r.vista}
          />
        ) : !r.isRedes && r.tabla ? (
          <FedTerritorialTable
            tabla={r.tabla as unknown as FedTablaCompleta}
            busqueda={r.busqueda}
            meta={r.metaFallback || 100}
            vista={r.vista}
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
