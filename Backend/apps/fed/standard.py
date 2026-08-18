"""Motor de consultas para indicadores FED con patrón estándar (MC/SI básico)."""

from __future__ import annotations

from collections import defaultdict
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


def _table(meta: IndicatorMeta) -> str:
    # Nombre de tabla controlado por catálogo (no input de usuario)
    return f"[{meta['tabla']}]"


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
    """Un solo DISTINCT de combinaciones → listas en Python (evita 7–8 scans)."""
    t = _table(meta)
    try:
        with connections["fed"].cursor() as cur:
            cur.execute(
                """
                SELECT 1 AS ok
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_NAME = %s AND COLUMN_NAME = 'CATEGORIA'
                """,
                [meta["tabla"]],
            )
            has_categoria = _row(cur) is not None

            if has_categoria:
                cur.execute(
                    f"""
                    SELECT DISTINCT [año], MES, DEPARTAMENTO, PROVINCIA, RED, MICRORED, CATEGORIA
                    FROM {t}
                    """
                )
            else:
                cur.execute(
                    f"""
                    SELECT DISTINCT [año], MES, DEPARTAMENTO, PROVINCIA, RED, MICRORED
                    FROM {t}
                    """
                )
            combos = _rows(cur)
    except Exception as exc:  # noqa: BLE001
        raise HttpError(500, f"Error al leer filtros FED: {exc}") from exc

    anios_set: set[int] = set()
    meses_set: set[str] = set()
    departamentos_set: set[str] = set()
    provincias_set: set[tuple[str, str]] = set()
    redes_set: set[str] = set()
    microredes_set: set[tuple[str, str]] = set()
    categorias_set: set[str] = set()

    for r in combos:
        anio = r.get("año")
        if anio is not None:
            anios_set.add(int(anio))
        mes = r.get("MES")
        if mes is not None:
            meses_set.add(str(mes).upper())
        dep = r.get("DEPARTAMENTO")
        prov = r.get("PROVINCIA")
        if dep is not None:
            departamentos_set.add(str(dep))
        if dep is not None and prov is not None:
            provincias_set.add((str(dep), str(prov)))
        red = r.get("RED")
        micro = r.get("MICRORED")
        if red is not None:
            redes_set.add(str(red))
        if red is not None and micro is not None:
            microredes_set.add((str(red), str(micro)))
        cat = r.get("CATEGORIA")
        if cat is not None:
            categorias_set.add(str(cat))

    return {
        "anios": sorted(anios_set),
        "meses": sorted(meses_set, key=lambda m: _MES_RANK.get(m, 99)),
        "departamentos": sorted(departamentos_set),
        "provincias": [
            {"departamento": d, "provincia": p}
            for d, p in sorted(provincias_set, key=lambda x: (x[0], x[1]))
        ],
        "redes": sorted(redes_set),
        "microredes": [
            {"red": r, "microred": m}
            for r, m in sorted(microredes_set, key=lambda x: (x[0], x[1]))
        ],
        "categorias": sorted(categorias_set),
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
    except Exception as exc:  # noqa: BLE001
        raise HttpError(500, f"Error en tabla-completa: {exc}") from exc

    prov_acc: dict[tuple[Any, Any], dict[str, float]] = defaultdict(
        lambda: {"denominador": 0.0, "numerador": 0.0}
    )
    total_d = 0.0
    total_n = 0.0
    for d in distritos:
        key = (d.get("DEPARTAMENTO"), d.get("PROVINCIA"))
        den = _num(d.get("denominador"))
        num = _num(d.get("numerador"))
        prov_acc[key]["denominador"] += den
        prov_acc[key]["numerador"] += num
        total_d += den
        total_n += num

    provincias = [
        {
            "DEPARTAMENTO": dep,
            "PROVINCIA": prov,
            "denominador": acc["denominador"],
            "numerador": acc["numerador"],
            "avance_pct": _pct(acc["numerador"], acc["denominador"]),
        }
        for (dep, prov), acc in sorted(
            prov_acc.items(), key=lambda x: (str(x[0][0]), str(x[0][1]))
        )
    ]
    total = {
        "denominador": total_d,
        "numerador": total_n,
        "avance_pct": _pct(total_n, total_d),
    }

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
    except Exception as exc:  # noqa: BLE001
        raise HttpError(500, f"Error en tabla-redes: {exc}") from exc

    mr_acc: dict[tuple[Any, Any], dict[str, float]] = defaultdict(
        lambda: {"denominador": 0.0, "numerador": 0.0}
    )
    red_acc: dict[Any, dict[str, float]] = defaultdict(
        lambda: {"denominador": 0.0, "numerador": 0.0}
    )
    total_d = 0.0
    total_n = 0.0
    for e in establecimientos:
        red_name = e.get("RED")
        micro_name = e.get("MICRORED")
        den = _num(e.get("denominador"))
        num = _num(e.get("numerador"))
        mr_acc[(red_name, micro_name)]["denominador"] += den
        mr_acc[(red_name, micro_name)]["numerador"] += num
        red_acc[red_name]["denominador"] += den
        red_acc[red_name]["numerador"] += num
        total_d += den
        total_n += num

    microredes = [
        {
            "RED": red_name,
            "MICRORED": micro_name,
            "denominador": acc["denominador"],
            "numerador": acc["numerador"],
            "avance_pct": _pct(acc["numerador"], acc["denominador"]),
        }
        for (red_name, micro_name), acc in sorted(
            mr_acc.items(), key=lambda x: (str(x[0][0]), str(x[0][1]))
        )
    ]
    redes = [
        {
            "RED": red_name,
            "denominador": acc["denominador"],
            "numerador": acc["numerador"],
            "avance_pct": _pct(acc["numerador"], acc["denominador"]),
        }
        for red_name, acc in sorted(red_acc.items(), key=lambda x: str(x[0]))
    ]
    total = {
        "denominador": total_d,
        "numerador": total_n,
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


def get_config() -> dict[str, Any]:
    """Lista completa de la tabla config (fuentes / fechas de corte)."""
    try:
        with connections["fed"].cursor() as cur:
            cur.execute(
                """
                SELECT ID, Fuente, Fecha
                FROM [config]
                ORDER BY ID
                """
            )
            rows = _rows(cur)
    except Exception as exc:  # noqa: BLE001
        raise HttpError(500, f"Error al leer config FED: {exc}") from exc

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
