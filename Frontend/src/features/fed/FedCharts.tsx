import { useMemo, useState } from 'react'
import { Maximize2 } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  LabelList,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cardSurface, chartTheme } from '@/lib/chartTheme'
import { cn } from '@/lib/utils'

export type AvanceBarRow = {
  name: string
  Denominador: number
  Numerador: number
  avance_pct: number
}

export type TendenciaRow = {
  name: string
  'Avance %': number
}

type RefLines = {
  meta?: number | null
  umbral?: number | null
  unit?: string
  percentScale?: boolean
}

const tooltipStyle = {
  fontSize: 12,
  borderRadius: 12,
  border: `1px solid ${chartTheme.border}`,
  boxShadow: chartTheme.tooltipShadow,
  background: '#FFFFFF',
}

const barAnim = {
  isAnimationActive: true,
  animationDuration: 650,
  animationEasing: 'ease-out' as const,
}

function ExpandButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-slate-100 hover:text-slate-800"
      title={label}
      aria-label={label}
    >
      <Maximize2 className="size-4" />
    </button>
  )
}

function formatRefValue(v: number, unit = '%') {
  const n = Number(v)
  if (unit === '%') return `${n.toFixed(1)}%`
  return n % 1 === 0 ? String(n) : n.toFixed(1)
}

function buildPctDomain(data: { avance_pct?: number; 'Avance %'?: number }[], refs: RefLines) {
  const vals = data.map((d) => Number(d.avance_pct ?? d['Avance %'] ?? 0))
  const all = [...vals, refs.meta ?? 0, refs.umbral ?? 0]
  const max = Math.max(...all, 0)
  if (refs.percentScale !== false) {
    const top = Math.max(100, Math.ceil(max / 5) * 5)
    return [0, top] as [number, number]
  }
  const top = Math.ceil(max * 1.15) || 10
  return [0, top] as [number, number]
}

function RefLineLegend({
  meta,
  umbral,
  unit = '%',
}: {
  meta?: number | null
  umbral?: number | null
  unit?: string
}) {
  return (
    <>
      {umbral != null ? (
        <Line
          type="monotone"
          dataKey={() => null}
          name={`Umbral ${formatRefValue(umbral, unit)}`}
          stroke={chartTheme.umbral}
          strokeWidth={2.5}
          strokeDasharray="6 4"
          dot={false}
          legendType="plainline"
          activeDot={false}
          isAnimationActive={false}
        />
      ) : null}
      {meta != null ? (
        <Line
          type="monotone"
          dataKey={() => null}
          name={`Meta ${formatRefValue(meta, unit)}`}
          stroke={chartTheme.meta}
          strokeWidth={2.5}
          strokeDasharray="3 3"
          dot={false}
          legendType="plainline"
          activeDot={false}
          isAnimationActive={false}
        />
      ) : null}
    </>
  )
}

function AvanceChartBody({
  data,
  height,
  dense,
  meta,
  umbral,
  pctMode,
  unit = '%',
}: {
  data: AvanceBarRow[]
  height: number
  dense?: boolean
  meta?: number | null
  umbral?: number | null
  pctMode?: boolean
  unit?: string
}) {
  const showPct = pctMode && (meta != null || umbral != null)
  const pctDomain = useMemo(
    () => buildPctDomain(data, { meta, umbral, unit, percentScale: unit === '%' }),
    [data, meta, umbral, unit],
  )

  if (showPct) {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart
          data={data}
          margin={{ top: 24, right: 44, left: dense ? -8 : 0, bottom: dense ? 0 : 8 }}
          barGap={4}
        >
          <CartesianGrid strokeDasharray="4 4" stroke={chartTheme.grid} vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: dense ? 11 : 12, fill: chartTheme.axis, fontWeight: 500 }}
            interval={0}
            angle={dense && data.length > 6 ? -28 : 0}
            textAnchor={dense && data.length > 6 ? 'end' : 'middle'}
            height={dense && data.length > 6 ? 56 : 30}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="count"
            tick={{ fontSize: dense ? 11 : 12, fill: chartTheme.axis }}
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
            width={dense ? 40 : 48}
          />
          <YAxis
            yAxisId="pct"
            orientation="right"
            domain={pctDomain}
            unit={unit === '%' ? '%' : undefined}
            tick={{ fontSize: dense ? 10 : 11, fill: chartTheme.axis }}
            axisLine={false}
            tickLine={false}
            width={44}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            cursor={{ fill: 'rgba(15, 23, 42, 0.04)' }}
            formatter={(value, name) => {
              if (name === 'Avance %') return [formatRefValue(Number(value), unit), 'Avance']
              return [Number(value).toLocaleString('es-PE'), String(name)]
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, fontWeight: 600, paddingTop: 8 }}
            iconType="circle"
            iconSize={8}
          />
          <Bar
            yAxisId="count"
            dataKey="Denominador"
            fill={chartTheme.comparative}
            radius={[5, 5, 0, 0]}
            maxBarSize={dense ? 28 : 40}
            {...barAnim}
          />
          <Bar
            yAxisId="count"
            dataKey="Numerador"
            fill={chartTheme.progress}
            radius={[5, 5, 0, 0]}
            maxBarSize={dense ? 28 : 40}
            {...barAnim}
          />
          <Line
            yAxisId="pct"
            type="monotone"
            dataKey="avance_pct"
            name="Avance %"
            stroke="#6366F1"
            strokeWidth={2}
            dot={{ r: 3, fill: '#6366F1', strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#6366F1' }}
            animationDuration={700}
            animationEasing="ease-out"
          />
          {umbral != null ? (
            <ReferenceLine
              yAxisId="pct"
              y={umbral}
              stroke={chartTheme.umbral}
              strokeWidth={2.5}
              strokeDasharray="6 4"
              label={{
                value: `Umbral ${formatRefValue(umbral, unit)}`,
                fill: chartTheme.umbral,
                fontSize: 10,
                fontWeight: 700,
                position: 'insideTopLeft',
              }}
            />
          ) : null}
          {meta != null ? (
            <ReferenceLine
              yAxisId="pct"
              y={meta}
              stroke={chartTheme.meta}
              strokeWidth={2.5}
              strokeDasharray="3 3"
              label={{
                value: `Meta ${formatRefValue(meta, unit)}`,
                fill: chartTheme.meta,
                fontSize: 10,
                fontWeight: 700,
                position: 'insideTopRight',
              }}
            />
          ) : null}
          <RefLineLegend meta={meta} umbral={umbral} unit={unit} />
        </ComposedChart>
      </ResponsiveContainer>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        margin={{ top: 18, right: 12, left: dense ? -8 : 0, bottom: dense ? 0 : 8 }}
        barGap={4}
      >
        <CartesianGrid strokeDasharray="4 4" stroke={chartTheme.grid} vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: dense ? 11 : 12, fill: chartTheme.axis, fontWeight: 500 }}
          interval={0}
          angle={dense && data.length > 6 ? -28 : 0}
          textAnchor={dense && data.length > 6 ? 'end' : 'middle'}
          height={dense && data.length > 6 ? 56 : 30}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: dense ? 11 : 12, fill: chartTheme.axis }}
          allowDecimals={false}
          axisLine={false}
          tickLine={false}
          width={dense ? 40 : 48}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          cursor={{ fill: 'rgba(15, 23, 42, 0.04)' }}
          formatter={(value, name) => [Number(value).toLocaleString('es-PE'), String(name)]}
          labelFormatter={(label, payload) => {
            const pct = payload?.[0]?.payload?.avance_pct
            return pct != null ? `${label} · ${Number(pct).toFixed(2)}%` : String(label)
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, fontWeight: 600, paddingTop: 8 }}
          iconType="circle"
          iconSize={8}
        />
        <Bar
          dataKey="Denominador"
          fill={chartTheme.comparative}
          radius={[5, 5, 0, 0]}
          maxBarSize={dense ? 32 : 48}
          {...barAnim}
        />
        <Bar
          dataKey="Numerador"
          fill={chartTheme.progress}
          radius={[5, 5, 0, 0]}
          maxBarSize={dense ? 32 : 48}
          {...barAnim}
        >
          <LabelList
            dataKey="Numerador"
            position="top"
            style={{ fontSize: dense ? 10 : 11, fill: chartTheme.title, fontWeight: 700 }}
            formatter={(value) => Number(value).toLocaleString('es-PE')}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

function TendenciaChartBody({
  data,
  meta,
  umbral,
  height,
  dense,
  unit = '%',
  percentScale = true,
}: {
  data: TendenciaRow[]
  meta: number
  umbral?: number | null
  height: number
  dense?: boolean
  unit?: string
  percentScale?: boolean
}) {
  const yDomain = useMemo(
    () => buildPctDomain(data, { meta, umbral, unit, percentScale }),
    [data, meta, umbral, unit, percentScale],
  )

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 28, right: 12, left: dense ? -4 : 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="4 4" stroke={chartTheme.grid} vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: dense ? 11 : 12, fill: chartTheme.axis, fontWeight: 500 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={yDomain}
          unit={unit === '%' ? '%' : undefined}
          tick={{ fontSize: dense ? 11 : 12, fill: chartTheme.axis }}
          axisLine={false}
          tickLine={false}
          width={dense ? 40 : 48}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          cursor={{ fill: 'rgba(15, 23, 42, 0.04)' }}
          formatter={(value) => [formatRefValue(Number(value), unit), 'Avance']}
        />
        <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600, paddingTop: 8 }} iconSize={8} />
        {umbral != null ? (
          <ReferenceLine
            y={umbral}
            stroke={chartTheme.umbral}
            strokeWidth={2.5}
            strokeDasharray="6 4"
            label={{
              value: `Umbral ${formatRefValue(umbral, unit)}`,
              fill: chartTheme.umbral,
              fontSize: 10,
              fontWeight: 700,
              position: 'insideBottomLeft',
            }}
          />
        ) : null}
        {meta != null && meta > 0 ? (
          <ReferenceLine
            y={meta}
            stroke={chartTheme.meta}
            strokeWidth={2.5}
            strokeDasharray="3 3"
            label={{
              value: `Meta ${formatRefValue(meta, unit)}`,
              fill: chartTheme.meta,
              fontSize: 10,
              fontWeight: 700,
              position: 'insideTopRight',
            }}
          />
        ) : null}
        <RefLineLegend meta={meta} umbral={umbral} unit={unit} />
        <Bar
          dataKey="Avance %"
          fill={chartTheme.progress}
          radius={[5, 5, 0, 0]}
          maxBarSize={dense ? 36 : 52}
          {...barAnim}
        >
          <LabelList
            dataKey="Avance %"
            position="top"
            style={{ fontSize: dense ? 10 : 11, fill: chartTheme.title, fontWeight: 700 }}
            formatter={(value) => formatRefValue(Number(value), unit)}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function FedAvanceBarChart({
  titulo,
  data,
  meta,
  umbral,
  pctMode,
  unit = '%',
}: {
  titulo: string
  data: AvanceBarRow[]
  meta?: number | null
  umbral?: number | null
  pctMode?: boolean
  unit?: string
}) {
  const [open, setOpen] = useState(false)

  if (!data.length) {
    return (
      <div
        className={cn(
          'flex h-[280px] items-center justify-center text-sm text-muted-foreground',
          cardSurface,
        )}
      >
        Sin datos para el gráfico
      </div>
    )
  }

  const subtitle =
    pctMode && (meta != null || umbral != null)
      ? 'Denominador vs numerador · líneas de umbral (ámbar) y meta (verde)'
      : 'Denominador vs numerador del periodo'

  return (
    <>
      <div className={cn('flex h-full min-h-[280px] flex-col p-5', cardSurface)}>
        <div className="mb-1 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold tracking-tight text-slate-800">{titulo}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <ExpandButton onClick={() => setOpen(true)} label="Expandir gráfico" />
        </div>
        <div className="min-h-0 flex-1">
          <AvanceChartBody
            data={data}
            height={220}
            dense
            meta={meta}
            umbral={umbral}
            pctMode={pctMode}
            unit={unit}
          />
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-h-[90vh] w-[min(96vw,72rem)] max-w-none gap-3 overflow-hidden p-5 sm:max-w-none"
          showCloseButton
        >
          <DialogHeader className="pr-8">
            <DialogTitle className="text-lg font-semibold text-slate-800">{titulo}</DialogTitle>
            <DialogDescription>Vista ampliada · {subtitle}</DialogDescription>
          </DialogHeader>
          <div className="min-h-[420px] w-full">
            <AvanceChartBody
              data={data}
              height={440}
              meta={meta}
              umbral={umbral}
              pctMode={pctMode}
              unit={unit}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function FedTendenciaChart({
  data,
  meta,
  umbral,
  unit = '%',
  percentScale = true,
}: {
  data: TendenciaRow[]
  meta: number
  umbral?: number | null
  unit?: string
  percentScale?: boolean
}) {
  const [open, setOpen] = useState(false)

  if (!data.length) {
    return (
      <div
        className={cn(
          'flex h-[280px] items-center justify-center text-sm text-muted-foreground',
          cardSurface,
        )}
      >
        Sin tendencia
      </div>
    )
  }

  const refHint = [
    umbral != null ? `umbral ${formatRefValue(umbral, unit)}` : null,
    meta > 0 ? `meta ${formatRefValue(meta, unit)}` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <>
      <div className={cn('flex h-full min-h-[280px] flex-col p-5', cardSurface)}>
        <div className="mb-1 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold tracking-tight text-slate-800">
              Tendencia — Avance %
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Serie mensual{refHint ? ` · ${refHint}` : ''}
            </p>
          </div>
          <ExpandButton onClick={() => setOpen(true)} label="Expandir gráfico" />
        </div>
        <div className="min-h-0 flex-1">
          <TendenciaChartBody
            data={data}
            meta={meta}
            umbral={umbral}
            height={220}
            dense
            unit={unit}
            percentScale={percentScale}
          />
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-h-[90vh] w-[min(96vw,72rem)] max-w-none gap-3 overflow-hidden p-5 sm:max-w-none"
          showCloseButton
        >
          <DialogHeader className="pr-8">
            <DialogTitle className="text-lg font-semibold text-slate-800">
              Tendencia — Avance %
            </DialogTitle>
            <DialogDescription>Vista ampliada · {refHint || 'serie mensual'}</DialogDescription>
          </DialogHeader>
          <div className="min-h-[420px] w-full">
            <TendenciaChartBody
              data={data}
              meta={meta}
              umbral={umbral}
              height={440}
              unit={unit}
              percentScale={percentScale}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
