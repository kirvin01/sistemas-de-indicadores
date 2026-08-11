from ninja import NinjaAPI, Router

from apps.accounts import services
from apps.accounts.models import Usuario
from apps.accounts.schemas import (
    ChangePasswordIn,
    ForgotPasswordIn,
    HealthOut,
    LoginIn,
    MeOut,
    MessageOut,
    PerfilCreateIn,
    PerfilOut,
    PerfilSelfIn,
    PerfilUpdateIn,
    PermisoOut,
    ResetPasswordIn,
    SesionIngresoListOut,
    TokenOut,
    UsuarioCreateIn,
    UsuarioOut,
    UsuarioUpdateIn,
)
from apps.accounts.security import auth_bearer, require_permission
from apps.patients.api import router as patients_router
from apps.fed.api import router as fed_router

api = NinjaAPI(
    title="Sistemas de Indicadores GERESA CUSCO",
    version="0.5.0",
    description="API Django Ninja — auth, usuarios, perfiles, pacientes e indicadores FED",
)

auth_router = Router(tags=["Autenticación"])
users_router = Router(tags=["Usuarios"], auth=auth_bearer)
profiles_router = Router(tags=["Perfiles"], auth=auth_bearer)


def _client_ip(request) -> str | None:
    xff = request.META.get("HTTP_X_FORWARDED_FOR")
    if xff:
        return xff.split(",")[0].strip()[:64]
    addr = request.META.get("REMOTE_ADDR")
    return (addr or "")[:64] or None


@api.get("/health", response=HealthOut, tags=["Sistema"])
def health(request):
    count = Usuario.objects.count()
    return {
        "status": "ok",
        "app": "Sistemas de Indicadores GERESA CUSCO",
        "database": f"DBSISINDICADORE (usuarios={count})",
    }


@auth_router.post("/login", response=TokenOut)
def login(request, payload: LoginIn):
    token, expires_in, debe = services.login(
        payload.username.strip(),
        payload.password,
        ip=_client_ip(request),
    )
    return {
        "access_token": token,
        "token_type": "bearer",
        "expires_in": expires_in,
        "debe_cambiar_password": debe,
    }


@auth_router.get("/me", response=MeOut, auth=auth_bearer)
def me(request):
    return services.me_payload(request.auth)


@auth_router.put("/me/perfil", response=MeOut, auth=auth_bearer)
def actualizar_mi_perfil(request, payload: PerfilSelfIn):
    return services.update_my_perfil(
        request.auth,
        correo=payload.correo,
        celular=payload.celular,
        red=payload.red,
        cargo=payload.cargo,
    )


@auth_router.put("/me/password", response=MessageOut, auth=auth_bearer)
def cambiar_mi_password(request, payload: ChangePasswordIn):
    services.change_my_password(
        request.auth,
        current_password=payload.current_password,
        new_password=payload.new_password,
    )
    return {"message": "Contraseña actualizada correctamente"}


@auth_router.post("/forgot-password", response=MessageOut)
def forgot_password(request, payload: ForgotPasswordIn):
    msg = services.forgot_password(payload.correo)
    return {"message": msg}


@auth_router.post("/reset-password", response=MessageOut)
def reset_password(request, payload: ResetPasswordIn):
    services.reset_password(payload.token, payload.password)
    return {"message": "Contraseña restablecida. Ya puede iniciar sesión."}


@auth_router.get("/sesiones", response=SesionIngresoListOut, auth=auth_bearer)
def listar_sesiones(
    request,
    username: str | None = None,
    desde: str | None = None,
    hasta: str | None = None,
    offset: int = 0,
    per_page: int = 25,
    limit: int | None = None,
):
    require_permission(request.auth, "admin:sesiones")
    return services.list_sesiones(
        username=username,
        desde=desde,
        hasta=hasta,
        offset=offset,
        per_page=per_page,
        limit=limit,
    )


@users_router.get("", response=list[UsuarioOut])
def listar_usuarios(request):
    require_permission(request.auth, "admin:users")
    return services.list_usuarios()


@users_router.post("", response=UsuarioOut)
def crear_usuario(request, payload: UsuarioCreateIn):
    require_permission(request.auth, "admin:users")
    return services.create_usuario(
        username=payload.username,
        password=payload.password,
        profile_id=payload.profile_id,
        disabled=payload.disabled,
        actor=request.auth.username,
        correo=payload.correo,
    )


@users_router.put("/{user_id}", response=UsuarioOut)
def editar_usuario(request, user_id: int, payload: UsuarioUpdateIn):
    require_permission(request.auth, "admin:users")
    return services.update_usuario(
        user_id=user_id,
        username=payload.username,
        profile_id=payload.profile_id,
        disabled=payload.disabled,
        password=payload.password,
        actor=request.auth.username,
        correo=payload.correo,
    )


@users_router.delete("/{user_id}", response=MessageOut)
def eliminar_usuario(request, user_id: int):
    require_permission(request.auth, "admin:users")
    services.delete_usuario(user_id, actor=request.auth.username)
    return {"message": "Usuario eliminado correctamente"}


@profiles_router.get("/permisos", response=list[PermisoOut])
def listar_permisos(request):
    require_permission(request.auth, "admin:profiles")
    return services.list_permisos()


@profiles_router.get("", response=list[PerfilOut])
def listar_perfiles(request):
    codes = set(request.auth.permission_codes)
    if "*" not in codes and "admin:users" not in codes and "admin:profiles" not in codes:
        require_permission(request.auth, "admin:profiles")
    solo_activos = "admin:profiles" not in codes and "*" not in codes
    return services.list_perfiles(solo_activos=solo_activos)


@profiles_router.post("", response=PerfilOut)
def crear_perfil(request, payload: PerfilCreateIn):
    require_permission(request.auth, "admin:profiles")
    return services.create_perfil(
        codigo=payload.codigo,
        nombre=payload.nombre,
        activo=payload.activo,
        permisos=payload.permisos,
        actor=request.auth.username,
    )


@profiles_router.put("/{perfil_id}", response=PerfilOut)
def editar_perfil(request, perfil_id: int, payload: PerfilUpdateIn):
    require_permission(request.auth, "admin:profiles")
    return services.update_perfil(
        perfil_id=perfil_id,
        nombre=payload.nombre,
        activo=payload.activo,
        permisos=payload.permisos,
        actor=request.auth.username,
    )


api.add_router("/auth", auth_router)
api.add_router("/usuarios", users_router)
api.add_router("/perfiles", profiles_router)
api.add_router("/", patients_router)
api.add_router("/fed", fed_router)
