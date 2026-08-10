"""Catálogo de indicadores FED disponibles en la API."""

from __future__ import annotations

from typing import Any, TypedDict


class IndicatorMeta(TypedDict):
    slug: str
    codigo: str
    nombre: str
    tabla: str
    meta_pct: float
    grupo: str  # Compromisos de Gestión | Metas de Cobertura
    bloque: str  # Subgrupo de menú / hub


# Indicadores con patrón estándar: filtros / tabla-completa / tabla-redes / resumen
STANDARD_INDICATORS: dict[str, IndicatorMeta] = {
    # ── Compromisos de Gestión · SI-01 ────────────────────────────────────────
    "si0101": {
        "slug": "si0101",
        "codigo": "SI-01.01",
        "nombre": "Gestantes con 1ra APN",
        "tabla": "IRVIN_FED_SI_01_01",
        "meta_pct": 80.0,
        "grupo": "Compromisos de Gestión",
        "bloque": "Gestantes con suplementación de hierro y dosaje de hemoglobina",
    },
    "si0102": {
        "slug": "si0102",
        "codigo": "SI-01.02",
        "nombre": "Gestantes con anemia",
        "tabla": "IRVIN_FED_SI_01_02",
        "meta_pct": 80.0,
        "grupo": "Compromisos de Gestión",
        "bloque": "Gestantes con suplementación de hierro y dosaje de hemoglobina",
    },
    "si0103": {
        "slug": "si0103",
        "codigo": "SI-01.03",
        "nombre": "Mujeres con parto institucional sin anemia",
        "tabla": "IRVIN_FED_SI_01_03",
        "meta_pct": 80.0,
        "grupo": "Compromisos de Gestión",
        "bloque": "Gestantes con suplementación de hierro y dosaje de hemoglobina",
    },
    # ── Compromisos de Gestión · SI-02 ────────────────────────────────────────
    "si0201": {
        "slug": "si0201",
        "codigo": "SI-02.01",
        "nombre": "Niños de 6 meses",
        "tabla": "IRVIN_FED_SI_02_01",
        "meta_pct": 80.0,
        "grupo": "Compromisos de Gestión",
        "bloque": "Niñas y niños < 12 meses con hierro y dosaje de hemoglobina",
    },
    "si0202": {
        "slug": "si0202",
        "codigo": "SI-02.02",
        "nombre": "Niños de 6 meses prematuros / bajo peso",
        "tabla": "IRVIN_FED_SI_02_02",
        "meta_pct": 80.0,
        "grupo": "Compromisos de Gestión",
        "bloque": "Niñas y niños < 12 meses con hierro y dosaje de hemoglobina",
    },
    "si0203": {
        "slug": "si0203",
        "codigo": "SI-02.03",
        "nombre": "Niños de 12 meses con anemia",
        "tabla": "IRVIN_FED_SI_02_03",
        "meta_pct": 80.0,
        "grupo": "Compromisos de Gestión",
        "bloque": "Niñas y niños < 12 meses con hierro y dosaje de hemoglobina",
    },
    "si0204": {
        "slug": "si0204",
        "codigo": "SI-02.04",
        "nombre": "Niños de 12 meses sin anemia",
        "tabla": "IRVIN_FED_SI_02_04",
        "meta_pct": 80.0,
        "grupo": "Compromisos de Gestión",
        "bloque": "Niñas y niños < 12 meses con hierro y dosaje de hemoglobina",
    },
    # ── Compromisos de Gestión · SI-03 ────────────────────────────────────────
    "si0301": {
        "slug": "si0301",
        "codigo": "SI-03.01",
        "nombre": "Adolescentes de 12 a 17 años",
        "tabla": "IRVIN_FED_SI_03_01",
        "meta_pct": 80.0,
        "grupo": "Compromisos de Gestión",
        "bloque": "Adolescentes mujeres de 12 a 17 años con dosaje de hemoglobina",
    },
    "si0302": {
        "slug": "si0302",
        "codigo": "SI-03.02",
        "nombre": "Adolescentes de 12 a 17 años sin anemia",
        "tabla": "IRVIN_FED_SI_03_02",
        "meta_pct": 80.0,
        "grupo": "Compromisos de Gestión",
        "bloque": "Adolescentes mujeres de 12 a 17 años con dosaje de hemoglobina",
    },
    # ── Compromisos de Gestión · VI-01 ────────────────────────────────────────
    "vi0101": {
        "slug": "vi0101",
        "codigo": "VI-01.01",
        "nombre": "Gestantes con tamizaje de violencia",
        "tabla": "IRVIN_FED_VI_01_01",
        "meta_pct": 80.0,
        "grupo": "Compromisos de Gestión",
        "bloque": "VI-01 Gestantes con tamizaje positivo de violencia y paquete terapéutico",
    },
    "vi0102": {
        "slug": "vi0102",
        "codigo": "VI-01.02",
        "nombre": "Gestantes con diagnóstico de violencia",
        "tabla": "IRVIN_FED_VI_01_02",
        "meta_pct": 80.0,
        "grupo": "Compromisos de Gestión",
        "bloque": "VI-01 Gestantes con tamizaje positivo de violencia y paquete terapéutico",
    },
    # ── Metas de Cobertura · MC ───────────────────────────────────────────────
    "mc0101": {
        "slug": "mc0101",
        "codigo": "MC-01.01",
        "nombre": "Paquete integrado de servicios para gestantes",
        "tabla": "IRVIN_FED_MC_01_01",
        "meta_pct": 40.7,
        "grupo": "Metas de Cobertura",
        "bloque": "Metas de Cobertura",
    },
    "mc0201": {
        "slug": "mc0201",
        "codigo": "MC-02.01",
        "nombre": "Paquete integrado de servicios para niñas y niños < 12 meses",
        "tabla": "IRVIN_FED_MC_02_01",
        "meta_pct": 40.7,
        "grupo": "Metas de Cobertura",
        "bloque": "Metas de Cobertura",
    },
    "mc0301": {
        "slug": "mc0301",
        "codigo": "MC-03.01",
        "nombre": "Paquete básico de atención del recién nacido",
        "tabla": "IRVIN_FED_MC_03_01",
        "meta_pct": 40.7,
        "grupo": "Metas de Cobertura",
        "bloque": "Metas de Cobertura",
    },
}


def list_indicators() -> list[dict[str, Any]]:
    return [
        {
            "slug": m["slug"],
            "codigo": m["codigo"],
            "nombre": m["nombre"],
            "grupo": m["grupo"],
            "bloque": m["bloque"],
            "meta_pct": m["meta_pct"],
            "patron": "standard",
        }
        for m in STANDARD_INDICATORS.values()
    ]


def get_indicator(slug: str) -> IndicatorMeta | None:
    return STANDARD_INDICATORS.get(slug)
