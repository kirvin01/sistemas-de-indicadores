from typing import Optional

from ninja import Query, Router
from ninja.errors import HttpError

from apps.accounts.security import auth_bearer, require_permission
from apps.fed import catalog, standard

router = Router(tags=["FED"], auth=auth_bearer)


def _meta(slug: str):
    meta = catalog.get_indicator(slug)
    if not meta:
        raise HttpError(404, f"Indicador FED '{slug}' no encontrado.")
    return meta


@router.get("/indicadores", summary="Catálogo de indicadores FED")
def listar_indicadores(request):
    require_permission(request.auth, "fed:read")
    return {"result": catalog.list_indicators()}


@router.get("/config", summary="Fuentes y fechas de corte (tabla config)")
def listar_config(request):
    require_permission(request.auth, "fed:read")
    return standard.get_config()


@router.get("/{slug}/filtros", summary="Filtros del indicador")
def filtros(request, slug: str):
    require_permission(request.auth, "fed:read")
    return standard.get_filtros(_meta(slug))


@router.get("/{slug}/tabla-completa", summary="Datos territoriales")
def tabla_completa(
    request,
    slug: str,
    anio: int,
    mes: str,
    departamento: Optional[str] = Query(None),
    provincia: Optional[str] = Query(None),
    red: Optional[str] = Query(None),
    microred: Optional[str] = Query(None),
    categoria: Optional[str] = Query(None),
):
    require_permission(request.auth, "fed:read")
    return standard.get_tabla_completa(
        _meta(slug),
        anio=anio,
        mes=mes,
        departamento=departamento,
        provincia=provincia,
        red=red,
        microred=microred,
        categoria=categoria,
    )


@router.get("/{slug}/tabla-redes", summary="Datos por redes")
def tabla_redes(
    request,
    slug: str,
    anio: int,
    mes: str,
    departamento: Optional[str] = Query(None),
    provincia: Optional[str] = Query(None),
    red: Optional[str] = Query(None),
    microred: Optional[str] = Query(None),
    categoria: Optional[str] = Query(None),
):
    require_permission(request.auth, "fed:read")
    return standard.get_tabla_redes(
        _meta(slug),
        anio=anio,
        mes=mes,
        departamento=departamento,
        provincia=provincia,
        red=red,
        microred=microred,
        categoria=categoria,
    )


@router.get("/{slug}/resumen", summary="Serie mensual del indicador")
def resumen(
    request,
    slug: str,
    anio: Optional[int] = Query(None),
    departamento: Optional[str] = Query(None),
    red: Optional[str] = Query(None),
):
    require_permission(request.auth, "fed:read")
    return standard.get_resumen(
        _meta(slug),
        anio=anio,
        departamento=departamento,
        red=red,
    )
