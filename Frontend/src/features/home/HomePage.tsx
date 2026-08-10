import { Link } from 'react-router-dom'
import { ArrowRight, BarChart3, ClipboardList, Shield, Users } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

export function HomePage() {
  const { user, can } = useAuth()

  const cards = [
    can('pacientes:read') && {
      to: '/pacientes',
      title: 'Consulta de Pacientes',
      desc: 'Buscar por documento y ver historial de atenciones HIS',
      icon: ClipboardList,
      accent: 'from-emerald-500/20 to-teal-500/5',
    },
    can('fed:read') && {
      to: '/fed',
      title: 'Indicador FED',
      desc: 'Compromisos de Gestión y Metas de Cobertura',
      icon: BarChart3,
      accent: 'from-teal-500/20 to-cyan-500/5',
    },
    can('admin:users') && {
      to: '/admin/usuarios',
      title: 'Usuarios',
      desc: 'Crear cuentas y asignar perfiles de acceso',
      icon: Users,
      accent: 'from-teal-500/15 to-emerald-500/5',
    },
    can('admin:profiles') && {
      to: '/admin/perfiles',
      title: 'Perfiles',
      desc: 'Definir permisos y políticas de acceso',
      icon: Shield,
      accent: 'from-cyan-500/15 to-teal-500/5',
    },
  ].filter(Boolean) as Array<{
    to: string
    title: string
    desc: string
    icon: typeof Users
    accent: string
  }>

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-medium text-teal-800/70">Panel principal</p>
        <h2 className="text-3xl font-semibold tracking-tight">Hola, {user?.username}</h2>
        <p className="max-w-2xl text-muted-foreground">
          Consulte pacientes, indicadores FED y administración de usuarios/perfiles.
        </p>
      </header>

      {cards.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {cards.map((card) => (
            <Link key={card.to} to={card.to} className="group">
              <Card
                className={cn(
                  'h-full overflow-hidden rounded-2xl border-border/70 shadow-sm transition-all duration-300',
                  'hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-24px_rgba(15,118,110,0.45)]',
                )}
              >
                <div className={cn('h-1.5 bg-gradient-to-r', card.accent)} />
                <CardHeader className="gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <card.icon className="size-5" />
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="flex items-center justify-between text-lg">
                      {card.title}
                      <ArrowRight className="size-4 opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100" />
                    </CardTitle>
                    <CardDescription className="text-sm leading-relaxed">{card.desc}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">Abrir módulo</CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="rounded-2xl border-dashed shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Sin módulos administrativos</CardTitle>
            <CardDescription>
              Su perfil ({user?.profile}) no tiene pantallas de administración en este frontend.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  )
}
