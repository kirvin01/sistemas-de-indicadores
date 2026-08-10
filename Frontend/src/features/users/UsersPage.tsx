import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Pencil, Plus, Trash2 } from 'lucide-react'
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
import { Checkbox } from '@/components/ui/checkbox'
import { StatusBadge } from '@/components/ui/status-badge'
import { ApiError, profilesApi, usersApi, type Perfil, type Usuario } from '@/lib/api'

type FormState = {
  username: string
  password: string
  profile_id: string
  disabled: boolean
}

const emptyForm: FormState = {
  username: '',
  password: '',
  profile_id: '',
  disabled: false,
}

export function UsersPage() {
  const [users, setUsers] = useState<Usuario[]>([])
  const [profiles, setProfiles] = useState<Perfil[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Usuario | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const [u, p] = await Promise.all([usersApi.list(), profilesApi.list()])
      setUsers(u)
      setProfiles(p.filter((x) => x.activo))
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  function openCreate() {
    setEditing(null)
    setForm({
      ...emptyForm,
      profile_id: profiles[0] ? String(profiles[0].id) : '',
    })
    setOpen(true)
  }

  function openEdit(user: Usuario) {
    setEditing(user)
    setForm({
      username: user.username,
      password: '',
      profile_id: String(user.profile_id),
      disabled: user.disabled,
    })
    setOpen(true)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.profile_id) {
      toast.error('Seleccione un perfil')
      return
    }
    setSaving(true)
    try {
      if (editing) {
        await usersApi.update(editing.id, {
          username: form.username.trim(),
          profile_id: Number(form.profile_id),
          disabled: form.disabled,
          password: form.password.trim() || null,
        })
        toast.success('Usuario actualizado')
      } else {
        if (form.password.length < 8) {
          toast.error('La contraseña debe tener al menos 8 caracteres')
          setSaving(false)
          return
        }
        await usersApi.create({
          username: form.username.trim(),
          password: form.password,
          profile_id: Number(form.profile_id),
          disabled: form.disabled,
        })
        toast.success('Usuario creado')
      }
      setOpen(false)
      await load()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  async function onDelete(user: Usuario) {
    if (!confirm(`¿Eliminar usuario "${user.username}"?`)) return
    try {
      await usersApi.remove(user.id)
      toast.success('Usuario eliminado')
      await load()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'No se pudo eliminar')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-teal-800/70">Administración</p>
          <h2 className="text-3xl font-semibold tracking-tight">Usuarios</h2>
          <p className="text-muted-foreground">Creación y administración de cuentas de acceso</p>
        </div>
        <Button className="rounded-xl shadow-md shadow-teal-900/10" onClick={openCreate}>
          <Plus className="size-4" />
          Nuevo usuario
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-[120px] text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">
                  Cargando…
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">
                  No hay usuarios
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.username}</TableCell>
                  <TableCell>{u.profile}</TableCell>
                  <TableCell>
                    <StatusBadge tone={u.disabled ? 'danger' : 'success'}>
                      {u.disabled ? 'Deshabilitado' : 'Activo'}
                    </StatusBadge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon-sm" onClick={() => openEdit(u)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => void onDelete(u)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar usuario' : 'Nuevo usuario'}</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="u-username">Usuario</Label>
              <Input
                id="u-username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="u-password">
                Contraseña {editing ? '(dejar vacío para no cambiar)' : ''}
              </Label>
              <Input
                id="u-password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required={!editing}
              />
            </div>
            <div className="space-y-2">
              <Label>Perfil</Label>
              <Select
                value={form.profile_id}
                onValueChange={(v) => setForm({ ...form, profile_id: v ?? '' })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccione perfil" />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.nombre} ({p.codigo})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.disabled}
                onCheckedChange={(v) => setForm({ ...form, disabled: v === true })}
              />
              Deshabilitado
            </label>
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
