# Copias de base de datos

## Incluido

| Archivo | Descripción |
|---------|-------------|
| `DBSISINDICADORE.bak` | Backup nativo SQL Server de la base de **aplicación** (~5 MB) |
| `DBSISINDICADORE_data.sql` | Datos de negocio (permisos, perfiles, usuarios) en SQL portable |

## No incluido (a propósito)

- `DBFED2026` — indicadores FED (volumen alto, tablas externas)
- `DBGERESA` — HIS / pacientes (datos clínicos; solo lectura en la app)

Esas bases deben restaurarse o conectarse aparte en cada entorno.

## Restaurar `.bak` (SQL Server)

```powershell
sqlcmd -S "localhost\SQLEXPRESS" -E -C -Q @"
RESTORE DATABASE [DBSISINDICADORE]
FROM DISK = N'D:\ruta\al\repo\sql\backups\DBSISINDICADORE.bak'
WITH REPLACE,
MOVE 'DBSISINDICADORE' TO N'C:\ruta\data\DBSISINDICADORE.mdf',
MOVE 'DBSISINDICADORE_log' TO N'C:\ruta\data\DBSISINDICADORE_log.ldf';
"@
```

Ajusta las rutas `MOVE` a los directorios de datos de tu instancia.

## Restaurar solo datos (SQL portable)

```powershell
sqlcmd -S "localhost\SQLEXPRESS" -E -C -i "sql\00_create_database.sql"
sqlcmd -S "localhost\SQLEXPRESS" -E -C -i "sql\01_schema_accounts.sql"
sqlcmd -S "localhost\SQLEXPRESS" -E -C -d DBSISINDICADORE -i "sql\backups\DBSISINDICADORE_data.sql"
```

## Nota de seguridad

El dump incluye hashes de contraseña de usuarios locales de desarrollo. No uses esta copia en producción pública sin rotar credenciales.
