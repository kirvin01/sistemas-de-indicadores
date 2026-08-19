import {
  Apple,
  BarChart3,
  ClipboardList,
  FileBarChart2,
  Goal,
  Handshake,
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
    id: 'nutricion',
    label: 'Nutrición',
    icon: Apple,
    permission: 'nutricion:read',
    children: [
      {
        id: 'n01',
        label: 'Suplementación de Hierro',
        to: '/nutricion/n01',
        permission: 'nutricion:read',
        icon: Apple,
      },
      {
        id: 'n02',
        label: 'Suplemento Vitamina A',
        to: '/nutricion/n02',
        permission: 'nutricion:read',
        icon: Apple,
      },
      {
        id: 'n03',
        label: 'Dosaje de Hemoglobina',
        to: '/nutricion/n03',
        permission: 'nutricion:read',
        icon: Apple,
      },
      {
        id: 'n04',
        label: 'Control de Suplementación',
        to: '/nutricion/n04',
        permission: 'nutricion:read',
        icon: Apple,
      },
      {
        id: 'n05',
        label: 'Tratamiento de Anemia',
        to: '/nutricion/n05',
        permission: 'nutricion:read',
        icon: Apple,
      },
    ],
  },
  {
    id: 'convenio-gestion',
    label: 'Convenio de Gestión',
    icon: Handshake,
    permission: 'cg:read',
    children: [
      {
        id: 'cg-ninez',
        label: 'Niñez y nutrición',
        icon: Layers,
        children: [
          { id: 'cg01', label: 'CG-01 Recuperación de anemia', to: '/cg/cg01', permission: 'cg:read', icon: Handshake },
          { id: 'cg02', label: 'CG-02 Suplementación hierro 6-11m', to: '/cg/cg02', permission: 'cg:read', icon: Handshake },
          { id: 'cg03', label: 'CG-03 Tamizaje neonatal', to: '/cg/cg03', permission: 'cg:read', icon: Handshake },
          { id: 'cg04', label: 'CG-04 Mejora nutricional <2a', to: '/cg/cg04', permission: 'cg:read', icon: Handshake },
        ],
      },
      {
        id: 'cg-inmuno',
        label: 'Inmunizaciones',
        icon: Layers,
        children: [
          { id: 'cg05', label: 'CG-05 Vacunación 24 meses', to: '/cg/cg05', permission: 'cg:read', icon: Handshake },
          { id: 'cg06', label: 'CG-06 BCG y Hepatitis B', to: '/cg/cg06', permission: 'cg:read', icon: Handshake },
        ],
      },
      {
        id: 'cg-tb',
        label: 'TB y VIH',
        icon: Layers,
        children: [
          { id: 'cg07', label: 'CG-07 Éxito TB sensible', to: '/cg/cg07', permission: 'cg:read', icon: Handshake },
          { id: 'cg08', label: 'CG-08 TPTB contactos', to: '/cg/cg08', permission: 'cg:read', icon: Handshake },
          { id: 'cg09', label: 'CG-09 TPTB en VIH', to: '/cg/cg09', permission: 'cg:read', icon: Handshake },
        ],
      },
      {
        id: 'cg-ssr',
        label: 'Salud bucal y SSR',
        icon: Layers,
        children: [
          { id: 'cg10', label: 'CG-10 Estomatología preventiva', to: '/cg/cg10', permission: 'cg:read', icon: Handshake },
          { id: 'cg11', label: 'CG-11 Anticonceptivos modernos', to: '/cg/cg11', permission: 'cg:read', icon: Handshake },
        ],
      },
      {
        id: 'cg-materno',
        label: 'Materno perinatal',
        icon: Layers,
        children: [
          { id: 'cg12', label: 'CG-12 APN referidas hospital', to: '/cg/cg12', permission: 'cg:read', icon: Handshake },
          { id: 'cg13', label: 'CG-13 Paquete preventivo gestantes', to: '/cg/cg13', permission: 'cg:read', icon: Handshake },
        ],
      },
      {
        id: 'cg-onco',
        label: 'Oncología y VPH',
        icon: Layers,
        children: [
          { id: 'cg14', label: 'CG-14 Tratamiento oncológico', to: '/cg/cg14', permission: 'cg:read', icon: Handshake },
          { id: 'cg15', label: 'CG-15 Mamografía tamizaje', to: '/cg/cg15', permission: 'cg:read', icon: Handshake },
          { id: 'cg16', label: 'CG-16 Vacuna VPH 9 años', to: '/cg/cg16', permission: 'cg:read', icon: Handshake },
        ],
      },
      {
        id: 'cg-rehab',
        label: 'Rehabilitación y SM',
        icon: Layers,
        children: [
          { id: 'cg17', label: 'CG-17 Rehabilitación <5 años', to: '/cg/cg17', permission: 'cg:read', icon: Handshake },
          { id: 'cg18', label: 'CG-18', to: '/cg/cg18', permission: 'cg:read', icon: Handshake },
          { id: 'cg19', label: 'CG-19 Paquete depresión', to: '/cg/cg19', permission: 'cg:read', icon: Handshake },
        ],
      },
      {
        id: 'cg-hosp',
        label: 'Hospitales y gestión',
        icon: Layers,
        children: [
          { id: 'cg20', label: 'CG-20 Resolutividad', to: '/cg/cg20', permission: 'cg:read', icon: Handshake },
          { id: 'cg21', label: 'CG-21 Rendimiento SOP', to: '/cg/cg21', permission: 'cg:read', icon: Handshake },
          { id: 'cg22', label: 'CG-22 Cirugías suspendidas', to: '/cg/cg22', permission: 'cg:read', icon: Handshake },
          { id: 'cg23', label: 'CG-23 Ocupación cama', to: '/cg/cg23', permission: 'cg:read', icon: Handshake },
          { id: 'cg24', label: 'CG-24 Intervalo sustitución', to: '/cg/cg24', permission: 'cg:read', icon: Handshake },
          { id: 'cg25', label: 'CG-25 Espera consulta externa', to: '/cg/cg25', permission: 'cg:read', icon: Handshake },
          { id: 'cg26', label: 'CG-26 Utilización consultorios', to: '/cg/cg26', permission: 'cg:read', icon: Handshake },
        ],
      },
      {
        id: 'cg32',
        label: 'CG-32 Telemedicina',
        to: '/cg/cg32',
        permission: 'cg:read',
        icon: Handshake,
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
