import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/context/AuthContext'
import { ApiError } from '@/lib/api'

export function LoginPage() {
  const { user, loading, login, can } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user) {
    if (can('admin:users')) return <Navigate to="/admin/usuarios" replace />
    return <Navigate to="/" replace />
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await login(username.trim(), password)
      toast.success('Sesión iniciada')
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'No se pudo iniciar sesión'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden p-4 md:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,oklch(0.88_0.06_195),transparent),linear-gradient(180deg,oklch(0.97_0.02_210),oklch(0.94_0.02_230))]" />
      <div className="pointer-events-none absolute -top-24 right-0 size-72 rounded-full bg-teal-300/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 size-80 rounded-full bg-emerald-200/25 blur-3xl" />

      <Card className="relative w-full max-w-md rounded-2xl border-border/70 bg-card/95 shadow-[0_20px_50px_-24px_rgba(15,118,110,0.35)] backdrop-blur">
        <CardHeader className="space-y-3 px-6 pt-8 text-center md:px-8">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-teal-900/15">
            <Activity className="size-6" />
          </div>
          <div className="space-y-1.5">
            <CardDescription className="text-[11px] font-semibold tracking-[0.22em] text-teal-800/70 uppercase">
              GERESA Cusco
            </CardDescription>
            <CardTitle className="text-2xl font-semibold tracking-tight md:text-[1.7rem]">
              Sistemas de Indicadores
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              Acceso seguro al panel de indicadores y administración
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-8 md:px-8">
          <form className="space-y-5" onSubmit={onSubmit}>
            <div className="space-y-2 text-left">
              <Label htmlFor="username" className="text-sm font-medium">
                Usuario
              </Label>
              <Input
                id="username"
                className="h-10 rounded-xl transition-shadow focus-visible:shadow-[0_0_0_3px_oklch(0.85_0.05_195)]"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2 text-left">
              <Label htmlFor="password" className="text-sm font-medium">
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                className="h-10 rounded-xl transition-shadow focus-visible:shadow-[0_0_0_3px_oklch(0.85_0.05_195)]"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              className="h-10 w-full rounded-xl shadow-md shadow-teal-900/10 transition-all hover:shadow-lg"
              disabled={submitting}
            >
              {submitting ? 'Ingresando…' : 'Ingresar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
