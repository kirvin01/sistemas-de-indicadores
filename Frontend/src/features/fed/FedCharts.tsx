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

const DENOM_COLOR = '#7EB8F7'
const NUM_COLOR = '#1565C0'
const TREND_COLOR = '#00695C'
const META_COLOR = '#D32F2F'

export function FedAvanceBarChart({
  titulo,
  data,
}: {
  titulo: string
  data: AvanceBarRow[]
}) {
  if (!data.length) {
    return (
      <div className="flex h-[260px] items-center justify-center rounded-2xl border border-border/70 bg-card text-sm text-muted-foreground shadow-sm">
        Sin datos para el gráfico
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-[260px] flex-col rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-foreground">{titulo}</h3>
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height={210}>
          <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.06)" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} />
            <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid #e2e8f0' }}
              formatter={(value, name) => [
                Number(value).toLocaleString('es-PE'),
                String(name),
              ]}
              labelFormatter={(label, payload) => {
                const pct = payload?.[0]?.payload?.avance_pct
                return pct != null ? `${label} · ${Number(pct).toFixed(2)}%` : String(label)
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="Denominador" fill={DENOM_COLOR} radius={[4, 4, 0, 0]} />
            <Bar dataKey="Numerador" fill={NUM_COLOR} radius={[4, 4, 0, 0]} />
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
      <div className="flex h-[260px] items-center justify-center rounded-2xl border border-border/70 bg-card text-sm text-muted-foreground shadow-sm">
        Sin tendencia
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-[260px] flex-col rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-foreground">Tendencia — Avance %</h3>
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 22, right: 10, left: -8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.06)" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 20, 40, 60, 80, 100]}
              unit="%"
              tick={{ fontSize: 10, fill: '#64748b' }}
            />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid #e2e8f0' }}
              formatter={(value) => [`${Number(value).toFixed(2)}%`, 'Avance %']}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <ReferenceLine
              y={meta}
              stroke={META_COLOR}
              strokeWidth={2}
              strokeDasharray="6 6"
            />
            <Line
              type="monotone"
              dataKey={() => null}
              name={`Meta Verificación ${meta.toFixed(2)}%`}
              stroke={META_COLOR}
              strokeWidth={2}
              strokeDasharray="6 6"
              dot={false}
              legendType="plainline"
              activeDot={false}
              isAnimationActive={false}
            />
            <Bar dataKey="Avance %" fill={TREND_COLOR} radius={[4, 4, 0, 0]}>
              <LabelList
                dataKey="Avance %"
                position="top"
                style={{ fontSize: 9, fill: TREND_COLOR, fontWeight: 700 }}
                formatter={(value) => `${Number(value).toFixed(1)}%`}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
