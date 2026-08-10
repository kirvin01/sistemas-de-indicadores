# Documentación — Sistemas de Indicadores GERESA CUSCO

## Objetivo

Documentar el sistema nuevo (Django Ninja + React shadcn/ui + SQL Server).

## Índice

| Documento | Tema |
|-----------|------|
| [01-inicio.md](./01-inicio.md) | Arranque local y BD |
| [02-ui-ux.md](./02-ui-ux.md) | Directrices visuales |
| [03-pacientes.md](./03-pacientes.md) | Consulta de pacientes / atenciones HIS |
| [04-fed.md](./04-fed.md) | Indicadores FED (MC/SI estándar) |
| Plan de migración | Ver plan Cursor (legado `GERESA_Convenios`) |

## Responsabilidades

- Mantener esta carpeta alineada con el código en `Backend/` y `Frontend/`.

## Dependencias

- Base `DBSISINDICADORE`
- Scripts en `sql/`

## Archivos relacionados

- `../README.md`
- `../sql/`
- `../Backend/`

## Riesgos

- Confundir este monorepo con `D:\www\GERESA_Convenios`.

## Mejoras posibles

- Portar docs de arquitectura/módulos del legado adaptados a este stack.
