import { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  ChevronDown,
  LogOut,
  MoreVertical,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'
import {
  collectOpenNavIds,
  filterNavByPermission,
  footerNav,
  mainNav,
  navTreeHasActivePath,
  type NavChild,
  type NavItem,
} from '@/components/layout/nav-config'

const STORAGE_KEY = 'sisindicadores_sidebar_collapsed'

function BrandMark({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={cn('flex min-w-0 items-center gap-3', collapsed && 'justify-center')}>
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-md shadow-teal-900/15">
        SI
      </div>
      {!collapsed && (
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-semibold text-foreground">Indicadores</p>
          <p className="truncate text-[11px] text-muted-foreground">GERESA Cusco</p>
        </div>
      )}
    </div>
  )
}

function findExpandedId(pathname: string, items: NavItem[]): string | null {
  for (const item of items) {
    if (item.children && navTreeHasActivePath(item.children, pathname)) {
      return item.id
    }
  }
  return null
}

function NavTree({
  nodes,
  depth,
  openIds,
  toggleOpen,
}: {
  nodes: NavChild[]
  depth: number
  openIds: Set<string>
  toggleOpen: (id: string) => void
}) {
  return (
    <ul
      className={cn(
        'space-y-0.5',
        depth === 0 && 'ml-4 border-l border-sidebar-border/80 py-1 pl-3',
        depth > 0 && 'ml-2 border-l border-sidebar-border/50 py-0.5 pl-2',
      )}
    >
      {nodes.map((node) => {
        const hasKids = Boolean(node.children?.length)
        const open = openIds.has(node.id)

        if (hasKids) {
          return (
            <li key={node.id} className="space-y-0.5">
              <button
                type="button"
                onClick={() => toggleOpen(node.id)}
                className={cn(
                  'flex w-full items-start gap-1.5 rounded-xl px-2 py-1.5 text-left text-[12px] font-semibold transition-colors',
                  open
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-primary/10 hover:text-primary',
                )}
              >
                <ChevronDown
                  className={cn(
                    'mt-0.5 size-3.5 shrink-0 opacity-70 transition-transform duration-300',
                    open && 'rotate-180',
                  )}
                />
                <span className="leading-snug">{node.label}</span>
              </button>
              <div
                className={cn(
                  'grid transition-[grid-template-rows,opacity] duration-300 ease-out',
                  open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                )}
              >
                <div className="overflow-hidden">
                  <NavTree
                    nodes={node.children!}
                    depth={depth + 1}
                    openIds={openIds}
                    toggleOpen={toggleOpen}
                  />
                </div>
              </div>
            </li>
          )
        }

        if (!node.to) return null

        return (
          <li key={node.id}>
            <NavLink
              to={node.to}
              end={node.end}
              className={({ isActive }) =>
                cn(
                  'block rounded-xl px-2.5 py-1.5 text-[12px] leading-snug transition-colors duration-200',
                  isActive
                    ? 'bg-primary/15 font-medium text-primary'
                    : 'text-muted-foreground hover:bg-primary/10 hover:text-primary',
                )
              }
            >
              {node.label}
            </NavLink>
          </li>
        )
      })}
    </ul>
  )
}

export function AppSidebar() {
  const { user, logout, can } = useAuth()
  const location = useLocation()

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1'
    } catch {
      return false
    }
  })

  const items = useMemo(() => filterNavByPermission(mainNav, can), [can])
  const footerItems = useMemo(() => filterNavByPermission(footerNav, can), [can])

  const [expandedId, setExpandedId] = useState<string | null>(() =>
    findExpandedId(location.pathname, mainNav),
  )
  const [openIds, setOpenIds] = useState<Set<string>>(() => {
    const root = findExpandedId(location.pathname, mainNav)
    const item = mainNav.find((i) => i.id === root)
    return collectOpenNavIds(item?.children, location.pathname)
  })

  useEffect(() => {
    const id = findExpandedId(location.pathname, items)
    if (id) {
      setExpandedId(id)
      const item = items.find((i) => i.id === id)
      setOpenIds((prev) => {
        const next = collectOpenNavIds(item?.children, location.pathname)
        prev.forEach((x) => next.add(x))
        return new Set(next)
      })
    }
  }, [location.pathname, items])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0')
    } catch {
      /* ignore */
    }
  }, [collapsed])

  function toggleAccordion(id: string) {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  function toggleOpen(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function onParentClick(item: NavItem) {
    if (collapsed) {
      setCollapsed(false)
      if (item.children?.length) setExpandedId(item.id)
      return
    }
    if (item.children?.length) toggleAccordion(item.id)
  }

  const initials = (user?.username ?? 'U').slice(0, 2).toUpperCase()

  return (
    <aside
      className={cn(
        'sticky top-3 z-20 m-3 flex h-[calc(100svh-1.5rem)] shrink-0 flex-col',
        'rounded-[1.75rem] border border-sidebar-border/80 bg-sidebar/95 shadow-[0_12px_40px_-20px_rgba(15,23,42,0.35)] backdrop-blur-md',
        'transition-[width] duration-300 ease-out',
        collapsed ? 'w-[4.5rem]' : 'w-72',
      )}
    >
      <div
        className={cn(
          'flex border-b border-sidebar-border/70 px-3 py-4',
          collapsed ? 'flex-col items-center gap-2' : 'items-center justify-between gap-2',
        )}
      >
        <BrandMark collapsed={collapsed} />
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="inline-flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
          aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          title={collapsed ? 'Expandir' : 'Colapsar'}
        >
          {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2.5 py-3">
        {items.map((item) => {
          const hasChildren = Boolean(item.children?.length)
          const open = expandedId === item.id
          const parentActive =
            hasChildren && navTreeHasActivePath(item.children, location.pathname)

          if (!hasChildren && item.to) {
            return (
              <NavLink
                key={item.id}
                to={item.to}
                end={item.end}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    collapsed && 'justify-center px-0',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md shadow-teal-900/10'
                      : 'text-sidebar-foreground hover:bg-primary/10 hover:text-primary',
                  )
                }
              >
                <item.icon className="size-[1.15rem] shrink-0 opacity-90" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            )
          }

          return (
            <div key={item.id} className="space-y-1">
              <button
                type="button"
                onClick={() => onParentClick(item)}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  collapsed && 'justify-center px-0',
                  parentActive || open
                    ? 'bg-primary/10 text-primary'
                    : 'text-sidebar-foreground hover:bg-primary/10 hover:text-primary',
                )}
              >
                <item.icon className="size-[1.15rem] shrink-0 opacity-90" />
                {!collapsed && (
                  <>
                    <span className="flex-1 truncate text-left">{item.label}</span>
                    <ChevronDown
                      className={cn(
                        'size-4 shrink-0 opacity-70 transition-transform duration-300',
                        open && 'rotate-180',
                      )}
                    />
                  </>
                )}
              </button>

              <div
                className={cn(
                  'grid transition-[grid-template-rows,opacity] duration-300 ease-out',
                  !collapsed && open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                )}
              >
                <div className="overflow-hidden">
                  {item.children && (
                    <NavTree
                      nodes={item.children}
                      depth={0}
                      openIds={openIds}
                      toggleOpen={toggleOpen}
                    />
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </nav>

      <div className="space-y-1 border-t border-sidebar-border/70 px-2.5 py-3">
        {footerItems.map((item) =>
          item.to ? (
            <NavLink
              key={item.id}
              to={item.to}
              end={item.end}
              title={collapsed ? item.label : undefined}
              onClick={(e) => {
                if (item.id === 'settings') {
                  e.preventDefault()
                  toast.message('Configuración', {
                    description: 'Esta sección estará disponible pronto.',
                  })
                }
              }}
              className={cn(
                'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-primary/10 hover:text-primary',
                collapsed && 'justify-center px-0',
              )}
            >
              <item.icon className="size-[1.15rem] shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ) : null,
        )}

        <button
          type="button"
          onClick={logout}
          title={collapsed ? 'Cerrar sesión' : undefined}
          className={cn(
            'flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-rose-500/10 hover:text-rose-700',
            collapsed && 'justify-center px-0',
          )}
        >
          <LogOut className="size-[1.15rem] shrink-0" />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </div>

      <div className="border-t border-sidebar-border/70 p-2.5">
        <div
          className={cn(
            'flex items-center gap-3 rounded-2xl bg-muted/50 px-2.5 py-2.5',
            collapsed && 'justify-center px-0',
          )}
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
            {initials}
          </div>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{user?.username ?? 'Usuario'}</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  Perfil · {user?.profile ?? '—'}
                </p>
              </div>
              <button
                type="button"
                className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-background hover:text-foreground"
                aria-label="Más opciones"
                onClick={() =>
                  toast.message('Cuenta', { description: user?.username ?? 'Sesión activa' })
                }
              >
                <MoreVertical className="size-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  )
}
