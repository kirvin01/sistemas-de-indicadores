import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Eye, EyeOff, Lock, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/context/AuthContext'
import { ApiError } from '@/lib/api'
import geresaLogo from '@/assets/geresa-logo.png'

export function LoginPage() {
  const { user, loading, login, can } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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

  const canSubmit = username.trim().length > 0 && password.length > 0 && !submitting

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background p-4 md:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-8%,rgba(15,118,110,0.14),transparent)]" />
      <div className="pointer-events-none absolute -top-20 right-0 size-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 size-80 rounded-full bg-sky-400/10 blur-3xl" />

      <div className="relative w-full max-w-[400px] overflow-hidden rounded-[1.75rem] border border-border/70 bg-card shadow-[0_24px_60px_-28px_rgba(15,23,42,0.35)]">
        {/* Cabecera institucional */}
        <div className="relative bg-primary px-6 pt-8 pb-7 text-center text-primary-foreground">
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-b from-transparent to-black/10" />
          <div className="relative mx-auto mb-4 flex size-[5.5rem] items-center justify-center rounded-full bg-white p-1.5 shadow-lg ring-4 ring-white/25">
            <img
              src={geresaLogo}
              alt="Gerencia Regional de Salud Cusco"
              className="size-full rounded-full object-cover"
            />
          </div>
          <h1 className="text-[0.95rem] font-bold tracking-[0.04em] uppercase">
            Gerencia Regional de Salud
          </h1>
          <p className="mt-1.5 text-sm font-medium text-primary-foreground/90">
            Sistemas de Indicadores
          </p>
        </div>

        {/* Formulario */}
        <div className="px-6 pt-6 pb-7 md:px-8">
          <div className="mb-5 flex items-center justify-center gap-2 text-slate-700">
            <Lock className="size-4 text-muted-foreground" />
            <h2 className="text-base font-semibold tracking-tight">Iniciar sesión</h2>
          </div>

          <form className="space-y-5" onSubmit={onSubmit}>
            <div className="relative pt-2">
              <Label
                htmlFor="username"
                className="absolute top-0 left-3 z-10 bg-card px-1 text-xs font-medium text-muted-foreground"
              >
                Usuario
              </Label>
              <div className="relative">
                <User className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="username"
                  className="h-11 rounded-xl border-slate-200 bg-white pl-10"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="relative pt-2">
              <Label
                htmlFor="password"
                className="absolute top-0 left-3 z-10 bg-card px-1 text-xs font-medium text-muted-foreground"
              >
                Contraseña
              </Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="h-11 rounded-xl border-slate-200 bg-white pr-10 pl-10"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute top-1/2 right-2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="h-11 w-full rounded-xl text-sm font-semibold shadow-md shadow-teal-900/15 transition-all hover:shadow-lg disabled:bg-slate-300 disabled:text-white disabled:shadow-none"
              disabled={!canSubmit}
            >
              {submitting ? 'Ingresando…' : 'Ingresar'}
            </Button>
          </form>

          <p className="mt-6 text-center text-[11px] leading-relaxed text-muted-foreground">
            Dirección de Estadística, Informática y Telecomunicaciones
          </p>
        </div>
      </div>
    </div>
  )
}
