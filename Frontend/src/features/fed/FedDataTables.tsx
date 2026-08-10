import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { StatusBadge } from '@/components/ui/status-badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { avanceTone, type FedTablaCompleta, type FedTablaRedes } from '@/lib/fedApi'
import { cn } from '@/lib/utils'

function fmtPct(v: number | null | undefined) {
  if (v == null) return '—'
  return `${Number(v).toFixed(2)}%`
}

function fmtN(v: number | null | undefined) {
  if (v == null) return '—'
  return Number(v).toLocaleString('es-PE')
}

function AvancePill({ value, meta }: { value: number | null | undefined; meta: number }) {
  const tone = avanceTone(value, meta)
  const solid =
    tone === 'success'
      ? 'border-transparent bg-emerald-700 text-white'
      : tone === 'warning'
        ? 'border-transparent bg-amber-600 text-white'
        : tone === 'danger'
          ? 'border-transparent bg-rose-700 text-white'
          : undefined
  return (
    <StatusBadge tone={tone} className={cn('min-w-[4.5rem] justify-center tabular-nums', solid)}>
      {fmtPct(value)}
    </StatusBadge>
  )
}

/* ── Territorial: Provincia → Distrito ─────────────────────────────────────── */

function ProvinciaFila({
  prov,
  distritos,
  busqueda,
  meta,
}: {
  prov: FedTablaCompleta['provincias'][number]
  distritos: FedTablaCompleta['distritos']
  busqueda: string
  meta: number
}) {
  const [open, setOpen] = useState(false)
  const q = busqueda.trim().toLowerCase()
  const filas = useMemo(
    () =>
      distritos.filter(
        (d) =>
          d.PROVINCIA === prov.PROVINCIA &&
          (!q || d.DISTRITO.toLowerCase().includes(q) || d.PROVINCIA.toLowerCase().includes(q)),
      ),
    [distritos, prov.PROVINCIA, q],
  )

  if (q && filas.length === 0) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="grid w-full grid-cols-[2rem_minmax(0,1.4fr)_5.5rem_5.5rem_6rem] items-center gap-1 border-b border-blue-700/15 bg-blue-700/10 px-2 py-2.5 text-left hover:bg-blue-700/15"
      >
        <span className="flex justify-center text-blue-800">
          {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </span>
        <span className="truncate text-sm font-bold text-blue-900">Total {prov.PROVINCIA}</span>
        <span className="text-center text-sm font-bold tabular-nums">{fmtN(prov.denominador)}</span>
        <span className="text-center text-sm font-bold tabular-nums">{fmtN(prov.numerador)}</span>
        <span className="flex justify-center">
          <AvancePill value={prov.avance_pct} meta={meta} />
        </span>
      </button>
      {open &&
        filas.map((d) => (
          <div
            key={`${d.PROVINCIA}-${d.DISTRITO}`}
            className="grid grid-cols-[2rem_minmax(0,1.4fr)_5.5rem_5.5rem_6rem] items-center gap-1 border-b border-black/5 px-2 py-2 hover:bg-blue-700/[0.04]"
          >
            <span />
            <span className="truncate pl-2 text-sm text-foreground">{d.DISTRITO}</span>
            <span className="text-center text-sm tabular-nums">{fmtN(d.denominador)}</span>
            <span className="text-center text-sm tabular-nums">{fmtN(d.numerador)}</span>
            <span className="flex justify-center">
              <AvancePill value={d.avance_pct} meta={meta} />
            </span>
          </div>
        ))}
    </>
  )
}

export function FedTerritorialTable({
  tabla,
  busqueda,
  meta,
  vista,
}: {
  tabla: FedTablaCompleta
  busqueda: string
  meta: number
  vista: 'jerarquica' | 'plana'
}) {
  const q = busqueda.trim().toLowerCase()
  const planas = useMemo(() => {
    const rows = tabla.distritos
    if (!q) return rows
    return rows.filter(
      (r) =>
        r.DISTRITO.toLowerCase().includes(q) || r.PROVINCIA.toLowerCase().includes(q),
    )
  }, [tabla.distritos, q])

  if (vista === 'plana') {
    return (
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-blue-900">Provincia</TableHead>
            <TableHead className="text-blue-900">Distrito</TableHead>
            <TableHead className="text-center text-blue-900">Denominador</TableHead>
            <TableHead className="text-center text-blue-900">Numerador</TableHead>
            <TableHead className="text-center text-blue-900">Avance %</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {planas.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                Sin datos para los filtros seleccionados.
              </TableCell>
            </TableRow>
          ) : (
            planas.map((row) => (
              <TableRow key={`${row.PROVINCIA}-${row.DISTRITO}`}>
                <TableCell>{row.PROVINCIA}</TableCell>
                <TableCell>{row.DISTRITO}</TableCell>
                <TableCell className="text-center tabular-nums">{fmtN(row.denominador)}</TableCell>
                <TableCell className="text-center tabular-nums">{fmtN(row.numerador)}</TableCell>
                <TableCell className="text-center">
                  <AvancePill value={row.avance_pct} meta={meta} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-[2rem_minmax(0,1.4fr)_5.5rem_5.5rem_6rem] items-center gap-1 border-b-2 border-blue-700/15 bg-blue-700/[0.06] px-2 py-2">
        <span />
        <span className="text-xs font-bold tracking-wide text-slate-800 uppercase">
          Provincia / Distrito
        </span>
        <span className="text-center text-xs font-bold text-slate-800">Denominador</span>
        <span className="text-center text-xs font-bold text-slate-800">Numerador</span>
        <span className="text-center text-xs font-bold text-slate-800">Avance %</span>
      </div>
      <div className="max-h-[520px] overflow-y-auto">
        {tabla.provincias.map((prov) => (
          <ProvinciaFila
            key={`${prov.DEPARTAMENTO}-${prov.PROVINCIA}`}
            prov={prov}
            distritos={tabla.distritos}
            busqueda={busqueda}
            meta={meta}
          />
        ))}
      </div>
      {tabla.total && (
        <div className="grid grid-cols-[2rem_minmax(0,1.4fr)_5.5rem_5.5rem_6rem] items-center gap-1 bg-blue-700 px-2 py-3 text-white">
          <span />
          <span className="text-sm font-black tracking-wide">TOTAL GENERAL</span>
          <span className="text-center text-sm font-black tabular-nums">
            {fmtN(tabla.total.denominador)}
          </span>
          <span className="text-center text-sm font-black tabular-nums">
            {fmtN(tabla.total.numerador)}
          </span>
          <span className="text-center text-base font-black tabular-nums">
            {fmtPct(tabla.total.avance_pct)}
          </span>
        </div>
      )}
    </div>
  )
}

/* ── Redes: Red → Microred → Establecimiento ───────────────────────────────── */

const REDES_COLS =
  'grid-cols-[2rem_minmax(0,1.3fr)_minmax(0,1fr)_5.5rem_5.5rem_6rem]'

function MicroredFila({
  microred,
  establecimientos,
  busqueda,
  meta,
}: {
  microred: FedTablaRedes['microredes'][number]
  establecimientos: FedTablaRedes['establecimientos']
  busqueda: string
  meta: number
}) {
  const [open, setOpen] = useState(false)
  const q = busqueda.trim().toLowerCase()
  const filas = useMemo(
    () =>
      establecimientos.filter(
        (e) =>
          e.RED === microred.RED &&
          e.MICRORED === microred.MICRORED &&
          (!q ||
            e.ESTABLECIMIENTO.toLowerCase().includes(q) ||
            e.MICRORED.toLowerCase().includes(q)),
      ),
    [establecimientos, microred.RED, microred.MICRORED, q],
  )

  if (q && filas.length === 0) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'grid w-full items-center gap-1 border-b border-emerald-800/10 bg-emerald-800/[0.05] px-2 py-2 text-left hover:bg-emerald-800/10',
          REDES_COLS,
        )}
      >
        <span className="flex justify-center pl-4 text-emerald-900">
          {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </span>
        <span className="truncate pl-2 text-sm font-semibold text-emerald-900">
          {microred.MICRORED}
        </span>
        <span />
        <span className="text-center text-sm font-semibold tabular-nums">
          {fmtN(microred.denominador)}
        </span>
        <span className="text-center text-sm font-semibold tabular-nums">
          {fmtN(microred.numerador)}
        </span>
        <span className="flex justify-center">
          <AvancePill value={microred.avance_pct} meta={meta} />
        </span>
      </button>
      {open &&
        filas.map((e) => (
          <div
            key={`${e.RED}-${e.MICRORED}-${e.ESTABLECIMIENTO}`}
            className={cn(
              'grid items-center gap-1 border-b border-black/5 px-2 py-1.5 hover:bg-emerald-800/[0.04]',
              REDES_COLS,
            )}
          >
            <span />
            <span />
            <span className="truncate text-[13px] text-foreground">{e.ESTABLECIMIENTO}</span>
            <span className="text-center text-sm tabular-nums">{fmtN(e.denominador)}</span>
            <span className="text-center text-sm tabular-nums">{fmtN(e.numerador)}</span>
            <span className="flex justify-center">
              <AvancePill value={e.avance_pct} meta={meta} />
            </span>
          </div>
        ))}
    </>
  )
}

function RedFila({
  red,
  microredes,
  establecimientos,
  busqueda,
  meta,
}: {
  red: FedTablaRedes['redes'][number]
  microredes: FedTablaRedes['microredes']
  establecimientos: FedTablaRedes['establecimientos']
  busqueda: string
  meta: number
}) {
  const [open, setOpen] = useState(false)
  const q = busqueda.trim().toLowerCase()
  const microredesDeLaRed = useMemo(
    () => microredes.filter((m) => m.RED === red.RED),
    [microredes, red.RED],
  )
  const tieneCoincidencia = useMemo(() => {
    if (!q) return true
    return establecimientos.some(
      (e) =>
        e.RED === red.RED &&
        (e.ESTABLECIMIENTO.toLowerCase().includes(q) || e.MICRORED.toLowerCase().includes(q)),
    )
  }, [establecimientos, red.RED, q])

  if (!tieneCoincidencia) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'grid w-full items-center gap-1 border-b border-emerald-800/15 bg-emerald-800/10 px-2 py-2.5 text-left hover:bg-emerald-800/15',
          REDES_COLS,
        )}
      >
        <span className="flex justify-center text-emerald-900">
          {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </span>
        <span className="truncate text-sm font-bold text-emerald-900">{red.RED}</span>
        <span className="truncate text-sm font-bold text-emerald-900">Total Red</span>
        <span className="text-center text-sm font-bold tabular-nums">{fmtN(red.denominador)}</span>
        <span className="text-center text-sm font-bold tabular-nums">{fmtN(red.numerador)}</span>
        <span className="flex justify-center">
          <AvancePill value={red.avance_pct} meta={meta} />
        </span>
      </button>
      {open &&
        microredesDeLaRed.map((mr) => (
          <MicroredFila
            key={`${mr.RED}-${mr.MICRORED}`}
            microred={mr}
            establecimientos={establecimientos}
            busqueda={busqueda}
            meta={meta}
          />
        ))}
    </>
  )
}

export function FedRedesTable({
  redes,
  busqueda,
  meta,
  vista,
}: {
  redes: FedTablaRedes
  busqueda: string
  meta: number
  vista: 'jerarquica' | 'plana'
}) {
  const q = busqueda.trim().toLowerCase()
  const planas = useMemo(() => {
    const rows = redes.establecimientos
    if (!q) return rows
    return rows.filter(
      (r) =>
        r.ESTABLECIMIENTO.toLowerCase().includes(q) ||
        r.MICRORED.toLowerCase().includes(q) ||
        r.RED.toLowerCase().includes(q),
    )
  }, [redes.establecimientos, q])

  if (vista === 'plana') {
    return (
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-emerald-900">Red</TableHead>
            <TableHead className="text-emerald-900">Microred</TableHead>
            <TableHead className="text-emerald-900">Establecimiento</TableHead>
            <TableHead className="text-center text-emerald-900">Denominador</TableHead>
            <TableHead className="text-center text-emerald-900">Numerador</TableHead>
            <TableHead className="text-center text-emerald-900">Avance %</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {planas.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                Sin datos para los filtros seleccionados.
              </TableCell>
            </TableRow>
          ) : (
            planas.map((row) => (
              <TableRow key={`${row.RED}-${row.MICRORED}-${row.ESTABLECIMIENTO}`}>
                <TableCell>{row.RED}</TableCell>
                <TableCell>{row.MICRORED}</TableCell>
                <TableCell>{row.ESTABLECIMIENTO}</TableCell>
                <TableCell className="text-center tabular-nums">{fmtN(row.denominador)}</TableCell>
                <TableCell className="text-center tabular-nums">{fmtN(row.numerador)}</TableCell>
                <TableCell className="text-center">
                  <AvancePill value={row.avance_pct} meta={meta} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    )
  }

  return (
    <div>
      <div
        className={cn(
          'grid items-center gap-1 border-b-2 border-emerald-800/15 bg-emerald-800/[0.06] px-2 py-2',
          REDES_COLS,
        )}
      >
        <span />
        <span className="text-xs font-bold tracking-wide text-emerald-900 uppercase">
          Red / Microred
        </span>
        <span className="text-xs font-bold tracking-wide text-emerald-900 uppercase">
          Establecimiento
        </span>
        <span className="text-center text-xs font-bold text-emerald-900">Denominador</span>
        <span className="text-center text-xs font-bold text-emerald-900">Numerador</span>
        <span className="text-center text-xs font-bold text-emerald-900">Avance %</span>
      </div>
      <div className="max-h-[520px] overflow-y-auto">
        {redes.redes.map((r) => (
          <RedFila
            key={r.RED}
            red={r}
            microredes={redes.microredes}
            establecimientos={redes.establecimientos}
            busqueda={busqueda}
            meta={meta}
          />
        ))}
      </div>
      {redes.total && (
        <div
          className={cn(
            'grid items-center gap-1 bg-emerald-800 px-2 py-3 text-white',
            REDES_COLS,
          )}
        >
          <span />
          <span className="col-span-2 text-sm font-black tracking-wide">TOTAL GENERAL</span>
          <span className="text-center text-sm font-black tabular-nums">
            {fmtN(redes.total.denominador)}
          </span>
          <span className="text-center text-sm font-black tabular-nums">
            {fmtN(redes.total.numerador)}
          </span>
          <span className="text-center text-base font-black tabular-nums">
            {fmtPct(redes.total.avance_pct)}
          </span>
        </div>
      )}
    </div>
  )
}
