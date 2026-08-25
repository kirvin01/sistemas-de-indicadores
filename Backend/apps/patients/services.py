"""Consultas de solo lectura contra DBGERESA (HIS / maestro pacientes)."""

from __future__ import annotations

from datetime import date, datetime
from typing import Any

from django.db import connections
from ninja.errors import HttpError

# Fallback cuando MAESTRO_HIS_TIPO_DOC no tiene filas
_TIPO_DOC_FALLBACK = {
    "1": "DNI",
    "2": "CE",
    "3": "PAS",
    "4": "DI",
    "5": "CNV",
    "6": "SD",
}


def _fmt_date(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, datetime):
        return value.strftime("%d-%m-%Y")
    if isinstance(value, date):
        return value.strftime("%d-%m-%Y")
    return str(value)


def _rows(cursor) -> list[dict[str, Any]]:
    columns = [col[0] for col in cursor.description]
    return [dict(zip(columns, row, strict=True)) for row in cursor.fetchall()]


def buscar_paciente(ndoc: str) -> list[dict[str, Any]]:
    ndoc = (ndoc or "").strip()
    if not ndoc:
        raise HttpError(400, "Debe indicar el número de documento.")

    sql = """
        SELECT DISTINCT TOP 10
            COALESCE(
                NULLIF(LTRIM(RTRIM(T.Abrev_Tipo_Doc)), ''),
                CAST(P.Id_Tipo_Documento AS NVARCHAR(10)),
                'DOC'
            ) AS abrev_tipo_doc,
            P.Numero_Documento AS numero_documento,
            P.Fecha_Nacimiento AS fecha_nacimiento,
            P.Genero AS genero,
            DATEDIFF(YEAR, P.Fecha_Nacimiento, GETDATE()) AS edad
        FROM MAESTRO_PACIENTE AS P
        LEFT JOIN MAESTRO_HIS_TIPO_DOC AS T
            ON T.Id_Tipo_Documento = P.Id_Tipo_Documento
        WHERE P.Numero_Documento = %s
    """
    try:
        with connections["geresa"].cursor() as cursor:
            cursor.execute(sql, [ndoc])
            rows = _rows(cursor)
    except Exception as exc:  # noqa: BLE001 — error de BD externo
        raise HttpError(500, f"Error en la base de datos: {exc}") from exc

    result: list[dict[str, Any]] = []
    for r in rows:
        tipo = str(r.get("abrev_tipo_doc") or "").strip()
        tipo = _TIPO_DOC_FALLBACK.get(tipo, tipo)
        result.append(
            {
                "abrev_tipo_doc": tipo or "DOC",
                "numero_documento": str(r.get("numero_documento") or ""),
                "fecha_nacimiento": _fmt_date(r.get("fecha_nacimiento")),
                "genero": str(r.get("genero") or ""),
                "edad": int(r.get("edad") or 0),
            }
        )
    return result


def listar_atenciones(
    *,
    ndoc: str,
    anio: int,
    mes: int | None = None,
    codigo: str | None = None,
    offset: int = 0,
    per_page: int = 25,
) -> list[dict[str, Any]]:
    ndoc = (ndoc or "").strip()
    if not ndoc:
        raise HttpError(400, "Debe indicar el número de documento.")
    if anio < 2000 or anio > 2100:
        raise HttpError(400, "Año inválido.")
    if mes is not None and (mes < 1 or mes > 12):
        raise HttpError(400, "Mes inválido.")
    if offset < 0:
        raise HttpError(400, "offset inválido.")
    if per_page < 1 or per_page > 1000:
        raise HttpError(400, "per_page debe estar entre 1 y 1000.")

    codigo = (codigo or "").strip()
    if codigo.lower() in {"", "todo", "todos"}:
        codigo = ""

    extras: list[str] = []
    params: list[Any] = [ndoc, anio]

    if mes is not None:
        extras.append("AND mes = %s")
        params.append(mes)

    if codigo:
        extras.append("AND Codigo LIKE %s")
        params.append(f"%{codigo}%")

    where_extra = "\n          ".join(extras)

    sql = f"""
        SELECT
            CAST(Id_Cita AS NVARCHAR(50)) AS id_cita,
            CONVERT(varchar(10), FECHA_ATENCION, 103) AS f_atencion,
            ISNULL(Codigo, '') AS codigo_item,
            ISNULL(Descripcion_Item, '') AS descripcion_item,
            ISNULL(LAB1, '') AS lab1,
            ISNULL(LAB2, '') AS lab2,
            ISNULL(LAB3, '') AS lab3,
            CONVERT(varchar(19), F_REGISTRO, 120) AS f_registro,
            ISNULL(CONVERT(varchar(19), F_MODIFICACION, 120), '') AS f_modificacion,
            ISNULL(ESTABLECIMIENTO, '') AS establecimiento,
            CONCAT(ISNULL(DISTRITO, ''), ' | ', ISNULL(POVINCIA, '')) AS distrito_provincia,
            ISNULL(SISTEMA, 'HISMINSA') AS sistema,
            ISNULL(registrador, '') AS registrador
        FROM HisAtenciones
        WHERE NUMERO = %s
          AND anio = %s
          {where_extra}
        ORDER BY FECHA_ATENCION DESC
        OFFSET %s ROWS FETCH NEXT %s ROWS ONLY
    """
    params.extend([offset, per_page])
    try:
        with connections["geresa"].cursor() as cursor:
            cursor.execute(sql, params)
            rows = _rows(cursor)
    except Exception as exc:  # noqa: BLE001
        raise HttpError(500, f"Error en la base de datos: {exc}") from exc

    result: list[dict[str, Any]] = []
    for i, r in enumerate(rows):
        result.append(
            {
                "n": offset + i + 1,
                "id_cita": str(r.get("id_cita") or ""),
                "f_atencion": str(r.get("f_atencion") or ""),
                "codigo_item": str(r.get("codigo_item") or ""),
                "descripcion_item": str(r.get("descripcion_item") or ""),
                "lab1": str(r.get("lab1") or ""),
                "lab2": str(r.get("lab2") or ""),
                "lab3": str(r.get("lab3") or ""),
                "f_registro": str(r.get("f_registro") or ""),
                "f_modificacion": str(r.get("f_modificacion") or ""),
                "establecimiento": str(r.get("establecimiento") or ""),
                "distrito_provincia": str(r.get("distrito_provincia") or ""),
                "sistema": str(r.get("sistema") or ""),
                "registrador": str(r.get("registrador") or "").strip(),
            }
        )
    return result
