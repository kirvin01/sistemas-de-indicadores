import { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  ChevronDown,
  CircleDot,
  LogOut,
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
    <div className="flex w-full flex-col items-center gap-2.5">
      <div
        className={cn(
          'rounded-2xl bg-white shadow-[0_8px_24px_-12px_rgba(0,0,0,0.35)] ring-1 ring-white/60',
          collapsed ? 'p-1.5' : 'px-3 py-2',
        )}
      >
        <img
          src={geresaLogo}
          alt="GERESA Cusco"
          className={cn(
            'object-contain',
            collapsed ? 'h-8 w-8' : 'h-12 w-auto max-w-[10rem]',
          )}
        />
      </div>
      {!collapsed && (
        <div className="text-center">
          <p className="text-[13px] font-bold leading-tight tracking-tight text-white drop-shadow-sm">
            Sistemas de Indicadores
          </p>
          <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-teal-100/90">
            GERESA Cusco
          </p>
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

function splitLabel(label: string) {
  const m = label.match(/^([A-Z]{2}-\d{2}\.\d{2})\s+(.+)$/)
  if (!m) return { code: null as string | null, text: label }
  return { code: m[1], text: m[2] }
}

function ChildIcon({
  icon: Icon,
  active,
}: {
  icon?: LucideIcon
  active?: boolean
}) {
  const Glyph = Icon ?? CircleDot
  return (
    <Glyph
      className={cn(
        'mt-0.5 size-3.5 shrink-0',
        active ? 'text-white' : 'text-teal-700',
      )}
      aria-hidden
    />
  )
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
          return (
            <li key={node.id} className="space-y-0.5">
              <button
                type="button"
                onClick={() => toggleOpen(node.id)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[12px] font-semibold leading-snug transition-colors',
                  open
                    ? 'bg-teal-100/80 text-teal-950'
                    : 'text-slate-700 hover:bg-teal-50 hover:text-teal-950',
                )}
              >
                <ChildIcon icon={node.icon} />
                <span className="min-w-0 flex-1">{node.label}</span>
                <ChevronDown
                  className={cn(
                    'size-3.5 shrink-0 text-slate-400 transition-transform duration-250',
                    open && 'rotate-180 text-teal-700',
                  )}
                />
              </button>
              <div
                className={cn(
                  'grid transition-[grid-template-rows,opacity] duration-300 ease-out',
                  open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                )}
              >
                <div className="ml-2 overflow-hidden border-l-2 border-teal-200 pl-2">
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
                  'group flex items-start gap-2 rounded-lg px-2 py-2 transition-colors duration-200',
                  isActive
                    ? 'bg-[#0f766e] text-white shadow-sm'
                    : 'text-slate-700 hover:bg-teal-50 hover:text-teal-950',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <ChildIcon icon={node.icon} active={isActive} />
                  <span className="min-w-0 flex-1">
                    {code ? (
                      <>
                        <span
                          className={cn(
                            'block text-[10px] font-bold tracking-wide',
                            isActive ? 'text-teal-100' : 'text-teal-700',
                          )}
                        >
                          {code}
                        </span>
                        <span className="block text-[12px] font-semibold leading-snug">
                          {text}
                        </span>
                      </>
                    ) : (
                      <span className="block text-[12px] font-semibold leading-snug">
                        {text}
                      </span>
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

function ParentIcon({
  icon: Icon,
  emphasize,
}: {
  icon: LucideIcon
  emphasize?: boolean
}) {
  return (
    <span
      className={cn(
        'inline-flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors',
        emphasize
          ? 'bg-[#0f766e]/12 text-[#0f766e]'
          : 'bg-white/15 text-white',
      )}
    >
      <Icon className="size-4" />
    </span>
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
        'sticky top-3 z-20 m-3 flex h-[calc(100svh-1.5rem)] shrink-0 flex-col overflow-hidden',
        'rounded-[1.35rem] border border-teal-900/25',
        'bg-gradient-to-b from-[#0b5f58] via-[#0f766e] to-[#0d6b64]',
        'shadow-[0_12px_40px_-18px_rgba(15,118,110,0.55)]',
        'transition-[width] duration-300 ease-out',
        collapsed ? 'w-[4.75rem]' : 'w-[18rem]',
      )}
    >
      {/* Cabecera marca */}
      <div
        className={cn(
          'relative border-b border-white/10 bg-black/10',
          collapsed ? 'flex flex-col items-center gap-2 px-2 py-3' : 'px-3 pb-4 pt-3.5',
        )}
      >
        <div className={cn(!collapsed && 'pr-8')}>
          <BrandMark collapsed={collapsed} />
        </div>
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className={cn(
            'inline-flex size-8 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/15',
            !collapsed && 'absolute right-2.5 top-3',
          )}
          aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          title={collapsed ? 'Expandir' : 'Colapsar'}
        >
          {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
        </button>
      </div>

      {/* Navegación */}
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
                    'group flex items-center gap-2.5 rounded-xl px-2 py-2 text-sm font-semibold tracking-tight transition-all duration-200',
                    collapsed && 'justify-center px-0',
                    isActive
                      ? 'bg-white text-[#0f766e] shadow-md shadow-teal-950/20'
                      : 'text-white hover:bg-white/12',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <ParentIcon icon={item.icon} emphasize={isActive} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </>
                )}
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
                  'flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-sm font-semibold tracking-tight transition-all duration-200',
                  collapsed && 'justify-center px-0',
                  parentActive || open
                    ? 'bg-white/18 text-white ring-1 ring-white/25'
                    : 'text-white hover:bg-white/12',
                )}
              >
                <ParentIcon icon={item.icon} />
                {!collapsed && (
                  <>
                    <span className="flex-1 truncate text-left">{item.label}</span>
                    <ChevronDown
                      className={cn(
                        'size-4 shrink-0 text-teal-100/80 transition-transform duration-300',
                        open && 'rotate-180 text-white',
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
                <div className="overflow-hidden px-0.5 pb-1">
                  {item.children && (
                    <div className="rounded-xl border border-teal-100/80 bg-[#f0fdfa] p-1.5 shadow-inner">
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

      {/* Acciones inferiores */}
      <div className="space-y-1 border-t border-white/10 px-2.5 py-2.5">
        {footerItems.map((item) =>
          item.to ? (
            <NavLink
              key={item.id}
              to={item.to}
              end={item.end}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-xl px-2 py-2 text-sm font-semibold transition-colors',
                  collapsed && 'justify-center px-0',
                  isActive
                    ? 'bg-white text-[#0f766e]'
                    : 'text-white hover:bg-white/12',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <ParentIcon icon={item.icon} emphasize={isActive} />
                  {!collapsed && <span>{item.label}</span>}
                </>
              )}
            </NavLink>
          ) : null,
        )}

        <button
          type="button"
          onClick={logout}
          title={collapsed ? 'Cerrar sesión' : undefined}
          className={cn(
            'flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-500/25',
            collapsed && 'justify-center px-0',
          )}
        >
          <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
            <LogOut className="size-4" />
          </span>
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </div>

      {/* Usuario */}
      <div className="border-t border-white/10 bg-black/15 p-2.5">
        <div
          className={cn(
            'flex items-center gap-3 rounded-xl bg-white/12 px-2.5 py-2 ring-1 ring-white/15 backdrop-blur-sm',
            collapsed && 'justify-center bg-transparent px-0 ring-0',
          )}
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-[#0f766e] shadow-sm">
            {initials}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-white">
                {user?.username ?? 'Usuario'}
              </p>
              <p className="truncate text-[11px] font-medium text-teal-100">
                {user?.profile ?? '—'}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
