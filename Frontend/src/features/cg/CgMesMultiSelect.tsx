import { ChevronsUpDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

type Props = {
  mesesDisponibles: string[]
  value: string[]
  onChange: (meses: string[]) => void
  className?: string
}

export function CgMesMultiSelect({ mesesDisponibles, value, onChange, className }: Props) {
  const label =
    value.length === 0
      ? 'Mes'
      : value.length === 1
        ? value[0]
        : `${value.length} meses`

  function toggle(mes: string, checked: boolean) {
    let next: string[]
    if (!checked) {
      if (value.length <= 1) return
      next = value.filter((m) => m !== mes)
    } else {
      next = [...value, mes]
      next.sort((a, b) => mesesDisponibles.indexOf(a) - mesesDisponibles.indexOf(b))
    }
    onChange(next)
  }

  return (
    <div className={cn('min-w-[168px] space-y-1.5', className)}>
      <Label>Mes</Label>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            'inline-flex h-9 w-full items-center justify-between gap-2 rounded-xl border border-border',
            'bg-background px-3 text-sm font-normal text-foreground shadow-xs',
            'outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring/40',
          )}
        >
          <span className="truncate text-left">{label}</span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="max-h-72 w-[220px] overflow-auto">
          {mesesDisponibles.map((m) => (
            <DropdownMenuCheckboxItem
              key={m}
              checked={value.includes(m)}
              closeOnClick={false}
              onCheckedChange={(c) => toggle(m, Boolean(c))}
            >
              {m}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
