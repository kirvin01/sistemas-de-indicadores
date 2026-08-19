import { useEffect, useState } from 'react'
import { CalendarRange, Loader2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ApiError } from '@/lib/api'
import { cgApi, type CgConfigRow } from '@/lib/cgApi'
import { cn } from '@/lib/utils'
import cloudFedIcon from '@/assets/cloud-fed.png'

const CLOUD_URL = (import.meta.env.VITE_CG_CLOUD_URL as string | undefined)?.trim()

export function CgToolbar() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<CgConfigRow[]>([])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    setError(null)
    void cgApi
      .config()
      .then((data) => {
        if (!cancelled) setRows(data.result ?? [])
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setRows([])
          setError(err instanceof ApiError ? err.message : 'No se pudo cargar el corte')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open])

  return (
    <div className="flex flex-wrap items-center gap-2">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger
          className={cn(
            'inline-flex h-8 items-center gap-1.5 rounded-full border border-[#0f766e]/30',
            'bg-[#0f766e] px-3 text-xs font-semibold tracking-wide text-white',
            'shadow-sm transition-colors hover:bg-[#0d6b64]',
            'outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e]/40',
          )}
        >
          <CalendarRange className="size-3.5 opacity-90" />
          Corte
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          sideOffset={8}
          className="w-72 rounded-xl border border-slate-700 bg-slate-950 p-0 text-white shadow-xl"
        >
          <div className="border-b border-white/10 px-3.5 py-2.5">
            <p className="text-sm font-bold tracking-tight text-white">
              Fuentes de Datos Activas
            </p>
          </div>
          <div className="space-y-3 px-3.5 py-3">
            {loading && (
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Loader2 className="size-3.5 animate-spin" />
                Cargando…
              </div>
            )}
            {error && !loading && <p className="text-xs text-rose-300">{error}</p>}
            {!loading && !error && rows.length === 0 && (
              <p className="text-xs text-slate-400">Sin fuentes registradas.</p>
            )}
            {!loading &&
              !error &&
              rows.map((row) => (
                <div key={row.id} className="space-y-0.5">
                  <p className="text-sm font-bold text-sky-300">{row.fuente}</p>
                  <p className="text-xs text-slate-300">
                    Última actualización: {row.fecha_fmt ?? '—'}
                  </p>
                </div>
              ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {CLOUD_URL ? (
        <a
          href={CLOUD_URL}
          target="_blank"
          rel="noopener noreferrer"
          title="Cloud Convenio de Gestión"
          className={cn(
            'inline-flex h-8 items-center gap-1.5 rounded-full border border-sky-600/40',
            'bg-sky-600 px-2.5 text-xs font-semibold text-white shadow-sm',
            'transition-colors hover:bg-sky-500',
          )}
        >
          <img
            src={cloudFedIcon}
            alt=""
            className="size-5 rounded-full object-cover"
            aria-hidden
          />
          Cloud CG
        </a>
      ) : null}
    </div>
  )
}
