import { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  ChevronDown,
  CircleDot,
  LogOut,
  MoreVertical,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'
import geresaLogo from '@/assets/geresa-logo.png'
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
    <div className="flex w-full justify-center">
      <img
        src={geresaLogo}
        alt="GERESA Cusco"
        className={cn(
          'object-contain',
          collapsed ? 'h-8 w-8' : 'h-11 w-auto max-w-[9.5rem]',
        )}
      />
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

/** Separa "SI-01.01 Texto" → código + resto (si aplica). */
function splitLabel(label: string) {
  const m = label.match(/^([A-Z]{2}-\d{2}\.\d{2})\s+(.+)$/)
  if (!m) return { code: null as string | null, text: label }
  return { code: m[1], text: m[2] }
}

function ChildIcon({ icon: Icon }: { icon?: LucideIcon }) {
  const Glyph = Icon ?? CircleDot
  return <Glyph className="size-3.5 shrink-0 opacity-80" aria-hidden />
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
    <ul className={cn('space-y-0.5', depth === 0 ? 'mt-0' : 'mt-0.5')}>
      {nodes.map((node) => {
        const hasKids = Boolean(node.children?.length)
        const open = openIds.has(node.id)

        if (hasKids) {
          const isSection = depth === 0
          return (
            <li key={node.id} className="space-y-0.5">
              <button
                type="button"
                onClick={() => toggleOpen(node.id)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors',
                  isSection
                    ? 'text-[12px] font-medium text-slate-500 hover:bg-white/80 hover:text-slate-700'
                    : 'text-[12px] font-medium text-slate-500 hover:bg-white/80 hover:text-slate-700',
                  open && 'bg-white/80 text-slate-600',
                )}
              >
                <ChildIcon icon={node.icon} />
                <span className="min-w-0 flex-1 leading-snug">{node.label}</span>
                <ChevronDown
                  className={cn(
                    'size-3.5 shrink-0 text-slate-400 transition-transform duration-250',
                    open && 'rotate-180 text-primary',
                  )}
                />
              </button>
              <div
                className={cn(
                  'grid transition-[grid-template-rows,opacity] duration-300 ease-out',
                  open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                )}
              >
                <div className="overflow-hidden border-l border-slate-200/90 ml-3 pl-2">
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
        const { code, text } = splitLabel(node.label)

        return (
          <li key={node.id}>
            <NavLink
              to={node.to}
              end={node.end}
              className={({ isActive }) =>
                cn(
                  'group flex items-start gap-2 rounded-lg px-2 py-1.5 transition-colors duration-200',
                  isActive
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-slate-500 hover:bg-white/80 hover:text-slate-700',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <ChildIcon icon={node.icon} />
                  <span className="min-w-0 flex-1">
                    {code ? (
                      <>
                        <span
                          className={cn(
                            'block text-[10px] font-bold tracking-wide',
                            isActive ? 'text-primary/80' : 'text-slate-400',
                          )}
                        >
                          {code}
                        </span>
                        <span className="block text-[12px] leading-snug font-medium">{text}</span>
                      </>
                    ) : (
                      <span className="block text-[12px] leading-snug font-medium">{text}</span>
                    )}
                  </span>
                </>
              )}
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
        'rounded-2xl border border-border/80 bg-card',
        'shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-20px_rgba(15,23,42,0.18)]',
        'transition-[width] duration-300 ease-out',
        collapsed ? 'w-[4.75rem]' : 'w-[17.5rem]',
      )}
    >
      <div
        className={cn(
          'relative border-b border-border/70',
          collapsed ? 'flex flex-col items-center gap-1.5 px-2 py-2.5' : 'px-3 py-3.5',
        )}
      >
        <div className={cn(!collapsed && 'px-7')}>
          <BrandMark collapsed={collapsed} />
        </div>
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className={cn(
            'inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-slate-100 hover:text-slate-800',
            !collapsed && 'absolute right-2 top-1/2 -translate-y-1/2',
          )}
          aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          title={collapsed ? 'Expandir' : 'Colapsar'}
        >
          {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2.5 py-3">
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
                    'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200',
                    collapsed && 'justify-center px-0',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-slate-800 hover:bg-slate-100',
                  )
                }
              >
                <item.icon className="size-[1.1rem] shrink-0 opacity-90" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            )
          }

          return (
            <div key={item.id} className="space-y-0.5">
              <button
                type="button"
                onClick={() => onParentClick(item)}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200',
                  collapsed && 'justify-center px-0',
                  parentActive || open
                    ? 'bg-teal-50 text-primary'
                    : 'text-slate-800 hover:bg-slate-100',
                )}
              >
                <item.icon className="size-[1.1rem] shrink-0 opacity-90" />
                {!collapsed && (
                  <>
                    <span className="flex-1 truncate text-left">{item.label}</span>
                    <ChevronDown
                      className={cn(
                        'size-4 shrink-0 text-slate-400 transition-transform duration-300',
                        open && 'rotate-180 text-primary',
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
                <div className="overflow-hidden px-1 pb-1">
                  {item.children && (
                    <div className="rounded-xl border border-slate-200/80 bg-slate-50/90 px-1.5 py-1.5">
                      <NavTree
                        nodes={item.children}
                        depth={0}
                        openIds={openIds}
                        toggleOpen={toggleOpen}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </nav>

      <div className="space-y-0.5 border-t border-border/70 px-2.5 py-2.5">
        {footerItems.map((item) =>
          item.to ? (
            <NavLink
              key={item.id}
              to={item.to}
              end={item.end}
              title={collapsed ? item.label : undefined}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-100',
                collapsed && 'justify-center px-0',
              )}
            >
              <item.icon className="size-[1.1rem] shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ) : null,
        )}

        <button
          type="button"
          onClick={logout}
          title={collapsed ? 'Cerrar sesión' : undefined}
          className={cn(
            'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 transition-colors hover:bg-rose-50 hover:text-rose-700',
            collapsed && 'justify-center px-0',
          )}
        >
          <LogOut className="size-[1.1rem] shrink-0" />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </div>

      <div className="border-t border-border/70 p-2.5">
        <div
          className={cn(
            'flex items-center gap-3 rounded-xl border border-border/60 bg-slate-50/90 px-2.5 py-2',
            collapsed && 'justify-center border-0 bg-transparent px-0',
          )}
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/12 text-xs font-bold text-primary ring-2 ring-white">
            {initials}
          </div>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800">
                  {user?.username ?? 'Usuario'}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {user?.profile ?? '—'}
                </p>
              </div>
              <NavLink
                to="/perfil"
                className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-white hover:text-slate-800"
                aria-label="Mi perfil"
                title="Mi perfil"
              >
                <MoreVertical className="size-4" />
              </NavLink>
            </>
          )}
        </div>
      </div>
    </aside>
  )
}
