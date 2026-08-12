"""Motor de consultas Nutrición — solo ámbito redes; avance = SUM(Avance_Meta)/MAX(Meta) por EESS."""

from __future__ import annotations

from typing import Any

from django.db import connections
from ninja.errors import HttpError

from apps.nutricion.catalog import IndicatorMeta

MES_ORDER = """
    CASE UPPER({mes})
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


def _qident(name: str) -> str:
    """Identificador SQL Server seguro (catálogo controlado)."""
    return "[" + name.replace("]", "]]") + "]"


def _table(meta: IndicatorMeta) -> str:
    return _qident(meta["tabla"])


def _anio(meta: IndicatorMeta) -> str:
    return _qident(meta["anio_col"])


def _mes(meta: IndicatorMeta) -> str:
    return _qident(meta["mes_col"])


def _eess_expr(meta: IndicatorMeta) -> str:
    if meta["eess_key"] == "renaes":
        return "COALESCE(NULLIF(LTRIM(RTRIM(CAST(renaes AS NVARCHAR(40)))), ''), ESTABLECIMIENTO)"
    return "ESTABLECIMIENTO"


def _build_filters(
    meta: IndicatorMeta,
    *,
    anio: int | None = None,
    mes: str | None = None,
    red: str | None = None,
    microred: str | None = None,
) -> tuple[str, list[Any]]:
    filters: list[str] = []
    params: list[Any] = []
    if anio is not None:
        filters.append(f"{_anio(meta)} = %s")
        params.append(anio)
    if mes:
        filters.append(f"UPPER({_mes(meta)}) = UPPER(%s)")
        params.append(mes)
    if red:
        filters.append("UPPER(RED) = UPPER(%s)")
        params.append(red)
    if microred:
        filters.append("UPPER(MICRORED) = UPPER(%s)")
        params.append(microred)
    where = ("WHERE " + " AND ".join(filters)) if filters else ""
    return where, params


def _pct_expr(avance_col: str = "avance", meta_col: str = "meta") -> str:
    return (
        f"CASE WHEN SUM({meta_col}) > 0 THEN "
        f"ROUND(CAST(SUM({avance_col}) AS FLOAT) / SUM({meta_col}) * 100, 2) ELSE 0 END AS avance_pct"
    )


def _eess_cte(meta: IndicatorMeta, where: str) -> str:
    """CTE: un registro por establecimiento (SUM Avance_Meta, MAX Meta)."""
    t = _table(meta)
    eess = _eess_expr(meta)
    return f"""
    eess AS (
        SELECT
            ISNULL(RED, 'SIN RED') AS RED,
            ISNULL(MICRORED, 'SIN MICRORED') AS MICRORED,
            ESTABLECIMIENTO,
            {eess} AS eess_key,
            SUM(CAST(Avance_Meta AS FLOAT)) AS avance,
            MAX(CAST(Meta AS FLOAT)) AS meta
        FROM {t}
        {where}
        GROUP BY
            ISNULL(RED, 'SIN RED'),
            ISNULL(MICRORED, 'SIN MICRORED'),
            ESTABLECIMIENTO,
            {eess}
    )
    """


def get_filtros(meta: IndicatorMeta) -> dict[str, Any]:
    t = _table(meta)
    anio_c = _anio(meta)
    mes_c = _mes(meta)
    mes_ord = MES_ORDER.format(mes=mes_c)
    try:
        with connections["nutricion"].cursor() as cur:
            cur.execute(f"SELECT DISTINCT {anio_c} AS anio FROM {t} ORDER BY anio")
            anios = [int(r["anio"]) for r in _rows(cur) if r["anio"] is not None]

            cur.execute(
                f"SELECT DISTINCT {mes_c} AS MES, {mes_ord} AS orden FROM {t} ORDER BY orden"
            )
            meses = [str(r["MES"]).upper() for r in _rows(cur) if r["MES"] is not None]

            cur.execute(
                f"SELECT DISTINCT RED FROM {t} WHERE RED IS NOT NULL ORDER BY RED"
            )
            redes = [r["RED"] for r in _rows(cur)]

            cur.execute(
                f"""
                SELECT DISTINCT RED, MICRORED FROM {t}
                WHERE MICRORED IS NOT NULL
                ORDER BY RED, MICRORED
                """
            )
            microredes = [
                {"red": r["RED"], "microred": r["MICRORED"]} for r in _rows(cur)
            ]
    except Exception as exc:  # noqa: BLE001
        raise HttpError(500, f"Error al leer filtros Nutrición: {exc}") from exc

    return {
        "anios": anios,
        "meses": meses,
        "redes": redes,
        "microredes": microredes,
        "codigo": meta["codigo"],
        "nombre": meta["nombre"],
    }


def get_tabla_redes(
    meta: IndicatorMeta,
    *,
    anio: int,
    mes: str,
    red: str | None = None,
    microred: str | None = None,
) -> dict[str, Any]:
    where, params = _build_filters(meta, anio=anio, mes=mes, red=red, microred=microred)
    cte = _eess_cte(meta, where)
    pct = _pct_expr()
    try:
        with connections["nutricion"].cursor() as cur:
            cur.execute(
                f"""
                ;WITH {cte}
                SELECT RED, MICRORED, ESTABLECIMIENTO,
                    avance AS numerador, meta AS denominador,
                    CASE WHEN meta > 0 THEN ROUND(CAST(avance AS FLOAT) / meta * 100, 2) ELSE 0 END AS avance_pct
                FROM eess
                ORDER BY RED, MICRORED, ESTABLECIMIENTO
                """,
                params,
            )
            establecimientos = _rows(cur)

            cur.execute(
                f"""
                ;WITH {cte}
                SELECT RED, MICRORED,
                    SUM(avance) AS numerador, SUM(meta) AS denominador, {pct}
                FROM eess
                GROUP BY RED, MICRORED
                ORDER BY RED, MICRORED
                """,
                params,
            )
            microredes = _rows(cur)

            cur.execute(
                f"""
                ;WITH {cte}
                SELECT RED,
                    SUM(avance) AS numerador, SUM(meta) AS denominador, {pct}
                FROM eess
                GROUP BY RED
                ORDER BY RED
                """,
                params,
            )
            redes = _rows(cur)

            cur.execute(
                f"""
                ;WITH {cte}
                SELECT SUM(avance) AS numerador, SUM(meta) AS denominador, {pct}
                FROM eess
                """,
                params,
            )
            total = _row(cur) or {"numerador": 0, "denominador": 0, "avance_pct": 0}
    except Exception as exc:  # noqa: BLE001
        raise HttpError(500, f"Error en tabla-redes Nutrición: {exc}") from exc

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
    red: str | None = None,
) -> dict[str, Any]:
    where, params = _build_filters(meta, anio=anio, red=red)
    t = _table(meta)
    anio_c = _anio(meta)
    mes_c = _mes(meta)
    eess = _eess_expr(meta)
    mes_ord = MES_ORDER.format(mes="MES")
    try:
        with connections["nutricion"].cursor() as cur:
            cur.execute(
                f"""
                ;WITH eess AS (
                    SELECT
                        {anio_c} AS anio,
                        UPPER({mes_c}) AS MES,
                        {eess} AS eess_key,
                        SUM(CAST(Avance_Meta AS FLOAT)) AS avance,
                        MAX(CAST(Meta AS FLOAT)) AS meta
                    FROM {t}
                    {where}
                    GROUP BY {anio_c}, UPPER({mes_c}), {eess}
                )
                SELECT
                    anio,
                    MES,
                    SUM(meta) AS total_denominador,
                    SUM(avance) AS total_numerador,
                    CASE WHEN SUM(meta) > 0 THEN
                        ROUND(CAST(SUM(avance) AS FLOAT) / SUM(meta) * 100, 2)
                    ELSE 0 END AS avance_pct
                FROM eess
                GROUP BY anio, MES
                ORDER BY anio, {mes_ord}
                """,
                params,
            )
            data = _rows(cur)
    except Exception as exc:  # noqa: BLE001
        raise HttpError(500, f"Error en resumen Nutrición: {exc}") from exc
    return {"data": data}


def get_config() -> dict[str, Any]:
    """Fuentes / fechas de corte desde DBNUTRICION.Config."""
    try:
        with connections["nutricion"].cursor() as cur:
            cur.execute(
                """
                SELECT ID, Fuente, Fecha
                FROM [Config]
                ORDER BY ID
                """
            )
            rows = _rows(cur)
    except Exception as exc:  # noqa: BLE001
        raise HttpError(500, f"Error al leer Config Nutrición: {exc}") from exc

    result: list[dict[str, Any]] = []
    for row in rows:
        fecha = row.get("Fecha")
        if hasattr(fecha, "strftime"):
            fecha_fmt = fecha.strftime("%d/%m/%Y")
            fecha_iso = fecha.isoformat()
        else:
            fecha_fmt = str(fecha) if fecha is not None else None
            fecha_iso = fecha_fmt
        result.append(
            {
                "id": row.get("ID"),
                "fuente": row.get("Fuente"),
                "fecha": fecha_iso,
                "fecha_fmt": fecha_fmt,
            }
        )
    return {"result": result}
