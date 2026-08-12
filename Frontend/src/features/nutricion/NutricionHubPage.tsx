import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowRight, Apple, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ApiError } from '@/lib/api'
import { nutricionApi, type NutricionIndicator } from '@/lib/nutricionApi'
import { NutricionToolbar } from '@/features/nutricion/NutricionToolbar'
import { cn } from '@/lib/utils'

export function NutricionHubPage() {
  const [items, setItems] = useState<NutricionIndicator[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void nutricionApi
      .list()
      .then((data) => {
        if (!cancelled) setItems(data.result)
      })
      .catch((err: unknown) => {
        toast.error(err instanceof ApiError ? err.message : 'Error al cargar Nutrición')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="space-y-8">
      <NutricionToolbar />
      <header className="space-y-1">
        <p className="text-sm font-medium text-teal-800/70">Nutrición</p>
        <h2 className="text-3xl font-semibold tracking-tight">Indicadores de Nutrición</h2>
        <p className="max-w-2xl text-muted-foreground">
          Evaluación por Redes Integradas de Salud. Avance = suma de Avance_Meta / meta por
          establecimiento (máximo Meta por RENAES).
        </p>
      </header>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Cargando catálogo…
        </div>
      ) : items.length === 0 ? (
        <Card className="rounded-2xl border-dashed">
          <CardHeader>
            <CardTitle className="text-base">Sin indicadores</CardTitle>
            <CardDescription>No hay indicadores de Nutrición registrados.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <Link key={item.slug} to={`/nutricion/${item.slug}`} className="group">
              <Card
                className={cn(
                  'h-full rounded-2xl border-border/70 transition-all',
                  'hover:border-primary/40 hover:shadow-md',
                )}
              >
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Apple className="size-5" />
                    </div>
                    <Badge variant="secondary" className="font-mono text-[11px]">
                      {item.codigo}
                    </Badge>
                  </div>
                  <CardTitle className="text-base leading-snug">{item.nombre}</CardTitle>
                  <CardDescription>Ámbito: redes de salud</CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                    Abrir reporte
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
