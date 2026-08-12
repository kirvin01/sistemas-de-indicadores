"""Catálogo de indicadores Nutrición (DBNUTRICION)."""

from __future__ import annotations

from typing import Any, Literal, TypedDict


class IndicatorMeta(TypedDict):
    slug: str
    codigo: str
    nombre: str
    tabla: str
    anio_col: str
    mes_col: str
    eess_key: Literal["renaes", "ESTABLECIMIENTO"]
    grupo: str


INDICATORS: dict[str, IndicatorMeta] = {
    "n01": {
        "slug": "n01",
        "codigo": "N-01",
        "nombre": "Suplementación de Hierro",
        "tabla": "N1_Suplementacion_Hierro_menor_3_años",
        "anio_col": "año",
        "mes_col": "mes",
        "eess_key": "renaes",
        "grupo": "Nutrición",
    },
    "n02": {
        "slug": "n02",
        "codigo": "N-02",
        "nombre": "Suplemento Vitamina A",
        "tabla": "N2_Suplementacion_Vitamina_A_en_menores_5_años",
        "anio_col": "AÑO",
        "mes_col": "mes",
        "eess_key": "ESTABLECIMIENTO",
        "grupo": "Nutrición",
    },
    "n03": {
        "slug": "n03",
        "codigo": "N-03",
        "nombre": "Dosaje de Hemoglobina",
        "tabla": "N3_Dosaje_de_hemoglobina_en_menores_3_años",
        "anio_col": "AÑO",
        "mes_col": "mes",
        "eess_key": "renaes",
        "grupo": "Nutrición",
    },
    "n04": {
        "slug": "n04",
        "codigo": "N-04",
        "nombre": "Control de Suplementación",
        "tabla": "N4_Seguimiento_de_cumplimiento_en_niños_menores_3_años",
        "anio_col": "AÑO",
        "mes_col": "MES",
        "eess_key": "renaes",
        "grupo": "Nutrición",
    },
    "n05": {
        "slug": "n05",
        "codigo": "N-05",
        "nombre": "Tratamiento de Anemia",
        "tabla": "N5_Tratamiento_completo_de_anemia_de_menor_3_años",
        "anio_col": "AÑO",
        "mes_col": "MES",
        "eess_key": "renaes",
        "grupo": "Nutrición",
    },
}


def list_indicators() -> list[dict[str, Any]]:
    return [
        {
            "slug": m["slug"],
            "codigo": m["codigo"],
            "nombre": m["nombre"],
            "grupo": m["grupo"],
            "bloque": m["grupo"],
            "patron": "nutricion-redes",
        }
        for m in INDICATORS.values()
    ]


def get_indicator(slug: str) -> IndicatorMeta | None:
    return INDICATORS.get(slug)
