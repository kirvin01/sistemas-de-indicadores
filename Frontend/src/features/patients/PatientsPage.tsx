import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { ClipboardList, IdCard, Loader2, Search } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
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
import { StatusBadge } from '@/components/ui/status-badge'
import { AtencionesHistorialDialog } from '@/features/patients/AtencionesHistorialDialog'
import { ApiError, patientsApi, type Paciente } from '@/lib/api'

export function PatientsPage() {
  const [ndoc, setNdoc] = useState('')
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [loadingSearch, setLoadingSearch] = useState(false)
  const [searched, setSearched] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [selected, setSelected] = useState<Paciente | null>(null)

  async function onSearch(e: FormEvent) {
    e.preventDefault()
    const doc = ndoc.trim()
    if (!doc || loadingSearch) return
    setLoadingSearch(true)
    setSearched(true)
    setPacientes([])
    try {
      const data = await patientsApi.search(doc)
      setPacientes(data.result)
      if (data.result.length === 0) {
        toast.message('Sin resultados', {
          description: 'No se encontraron pacientes con ese documento.',
        })
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Error al buscar pacientes')
    } finally {
      setLoadingSearch(false)
    }
  }

  function openAtenciones(p: Paciente) {
    setSelected(p)
    setModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-sm font-medium text-teal-800/70">Consulta HIS</p>
        <h2 className="text-3xl font-semibold tracking-tight">Consulta de Pacientes</h2>
        <p className="max-w-2xl text-muted-foreground">
          Busque por número de documento y revise el historial de atenciones por año y mes.
        </p>
      </div>

      <form
        onSubmit={onSearch}
        className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm md:p-6"
      >
        <div className="mb-4 flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Search className="size-4 text-primary" />
          Búsqueda de pacientes
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="ndoc">Número de documento</Label>
            <div className="relative">
              <IdCard className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="ndoc"
                value={ndoc}
                onChange={(e) => setNdoc(e.target.value)}
                placeholder="Ingrese DNI u otro documento…"
                className="h-11 rounded-xl pl-9"
                autoComplete="off"
              />
            </div>
          </div>
          <Button
            type="submit"
            disabled={loadingSearch || !ndoc.trim()}
            className="h-11 rounded-xl px-6 shadow-md shadow-teal-900/10 sm:min-w-36"
          >
            {loadingSearch ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Search className="size-4" />
            )}
            Buscar
          </Button>
        </div>
      </form>

      {searched && pacientes.length === 0 && !loadingSearch && (
        <Alert className="rounded-xl border-amber-200 bg-amber-50 text-amber-950">
          <AlertDescription>
            No se encontraron pacientes con el documento indicado.
          </AlertDescription>
        </Alert>
      )}

      {pacientes.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border/60 bg-teal-50/40 px-4 py-3">
            <p className="text-sm text-muted-foreground">
              {pacientes.length} resultado{pacientes.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Tipo</TableHead>
                <TableHead>N° Documento</TableHead>
                <TableHead>Fec. Nacimiento</TableHead>
                <TableHead>Género</TableHead>
                <TableHead>Edad</TableHead>
                <TableHead className="text-right">Atenciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pacientes.map((p, idx) => (
                <TableRow
                  key={`${p.numero_documento}-${p.abrev_tipo_doc}-${idx}`}
                  className="cursor-pointer"
                  onDoubleClick={() => openAtenciones(p)}
                >
                  <TableCell>
                    <Badge variant="outline" className="rounded-full">
                      {p.abrev_tipo_doc}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{p.numero_documento}</TableCell>
                  <TableCell>{p.fecha_nacimiento}</TableCell>
                  <TableCell>
                    <StatusBadge tone={p.genero === 'M' ? 'neutral' : 'warning'}>
                      {p.genero === 'M' ? 'Masculino' : p.genero === 'F' ? 'Femenino' : p.genero}
                    </StatusBadge>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-teal-800">{p.edad}</span>
                    <span className="text-muted-foreground"> a.</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" className="rounded-xl" onClick={() => openAtenciones(p)}>
                      <ClipboardList className="size-4" />
                      Ver
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AtencionesHistorialDialog
        open={modalOpen}
        onOpenChange={setModalOpen}
        paciente={selected}
      />
    </div>
  )
}
