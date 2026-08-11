import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowRight, BarChart3, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ApiError } from '@/lib/api'
import { fedApi, type FedIndicator } from '@/lib/fedApi'
import { cn } from '@/lib/utils'
import { FedToolbar } from '@/features/fed/FedToolbar'

type HubTree = Record<string, Record<string, FedIndicator[]>>

export function FedHubPage() {
  const [items, setItems] = useState<FedIndicator[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void fedApi
      .list()
      .then((data) => {
        if (!cancelled) setItems(data.result)
      })
      .catch((err: unknown) => {
        toast.error(err instanceof ApiError ? err.message : 'Error al cargar indicadores FED')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const tree = useMemo(() => {
    const acc: HubTree = {}
    for (const item of items) {
      const grupo = item.grupo || 'Otros'
      const bloque = item.bloque || item.grupo || 'General'
      acc[grupo] ??= {}
      acc[grupo][bloque] ??= []
      acc[grupo][bloque].push(item)
    }
    return acc
  }, [items])

  return (
    <div className="space-y-8">
      <FedToolbar />
      <header className="space-y-1">
        <p className="text-sm font-medium text-teal-800/70">Indicador FED</p>
        <h2 className="text-3xl font-semibold tracking-tight">Catálogo de reportes</h2>
        <p className="max-w-2xl text-muted-foreground">
          Compromisos de Gestión y Metas de Cobertura. Seleccione un indicador para consultar
          avances territoriales y por redes.
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
            <CardDescription>No hay indicadores FED registrados en la API.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        Object.entries(tree).map(([grupo, bloques]) => (
          <section key={grupo} className="space-y-5">
            <h3 className="text-sm font-semibold tracking-wide text-emerald-900 uppercase">
              {grupo}
            </h3>
            {Object.entries(bloques).map(([bloque, list]) => (
              <div key={bloque} className="space-y-3">
                {bloque !== grupo && (
                  <h4 className="text-sm font-medium text-muted-foreground">{bloque}</h4>
                )}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {list.map((ind) => (
                    <Link key={ind.slug} to={`/fed/${ind.slug}`} className="group">
                      <Card
                        className={cn(
                          'h-full overflow-hidden rounded-2xl border-border/70 shadow-sm transition-all duration-300',
                          'hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-24px_rgba(15,118,110,0.45)]',
                        )}
                      >
                        <div className="h-1.5 bg-gradient-to-r from-teal-500/30 to-emerald-500/10" />
                        <CardHeader className="gap-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                              <BarChart3 className="size-5" />
                            </div>
                            <Badge variant="outline" className="rounded-full">
                              {ind.codigo}
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            <CardTitle className="flex items-center justify-between gap-2 text-base">
                              <span className="leading-snug">{ind.nombre}</span>
                              <ArrowRight className="size-4 shrink-0 opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100" />
                            </CardTitle>
                            <CardDescription>
                              Meta de avance: {ind.meta_pct.toFixed(1)}%
                            </CardDescription>
                          </div>
                        </CardHeader>
                        <CardContent className="text-xs text-muted-foreground">
                          Abrir reporte
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </section>
        ))
      )}
    </div>
  )
}
