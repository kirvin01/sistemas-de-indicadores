# Sistemas de Indicadores GERESA CUSCO

Sistema de indicadores, consulta de pacientes y administración de usuarios/perfiles.

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | React + Vite + **shadcn/ui** + ECharts (en construcción) |
| Backend | **Django Ninja** |
| Base app | SQL Server **`DBSISINDICADORE`** |
| Datos analíticos | `DBFED2026`, `DBGERESA`, etc. (lectura) |

## Estructura

```text
sistemas de indicadores/
  Backend/     Django Ninja
  Frontend/    React + shadcn/ui
  deploy/      Docker / nginx
  docs/        Documentación
  sql/         DDL y seeds SQL Server
```

## Base de datos

Scripts en `sql/`:

1. `00_create_database.sql` — crea `DBSISINDICADORE`
2. `01_schema_accounts.sql` — usuarios, perfiles, permisos
3. `02_seed_permisos_perfiles.sql` — seed RBAC

Copia de la base de aplicación (backup + datos): `sql/backups/` — ver `sql/backups/README.md`.  
No se versionan `DBFED2026` ni `DBGERESA` (externas / sensibles).

```powershell
sqlcmd -S "localhost\SQLEXPRESS" -E -C -i "sql\00_create_database.sql"
sqlcmd -S "localhost\SQLEXPRESS" -E -C -i "sql\01_schema_accounts.sql"
sqlcmd -S "localhost\SQLEXPRESS" -E -C -i "sql\02_seed_permisos_perfiles.sql"
```

## Arranque completo (DEV)

### 1) Backend

```powershell
cd "D:\www\sistemas de indicadores\Backend"
.\venv\Scripts\activate
.\venv\Scripts\python.exe manage.py seed_admin
.\venv\Scripts\python.exe manage.py runserver 127.0.0.1:8001
```

### 2) Frontend

```powershell
cd "D:\www\sistemas de indicadores\Frontend"
npm install
npm run dev
```

Abrir **http://127.0.0.1:5173** — login `admin` / `Admin123!`

### API

```powershell
cd Backend
py -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
.\venv\Scripts\python.exe manage.py migrate
.\venv\Scripts\python.exe manage.py runserver 0.0.0.0:8001
```


- Health: http://127.0.0.1:8001/api/health  
- Docs Ninja: http://127.0.0.1:8001/api/docs  

### Auth / usuarios / perfiles

```powershell
.\venv\Scripts\python.exe manage.py seed_admin
# admin / Admin123!
```

| Método | Ruta | Permiso |
|--------|------|---------|
| POST | `/api/auth/login` | público |
| GET | `/api/auth/me` | Bearer |
| GET/POST | `/api/usuarios` | `admin:users` |
| PUT/DELETE | `/api/usuarios/{id}` | `admin:users` |
| GET/POST | `/api/perfiles` | `admin:profiles` (GET también con `admin:users`) |
| PUT | `/api/perfiles/{id}` | `admin:profiles` |
| GET | `/api/perfiles/permisos` | `admin:profiles` |
| GET | `/api/paciente?ndoc=` | `pacientes:read` |
| GET | `/api/atenciones?anio&ndoc&mes&codigo` | `pacientes:read` |
| GET | `/api/fed/indicadores` | `fed:read` |
| GET | `/api/fed/{slug}/filtros` | `fed:read` |
| GET | `/api/fed/{slug}/tabla-completa` | `fed:read` |
| GET | `/api/fed/{slug}/tabla-redes` | `fed:read` |
| GET | `/api/fed/{slug}/resumen` | `fed:read` |

UI pacientes: **http://127.0.0.1:5173/pacientes**  
UI FED: **http://127.0.0.1:5173/fed** (MC-01.01, SI-01.01)

## Legado

Código de referencia (no modificar desde este repo): `D:\www\GERESA_Convenios`
