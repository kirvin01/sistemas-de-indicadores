import { useState } from 'react'
import { Maximize2 } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
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

const tooltipStyle = {
  fontSize: 12,
  borderRadius: 12,
  border: `1px solid ${chartTheme.border}`,
  boxShadow: chartTheme.tooltipShadow,
  background: '#FFFFFF',
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

function AvanceChartBody({
  data,
  height,
  dense,
}: {
  data: AvanceBarRow[]
  height: number
  dense?: boolean
}) {
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
        />
        <Bar
          dataKey="Numerador"
          fill={chartTheme.progress}
          radius={[5, 5, 0, 0]}
          maxBarSize={dense ? 32 : 48}
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
  height,
  dense,
}: {
  data: TendenciaRow[]
  meta: number
  height: number
  dense?: boolean
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 22, right: 12, left: dense ? -4 : 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="4 4" stroke={chartTheme.grid} vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: dense ? 11 : 12, fill: chartTheme.axis, fontWeight: 500 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          ticks={[0, 25, 50, 75, 100]}
          unit="%"
          tick={{ fontSize: dense ? 11 : 12, fill: chartTheme.axis }}
          axisLine={false}
          tickLine={false}
          width={dense ? 40 : 48}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          cursor={{ fill: 'rgba(15, 23, 42, 0.04)' }}
          formatter={(value) => [`${Number(value).toFixed(2)}%`, 'Avance %']}
        />
        <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600, paddingTop: 8 }} iconSize={8} />
        <ReferenceLine
          y={meta}
          stroke={chartTheme.alert}
          strokeWidth={1.75}
          strokeDasharray="5 5"
        />
        <Line
          type="monotone"
          dataKey={() => null}
          name={`Meta ${meta.toFixed(1)}%`}
          stroke={chartTheme.alert}
          strokeWidth={1.75}
          strokeDasharray="5 5"
          dot={false}
          legendType="plainline"
          activeDot={false}
          isAnimationActive={false}
        />
        <Bar
          dataKey="Avance %"
          fill={chartTheme.progress}
          radius={[5, 5, 0, 0]}
          maxBarSize={dense ? 36 : 52}
        >
          <LabelList
            dataKey="Avance %"
            position="top"
            style={{ fontSize: dense ? 10 : 11, fill: chartTheme.title, fontWeight: 700 }}
            formatter={(value) => `${Number(value).toFixed(1)}%`}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function FedAvanceBarChart({
  titulo,
  data,
}: {
  titulo: string
  data: AvanceBarRow[]
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

  return (
    <>
      <div className={cn('flex h-full min-h-[280px] flex-col p-5', cardSurface)}>
        <div className="mb-1 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold tracking-tight text-slate-800">{titulo}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Denominador vs numerador del periodo
            </p>
          </div>
          <ExpandButton onClick={() => setOpen(true)} label="Expandir gráfico" />
        </div>
        <div className="min-h-0 flex-1">
          <AvanceChartBody data={data} height={220} dense />
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-h-[90vh] w-[min(96vw,72rem)] max-w-none gap-3 overflow-hidden p-5 sm:max-w-none"
          showCloseButton
        >
          <DialogHeader className="pr-8">
            <DialogTitle className="text-lg font-semibold text-slate-800">{titulo}</DialogTitle>
            <DialogDescription>
              Vista ampliada · Denominador vs numerador del periodo
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-[420px] w-full">
            <AvanceChartBody data={data} height={440} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function FedTendenciaChart({
  data,
  meta,
}: {
  data: TendenciaRow[]
  meta: number
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

  return (
    <>
      <div className={cn('flex h-full min-h-[280px] flex-col p-5', cardSurface)}>
        <div className="mb-1 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold tracking-tight text-slate-800">
              Tendencia — Avance %
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Serie mensual · meta {meta.toFixed(2)}%
            </p>
          </div>
          <ExpandButton onClick={() => setOpen(true)} label="Expandir gráfico" />
        </div>
        <div className="min-h-0 flex-1">
          <TendenciaChartBody data={data} meta={meta} height={220} dense />
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
            <DialogDescription>
              Vista ampliada · meta de verificación {meta.toFixed(2)}%
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-[420px] w-full">
            <TendenciaChartBody data={data} meta={meta} height={440} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
