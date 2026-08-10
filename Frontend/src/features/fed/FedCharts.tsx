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

export function FedAvanceBarChart({
  titulo,
  data,
}: {
  titulo: string
  data: AvanceBarRow[]
}) {
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
    <div className={cn('flex h-full min-h-[280px] flex-col p-5', cardSurface)}>
      <h3 className="mb-1 text-sm font-semibold tracking-tight text-slate-800">{titulo}</h3>
      <p className="mb-3 text-xs text-muted-foreground">Denominador vs numerador del periodo</p>
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 18, right: 8, left: -8, bottom: 0 }} barGap={4}>
            <CartesianGrid
              strokeDasharray="4 4"
              stroke={chartTheme.grid}
              vertical={false}
            />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: chartTheme.axis, fontWeight: 500 }}
              interval={0}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: chartTheme.axis }}
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              cursor={{ fill: 'rgba(15, 23, 42, 0.04)' }}
              formatter={(value, name) => [
                Number(value).toLocaleString('es-PE'),
                String(name),
              ]}
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
              maxBarSize={32}
            />
            <Bar
              dataKey="Numerador"
              fill={chartTheme.progress}
              radius={[5, 5, 0, 0]}
              maxBarSize={32}
            >
              <LabelList
                dataKey="Numerador"
                position="top"
                style={{ fontSize: 10, fill: chartTheme.title, fontWeight: 700 }}
                formatter={(value) => Number(value).toLocaleString('es-PE')}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export function FedTendenciaChart({
  data,
  meta,
}: {
  data: TendenciaRow[]
  meta: number
}) {
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
    <div className={cn('flex h-full min-h-[280px] flex-col p-5', cardSurface)}>
      <h3 className="mb-1 text-sm font-semibold tracking-tight text-slate-800">
        Tendencia — Avance %
      </h3>
      <p className="mb-3 text-xs text-muted-foreground">
        Serie mensual · meta {meta.toFixed(2)}%
      </p>
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 22, right: 8, left: -4, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="4 4"
              stroke={chartTheme.grid}
              vertical={false}
            />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: chartTheme.axis, fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              unit="%"
              tick={{ fontSize: 11, fill: chartTheme.axis }}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              cursor={{ fill: 'rgba(15, 23, 42, 0.04)' }}
              formatter={(value) => [`${Number(value).toFixed(2)}%`, 'Avance %']}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, fontWeight: 600, paddingTop: 8 }}
              iconSize={8}
            />
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
              maxBarSize={36}
            >
              <LabelList
                dataKey="Avance %"
                position="top"
                style={{ fontSize: 10, fill: chartTheme.title, fontWeight: 700 }}
                formatter={(value) => `${Number(value).toFixed(1)}%`}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
