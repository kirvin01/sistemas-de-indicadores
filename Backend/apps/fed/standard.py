"""Motor de consultas para indicadores FED con patrón estándar (MC/SI básico)."""

from __future__ import annotations

from typing import Any

from django.db import connections
from ninja.errors import HttpError

from apps.fed.catalog import IndicatorMeta

MES_ORDER = """
    CASE MES
        WHEN 'ENERO' THEN 1 WHEN 'FEBRERO' THEN 2
        WHEN 'MARZO' THEN 3 WHEN 'ABRIL' THEN 4
        WHEN 'MAYO' THEN 5 WHEN 'JUNIO' THEN 6
        WHEN 'JULIO' THEN 7 WHEN 'AGOSTO' THEN 8
        WHEN 'SEPTIEMBRE' THEN 9 WHEN 'OCTUBRE' THEN 10
        WHEN 'NOVIEMBRE' THEN 11 WHEN 'DICIEMBRE' THEN 12
        ELSE 99
    END
"""


def _rows(cursor) -> list[dict[str, Any]]:
    cols = [c[0] for c in cursor.description]
    return [dict(zip(cols, row, strict=True)) for row in cursor.fetchall()]


def _row(cursor) -> dict[str, Any] | None:
    rows = _rows(cursor)
    return rows[0] if rows else None


def _table(meta: IndicatorMeta) -> str:
    # Nombre de tabla controlado por catálogo (no input de usuario)
    return f"[{meta['tabla']}]"


def _build_filters(
    *,
    anio: int | None = None,
    mes: str | None = None,
    departamento: str | None = None,
    provincia: str | None = None,
    red: str | None = None,
    microred: str | None = None,
    categoria: str | None = None,
) -> tuple[str, list[Any]]:
    filters: list[str] = []
    params: list[Any] = []
    if anio is not None:
        filters.append("[año] = %s")
        params.append(anio)
    if mes:
        filters.append("UPPER(MES) = UPPER(%s)")
        params.append(mes)
    if departamento:
        filters.append("UPPER(DEPARTAMENTO) = UPPER(%s)")
        params.append(departamento)
    if provincia:
        filters.append("UPPER(PROVINCIA) = UPPER(%s)")
        params.append(provincia)
    if red:
        filters.append("UPPER(RED) = UPPER(%s)")
        params.append(red)
    if microred:
        filters.append("UPPER(MICRORED) = UPPER(%s)")
        params.append(microred)
    if categoria:
        filters.append("UPPER(CATEGORIA) = UPPER(%s)")
        params.append(categoria)
    where = ("WHERE " + " AND ".join(filters)) if filters else ""
    return where, params


def _avance_expr() -> str:
    return (
        "CASE WHEN SUM(denominador)>0 THEN "
        "ROUND(CAST(SUM(numerador) AS FLOAT)/SUM(denominador)*100, 2) ELSE 0 END AS avance_pct"
    )


def get_filtros(meta: IndicatorMeta) -> dict[str, Any]:
    t = _table(meta)
    try:
        with connections["fed"].cursor() as cur:
            cur.execute(f"SELECT DISTINCT [año] FROM {t} ORDER BY [año]")
            anios = [r["año"] for r in _rows(cur)]

            cur.execute(
                f"SELECT DISTINCT MES, {MES_ORDER} AS orden FROM {t} ORDER BY orden"
            )
            meses = [r["MES"] for r in _rows(cur)]

            cur.execute(f"SELECT DISTINCT DEPARTAMENTO FROM {t} ORDER BY DEPARTAMENTO")
            departamentos = [r["DEPARTAMENTO"] for r in _rows(cur)]

            cur.execute(
                f"SELECT DISTINCT DEPARTAMENTO, PROVINCIA FROM {t} "
                "ORDER BY DEPARTAMENTO, PROVINCIA"
            )
            provincias = [
                {"departamento": r["DEPARTAMENTO"], "provincia": r["PROVINCIA"]}
                for r in _rows(cur)
            ]

            cur.execute(
                f"SELECT DISTINCT RED FROM {t} WHERE RED IS NOT NULL ORDER BY RED"
            )
            redes = [r["RED"] for r in _rows(cur)]

            cur.execute(
                f"SELECT DISTINCT RED, MICRORED FROM {t} "
                "WHERE MICRORED IS NOT NULL ORDER BY RED, MICRORED"
            )
            microredes = [
                {"red": r["RED"], "microred": r["MICRORED"]} for r in _rows(cur)
            ]

            cur.execute(
                """
                SELECT 1 AS ok
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_NAME = %s AND COLUMN_NAME = 'CATEGORIA'
                """,
                [meta["tabla"]],
            )
            categorias: list[str] = []
            if _row(cur):
                cur.execute(
                    f"SELECT DISTINCT CATEGORIA FROM {t} "
                    "WHERE CATEGORIA IS NOT NULL ORDER BY CATEGORIA"
                )
                categorias = [r["CATEGORIA"] for r in _rows(cur)]
    except Exception as exc:  # noqa: BLE001
        raise HttpError(500, f"Error al leer filtros FED: {exc}") from exc

    return {
        "anios": anios,
        "meses": meses,
        "departamentos": departamentos,
        "provincias": provincias,
        "redes": redes,
        "microredes": microredes,
        "categorias": categorias,
        "meta_pct": meta["meta_pct"],
        "codigo": meta["codigo"],
        "nombre": meta["nombre"],
    }


def get_tabla_completa(
    meta: IndicatorMeta,
    *,
    anio: int,
    mes: str,
    departamento: str | None = None,
    provincia: str | None = None,
    red: str | None = None,
    microred: str | None = None,
    categoria: str | None = None,
) -> dict[str, Any]:
    t = _table(meta)
    where, params = _build_filters(
        anio=anio,
        mes=mes,
        departamento=departamento,
        provincia=provincia,
        red=red,
        microred=microred,
        categoria=categoria,
    )
    avance = _avance_expr()
    try:
        with connections["fed"].cursor() as cur:
            cur.execute(
                f"""
                SELECT DEPARTAMENTO, PROVINCIA, DISTRITO,
                    SUM(denominador) AS denominador, SUM(numerador) AS numerador, {avance}
                FROM {t} {where}
                GROUP BY DEPARTAMENTO, PROVINCIA, DISTRITO
                ORDER BY DEPARTAMENTO, PROVINCIA, DISTRITO
                """,
                params,
            )
            distritos = _rows(cur)

            cur.execute(
                f"""
                SELECT DEPARTAMENTO, PROVINCIA,
                    SUM(denominador) AS denominador, SUM(numerador) AS numerador, {avance}
                FROM {t} {where}
                GROUP BY DEPARTAMENTO, PROVINCIA
                ORDER BY DEPARTAMENTO, PROVINCIA
                """,
                params,
            )
            provincias = _rows(cur)

            cur.execute(
                f"""
                SELECT SUM(denominador) AS denominador, SUM(numerador) AS numerador, {avance}
                FROM {t} {where}
                """,
                params,
            )
            total = _row(cur) or {"denominador": 0, "numerador": 0, "avance_pct": 0}
    except Exception as exc:  # noqa: BLE001
        raise HttpError(500, f"Error en tabla-completa: {exc}") from exc

    return {
        "anio": anio,
        "mes": mes.upper(),
        "total": total,
        "provincias": provincias,
        "distritos": distritos,
    }


def get_tabla_redes(
    meta: IndicatorMeta,
    *,
    anio: int,
    mes: str,
    departamento: str | None = None,
    provincia: str | None = None,
    red: str | None = None,
    microred: str | None = None,
    categoria: str | None = None,
) -> dict[str, Any]:
    t = _table(meta)
    where, params = _build_filters(
        anio=anio,
        mes=mes,
        departamento=departamento,
        provincia=provincia,
        red=red,
        microred=microred,
        categoria=categoria,
    )
    avance = _avance_expr()
    try:
        with connections["fed"].cursor() as cur:
            cur.execute(
                f"""
                SELECT ISNULL(RED,'SIN RED') AS RED, ISNULL(MICRORED,'SIN MICRORED') AS MICRORED,
                    ESTABLECIMIENTO,
                    SUM(denominador) AS denominador, SUM(numerador) AS numerador, {avance}
                FROM {t} {where}
                GROUP BY RED, MICRORED, ESTABLECIMIENTO
                ORDER BY RED, MICRORED, ESTABLECIMIENTO
                """,
                params,
            )
            establecimientos = _rows(cur)

            cur.execute(
                f"""
                SELECT ISNULL(RED,'SIN RED') AS RED, ISNULL(MICRORED,'SIN MICRORED') AS MICRORED,
                    SUM(denominador) AS denominador, SUM(numerador) AS numerador, {avance}
                FROM {t} {where}
                GROUP BY RED, MICRORED
                ORDER BY RED, MICRORED
                """,
                params,
            )
            microredes = _rows(cur)

            cur.execute(
                f"""
                SELECT ISNULL(RED,'SIN RED') AS RED,
                    SUM(denominador) AS denominador, SUM(numerador) AS numerador, {avance}
                FROM {t} {where}
                GROUP BY RED
                ORDER BY RED
                """,
                params,
            )
            redes = _rows(cur)

            cur.execute(
                f"""
                SELECT SUM(denominador) AS denominador, SUM(numerador) AS numerador, {avance}
                FROM {t} {where}
                """,
                params,
            )
            total = _row(cur) or {"denominador": 0, "numerador": 0, "avance_pct": 0}
    except Exception as exc:  # noqa: BLE001
        raise HttpError(500, f"Error en tabla-redes: {exc}") from exc

    return {
        "anio": anio,
        "mes": mes.upper(),
        "total": total,
        "redes": redes,
        "microredes": microredes,
        "establecimientos": establecimientos,
    }


def get_resumen(
    meta: IndicatorMeta,
    *,
    anio: int | None = None,
    departamento: str | None = None,
    red: str | None = None,
) -> dict[str, Any]:
    t = _table(meta)
    where, params = _build_filters(anio=anio, departamento=departamento, red=red)
    avance = _avance_expr()
    try:
        with connections["fed"].cursor() as cur:
            cur.execute(
                f"""
                SELECT [año], MES,
                    SUM(denominador) AS total_denominador,
                    SUM(numerador) AS total_numerador,
                    {avance}
                FROM {t} {where}
                GROUP BY [año], MES
                ORDER BY [año], {MES_ORDER}
                """,
                params,
            )
            data = _rows(cur)
    except Exception as exc:  # noqa: BLE001
        raise HttpError(500, f"Error en resumen: {exc}") from exc
    return {"data": data}
