import {
  BarChart3,
  ClipboardList,
  FileBarChart2,
  Goal,
  History,
  Layers,
  LayoutDashboard,
  Settings2,
  Shield,
  Stethoscope,
  Target,
  UserCircle,
  Users,
  type LucideIcon,
} from 'lucide-react'

export type NavChild = {
  id: string
  label: string
  to?: string
  permission?: string | null
  end?: boolean
  icon?: LucideIcon
  /** Subgrupos anidados (p. ej. bloques FED) */
  children?: NavChild[]
}

export type NavItem = {
  id: string
  label: string
  icon: LucideIcon
  permission?: string | null
  /** Enlace directo (sin hijos) */
  to?: string
  end?: boolean
  children?: NavChild[]
}

function fedLeaf(
  id: string,
  codigo: string,
  nombre: string,
  slug: string,
): NavChild {
  return {
    id,
    label: `${codigo} ${nombre}`,
    to: `/fed/${slug}`,
    permission: 'fed:read',
    icon: FileBarChart2,
  }
}

function fedBlock(id: string, label: string, children: NavChild[]): NavChild {
  return {
    id,
    label,
    icon: Layers,
    children,
  }
}

/** Menú principal — datos dinámicos (acordeón + permisos). */
export const mainNav: NavItem[] = [
  {
    id: 'inicio',
    label: 'Inicio',
    icon: LayoutDashboard,
    to: '/',
    end: true,
    permission: null,
  },
  {
    id: 'consultas',
    label: 'Consultas',
    icon: ClipboardList,
    permission: 'pacientes:read',
    children: [
      {
        id: 'pacientes',
        label: 'Consulta Pacientes',
        to: '/pacientes',
        permission: 'pacientes:read',
        icon: Stethoscope,
      },
    ],
  },
  {
    id: 'indicador-fed',
    label: 'Indicador FED',
    icon: BarChart3,
    permission: 'fed:read',
    children: [
      {
        id: 'compromisos',
        label: 'Compromisos de Gestión',
        icon: Target,
        children: [
          fedBlock(
            'si01-bloque',
            'Gestantes con suplementación de hierro y dosaje de hemoglobina',
            [
              fedLeaf('si0101', 'SI-01.01', 'Gestantes con 1ra APN', 'si0101'),
              fedLeaf('si0102', 'SI-01.02', 'Gestantes con anemia', 'si0102'),
              fedLeaf(
                'si0103',
                'SI-01.03',
                'Mujeres con parto institucional sin anemia',
                'si0103',
              ),
            ],
          ),
          fedBlock(
            'si02-bloque',
            'Niñas y niños < 12 meses con hierro y dosaje de hemoglobina',
            [
              fedLeaf('si0201', 'SI-02.01', 'Niños de 6 meses', 'si0201'),
              fedLeaf(
                'si0202',
                'SI-02.02',
                'Niños de 6 meses prematuros / bajo peso',
                'si0202',
              ),
              fedLeaf('si0203', 'SI-02.03', 'Niños de 12 meses con anemia', 'si0203'),
              fedLeaf('si0204', 'SI-02.04', 'Niños de 12 meses sin anemia', 'si0204'),
            ],
          ),
          fedBlock(
            'si03-bloque',
            'Adolescentes mujeres de 12 a 17 años con dosaje de hemoglobina',
            [
              fedLeaf('si0301', 'SI-03.01', 'Adolescentes de 12 a 17 años', 'si0301'),
              fedLeaf(
                'si0302',
                'SI-03.02',
                'Adolescentes de 12 a 17 años sin anemia',
                'si0302',
              ),
            ],
          ),
          fedBlock(
            'vi01-bloque',
            'VI-01 Gestantes con tamizaje positivo de violencia y paquete terapéutico',
            [
              fedLeaf(
                'vi0101',
                'VI-01.01',
                'Gestantes con tamizaje de violencia',
                'vi0101',
              ),
              fedLeaf(
                'vi0102',
                'VI-01.02',
                'Gestantes con diagnóstico de violencia',
                'vi0102',
              ),
            ],
          ),
        ],
      },
      {
        id: 'metas-cobertura',
        label: 'Metas de Cobertura',
        icon: Goal,
        children: [
          fedLeaf(
            'mc0101',
            'MC-01.01',
            'Paquete integrado de servicios para gestantes',
            'mc0101',
          ),
          fedLeaf(
            'mc0201',
            'MC-02.01',
            'Paquete integrado de servicios para niñas y niños < 12 meses',
            'mc0201',
          ),
          fedLeaf(
            'mc0301',
            'MC-03.01',
            'Paquete básico de atención del recién nacido',
            'mc0301',
          ),
        ],
      },
    ],
  },
  {
    id: 'admin',
    label: 'Administración',
    icon: Settings2,
    permission: null,
    children: [
      {
        id: 'usuarios',
        label: 'Usuarios',
        to: '/admin/usuarios',
        permission: 'admin:users',
        icon: Users,
      },
      {
        id: 'perfiles',
        label: 'Perfiles',
        to: '/admin/perfiles',
        permission: 'admin:profiles',
        icon: Shield,
      },
      {
        id: 'sesiones',
        label: 'Seguimiento de ingresos',
        to: '/admin/sesiones',
        permission: 'admin:sesiones',
        icon: History,
      },
    ],
  },
]

export const footerNav: NavItem[] = [
  {
    id: 'perfil',
    label: 'Mi perfil',
    icon: UserCircle,
    to: '/perfil',
    end: true,
    permission: null,
  },
]

function filterChildren(
  children: NavChild[],
  can: (permission: string) => boolean,
): NavChild[] {
  return children
    .map((child) => {
      if (child.children?.length) {
        const nested = filterChildren(child.children, can)
        if (nested.length === 0) return null
        if (child.permission && !can(child.permission)) return null
        return { ...child, children: nested }
      }
      if (child.permission && !can(child.permission)) return null
      if (!child.to) return null
      return child
    })
    .filter(Boolean) as NavChild[]
}

export function filterNavByPermission(
  items: NavItem[],
  can: (permission: string) => boolean,
): NavItem[] {
  return items
    .map((item) => {
      if (item.children?.length) {
        const children = filterChildren(item.children, can)
        if (children.length === 0) return null
        if (item.permission && !can(item.permission)) return null
        return { ...item, children }
      }
      if (item.permission && !can(item.permission)) return null
      return item
    })
    .filter(Boolean) as NavItem[]
}

/** ¿Algún enlace hijo/nieto coincide con la ruta? */
export function navTreeHasActivePath(
  nodes: NavChild[] | undefined,
  pathname: string,
): boolean {
  if (!nodes?.length) return false
  return nodes.some((n) => {
    if (n.to) {
      if (n.end) return pathname === n.to
      return pathname === n.to || pathname.startsWith(`${n.to}/`)
    }
    return navTreeHasActivePath(n.children, pathname)
  })
}

/** IDs de nodos (grupos) que deben quedar abiertos para mostrar la ruta activa. */
export function collectOpenNavIds(
  nodes: NavChild[] | undefined,
  pathname: string,
  acc: Set<string> = new Set(),
): Set<string> {
  if (!nodes?.length) return acc
  for (const n of nodes) {
    if (n.to) {
      const active = n.end
        ? pathname === n.to
        : pathname === n.to || pathname.startsWith(`${n.to}/`)
      if (active) acc.add(n.id)
    }
    if (n.children?.length && navTreeHasActivePath(n.children, pathname)) {
      acc.add(n.id)
      collectOpenNavIds(n.children, pathname, acc)
    }
  }
  return acc
}
