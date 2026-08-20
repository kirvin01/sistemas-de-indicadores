"""Catálogo Convenio de Gestión 2026 (DBCGESTION_26.ID_*_Web)."""

from __future__ import annotations

from typing import Any, Literal, NotRequired, TypedDict

Kind = Literal["ratio_pct", "ratio_raw", "inverse_pct", "dual_ratio", "rate_10k"]

# Indicadores con logro esperado móvil o segmentado (no meta fija en catálogo).
META_VARIABLE_SLUGS = frozenset({"cg10", "cg14", "cg17", "cg19", "cg21", "cg25"})


class IndicatorMeta(TypedDict):
    slug: str
    codigo: str
    nombre: str
    tabla: str
    den_col: str
    num_col: str
    kind: Kind
    umbral: float | None
    meta: float | None
    extras: list[str]
    grupo: str
    bloque: str
    descripcion: NotRequired[str]


def _i(
    slug: str,
    codigo: str,
    nombre: str,
    tabla: str,
    den_col: str,
    num_col: str,
    *,
    kind: Kind = "ratio_pct",
    umbral: float | None = None,
    meta: float | None = None,
    extras: list[str] | None = None,
    bloque: str,
    descripcion: str = "",
) -> IndicatorMeta:
    item: IndicatorMeta = {
        "slug": slug,
        "codigo": codigo,
        "nombre": nombre,
        "tabla": tabla,
        "den_col": den_col,
        "num_col": num_col,
        "kind": kind,
        "umbral": umbral,
        "meta": meta,
        "extras": extras or [],
        "grupo": "Convenio de Gestión 2026",
        "bloque": bloque,
    }
    if descripcion:
        item["descripcion"] = descripcion
    return item


INDICATORS: dict[str, IndicatorMeta] = {
    "cg01": _i(
        "cg01",
        "CG-01",
        "Recuperación de anemia en niños de 12 a 18 meses",
        "ID_01_Web",
        "den",
        "num_recup",
        umbral=40,
        meta=50,
        extras=["num", "num_sup_He", "num_dosaje", "num_t1", "num_T3"],
        bloque="Niñez y nutrición",
        descripcion=(
            "Porcentaje de niñas y niños de 12 a 18 meses, con diagnóstico de anemia "
            "entre los 6 y 11 meses, que se han recuperado. Umbral 40%, logro esperado 50%."
        ),
    ),
    "cg02": _i(
        "cg02",
        "CG-02",
        "Suplementación preventiva de hierro (6 a 11 meses)",
        "ID_02_Web",
        "den",
        "num",
        umbral=40,
        meta=70,
        extras=["num_term_ta", "num_ctrl_hb", "num_dosaje_fin"],
        bloque="Niñez y nutrición",
        descripcion=(
            "Niños de 6 a 11 meses que iniciaron suplementación con hierro, culminan "
            "6 meses y se mantienen sin anemia. Umbral 40%, logro esperado 70%."
        ),
    ),
    "cg03": _i(
        "cg03",
        "CG-03",
        "Tamizaje neonatal metabólico",
        "ID_03_Web",
        "den",
        "num",
        umbral=50,
        meta=80,
        bloque="Niñez y nutrición",
        descripcion="Recién nacidos con tamizaje neonatal metabólico. Umbral 50%, logro esperado 80%.",
    ),
    "cg04": _i(
        "cg04",
        "CG-04",
        "Mejora nutricional en menores de 2 años",
        "ID_04_Web",
        "den",
        "num",
        umbral=20,
        meta=50,
        extras=["num1", "num_2"],
        bloque="Niñez y nutrición",
        descripcion=(
            "Menores de 2 años con crecimiento inadecuado que mejoran tras seguimiento. "
            "Umbral 20%, logro esperado 50%."
        ),
    ),
    "cg05": _i(
        "cg05",
        "CG-05",
        "Vacunación completa a los 24 meses",
        "ID_05_Web",
        "Denominador",
        "Numerador",
        umbral=70,
        meta=85,
        bloque="Inmunizaciones",
        descripcion="Niñas/niños de 24 meses con vacunas para su edad. Umbral 70%, logro esperado ≥ 85%.",
    ),
    "cg06": _i(
        "cg06",
        "CG-06",
        "Vacunación oportuna BCG y Hepatitis B",
        "ID_06_Web",
        "den",
        "num",
        umbral=90,
        meta=95,
        extras=["Vacuna_BCG", "Vacuna_HVB"],
        bloque="Inmunizaciones",
        descripcion=(
            "Recién nacidos de parto institucional vacunados con BCG y Anti-Hepatitis B "
            "en las primeras 24 horas. Umbral 90%, logro esperado ≥ 95%."
        ),
    ),
    "cg07": _i(
        "cg07",
        "CG-07",
        "Tasa de éxito de tratamiento para TB sensible",
        "ID_07_Web",
        "den",
        "num",
        umbral=80,
        meta=90,
        bloque="TB y VIH",
        descripcion="Tasa de éxito de tratamiento TB sensible. Umbral 80%, logro esperado 90%.",
    ),
    "cg08": _i(
        "cg08",
        "CG-08",
        "Contactos de TB con TPTB completa",
        "ID_08_Web",
        "den",
        "num",
        bloque="TB y VIH",
        descripcion=(
            "Porcentaje de contactos de TB que culminan Terapia Preventiva para TB (TPTB). "
            "Ficha técnica sin umbral ni logro esperado definidos."
        ),
    ),
    "cg09": _i(
        "cg09",
        "CG-09",
        "TPTB en adultos con VIH en TAR",
        "ID_09_Web",
        "denominador",
        "numerador",
        umbral=65,
        meta=90,
        bloque="TB y VIH",
        descripcion=(
            "Cobertura de TPTB en personas adultas con VIH en TAR. Umbral 65%, logro esperado 90%."
        ),
    ),
    "cg10": _i(
        "cg10",
        "CG-10",
        "Procedimientos estomatológicos preventivos",
        "ID_10_Web",
        "Den",
        "Num",
        umbral=10,
        meta=None,
        extras=["HO_CUMPLE", "AN_CUMPLE", "FB_CUMPLE", "PD_CUMPLE", "AS_CUMPLE", "NUM_EOC_2026"],
        bloque="Salud bucal y SSR",
        descripcion=(
            "Niños de 6 meses a 6 años, 11 meses y 29 días con procedimientos preventivos. "
            "Umbral 10%. Logro esperado según EOC: <100→50%, 100–199→40%, 200–299→30%, "
            "300–399→25%, ≥400→20%."
        ),
    ),
    "cg11": _i(
        "cg11",
        "CG-11",
        "Acceso a métodos anticonceptivos modernos",
        "ID_11_Web",
        "Den",
        "Num",
        umbral=20,
        meta=45,
        extras=[
            "DIU",
            "SIU",
            "OralComb",
            "InyTrim",
            "InyMens",
            "Implantes",
            "PreservMasc",
            "PreservFem",
            "Ligadura",
            "Vasectomia",
        ],
        bloque="Salud bucal y SSR",
        descripcion=(
            "Personas que acceden a algún método anticonceptivo moderno. Umbral 20%, logro esperado 45%."
        ),
    ),
    "cg12": _i(
        "cg12",
        "CG-12",
        "APN en hospital de gestantes referidas por riesgo",
        "ID_12_Web",
        "Den",
        "Num",
        umbral=40,
        meta=80,
        bloque="Materno perinatal",
        descripcion=(
            "Gestantes con ≥2 APN en hospital referidas por factor de riesgo. Umbral 40%, logro esperado 80%."
        ),
    ),
    "cg13": _i(
        "cg13",
        "CG-13",
        "Paquete preventivo básico en gestantes",
        "ID_13_Web",
        "Den",
        "Num",
        umbral=30,
        meta=60,
        extras=["num_exa", "num_apn", "num_suple"],
        bloque="Materno perinatal",
        descripcion=(
            "Gestantes con paquete preventivo básico priorizado. Umbral 30%, logro esperado 60%."
        ),
    ),
    "cg14": _i(
        "cg14",
        "CG-14",
        "Inicio oportuno de tratamiento oncológico",
        "ID_14_Web",
        "Denominador",
        "Numerador",
        bloque="Oncología y VPH",
        descripcion=(
            "Personas con cánceres prevalentes que inician tratamiento oncológico en ≤37 días. "
            "Logro esperado por grupo IPRESS: A≥80%, B≥70%, C≥60%, D≥40%."
        ),
    ),
    "cg15": _i(
        "cg15",
        "CG-15",
        "Mamografía bilateral de tamizaje (40 a 69 años)",
        "ID_15_Web",
        "DENOMINADOR",
        "NUMERADOR",
        bloque="Oncología y VPH",
        descripcion=(
            "Mujeres de 40 a 69 años con mamografía bilateral de tamizaje. "
            "Ficha técnica sin umbral ni logro esperado detallados."
        ),
    ),
    "cg16": _i(
        "cg16",
        "CG-16",
        "Vacunación VPH en niños y niñas de 9 años",
        "ID_16_Web",
        "denominador",
        "numerador",
        umbral=80,
        meta=90,
        bloque="Oncología y VPH",
        descripcion=(
            "Niñas y niños de 9 años vacunados contra VPH. Umbral 80%, logro esperado ≥ 90%."
        ),
    ),
    "cg17": _i(
        "cg17",
        "CG-17",
        "Atenciones en medicina de rehabilitación (<5 años)",
        "ID_17_Web",
        "Den",
        "Num",
        umbral=25,
        meta=30,
        extras=["Atenciones"],
        bloque="Rehabilitación y salud mental",
        descripcion=(
            "Menores de 5 años con deficiencias o riesgo de discapacidad y ≥6 atenciones en UPSS "
            "de rehabilitación. Umbral 25%. Logro: 35% Lima Metropolitana, 30% Regional."
        ),
    ),
    "cg18": _i(
        "cg18",
        "CG-18",
        "Egresos por salud mental en UHSMA",
        "ID_18_Web",
        "den",
        "num",
        kind="ratio_raw",
        meta=30,
        bloque="Rehabilitación y salud mental",
        descripcion=(
            "Egresos por problemas de salud mental en hospitales con UHSMA. "
            "Logro esperado: 12 a 30 egresos por cama al año."
        ),
    ),
    "cg19": _i(
        "cg19",
        "CG-19",
        "Paquete estándar en personas con depresión",
        "ID_19_Web",
        "DENOMINADOR",
        "NUMERADOR",
        extras=["CUMPLE_03_ATC_SALUD_MENTAL", "CUMPLE_01_ATC_PSICOEDUCACION"],
        bloque="Rehabilitación y salud mental",
        descripcion=(
            "Personas con diagnóstico de depresión que reciben paquete estándar. "
            "Logro esperado según volumen: >150→30%, 101–150→40%, 60–100→50%, 40–59→60%."
        ),
    ),
    "cg20": _i(
        "cg20",
        "CG-20",
        "Porcentaje de resolutividad",
        "ID_20_Web",
        "den",
        "num",
        kind="inverse_pct",
        meta=5,
        bloque="Hospitales y gestión",
        descripcion=(
            "Desempeño inverso. Logro esperado 5%. Si logro alcanzado ≤5%, cumplimiento 100%."
        ),
    ),
    "cg21": _i(
        "cg21",
        "CG-21",
        "Rendimiento de sala de operaciones",
        "ID_21_Web",
        "Den",
        "Num",
        kind="ratio_raw",
        meta=None,
        bloque="Hospitales y gestión",
        descripcion=(
            "Cirugías electivas por sala-día. Logro: II con 1 sala=60; II con ≥2 salas o III=85."
        ),
    ),
    "cg22": _i(
        "cg22",
        "CG-22",
        "Porcentaje de cirugías suspendidas",
        "ID_22_Web",
        "total_cirugias_programadas",
        "total_cirugias_suspendidas",
        kind="inverse_pct",
        bloque="Hospitales y gestión",
        descripcion=(
            "Cirugías suspendidas sobre programadas (desempeño inverso). "
            "Ficha técnica sin umbral ni logro esperado definidos."
        ),
    ),
    "cg23": _i(
        "cg23",
        "CG-23",
        "Porcentaje de ocupación cama",
        "ID_23_Web",
        "Den_Hosp",
        "Num_Hosp",
        kind="dual_ratio",
        meta=80,
        extras=["Den_UCI", "Num_UCI"],
        bloque="Hospitales y gestión",
        descripcion="Logro esperado: hospitalización 80%, UCI 90%.",
    ),
    "cg24": _i(
        "cg24",
        "CG-24",
        "Intervalo de sustitución cama",
        "ID_24_Web",
        "Den",
        "Num",
        kind="ratio_raw",
        meta=2,
        extras=["Dias_Renoxi"],
        bloque="Hospitales y gestión",
        descripcion="Días promedio que una cama permanece libre. Logro esperado: 0 a 2 días.",
    ),
    "cg25": _i(
        "cg25",
        "CG-25",
        "Espera en consulta externa de referidos",
        "ID_25_Web",
        "den",
        "num",
        kind="ratio_raw",
        bloque="Hospitales y gestión",
        descripcion=(
            "Días de espera máximos: I-4=20, Hospital II=35, III=45, Institutos Especializados=22."
        ),
    ),
    "cg26": _i(
        "cg26",
        "CG-26",
        "Utilización de consultorios externos de medicina",
        "ID_26_Web",
        "DENOMINADOR_CONSULTORIO_FISICO",
        "NUMERADOR_CONSULTORIO_FUNCIONAL",
        kind="ratio_raw",
        meta=2,
        bloque="Hospitales y gestión",
        descripcion="Turnos por consultorio físico (≥2 turnos, 12 h/día).",
    ),
    "cg32": _i(
        "cg32",
        "CG-32",
        "Tasa de uso de servicios de telemedicina",
        "ID_32_Web",
        "den",
        "Num_Pond",
        kind="rate_10k",
        umbral=10,
        meta=100,
        extras=["TeleInterconsultas", "teleconsultas", "telemonitoreos", "num"],
        bloque="Telemedicina",
        descripcion="Tasa por 10 000 habitantes (Num_Pond/den×10 000). Umbral 10, logro esperado 100.",
    ),
}


def list_indicators() -> list[dict[str, Any]]:
    return [
        {
            "slug": m["slug"],
            "codigo": m["codigo"],
            "nombre": m["nombre"],
            "grupo": m["grupo"],
            "bloque": m["bloque"],
            "meta_pct": m["meta"] if m["meta"] is not None else 0,
            "meta_variable": m["slug"] in META_VARIABLE_SLUGS,
            "umbral": m["umbral"],
            "kind": m["kind"],
            "patron": "cg-standard",
            "descripcion": m.get("descripcion", ""),
        }
        for m in INDICATORS.values()
    ]


def get_indicator(slug: str) -> IndicatorMeta | None:
    return INDICATORS.get(slug)
