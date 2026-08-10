import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Pencil, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { ApiError, profilesApi, type Perfil, type Permiso } from '@/lib/api'

type FormState = {
  codigo: string
  nombre: string
  activo: boolean
  permisos: string[]
}

const emptyForm: FormState = {
  codigo: '',
  nombre: '',
  activo: true,
  permisos: [],
}

export function ProfilesPage() {
  const [profiles, setProfiles] = useState<Perfil[]>([])
  const [catalog, setCatalog] = useState<Permiso[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Perfil | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const [p, perms] = await Promise.all([profilesApi.list(), profilesApi.permissions()])
      setProfiles(p)
      setCatalog(perms)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Error al cargar perfiles')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setOpen(true)
  }

  function openEdit(perfil: Perfil) {
    setEditing(perfil)
    setForm({
      codigo: perfil.codigo,
      nombre: perfil.nombre,
      activo: perfil.activo,
      permisos: [...perfil.permisos],
    })
    setOpen(true)
  }

  function togglePerm(codigo: string, checked: boolean) {
    setForm((prev) => ({
      ...prev,
      permisos: checked
        ? [...new Set([...prev.permisos, codigo])]
        : prev.permisos.filter((p) => p !== codigo),
    }))
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing) {
        await profilesApi.update(editing.id, {
          nombre: form.nombre.trim(),
          activo: form.activo,
          permisos: form.permisos,
        })
        toast.success('Perfil actualizado')
      } else {
        await profilesApi.create({
          codigo: form.codigo.trim().toLowerCase(),
          nombre: form.nombre.trim(),
          activo: form.activo,
          permisos: form.permisos,
        })
        toast.success('Perfil creado')
      }
      setOpen(false)
      await load()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-teal-800/70">Administración</p>
          <h2 className="text-3xl font-semibold tracking-tight">Perfiles de acceso</h2>
          <p className="text-muted-foreground">Defina permisos y políticas por perfil</p>
        </div>
        <Button className="rounded-xl shadow-md shadow-teal-900/10" onClick={openCreate}>
          <Plus className="size-4" />
          Nuevo perfil
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Permisos</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-[80px] text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground">
                  Cargando…
                </TableCell>
              </TableRow>
            ) : (
              profiles.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.codigo}</TableCell>
                  <TableCell>{p.nombre}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {p.permisos.map((code) => (
                        <Badge key={code} variant="outline">
                          {code}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge tone={p.activo ? 'success' : 'danger'}>
                      {p.activo ? 'Activo' : 'Inactivo'}
                    </StatusBadge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon-sm" onClick={() => openEdit(p)}>
                      <Pencil className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar perfil' : 'Nuevo perfil'}</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={onSubmit}>
            {!editing && (
              <div className="space-y-2">
                <Label htmlFor="p-codigo">Código</Label>
                <Input
                  id="p-codigo"
                  value={form.codigo}
                  onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                  placeholder="ej. analisis"
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="p-nombre">Nombre</Label>
              <Input
                id="p-nombre"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                required
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.activo}
                onCheckedChange={(v) => setForm({ ...form, activo: v === true })}
              />
              Activo
            </label>
            <div className="space-y-2">
              <Label>Permisos</Label>
              <div className="max-h-56 space-y-2 overflow-y-auto rounded-md border p-3">
                {catalog.map((perm) => (
                  <label key={perm.codigo} className="flex items-start gap-2 text-sm">
                    <Checkbox
                      checked={form.permisos.includes(perm.codigo)}
                      onCheckedChange={(v) => togglePerm(perm.codigo, v === true)}
                    />
                    <span>
                      <span className="font-medium">{perm.codigo}</span>
                      <span className="block text-muted-foreground">{perm.nombre}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Guardando…' : 'Guardar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
