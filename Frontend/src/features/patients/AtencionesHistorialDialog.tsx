import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Cake, IdCard, Loader2, UserRound, VenusAndMars } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { StatusBadge } from '@/components/ui/status-badge'
import { useDebounce } from '@/hooks/useDebounce'
import { ApiError, patientsApi, type Atencion, type Paciente } from '@/lib/api'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 25
const FILTER_DEBOUNCE_MS = 700
const MES_TODOS = 'all'
const CODIGO_TODO = 'Todo'

const MESES = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' },
]

function InfoChip({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Cake
  label: string
  value: string
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl border border-border/70 bg-teal-50/50 px-3 py-2.5">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          {label}
        </p>
        <p className="truncate text-sm font-semibold">{value}</p>
      </div>
    </div>
  )
}

function normalizeCodigoFilter(value: string): string | undefined {
  const v = value.trim()
  if (!v || v.toLowerCase() === 'todo' || v.toLowerCase() === 'todos') return undefined
  return v
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  paciente: Paciente | null
}

export function AtencionesHistorialDialog({ open, onOpenChange, paciente }: Props) {
  const anios = useMemo(() => {
    const y = new Date().getFullYear()
    return Array.from({ length: 6 }, (_, i) => y - i)
  }, [])

  const [anio, setAnio] = useState(() => new Date().getFullYear())
  const [mes, setMes] = useState<string>(MES_TODOS)
  const [codigo, setCodigo] = useState(CODIGO_TODO)
  const codigoDebounced = useDebounce(codigo, FILTER_DEBOUNCE_MS)

  const [atenciones, setAtenciones] = useState<Atencion[]>([])
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  const abortRef = useRef<AbortController | null>(null)
  const loadingRef = useRef(false)
  const requestIdRef = useRef(0)
  const prevOpenRef = useRef(false)

  const mesNum = mes === MES_TODOS ? undefined : Number(mes)
  const codigoFiltro = normalizeCodigoFilter(codigoDebounced)

  const fetchPage = useCallback(
    async (opts: {
      offset: number
      append: boolean
      anio: number
      mes?: number
      codigo?: string
      ndoc: string
    }) => {
      if (!opts.anio) return
      if (opts.append && loadingRef.current) return

      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      const reqId = ++requestIdRef.current

      loadingRef.current = true
      if (opts.append) setLoadingMore(true)
      else {
        setLoading(true)
        setLoadingMore(false)
      }

      try {
        const data = await patientsApi.atenciones(
          {
            ndoc: opts.ndoc,
            anio: opts.anio,
            mes: opts.mes,
            codigo: opts.codigo,
            offset: opts.offset,
            per_page: PAGE_SIZE,
          },
          { signal: controller.signal },
        )
        if (reqId !== requestIdRef.current || controller.signal.aborted) return

        const batch = data.result
        setHasMore(batch.length >= PAGE_SIZE)
        setOffset(opts.offset + batch.length)
        setAtenciones((prev) => (opts.append ? [...prev, ...batch] : batch))

        if (!opts.append && batch.length === 0) {
          const periodo =
            opts.mes != null
              ? `${MESES.find((m) => m.value === opts.mes)?.label ?? opts.mes} ${opts.anio}`
              : `el año ${opts.anio}`
          const extra = opts.codigo ? ` con código «${opts.codigo}»` : ''
          toast.message('Sin atenciones', {
            description: `No hay registros en ${periodo}${extra}.`,
          })
        }
      } catch (err: unknown) {
        if (controller.signal.aborted) return
        if (err instanceof DOMException && err.name === 'AbortError') return
        toast.error(err instanceof ApiError ? err.message : 'Error al cargar atenciones')
        if (!opts.append) {
          setAtenciones([])
          setHasMore(false)
        }
      } finally {
        if (reqId === requestIdRef.current) {
          loadingRef.current = false
          setLoading(false)
          setLoadingMore(false)
        }
      }
    },
    [],
  )

  useEffect(() => {
    const justOpened = open && !prevOpenRef.current
    prevOpenRef.current = open

    if (!open) {
      abortRef.current?.abort()
      abortRef.current = null
      loadingRef.current = false
      return
    }

    if (justOpened && paciente) {
      setAnio(new Date().getFullYear())
      setMes(MES_TODOS)
      setCodigo(CODIGO_TODO)
      setAtenciones([])
      setOffset(0)
      setHasMore(true)
    }
  }, [open, paciente])

  useEffect(() => {
    if (!open || !paciente || !anio) return
    setAtenciones([])
    setOffset(0)
    setHasMore(true)
    void fetchPage({
      offset: 0,
      append: false,
      anio,
      mes: mesNum,
      codigo: codigoFiltro,
      ndoc: paciente.numero_documento,
    })
    return () => {
      abortRef.current?.abort()
    }
  }, [open, paciente, anio, mesNum, codigoFiltro, fetchPage])

  const loadMore = useCallback(() => {
    if (!open || !paciente || !anio || !hasMore) return
    if (loadingRef.current || loading || loadingMore) return
    void fetchPage({
      offset,
      append: true,
      anio,
      mes: mesNum,
      codigo: codigoFiltro,
      ndoc: paciente.numero_documento,
    })
  }, [
    open,
    paciente,
    anio,
    mesNum,
    codigoFiltro,
    hasMore,
    offset,
    loading,
    loadingMore,
    fetchPage,
  ])

  const busy = loading && atenciones.length === 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className={cn(
          'flex max-h-[92vh] w-[min(96vw,1280px)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none',
        )}
      >
        <DialogHeader className="border-b border-teal-800/10 bg-gradient-to-r from-teal-700 to-emerald-700 px-5 py-4 text-white">
          <DialogTitle className="text-base text-white">Historial de atenciones</DialogTitle>
        </DialogHeader>

        {paciente && (
          <div className="grid gap-2 border-b border-border/60 bg-muted/30 px-5 py-3 sm:grid-cols-2 lg:grid-cols-4">
            <InfoChip
              icon={UserRound}
              label="Documento"
              value={`${paciente.abrev_tipo_doc}: ${paciente.numero_documento}`}
            />
            <InfoChip icon={Cake} label="Nacimiento" value={paciente.fecha_nacimiento} />
            <InfoChip
              icon={VenusAndMars}
              label="Género"
              value={
                paciente.genero === 'M'
                  ? 'Masculino'
                  : paciente.genero === 'F'
                    ? 'Femenino'
                    : paciente.genero
              }
            />
            <InfoChip icon={IdCard} label="Edad" value={`${paciente.edad} años`} />
          </div>
        )}

        <div className="flex flex-wrap items-end gap-3 border-b border-border/60 px-5 py-3">
          <div className="w-28 space-y-1.5">
            <Label>
              Año <span className="text-rose-600">*</span>
            </Label>
            <Select
              value={String(anio)}
              onValueChange={(v) => {
                const next = Number(v)
                if (!next || next === anio) return
                setAnio(next)
              }}
              disabled={busy}
            >
              <SelectTrigger className="h-9 w-full rounded-xl">
                <SelectValue placeholder="Año" />
              </SelectTrigger>
              <SelectContent>
                {anios.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-44 space-y-1.5">
            <Label>Mes</Label>
            <Select value={mes} onValueChange={(v) => setMes(v ?? MES_TODOS)} disabled={busy}>
              <SelectTrigger className="h-9 w-full rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={MES_TODOS}>Todo</SelectItem>
                {MESES.map((m) => (
                  <SelectItem key={m.value} value={String(m.value)}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-[160px] flex-1 space-y-1.5 sm:max-w-xs">
            <Label htmlFor="filtro-codigo">Código</Label>
            <Input
              id="filtro-codigo"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              onFocus={(e) => {
                if (e.target.value.trim().toLowerCase() === 'todo') {
                  setCodigo('')
                }
              }}
              onBlur={(e) => {
                if (!e.target.value.trim()) setCodigo(CODIGO_TODO)
              }}
              placeholder="Todo"
              disabled={busy}
              className="h-9 rounded-xl"
              autoComplete="off"
            />
          </div>

          <StatusBadge tone={atenciones.length ? 'success' : 'warning'} className="mb-0.5">
            {busy
              ? '…'
              : `${atenciones.length} atención${atenciones.length !== 1 ? 'es' : ''}${
                  hasMore ? '+' : ''
                }`}
          </StatusBadge>
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          {busy ? (
            <div className="flex h-48 items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="size-5 animate-spin text-primary" />
              Cargando atenciones…
            </div>
          ) : (
            <>
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card shadow-sm">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead className="min-w-[200px]">Descripción</TableHead>
                    <TableHead>Lab1</TableHead>
                    <TableHead>Lab2</TableHead>
                    <TableHead>Lab3</TableHead>
                    <TableHead>F. Registro</TableHead>
                    <TableHead className="min-w-[160px]">Establecimiento</TableHead>
                    <TableHead>Dist. | Prov.</TableHead>
                    <TableHead>Sistema</TableHead>
                    <TableHead className="min-w-[140px]">Registrador</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {atenciones.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={12} className="h-24 text-center text-muted-foreground">
                        No hay atenciones para mostrar.
                        {codigoFiltro ? (
                          <span className="mt-1 block text-xs">
                            Pruebe código «Todo», otro año o mes «Todo».
                          </span>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ) : (
                    atenciones.map((a, idx) => (
                      <TableRow key={`${a.id_cita}-${a.codigo_item}-${idx}`}>
                        <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell className="whitespace-nowrap font-medium">
                          {a.f_atencion}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{a.codigo_item}</TableCell>
                        <TableCell className="max-w-[280px] truncate" title={a.descripcion_item}>
                          {a.descripcion_item || '—'}
                        </TableCell>
                        <TableCell>{a.lab1 || '—'}</TableCell>
                        <TableCell>{a.lab2 || '—'}</TableCell>
                        <TableCell>{a.lab3 || '—'}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs">
                          {a.f_registro || '—'}
                        </TableCell>
                        <TableCell className="max-w-[180px] truncate" title={a.establecimiento}>
                          {a.establecimiento || '—'}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs">
                          {a.distrito_provincia || '—'}
                        </TableCell>
                        <TableCell>{a.sistema || '—'}</TableCell>
                        <TableCell className="max-w-[160px] truncate" title={a.registrador}>
                          {a.registrador || '—'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              <div className="flex flex-col items-center gap-2 px-4 py-4">
                {hasMore && atenciones.length > 0 && (
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    disabled={loadingMore || loading}
                    onClick={loadMore}
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Cargando…
                      </>
                    ) : (
                      'Cargar más'
                    )}
                  </Button>
                )}
                {!hasMore && atenciones.length > 0 && (
                  <span className="text-xs text-muted-foreground">Fin del listado</span>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter className="m-0 rounded-none">
          <Button variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
