import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/context/AuthContext'
import { ApiError, authApi } from '@/lib/api'

export function ProfilePage() {
  const { user, refresh } = useAuth()
  const [correo, setCorreo] = useState('')
  const [celular, setCelular] = useState('')
  const [red, setRed] = useState('')
  const [cargo, setCargo] = useState('')
  const [savingPerfil, setSavingPerfil] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [savingPwd, setSavingPwd] = useState(false)

  useEffect(() => {
    if (!user) return
    setCorreo(user.correo ?? '')
    setCelular(user.celular ?? '')
    setRed(user.red ?? '')
    setCargo(user.cargo ?? '')
  }, [user])

  async function onSavePerfil(e: FormEvent) {
    e.preventDefault()
    setSavingPerfil(true)
    try {
      await authApi.updatePerfil({ correo, celular, red, cargo })
      await refresh()
      toast.success('Datos actualizados')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'No se pudo guardar')
    } finally {
      setSavingPerfil(false)
    }
  }

  async function onChangePassword(e: FormEvent) {
    e.preventDefault()
    if (newPassword.length < 8) {
      toast.error('La nueva contraseña debe tener al menos 8 caracteres')
      return
    }
    if (newPassword !== confirm) {
      toast.error('La confirmación no coincide')
      return
    }
    setSavingPwd(true)
    try {
      await authApi.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      })
      toast.success('Contraseña actualizada')
      setCurrentPassword('')
      setNewPassword('')
      setConfirm('')
      await refresh()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'No se pudo cambiar la contraseña')
    } finally {
      setSavingPwd(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Mi perfil</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Usuario <span className="font-medium text-slate-700">{user?.username}</span> · perfil{' '}
          <span className="font-medium text-slate-700">{user?.profile}</span>
        </p>
      </div>

      <form onSubmit={onSavePerfil} className="space-y-4 rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800">Datos de contacto</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="correo">Correo</Label>
            <Input
              id="correo"
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="correo@ejemplo.com"
            />
            <p className="text-xs text-muted-foreground">
              Necesario para recuperar la contraseña por correo.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="celular">Celular</Label>
            <Input id="celular" value={celular} onChange={(e) => setCelular(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="red">Red</Label>
            <Input
              id="red"
              value={red}
              onChange={(e) => setRed(e.target.value)}
              placeholder="Red de salud"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="cargo">Cargo</Label>
            <Input id="cargo" value={cargo} onChange={(e) => setCargo(e.target.value)} />
          </div>
        </div>
        <Button type="submit" disabled={savingPerfil}>
          {savingPerfil ? 'Guardando…' : 'Guardar datos'}
        </Button>
      </form>

      <form
        onSubmit={onChangePassword}
        className="space-y-4 rounded-2xl border border-border/70 bg-card p-5 shadow-sm"
      >
        <h2 className="text-sm font-semibold text-slate-800">Cambiar contraseña</h2>
        <div className="space-y-2">
          <Label htmlFor="pwd-current">Contraseña actual</Label>
          <Input
            id="pwd-current"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="pwd-new">Nueva contraseña</Label>
            <Input
              id="pwd-new"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pwd-confirm">Confirmar</Label>
            <Input
              id="pwd-confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={8}
            />
          </div>
        </div>
        <Button type="submit" disabled={savingPwd}>
          {savingPwd ? 'Actualizando…' : 'Actualizar contraseña'}
        </Button>
      </form>
    </div>
  )
}
