import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ApiError, authApi } from '@/lib/api'
import geresaLogo from '@/assets/geresa-logo.png'

export function ForgotPasswordPage() {
  const [correo, setCorreo] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await authApi.forgotPassword(correo.trim())
      setDone(true)
      toast.success(res.message)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'No se pudo procesar la solicitud')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background p-4">
      <div className="relative w-full max-w-[400px] overflow-hidden rounded-[1.75rem] border border-border/70 bg-card p-6 shadow-lg md:p-8">
        <div className="mb-5 flex flex-col items-center text-center">
          <img src={geresaLogo} alt="GERESA" className="mb-3 size-16 rounded-full object-cover" />
          <h1 className="text-lg font-semibold">Recuperar contraseña</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ingrese el correo registrado en su perfil.
          </p>
        </div>

        {done ? (
          <div className="space-y-4 text-center text-sm text-slate-700">
            <p>
              Si el correo está registrado, recibirá un enlace para restablecer la contraseña. En
              desarrollo local el enlace aparece en la consola del servidor.
            </p>
            <Link
              to="/login"
              className="inline-flex h-8 w-full items-center justify-center rounded-lg border border-border bg-background text-sm font-medium hover:bg-muted"
            >
              Volver al login
            </Link>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="correo">Correo</Label>
              <Input
                id="correo"
                type="email"
                autoComplete="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting || !correo.trim()}>
              {submitting ? 'Enviando…' : 'Enviar enlace'}
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
