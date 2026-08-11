import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ApiError, authApi, type SesionIngreso } from '@/lib/api'

const PAGE_SIZE = 25

function formatWhen(iso: string) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('es-PE', {
    dateStyle: 'short',
    timeStyle: 'medium',
  })
}

export function SessionsPage() {
  const [rows, setRows] = useState<SesionIngreso[]>([])
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [username, setUsername] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')

  const abortRef = useRef<AbortController | null>(null)
  const loadingRef = useRef(false)
  const requestIdRef = useRef(0)
  const filtersRef = useRef({ username: '', desde: '', hasta: '' })

  const fetchPage = useCallback(
    async (opts: {
      offset: number
      append: boolean
      username?: string
      desde?: string
      hasta?: string
    }) => {
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
        const data = await authApi.sesiones(
          {
            username: opts.username || undefined,
            desde: opts.desde || undefined,
            hasta: opts.hasta || undefined,
            offset: opts.offset,
            per_page: PAGE_SIZE,
          },
          { signal: controller.signal },
        )
        if (reqId !== requestIdRef.current || controller.signal.aborted) return

        const batch = data.result
        setHasMore(batch.length >= PAGE_SIZE)
        setOffset(opts.offset + batch.length)
        setRows((prev) => (opts.append ? [...prev, ...batch] : batch))
      } catch (err: unknown) {
        if (controller.signal.aborted) return
        if (err instanceof DOMException && err.name === 'AbortError') return
        toast.error(err instanceof ApiError ? err.message : 'Error al cargar sesiones')
        if (!opts.append) {
          setRows([])
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
    void fetchPage({ offset: 0, append: false })
    return () => {
      abortRef.current?.abort()
    }
  }, [fetchPage])

  function onFilter(e: FormEvent) {
    e.preventDefault()
    const next = {
      username: username.trim(),
      desde,
      hasta,
    }
    filtersRef.current = next
    setOffset(0)
    setHasMore(true)
    void fetchPage({ offset: 0, append: false, ...next })
  }

  function loadMore() {
    if (!hasMore || loading || loadingMore || loadingRef.current) return
    void fetchPage({
      offset,
      append: true,
      ...filtersRef.current,
    })
  }

  const countLabel = hasMore && rows.length > 0 ? `${rows.length}+` : String(rows.length)

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Seguimiento de ingresos
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Registro de inicios de sesión (usuario, fecha y hora).
        </p>
      </div>

      <form
        onSubmit={onFilter}
        className="flex flex-wrap items-end gap-3 rounded-2xl border border-border/70 bg-card p-4"
      >
        <div className="space-y-1.5">
          <Label htmlFor="f-user">Usuario</Label>
          <Input
            id="f-user"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Buscar…"
            className="w-40"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="f-desde">Desde</Label>
          <Input
            id="f-desde"
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="f-hasta">Hasta</Label>
          <Input
            id="f-hasta"
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={loading}>
          Filtrar
        </Button>
      </form>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Mostrando <span className="font-medium text-slate-700">{countLabel}</span> registros
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Fecha y hora</TableHead>
              <TableHead>IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">
                  Cargando…
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">
                  Sin registros
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.username}</TableCell>
                  <TableCell>{r.profile ?? '—'}</TableCell>
                  <TableCell>{formatWhen(r.ingresado_en)}</TableCell>
                  <TableCell className="text-muted-foreground">{r.ip ?? '—'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {hasMore && rows.length > 0 && (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            disabled={loadingMore || loading}
            onClick={loadMore}
            className="min-w-40"
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
        </div>
      )}
    </div>
  )
}
