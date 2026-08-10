# 03 — Consulta de Pacientes

## Objetivo

Buscar pacientes por documento y listar atenciones HIS por año/mes.

## Alcance

- API Django Ninja (`pacientes:read`)
- UI shadcn en `/pacientes`
- Lectura contra `DBGERESA` (no escribe)

## Endpoints

| Método | Ruta | Permiso | Parámetros |
|--------|------|---------|------------|
| `GET` | `/api/paciente` | `pacientes:read` | `ndoc` |
| `GET` | `/api/atenciones` | `pacientes:read` | `anio`, `ndoc`, `mes?`, `codigo?` (solo `Codigo_Item`; omitir/`Todo` = todos), `offset`, `per_page` |

Respuesta: `{ "result": [ ... ] }`.

## Responsabilidades

| Pieza | Responsabilidad |
|-------|-----------------|
| `apps/patients/services.py` | SQL solo lectura a `DBGERESA` |
| `apps/patients/api.py` | Endpoints Ninja + RBAC |
| `Frontend/.../PatientsPage.tsx` | Búsqueda, tabla y modal de atenciones |

## Dependencias

- Permiso `pacientes:read` (perfil admin con `*` lo incluye)
- Alias de BD Django `geresa` → `DB_GERESA_NAME` (default `DBGERESA`)
- Tablas: `MAESTRO_PACIENTE`, `HISMINSA`, `RENIPRESS`, maestros HIS

## Archivos relacionados

- `Backend/apps/patients/`
- `Backend/config/settings.py` (`DATABASES["geresa"]`)
- `Frontend/src/features/patients/PatientsPage.tsx`
- `Frontend/src/lib/api.ts` (`patientsApi`)

## Joins de atenciones (referencia HIS)

- `SISTEMA`: `MAESTRO_HIS_SISTEMA` por `Id_AplicacionOrigen`; si no hay fila → **`HISMINSA`**
- `REGISTRADOR`: nombre + apellidos desde `MAESTRO_PERSONAL` (`Id_Personal`)

## UX / rendimiento (historial)

- Año obligatorio; mes default **Todo**; código default **Todo**
- Filtro código en barra (servidor), sobre `h.Codigo_Item` (no el texto concatenado)
- Paginación con botón **Cargar más** (25 filas)
- `AbortController` cancela la petición anterior al cambiar filtros

## Riesgos

- Consultas a `HISMINSA` pueden ser lentas sin índices adecuados
- Si `MAESTRO_HIS_TIPO_DOC` está vacío, se usa fallback DNI/CE/PAS…
- Si `MAESTRO_PERSONAL` está vacía, registrador queda en blanco

## Mejoras posibles

- Paginación server-side en el modal
- Export CSV/Excel del historial
- Caché de búsquedas recientes
