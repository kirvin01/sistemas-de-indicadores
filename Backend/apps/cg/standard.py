"""Motor CG — territorial y redes; logro/cumplimiento según DAX 2026."""

from __future__ import annotations

from collections import defaultdict
from typing import Any

from django.db import connections
from ninja.errors import HttpError

from apps.cg.catalog import IndicatorMeta

MES_ORDER = """
    CASE UPPER(mes)
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
    return "[" + name.replace("]", "]]") + "]"


def _table(meta: IndicatorMeta) -> str:
    return _qident(meta["tabla"])


def _num(v: Any) -> float:
    try:
        return float(v or 0)
    except (TypeError, ValueError):
        return 0.0


def _sum_expr(col: str, alias: str) -> str:
    return f"SUM(CAST({_qident(col)} AS FLOAT)) AS {_qident(alias)}"


def _build_filters(
    *,
    anio: int | None = None,
    mes: str | None = None,
    departamento: str | None = None,
    provincia: str | None = None,
    red: str | None = None,
    microred: str | None = None,
    fuente: str | None = None,
    require_null_mes: bool = False,
) -> tuple[str, list[Any]]:
    filters: list[str] = []
    params: list[Any] = []
    if anio is not None:
        filters.append("anio = %s")
        params.append(anio)
    if mes:
        filters.append("UPPER(mes) = UPPER(%s)")
        params.append(mes)
    elif require_null_mes:
        filters.append("mes IS NULL")
    if departamento:
        filters.append("UPPER(Departamento) = UPPER(%s)")
        params.append(departamento)
    if provincia:
        filters.append("UPPER(Provincia) = UPPER(%s)")
        params.append(provincia)
    if red:
        filters.append("UPPER(Red) = UPPER(%s)")
        params.append(red)
    if microred:
        filters.append("UPPER(MicroRed) = UPPER(%s)")
        params.append(microred)
    if fuente:
        filters.append("UPPER(Fuente) = UPPER(%s)")
        params.append(fuente)
    where = ("WHERE " + " AND ".join(filters)) if filters else ""
    return where, params


def _norm_mes(mes: str | None) -> str | None:
    if mes is None:
        return None
    t = str(mes).strip().upper()
    return t or None


def _canon_fuente(value: Any) -> str | None:
    if value is None:
        return None
    t = str(value).strip()
    if not t:
        return None
    low = t.lower()
    if low == "nacional":
        return "Nacional"
    if low == "regional":
        return "Regional"
    return t


def _row_mes(row: dict[str, Any]) -> str | None:
    return _norm_mes(row.get("mes") if "mes" in row else row.get("MES"))


def _coverage_rows(meta: IndicatorMeta) -> list[dict[str, Any]]:
    t = _table(meta)
    with connections["cg"].cursor() as cur:
        cur.execute(f"SELECT DISTINCT anio, mes, Fuente FROM {t}")
        return _rows(cur)


def resolve_fuente(
    meta: IndicatorMeta,
    *,
    anio: int | None,
    mes: str | None,
) -> str | None:
    """Nacional si el mes existe en esa carga; si no, Regional."""
    if anio is None:
        return None
    mes_n = _norm_mes(mes)
    fuentes: set[str] = set()
    for r in _coverage_rows(meta):
        if r.get("anio") is None or int(r["anio"]) != int(anio):
            continue
        fu = _canon_fuente(r.get("Fuente"))
        if not fu:
            continue
        rm = _row_mes(r)
        if mes_n is None:
            if rm is None:
                fuentes.add(fu)
        elif rm == mes_n:
            fuentes.add(fu)
    if "Nacional" in fuentes:
        return "Nacional"
    if "Regional" in fuentes:
        return "Regional"
    return next(iter(fuentes), None)


def _prefer_fuente_row(
    current: dict[str, Any] | None, candidate: dict[str, Any]
) -> dict[str, Any]:
    if current is None:
        return candidate
    if _canon_fuente(candidate.get("Fuente")) == "Nacional":
        return candidate
    return current


def _empty_tabla_completa(anio: int, mes: str | None, fuente: str | None, kind: str) -> dict[str, Any]:
    return {
        "anio": anio,
        "mes": _norm_mes(mes),
        "fuente": fuente,
        "kind": kind,
        "total": {
            "denominador": 0,
            "numerador": 0,
            "avance_pct": 0,
            "cumplimiento_pct": None,
            "umbral": None,
            "meta": None,
            "extras": {},
        },
        "provincias": [],
        "distritos": [],
    }


def _empty_tabla_redes(anio: int, mes: str | None, fuente: str | None, kind: str) -> dict[str, Any]:
    return {
        "anio": anio,
        "mes": _norm_mes(mes),
        "fuente": fuente,
        "kind": kind,
        "total": {
            "denominador": 0,
            "numerador": 0,
            "avance_pct": 0,
            "cumplimiento_pct": None,
            "umbral": None,
            "meta": None,
            "extras": {},
        },
        "redes": [],
        "microredes": [],
        "establecimientos": [],
    }


def _meta_eoc(eoc: float) -> float:
    if eoc < 100:
        return 50.0
    if eoc < 200:
        return 40.0
    if eoc < 300:
        return 30.0
    if eoc < 400:
        return 25.0
    return 20.0


def _meta_cg14(categoria: str | None) -> float | None:
    """Grupo A–D o categoría hospitalaria → logro esperado (%)."""
    cat = (categoria or "").upper().strip()
    if not cat:
        return None
    if "GRUPO A" in cat or cat in {"A", "GRUPOA"}:
        return 80.0
    if "GRUPO B" in cat or cat in {"B", "GRUPOB"}:
        return 70.0
    if "GRUPO C" in cat or cat in {"C", "GRUPOC"}:
        return 60.0
    if "GRUPO D" in cat or cat in {"D", "GRUPOD"}:
        return 40.0
    if cat.startswith("III"):
        return 80.0
    if cat in {"II-2", "II-E", "II-2-E", "II-2E"}:
        return 70.0
    if cat.startswith("II"):
        return 60.0
    if cat.startswith("I-4") or cat.startswith("I4"):
        return 40.0
    return None


def _meta_cg17(departamento: str | None) -> float:
    dep = (departamento or "").upper()
    if "LIMA" in dep:
        return 35.0
    return 30.0


def _meta_cg19(denominador: float) -> float | None:
    if denominador > 150:
        return 30.0
    if denominador >= 101:
        return 40.0
    if denominador >= 60:
        return 50.0
    if denominador >= 40:
        return 60.0
    return None


def _meta_cg21(categoria: str | None) -> float:
    cat = (categoria or "").upper().strip()
    if cat.startswith("II-1") or cat == "II-1":
        return 60.0
    return 85.0


def _meta_cg25(categoria: str | None) -> float:
    cat = (categoria or "").upper()
    if cat.startswith("I-4") or cat.startswith("I4"):
        return 20.0
    if cat.startswith("III-E") or cat in {"III-E", "IIIE"}:
        return 22.0
    if cat.startswith("III"):
        return 45.0
    if cat.startswith("II"):
        return 35.0
    return 35.0


def _linear_cumplimiento(logro: float, umbral: float, meta: float) -> float:
    if meta == umbral:
        return 100.0 if logro >= meta else 0.0
    if logro >= meta:
        return 100.0
    if logro <= umbral:
        return 0.0
    return round((logro - umbral) / (meta - umbral) * 100, 2)


def _apply_metrics(
    meta: IndicatorMeta,
    numerador: float,
    denominador: float,
    *,
    extras: dict[str, float] | None = None,
    categoria: str | None = None,
    departamento: str | None = None,
) -> dict[str, Any]:
    extras = extras or {}
    kind = meta["kind"]
    umbral = meta.get("umbral")
    goal = meta.get("meta")

    if kind == "rate_10k":
        logro = round(numerador / denominador * 10000, 2) if denominador else 0.0
    elif kind in {"ratio_raw"}:
        logro = round(numerador / denominador, 2) if denominador else 0.0
    elif kind == "dual_ratio":
        logro = round(numerador / denominador * 100, 2) if denominador else 0.0
    else:
        logro = round(numerador / denominador * 100, 2) if denominador else 0.0

    slug = meta["slug"]
    if slug == "cg10":
        goal = _meta_eoc(extras.get("NUM_EOC_2026", 0.0))
        umbral = 10.0
    elif slug == "cg14":
        goal = _meta_cg14(categoria)
        umbral = None
    elif slug == "cg17":
        goal = _meta_cg17(departamento)
    elif slug == "cg19":
        goal = _meta_cg19(denominador)
    elif slug == "cg21":
        goal = _meta_cg21(categoria)
    elif slug == "cg25":
        goal = _meta_cg25(categoria)
    elif slug == "cg18":
        goal = 30.0
        umbral = None

    cumplimiento: float | None = None
    if kind == "inverse_pct" and slug == "cg20":
        cumplimiento = 100.0 if logro <= 5 else 0.0
    elif kind == "ratio_raw" and slug == "cg18":
        cumplimiento = 100.0 if 12 <= logro <= 30 else 0.0
    elif slug == "cg14" and goal is not None:
        cumplimiento = 100.0 if logro >= goal else 0.0
    elif slug == "cg19" and goal is not None:
        cumplimiento = 100.0 if logro >= goal else 0.0
    elif slug == "cg10" and umbral is not None and goal is not None:
        cumplimiento = _linear_cumplimiento(logro, float(umbral), float(goal))
    elif kind == "dual_ratio":
        cumplimiento = 100.0 if logro >= 80 else 0.0
        den_uci = extras.get("Den_UCI", 0.0)
        num_uci = extras.get("Num_UCI", 0.0)
        extras["logro_uci"] = round(num_uci / den_uci * 100, 2) if den_uci else 0.0
        extras["cumplimiento_uci"] = 100.0 if extras["logro_uci"] >= 90 else 0.0
    elif kind == "ratio_raw" and slug == "cg24":
        cumplimiento = 100.0 if 0 <= logro <= 2 else 0.0
    elif kind == "ratio_raw" and slug == "cg25" and goal is not None:
        cumplimiento = 100.0 if logro <= goal else 0.0
    elif kind == "ratio_raw" and slug == "cg26":
        cumplimiento = 100.0 if logro >= 2 else 0.0
    elif kind == "ratio_raw" and slug == "cg21" and goal is not None:
        cumplimiento = 100.0 if logro >= goal else 0.0
    elif umbral is not None and goal is not None and kind in {"ratio_pct", "rate_10k"}:
        cumplimiento = _linear_cumplimiento(logro, float(umbral), float(goal))
    elif umbral is not None and goal is not None and kind == "ratio_pct":
        cumplimiento = _linear_cumplimiento(logro, float(umbral), float(goal))

    return {
        "denominador": denominador,
        "numerador": numerador,
        "avance_pct": logro,
        "cumplimiento_pct": cumplimiento,
        "umbral": umbral,
        "meta": goal,
        "extras": extras,
    }


def _metrics_row(
    meta: IndicatorMeta,
    numerador: float,
    denominador: float,
    extras: dict[str, float],
    categoria: str | None = None,
    departamento: str | None = None,
) -> dict[str, Any]:
    m = _apply_metrics(
        meta,
        numerador,
        denominador,
        extras=extras,
        categoria=categoria,
        departamento=departamento,
    )
    return {
        "denominador": m["denominador"],
        "numerador": m["numerador"],
        "avance_pct": m["avance_pct"],
        "cumplimiento_pct": m["cumplimiento_pct"],
        "umbral": m["umbral"],
        "meta": m["meta"],
        **{k: v for k, v in extras.items()},
    }


def _select_aggs(meta: IndicatorMeta) -> str:
    parts = [
        _sum_expr(meta["den_col"], "denominador"),
        _sum_expr(meta["num_col"], "numerador"),
    ]
    for extra in meta["extras"]:
        parts.append(_sum_expr(extra, extra))
    return ", ".join(parts)


def _extract_extras(meta: IndicatorMeta, row: dict[str, Any]) -> dict[str, float]:
    return {col: _num(row.get(col)) for col in meta["extras"]}


def get_filtros(
    meta: IndicatorMeta,
    *,
    anio: int | None = None,
    mes: str | None = None,
) -> dict[str, Any]:
    t = _table(meta)
    try:
        with connections["cg"].cursor() as cur:
            cur.execute(
                f"""
                SELECT DISTINCT anio, mes, Departamento, Provincia, Red, MicroRed, Fuente
                FROM {t}
                """
            )
            combos = _rows(cur)
    except Exception as exc:  # noqa: BLE001
        raise HttpError(500, f"Error al leer filtros CG: {exc}") from exc

    anios_set: set[int] = set()
    meses_set: set[str] = set()
    departamentos_set: set[str] = set()
    provincias_set: set[tuple[str, str]] = set()
    redes_set: set[str] = set()
    microredes_set: set[tuple[str, str]] = set()
    fuentes_set: set[str] = set()

    fuente_geo = resolve_fuente(meta, anio=anio, mes=mes) if anio is not None else None
    mes_n = _norm_mes(mes)

    for r in combos:
        fu = _canon_fuente(r.get("Fuente"))
        if fu:
            fuentes_set.add(fu)
        if r.get("anio") is not None:
            anios_set.add(int(r["anio"]))
        rm = _row_mes(r)
        if rm:
            meses_set.add(rm)

        use_geo = True
        if fuente_geo and fu and fu != fuente_geo:
            use_geo = False
        if mes_n and rm != mes_n:
            use_geo = False
        if anio is not None and r.get("anio") is not None and int(r["anio"]) != int(anio):
            use_geo = False
        if not use_geo:
            continue

        dep = r.get("Departamento")
        prov = r.get("Provincia")
        if dep:
            departamentos_set.add(str(dep))
        if dep and prov:
            provincias_set.add((str(dep), str(prov)))
        red = r.get("Red")
        micro = r.get("MicroRed")
        if red:
            redes_set.add(str(red))
        if red and micro:
            microredes_set.add((str(red), str(micro)))

    fuentes = sorted(fuentes_set)
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
        "fuentes": fuentes,
        "fuente_aplicada": fuente_geo,
        "meta_pct": meta["meta"] if meta["meta"] is not None else 0,
        "umbral": meta["umbral"],
        "kind": meta["kind"],
        "codigo": meta["codigo"],
        "nombre": meta["nombre"],
        "descripcion": meta.get("descripcion", ""),
        "extras": meta["extras"],
    }


def get_tabla_completa(
    meta: IndicatorMeta,
    *,
    anio: int,
    mes: str | None = None,
    departamento: str | None = None,
    provincia: str | None = None,
    red: str | None = None,
    microred: str | None = None,
) -> dict[str, Any]:
    fuente = resolve_fuente(meta, anio=anio, mes=mes)
    if fuente is None:
        return _empty_tabla_completa(anio, mes, None, meta["kind"])
    t = _table(meta)
    where, params = _build_filters(
        anio=anio,
        mes=mes,
        departamento=departamento,
        provincia=provincia,
        red=red,
        microred=microred,
        fuente=fuente,
        require_null_mes=not mes,
    )
    aggs = _select_aggs(meta)
    try:
        with connections["cg"].cursor() as cur:
            cur.execute(
                f"""
                SELECT
                    ISNULL(Departamento, 'SIN DATO') AS DEPARTAMENTO,
                    ISNULL(Provincia, 'SIN DATO') AS PROVINCIA,
                    ISNULL(Distrito, 'SIN DATO') AS DISTRITO,
                    {aggs}
                FROM {t} {where}
                GROUP BY Departamento, Provincia, Distrito
                ORDER BY Departamento, Provincia, Distrito
                """,
                params,
            )
            raw = _rows(cur)
    except Exception as exc:  # noqa: BLE001
        raise HttpError(500, f"Error en tabla-completa CG: {exc}") from exc

    distritos: list[dict[str, Any]] = []
    prov_acc: dict[tuple[Any, Any], dict[str, float]] = defaultdict(lambda: {"den": 0.0, "num": 0.0})
    prov_ex: dict[tuple[Any, Any], dict[str, float]] = defaultdict(lambda: defaultdict(float))
    tot_d = tot_n = 0.0
    tot_ex: dict[str, float] = defaultdict(float)

    for r in raw:
        den = _num(r.get("denominador"))
        num = _num(r.get("numerador"))
        extras = _extract_extras(meta, r)
        metrics = _metrics_row(
            meta,
            num,
            den,
            extras,
            departamento=str(r["DEPARTAMENTO"]) if r.get("DEPARTAMENTO") else None,
        )
        distritos.append(
            {
                "DEPARTAMENTO": r["DEPARTAMENTO"],
                "PROVINCIA": r["PROVINCIA"],
                "DISTRITO": r["DISTRITO"],
                **metrics,
            }
        )
        key = (r["DEPARTAMENTO"], r["PROVINCIA"])
        prov_acc[key]["den"] += den
        prov_acc[key]["num"] += num
        for k, v in extras.items():
            prov_ex[key][k] += v
            tot_ex[k] += v
        tot_d += den
        tot_n += num

    provincias = []
    for (dep, prov), acc in sorted(prov_acc.items(), key=lambda x: (str(x[0][0]), str(x[0][1]))):
        extras = dict(prov_ex[(dep, prov)])
        provincias.append(
            {
                "DEPARTAMENTO": dep,
                "PROVINCIA": prov,
                **_metrics_row(
                    meta,
                    acc["num"],
                    acc["den"],
                    extras,
                    departamento=str(dep) if dep else None,
                ),
            }
        )

    total = _apply_metrics(meta, tot_n, tot_d, extras=dict(tot_ex))
    return {
        "anio": anio,
        "mes": (mes or "").upper() or None,
        "fuente": fuente,
        "kind": meta["kind"],
        "total": total,
        "provincias": provincias,
        "distritos": distritos,
    }


def get_tabla_redes(
    meta: IndicatorMeta,
    *,
    anio: int,
    mes: str | None = None,
    departamento: str | None = None,
    provincia: str | None = None,
    red: str | None = None,
    microred: str | None = None,
) -> dict[str, Any]:
    fuente = resolve_fuente(meta, anio=anio, mes=mes)
    if fuente is None:
        return _empty_tabla_redes(anio, mes, None, meta["kind"])
    t = _table(meta)
    where, params = _build_filters(
        anio=anio,
        mes=mes,
        departamento=departamento,
        provincia=provincia,
        red=red,
        microred=microred,
        fuente=fuente,
        require_null_mes=not mes,
    )
    aggs = _select_aggs(meta)
    eess = (
        "COALESCE(NULLIF(LTRIM(RTRIM(Nombre_Establecimiento)), ''), "
        "NULLIF(LTRIM(RTRIM(CAST(renaes AS NVARCHAR(40)))), ''), "
        "ISNULL(Distrito, 'SIN EESS'))"
    )
    try:
        with connections["cg"].cursor() as cur:
            cur.execute(
                f"""
                SELECT
                    ISNULL(Red, 'SIN RED') AS RED,
                    ISNULL(MicroRed, 'SIN MICRORED') AS MICRORED,
                    {eess} AS ESTABLECIMIENTO,
                    MAX(Categoria) AS Categoria,
                    MAX(Departamento) AS Departamento,
                    {aggs}
                FROM {t} {where}
                GROUP BY ISNULL(Red, 'SIN RED'), ISNULL(MicroRed, 'SIN MICRORED'), {eess}
                ORDER BY RED, MICRORED, ESTABLECIMIENTO
                """,
                params,
            )
            raw = _rows(cur)
    except Exception as exc:  # noqa: BLE001
        raise HttpError(500, f"Error en tabla-redes CG: {exc}") from exc

    establecimientos: list[dict[str, Any]] = []
    mr_acc: dict[tuple[Any, Any], dict[str, float]] = defaultdict(lambda: {"den": 0.0, "num": 0.0})
    mr_ex: dict[tuple[Any, Any], dict[str, float]] = defaultdict(lambda: defaultdict(float))
    red_acc: dict[Any, dict[str, float]] = defaultdict(lambda: {"den": 0.0, "num": 0.0})
    red_ex: dict[Any, dict[str, float]] = defaultdict(lambda: defaultdict(float))
    tot_d = tot_n = 0.0
    tot_ex: dict[str, float] = defaultdict(float)

    for r in raw:
        den = _num(r.get("denominador"))
        num = _num(r.get("numerador"))
        extras = _extract_extras(meta, r)
        cat = r.get("Categoria")
        dep = r.get("Departamento")
        metrics = _metrics_row(
            meta,
            num,
            den,
            extras,
            categoria=str(cat) if cat else None,
            departamento=str(dep) if dep else None,
        )
        establecimientos.append(
            {
                "RED": r["RED"],
                "MICRORED": r["MICRORED"],
                "ESTABLECIMIENTO": r["ESTABLECIMIENTO"],
                **metrics,
            }
        )
        mk = (r["RED"], r["MICRORED"])
        mr_acc[mk]["den"] += den
        mr_acc[mk]["num"] += num
        red_acc[r["RED"]]["den"] += den
        red_acc[r["RED"]]["num"] += num
        for k, v in extras.items():
            mr_ex[mk][k] += v
            red_ex[r["RED"]][k] += v
            tot_ex[k] += v
        tot_d += den
        tot_n += num

    microredes = [
        {
            "RED": red_name,
            "MICRORED": micro_name,
            **_metrics_row(meta, acc["num"], acc["den"], dict(mr_ex[(red_name, micro_name)])),
        }
        for (red_name, micro_name), acc in sorted(
            mr_acc.items(), key=lambda x: (str(x[0][0]), str(x[0][1]))
        )
    ]
    redes = [
        {
            "RED": red_name,
            **_metrics_row(meta, acc["num"], acc["den"], dict(red_ex[red_name])),
        }
        for red_name, acc in sorted(red_acc.items(), key=lambda x: str(x[0]))
    ]
    total = _apply_metrics(meta, tot_n, tot_d, extras=dict(tot_ex))
    return {
        "anio": anio,
        "mes": (mes or "").upper() or None,
        "fuente": fuente,
        "kind": meta["kind"],
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
    aggs = _select_aggs(meta)
    try:
        with connections["cg"].cursor() as cur:
            cur.execute(
                f"""
                SELECT anio AS [año], UPPER(mes) AS MES, Fuente, {aggs}
                FROM {t} {where}
                GROUP BY anio, UPPER(mes), Fuente
                ORDER BY anio, {MES_ORDER}
                """,
                params,
            )
            raw = _rows(cur)
    except Exception as exc:  # noqa: BLE001
        raise HttpError(500, f"Error en resumen CG: {exc}") from exc

    picked: dict[tuple[Any, Any], dict[str, Any]] = {}
    for r in raw:
        key = (r.get("año"), r.get("MES"))
        picked[key] = _prefer_fuente_row(picked.get(key), r)

    data = []
    for r in sorted(
        picked.values(),
        key=lambda x: (
            int(x.get("año") or 0),
            _MES_RANK.get(_norm_mes(x.get("MES")) or "", 99),
        ),
    ):
        extras = _extract_extras(meta, r)
        m = _metrics_row(
            meta, _num(r.get("numerador")), _num(r.get("denominador")), extras
        )
        data.append(
            {
                "año": r.get("año"),
                "MES": r.get("MES"),
                "fuente": _canon_fuente(r.get("Fuente")),
                "total_denominador": m["denominador"],
                "total_numerador": m["numerador"],
                "avance_pct": m["avance_pct"],
                "cumplimiento_pct": m["cumplimiento_pct"],
            }
        )
    return {"data": data}


def get_config() -> dict[str, Any]:
    try:
        with connections["cg"].cursor() as cur:
            cur.execute(
                """
                SELECT ID, Fuente, Fecha
                FROM [Config]
                ORDER BY ID
                """
            )
            rows = _rows(cur)
    except Exception as exc:  # noqa: BLE001
        raise HttpError(500, f"Error al leer Config CG: {exc}") from exc

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
