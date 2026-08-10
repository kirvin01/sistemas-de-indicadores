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
      ? 'border-transparent bg-teal-600 text-white'
      : tone === 'warning'
        ? 'border-transparent bg-amber-500 text-white'
        : tone === 'danger'
          ? 'border-transparent bg-rose-500 text-white'
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
        className="grid w-full grid-cols-[2rem_minmax(0,1.4fr)_5.5rem_5.5rem_6rem] items-center gap-1 border-b border-sky-200/80 bg-sky-50/90 px-3 py-2.5 text-left hover:bg-sky-100/80"
      >
        <span className="flex justify-center text-sky-700">
          {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </span>
        <span className="truncate text-sm font-bold text-slate-800">Total {prov.PROVINCIA}</span>
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
            className="grid grid-cols-[2rem_minmax(0,1.4fr)_5.5rem_5.5rem_6rem] items-center gap-1 border-b border-slate-100 px-3 py-2 hover:bg-slate-50"
          >
            <span />
            <span className="truncate pl-2 text-sm text-slate-700">{d.DISTRITO}</span>
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
            <TableHead className="text-slate-700">Provincia</TableHead>
            <TableHead className="text-slate-700">Distrito</TableHead>
            <TableHead className="text-center text-slate-700">Denominador</TableHead>
            <TableHead className="text-center text-slate-700">Numerador</TableHead>
            <TableHead className="text-center text-slate-700">Avance %</TableHead>
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
      <div className="grid grid-cols-[2rem_minmax(0,1.4fr)_5.5rem_5.5rem_6rem] items-center gap-1 border-b border-border bg-slate-50 px-3 py-2.5">
        <span />
        <span className="text-[11px] font-bold tracking-wide text-slate-600 uppercase">
          Provincia / Distrito
        </span>
        <span className="text-center text-[11px] font-bold text-slate-600 uppercase">Denominador</span>
        <span className="text-center text-[11px] font-bold text-slate-600 uppercase">Numerador</span>
        <span className="text-center text-[11px] font-bold text-slate-600 uppercase">Avance %</span>
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
        <div className="grid grid-cols-[2rem_minmax(0,1.4fr)_5.5rem_5.5rem_6rem] items-center gap-1 bg-slate-800 px-3 py-3 text-white">
          <span />
          <span className="text-sm font-bold tracking-wide">TOTAL GENERAL</span>
          <span className="text-center text-sm font-bold tabular-nums">
            {fmtN(tabla.total.denominador)}
          </span>
          <span className="text-center text-sm font-bold tabular-nums">
            {fmtN(tabla.total.numerador)}
          </span>
          <span className="text-center text-base font-bold tabular-nums">
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
          'grid w-full items-center gap-1 border-b border-teal-100 bg-teal-50/50 px-3 py-2 text-left hover:bg-teal-50',
          REDES_COLS,
        )}
      >
        <span className="flex justify-center pl-4 text-teal-700">
          {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </span>
        <span className="truncate pl-2 text-sm font-semibold text-slate-700">
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
              'grid items-center gap-1 border-b border-slate-100 px-3 py-1.5 hover:bg-slate-50',
              REDES_COLS,
            )}
          >
            <span />
            <span />
            <span className="truncate text-[13px] text-slate-700">{e.ESTABLECIMIENTO}</span>
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
          'grid w-full items-center gap-1 border-b border-teal-200/80 bg-teal-50/90 px-3 py-2.5 text-left hover:bg-teal-100/70',
          REDES_COLS,
        )}
      >
        <span className="flex justify-center text-teal-700">
          {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </span>
        <span className="truncate text-sm font-bold text-slate-800">{red.RED}</span>
        <span className="truncate text-sm font-semibold text-slate-500">Total Red</span>
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
            <TableHead className="text-slate-700">Red</TableHead>
            <TableHead className="text-slate-700">Microred</TableHead>
            <TableHead className="text-slate-700">Establecimiento</TableHead>
            <TableHead className="text-center text-slate-700">Denominador</TableHead>
            <TableHead className="text-center text-slate-700">Numerador</TableHead>
            <TableHead className="text-center text-slate-700">Avance %</TableHead>
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
          'grid items-center gap-1 border-b border-border bg-slate-50 px-3 py-2.5',
          REDES_COLS,
        )}
      >
        <span />
        <span className="text-[11px] font-bold tracking-wide text-slate-600 uppercase">
          Red / Microred
        </span>
        <span className="text-[11px] font-bold tracking-wide text-slate-600 uppercase">
          Establecimiento
        </span>
        <span className="text-center text-[11px] font-bold text-slate-600 uppercase">Denominador</span>
        <span className="text-center text-[11px] font-bold text-slate-600 uppercase">Numerador</span>
        <span className="text-center text-[11px] font-bold text-slate-600 uppercase">Avance %</span>
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
            'grid items-center gap-1 bg-slate-800 px-3 py-3 text-white',
            REDES_COLS,
          )}
        >
          <span />
          <span className="col-span-2 text-sm font-bold tracking-wide">TOTAL GENERAL</span>
          <span className="text-center text-sm font-bold tabular-nums">
            {fmtN(redes.total.denominador)}
          </span>
          <span className="text-center text-sm font-bold tabular-nums">
            {fmtN(redes.total.numerador)}
          </span>
          <span className="text-center text-base font-bold tabular-nums">
            {fmtPct(redes.total.avance_pct)}
          </span>
        </div>
      )}
    </div>
  )
}
