import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ApiError, authApi } from '@/lib/api'
import geresaLogo from '@/assets/geresa-logo.png'

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = useMemo(() => params.get('token')?.trim() ?? '', [params])
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!token) {
      toast.error('Enlace inválido')
      return
    }
    if (password.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres')
      return
    }
    if (password !== confirm) {
      toast.error('La confirmación no coincide')
      return
    }
    setSubmitting(true)
    try {
      const res = await authApi.resetPassword(token, password)
      toast.success(res.message)
      navigate('/login', { replace: true })
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'No se pudo restablecer')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background p-4">
      <div className="relative w-full max-w-[400px] overflow-hidden rounded-[1.75rem] border border-border/70 bg-card p-6 shadow-lg md:p-8">
        <div className="mb-5 flex flex-col items-center text-center">
          <img src={geresaLogo} alt="GERESA" className="mb-3 size-16 rounded-full object-cover" />
          <h1 className="text-lg font-semibold">Restablecer contraseña</h1>
        </div>

        {!token ? (
          <div className="space-y-4 text-center text-sm">
            <p className="text-muted-foreground">El enlace no incluye un token válido.</p>
            <Link
              to="/olvidar-password"
              className="inline-flex h-8 w-full items-center justify-center rounded-lg border border-border bg-background text-sm font-medium hover:bg-muted"
            >
              Solicitar nuevo enlace
            </Link>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="new-password">Nueva contraseña</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Guardando…' : 'Restablecer'}
            </Button>
            <p className="text-center text-sm">
              <Link to="/login" className="text-primary hover:underline">
                Volver al login
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
