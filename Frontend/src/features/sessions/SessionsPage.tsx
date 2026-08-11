import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
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
  const [loading, setLoading] = useState(true)
  const [username, setUsername] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')

  async function load(filters?: { username?: string; desde?: string; hasta?: string }) {
    setLoading(true)
    try {
      const data = await authApi.sesiones({
        username: filters?.username || undefined,
        desde: filters?.desde || undefined,
        hasta: filters?.hasta || undefined,
        limit: 200,
      })
      setRows(data)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Error al cargar sesiones')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  function onFilter(e: FormEvent) {
    e.preventDefault()
    void load({ username: username.trim(), desde, hasta })
  }

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
    </div>
  )
}
