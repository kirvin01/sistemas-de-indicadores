from ninja import NinjaAPI, Router

from apps.accounts import services
from apps.accounts.models import Usuario
from apps.accounts.schemas import (
    HealthOut,
    LoginIn,
    MeOut,
    MessageOut,
    PerfilCreateIn,
    PerfilOut,
    PerfilUpdateIn,
    PermisoOut,
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
    version="0.4.0",
    description="API Django Ninja — auth, usuarios, perfiles, pacientes e indicadores FED",
)

auth_router = Router(tags=["Autenticación"])
users_router = Router(tags=["Usuarios"], auth=auth_bearer)
profiles_router = Router(tags=["Perfiles"], auth=auth_bearer)


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
    token, expires_in = services.login(payload.username.strip(), payload.password)
    return {"access_token": token, "token_type": "bearer", "expires_in": expires_in}


@auth_router.get("/me", response=MeOut, auth=auth_bearer)
def me(request):
    return services.me_payload(request.auth)


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
    # Lectura para formularios de usuario: admin:users o admin:profiles
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
