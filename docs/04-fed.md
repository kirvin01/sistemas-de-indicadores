# 04 — Indicadores FED

## Objetivo

Consultar indicadores FED (Formato Estadístico) desde `DBFED2026` con API Django Ninja y UI shadcn.

## Alcance

Patrón estándar por indicador (`denominador` / `numerador` / `avance_pct`):

- `GET /api/fed/indicadores`
- `GET /api/fed/{slug}/filtros`
- `GET /api/fed/{slug}/tabla-completa`
- `GET /api/fed/{slug}/tabla-redes`
- `GET /api/fed/{slug}/resumen`

### Compromisos de Gestión

| Slug | Código | Tabla | Meta % |
|------|--------|-------|--------|
| `si0101` | SI-01.01 | `IRVIN_FED_SI_01_01` | 80 |
| `si0102` | SI-01.02 | `IRVIN_FED_SI_01_02` | 80 |
| `si0103` | SI-01.03 | `IRVIN_FED_SI_01_03` | 80 |
| `si0201` | SI-02.01 | `IRVIN_FED_SI_02_01` | 80 |
| `si0202` | SI-02.02 | `IRVIN_FED_SI_02_02` | 80 |
| `si0203` | SI-02.03 | `IRVIN_FED_SI_02_03` | 80 |
| `si0204` | SI-02.04 | `IRVIN_FED_SI_02_04` | 80 |
| `si0301` | SI-03.01 | `IRVIN_FED_SI_03_01` | 80 |
| `si0302` | SI-03.02 | `IRVIN_FED_SI_03_02` | 80 |
| `vi0101` | VI-01.01 | `IRVIN_FED_VI_01_01` | 80 |
| `vi0102` | VI-01.02 | `IRVIN_FED_VI_01_02` | 80 |

### Metas de Cobertura

| Slug | Código | Tabla | Meta % |
|------|--------|-------|--------|
| `mc0101` | MC-01.01 | `IRVIN_FED_MC_01_01` | 40.7 |
| `mc0201` | MC-02.01 | `IRVIN_FED_MC_02_01` | 40.7 |
| `mc0301` | MC-03.01 | `IRVIN_FED_MC_03_01` | 40.7 |

## Responsabilidades

| Pieza | Rol |
|-------|-----|
| `apps/fed/catalog.py` | Catálogo (slug, tabla, meta, grupo, bloque) |
| `apps/fed/standard.py` | SQL genérico (solo lectura) |
| `apps/fed/api.py` | Endpoints + `fed:read` |
| `Frontend/.../fed/` | Hub + reporte estándar |
| `nav-config.ts` | Menú jerárquico Indicador FED |

## Dependencias

- Permiso `fed:read` (perfil `admin` con `*` o perfil `fed`)
- Alias Django `fed` → `DB_FED_NAME` (default `DBFED2026`)
- Tablas `IRVIN_FED_*` cargadas en SQL Server

## Archivos relacionados

- `Backend/apps/fed/`
- `Frontend/src/features/fed/`
- `Frontend/src/lib/fedApi.ts`
- `Frontend/src/components/layout/nav-config.ts`

## UI del reporte estándar

`FedStandardReportPage` (ruta `/fed/:slug`):

- Tabs: Organización Territorial (azul) / Redes Integradas de Salud (verde esmeralda, default)
- Filtros: Año, Mes + Provincia (territorial) o Red/Microred (redes) + búsqueda
- KPI Avance Global, gráficos Recharts y tablas jerárquica/plana

Menú lateral:

```
Indicador FED
├── Compromisos de Gestión
│   ├── Gestantes con suplementación… → SI-01.01…03
│   ├── Niñas y niños < 12 meses… → SI-02.01…04
│   ├── Adolescentes 12–17… → SI-03.01…02
│   └── VI-01… → VI-01.01…02
└── Metas de Cobertura → MC-01.01, MC-02.01, MC-03.01
```

## Riesgos

- Tablas FED fuera del control de versiones
- Algunos indicadores tienen columnas clínicas adicionales en legado (SI-01.02, SI-02.03/04, MC-02.01); el motor actual expone solo num/denom/avance
- Endpoints nominales / UE del legado (SI-03.01, VI-01.01/02) aún no portados

## Mejoras posibles

- Columnas clínicas extendidas y nominales
- HIS diario / Oportunidad
- `GET /config/fed/all` para fuentes del header
