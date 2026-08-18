"""Motor Nutrición — redes; avance YTD (ene…mes) / meta anual MAX(Meta) por EESS."""

from __future__ import annotations

from collections import defaultdict
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

_MES_RANK = {
    "ENERO": 1,
    "FEBRERO": 2,
    "MARZO": 3,
    "ABRIL": 4,
    "MAYO": 5,
    "JUNIO": 6,
    "JULIO": 7,
    "AGOSTO": 8,
    "SEPTIEMBRE": 9,
    "OCTUBRE": 10,
    "NOVIEMBRE": 11,
    "DICIEMBRE": 12,
}


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


def _num(v: Any) -> float:
    try:
        return float(v or 0)
    except (TypeError, ValueError):
        return 0.0


def _pct(numerador: float, denominador: float) -> float:
    if denominador <= 0:
        return 0.0
    return round(numerador / denominador * 100, 2)


def _build_filters(
    meta: IndicatorMeta,
    *,
    anio: int | None = None,
    mes: str | None = None,
    red: str | None = None,
    microred: str | None = None,
) -> tuple[str, list[Any]]:
    """Si se pasa mes, filtra acumulado YTD: orden_mes <= mes seleccionado."""
    filters: list[str] = []
    params: list[Any] = []
    if anio is not None:
        filters.append(f"{_anio(meta)} = %s")
        params.append(anio)
    if mes:
        mes_ord_col = MES_ORDER.format(mes=_mes(meta))
        mes_ord_cut = MES_ORDER.format(mes="%s")
        filters.append(f"({mes_ord_col}) <= ({mes_ord_cut})")
        params.append(mes)
    if red:
        filters.append("UPPER(RED) = UPPER(%s)")
        params.append(red)
    if microred:
        filters.append("UPPER(MICRORED) = UPPER(%s)")
        params.append(microred)
    where = ("WHERE " + " AND ".join(filters)) if filters else ""
    return where, params


def _eess_ytd_cte(
    meta: IndicatorMeta,
    where_ytd: str,
    where_anual: str,
) -> str:
    """Meta anual por EESS (universo del año) + avance YTD (0 si aún no hay)."""
    t = _table(meta)
    eess = _eess_expr(meta)
    return f"""
    base_anual AS (
        SELECT
            ISNULL(RED, 'SIN RED') AS RED,
            ISNULL(MICRORED, 'SIN MICRORED') AS MICRORED,
            ESTABLECIMIENTO,
            {eess} AS eess_key,
            CAST(Meta AS FLOAT) AS meta
        FROM {t}
        {where_anual}
    ),
    meta_anual AS (
        SELECT
            eess_key,
            MAX(RED) AS RED,
            MAX(MICRORED) AS MICRORED,
            MAX(ESTABLECIMIENTO) AS ESTABLECIMIENTO,
            MAX(meta) AS meta
        FROM base_anual
        GROUP BY eess_key
    ),
    avance_ytd AS (
        SELECT
            {eess} AS eess_key,
            SUM(CAST(Avance_Meta AS FLOAT)) AS avance
        FROM {t}
        {where_ytd}
        GROUP BY {eess}
    ),
    eess AS (
        SELECT
            m.RED,
            m.MICRORED,
            m.ESTABLECIMIENTO,
            m.eess_key,
            ISNULL(a.avance, 0) AS avance,
            ISNULL(m.meta, 0) AS meta
        FROM meta_anual m
        LEFT JOIN avance_ytd a ON a.eess_key = m.eess_key
    )
    """


def get_filtros(meta: IndicatorMeta) -> dict[str, Any]:
    """Un solo DISTINCT → listas en Python (evita 4 scans)."""
    t = _table(meta)
    anio_c = _anio(meta)
    mes_c = _mes(meta)
    try:
        with connections["nutricion"].cursor() as cur:
            cur.execute(
                f"""
                SELECT DISTINCT {anio_c} AS anio, {mes_c} AS MES, RED, MICRORED
                FROM {t}
                """
            )
            combos = _rows(cur)
    except Exception as exc:  # noqa: BLE001
        raise HttpError(500, f"Error al leer filtros Nutrición: {exc}") from exc

    anios_set: set[int] = set()
    meses_set: set[str] = set()
    redes_set: set[str] = set()
    microredes_set: set[tuple[str, str]] = set()
    for r in combos:
        if r.get("anio") is not None:
            anios_set.add(int(r["anio"]))
        if r.get("MES") is not None:
            meses_set.add(str(r["MES"]).upper())
        red = r.get("RED")
        micro = r.get("MICRORED")
        if red is not None:
            redes_set.add(str(red))
        if red is not None and micro is not None:
            microredes_set.add((str(red), str(micro)))

    return {
        "anios": sorted(anios_set),
        "meses": sorted(meses_set, key=lambda m: _MES_RANK.get(m, 99)),
        "redes": sorted(redes_set),
        "microredes": [
            {"red": r, "microred": m}
            for r, m in sorted(microredes_set, key=lambda x: (x[0], x[1]))
        ],
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
    """Una sola ejecución del CTE YTD; rollup microred/red/total en Python."""
    where_ytd, params_ytd = _build_filters(
        meta, anio=anio, mes=mes, red=red, microred=microred
    )
    where_anual, params_anual = _build_filters(
        meta, anio=anio, red=red, microred=microred
    )
    cte = _eess_ytd_cte(meta, where_ytd, where_anual)
    params = params_anual + params_ytd
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
    except Exception as exc:  # noqa: BLE001
        raise HttpError(500, f"Error en tabla-redes Nutrición: {exc}") from exc

    mr_acc: dict[tuple[Any, Any], dict[str, float]] = defaultdict(
        lambda: {"numerador": 0.0, "denominador": 0.0}
    )
    red_acc: dict[Any, dict[str, float]] = defaultdict(
        lambda: {"numerador": 0.0, "denominador": 0.0}
    )
    total_n = 0.0
    total_d = 0.0
    for e in establecimientos:
        red_name = e.get("RED")
        micro_name = e.get("MICRORED")
        num = _num(e.get("numerador"))
        den = _num(e.get("denominador"))
        mr_acc[(red_name, micro_name)]["numerador"] += num
        mr_acc[(red_name, micro_name)]["denominador"] += den
        red_acc[red_name]["numerador"] += num
        red_acc[red_name]["denominador"] += den
        total_n += num
        total_d += den

    microredes = [
        {
            "RED": red_name,
            "MICRORED": micro_name,
            "numerador": acc["numerador"],
            "denominador": acc["denominador"],
            "avance_pct": _pct(acc["numerador"], acc["denominador"]),
        }
        for (red_name, micro_name), acc in sorted(
            mr_acc.items(), key=lambda x: (str(x[0][0]), str(x[0][1]))
        )
    ]
    redes = [
        {
            "RED": red_name,
            "numerador": acc["numerador"],
            "denominador": acc["denominador"],
            "avance_pct": _pct(acc["numerador"], acc["denominador"]),
        }
        for red_name, acc in sorted(red_acc.items(), key=lambda x: str(x[0]))
    ]
    total = {
        "numerador": total_n,
        "denominador": total_d,
        "avance_pct": _pct(total_n, total_d),
    }

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
    """Serie mensual con avance acumulado YTD y meta anual fija."""
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
                ;WITH eess_mes AS (
                    SELECT
                        {anio_c} AS anio,
                        UPPER({mes_c}) AS MES,
                        {eess} AS eess_key,
                        SUM(CAST(Avance_Meta AS FLOAT)) AS avance,
                        MAX(CAST(Meta AS FLOAT)) AS meta
                    FROM {t}
                    {where}
                    GROUP BY {anio_c}, UPPER({mes_c}), {eess}
                ),
                meta_anual AS (
                    SELECT anio, eess_key, MAX(meta) AS meta
                    FROM eess_mes
                    GROUP BY anio, eess_key
                ),
                den_anual AS (
                    SELECT anio, SUM(meta) AS total_denominador
                    FROM meta_anual
                    GROUP BY anio
                ),
                avance_mes AS (
                    SELECT
                        anio,
                        MES,
                        {mes_ord} AS orden,
                        SUM(avance) AS avance_mes
                    FROM eess_mes
                    GROUP BY anio, MES
                ),
                ytd AS (
                    SELECT
                        anio,
                        MES,
                        orden,
                        SUM(avance_mes) OVER (
                            PARTITION BY anio
                            ORDER BY orden
                            ROWS UNBOUNDED PRECEDING
                        ) AS total_numerador
                    FROM avance_mes
                )
                SELECT
                    y.anio,
                    y.MES,
                    d.total_denominador,
                    y.total_numerador,
                    CASE WHEN d.total_denominador > 0 THEN
                        ROUND(CAST(y.total_numerador AS FLOAT) / d.total_denominador * 100, 2)
                    ELSE 0 END AS avance_pct
                FROM ytd y
                INNER JOIN den_anual d ON d.anio = y.anio
                ORDER BY y.anio, y.orden
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
