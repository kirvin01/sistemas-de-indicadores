from typing import Optional

from ninja import Query, Router

from apps.accounts.security import auth_bearer, require_permission
from apps.patients import services
from apps.patients.schemas import AtencionListOut, PacienteListOut

router = Router(tags=["Pacientes"], auth=auth_bearer)


@router.get("/paciente", response=PacienteListOut, summary="Buscar paciente por documento")
def get_paciente(request, ndoc: str):
    require_permission(request.auth, "pacientes:read")
    return {"result": services.buscar_paciente(ndoc)}


@router.get(
    "/atenciones",
    response=AtencionListOut,
    summary="Atenciones HIS por año (mes/código opcionales)",
)
def get_atenciones(
    request,
    anio: int,
    ndoc: str,
    mes: Optional[int] = Query(None, description="Mes 1-12; omitir = todo el año"),
    codigo: Optional[str] = Query(
        None,
        description="Filtro por Codigo_Item; omitir o 'Todo' = todos los códigos",
    ),
    offset: int = Query(0),
    per_page: int = Query(25),
):
    require_permission(request.auth, "pacientes:read")
    return {
        "result": services.listar_atenciones(
            ndoc=ndoc,
            anio=anio,
            mes=mes,
            codigo=codigo,
            offset=offset,
            per_page=per_page,
        )
    }
