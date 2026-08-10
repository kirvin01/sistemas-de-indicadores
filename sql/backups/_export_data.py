"""Exporta tablas de negocio de DBSISINDICADORE a SQL INSERT."""
from __future__ import annotations

import os
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[2] / "Backend"
sys.path.insert(0, str(BACKEND))
os.chdir(BACKEND)

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.db import connection  # noqa: E402

BIZ_TABLES = ["permisos", "perfiles", "perfil_permisos", "usuarios"]
OUT = Path(__file__).with_name("DBSISINDICADORE_data.sql")


def qident(name: str) -> str:
    return "[" + name.replace("]", "]]") + "]"


def sql_literal(value: object) -> str:
    if value is None:
        return "NULL"
    if isinstance(value, bool):
        return "1" if value else "0"
    if isinstance(value, (int, float)):
        return str(value)
    text = str(value).replace("'", "''")
    return f"'{text}'"


def main() -> None:
    lines: list[str] = [
        "-- Copia portable DBSISINDICADORE (tablas de negocio)",
        "-- No incluye DBFED2026 ni DBGERESA (datos externos / sensibles).",
        "-- Uso: aplicar 00_create_database.sql + 01_schema_accounts.sql, luego este archivo.",
        "SET NOCOUNT ON;",
        "SET XACT_ABORT ON;",
        "BEGIN TRAN;",
        "",
    ]

    with connection.cursor() as cur:
        for table in BIZ_TABLES:
            cur.execute(f"SELECT * FROM {qident(table)}")
            cols = [c[0] for c in cur.description]
            rows = cur.fetchall()
            lines.append(f"-- {table}: {len(rows)} filas")
            lines.append(f"DELETE FROM {qident(table)};")
            if rows:
                col_list = ", ".join(qident(c) for c in cols)
                for row in rows:
                    values = ", ".join(sql_literal(v) for v in row)
                    lines.append(
                        f"INSERT INTO {qident(table)} ({col_list}) VALUES ({values});"
                    )
            lines.append("")

    lines.append("COMMIT;")
    OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Wrote {OUT} ({OUT.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
