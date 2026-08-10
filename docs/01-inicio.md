# 01 — Inicio del proyecto

## Objetivo

Dejar operativo el entorno local: carpeta, BD `DBSISINDICADORE` y API Django Ninja.

## Alcance

- Creación de BD y esquema accounts
- Arranque Backend en puerto **8001**
- Endpoint de salud `/api/health`

## Responsabilidades

| Pieza | Responsabilidad |
|-------|-----------------|
| `sql/` | DDL y seeds |
| `Backend/` | API Django Ninja |
| `DBSISINDICADORE` | Usuarios, perfiles, permisos |

## Dependencias

- SQL Server Express (`localhost\SQLEXPRESS`)
- Python 3.11+ (probado con 3.14)
- ODBC Driver 17 o 18

## Archivos relacionados

- `sql/00_create_database.sql`
- `sql/01_schema_accounts.sql`
- `sql/02_seed_permisos_perfiles.sql`
- `Backend/manage.py`
- `Backend/apps/accounts/`

## Riesgos

- ODBC 18 requiere `TrustServerCertificate=yes`
- Espacios en la ruta del proyecto: usar comillas en PowerShell

## Credenciales DEV

```powershell
.\venv\Scripts\python.exe manage.py seed_admin
```

Usuario: `admin` / `Admin123!` (cambiar en producción).

## Mejoras posibles

- Bootstrap Frontend shadcn (siguiente fase)
- Rate limiting en `/api/auth/login`
