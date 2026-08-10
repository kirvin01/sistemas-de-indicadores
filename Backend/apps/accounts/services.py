"""Casos de uso: auth, usuarios y perfiles."""

from __future__ import annotations

from django.db import transaction
from django.utils import timezone
from ninja.errors import HttpError

from apps.accounts.models import AuditoriaAdmin, Perfil, PerfilPermiso, Permiso, Usuario
from apps.accounts.security import create_access_token, hash_password, verify_password


def audit(actor: str, accion: str, entidad: str, entidad_id: int | None = None, detalle: str | None = None) -> None:
    AuditoriaAdmin.objects.create(
        actor_username=actor,
        accion=accion,
        entidad=entidad,
        entidad_id=entidad_id,
        detalle=detalle,
        creado_en=timezone.now(),
    )


def login(username: str, password: str) -> tuple[str, int]:
    user = (
        Usuario.objects.select_related("perfil")
        .prefetch_related("perfil__permisos")
        .filter(username=username)
        .first()
    )
    if not user or not verify_password(password, user.hashed_password):
        raise HttpError(401, "Usuario o contraseña incorrectos.")
    if user.disabled:
        raise HttpError(403, "Usuario deshabilitado.")
    return create_access_token(user)


def me_payload(user: Usuario) -> dict:
    return {
        "id": user.id,
        "username": user.username,
        "profile": user.perfil.codigo,
        "profile_id": user.perfil_id,
        "permissions": user.permission_codes,
        "disabled": user.disabled,
    }


def list_permisos() -> list[Permiso]:
    return list(Permiso.objects.all().order_by("codigo"))


def perfil_to_out(perfil: Perfil) -> dict:
    return {
        "id": perfil.id,
        "codigo": perfil.codigo,
        "nombre": perfil.nombre,
        "activo": perfil.activo,
        "permisos": list(perfil.permisos.values_list("codigo", flat=True)),
    }


def list_perfiles(solo_activos: bool = False) -> list[dict]:
    qs = Perfil.objects.prefetch_related("permisos").order_by("nombre")
    if solo_activos:
        qs = qs.filter(activo=True)
    return [perfil_to_out(p) for p in qs]


def _resolve_permisos(codigos: list[str]) -> list[Permiso]:
    if not codigos:
        return []
    found = list(Permiso.objects.filter(codigo__in=codigos))
    if len(found) != len(set(codigos)):
        faltan = set(codigos) - {p.codigo for p in found}
        raise HttpError(400, f"Permisos desconocidos: {', '.join(sorted(faltan))}")
    return found


@transaction.atomic
def create_perfil(codigo: str, nombre: str, activo: bool, permisos: list[str], actor: str) -> dict:
    codigo = codigo.strip().lower()
    if Perfil.objects.filter(codigo=codigo).exists():
        raise HttpError(400, "Ya existe un perfil con ese código.")
    perfil = Perfil.objects.create(
        codigo=codigo,
        nombre=nombre.strip(),
        activo=activo,
        creado_en=timezone.now(),
    )
    for perm in _resolve_permisos(permisos):
        PerfilPermiso.objects.create(perfil=perfil, permiso=perm)
    audit(actor, "create", "perfil", perfil.id, f"codigo={codigo}")
    return perfil_to_out(Perfil.objects.prefetch_related("permisos").get(pk=perfil.pk))


@transaction.atomic
def update_perfil(perfil_id: int, nombre: str, activo: bool, permisos: list[str], actor: str) -> dict:
    perfil = Perfil.objects.filter(pk=perfil_id).first()
    if not perfil:
        raise HttpError(404, "Perfil no encontrado.")
    perfil.nombre = nombre.strip()
    perfil.activo = activo
    perfil.save(update_fields=["nombre", "activo"])
    PerfilPermiso.objects.filter(perfil=perfil).delete()
    for perm in _resolve_permisos(permisos):
        PerfilPermiso.objects.create(perfil=perfil, permiso=perm)
    audit(actor, "update", "perfil", perfil.id, f"nombre={nombre}")
    return perfil_to_out(Perfil.objects.prefetch_related("permisos").get(pk=perfil.pk))


def list_usuarios() -> list[dict]:
    users = Usuario.objects.select_related("perfil").order_by("username")
    return [
        {
            "id": u.id,
            "username": u.username,
            "profile": u.perfil.codigo,
            "profile_id": u.perfil_id,
            "disabled": u.disabled,
        }
        for u in users
    ]


def _get_perfil_activo(profile_id: int) -> Perfil:
    perfil = Perfil.objects.filter(pk=profile_id, activo=True).first()
    if not perfil:
        raise HttpError(400, "Perfil inválido o inactivo.")
    return perfil


@transaction.atomic
def create_usuario(username: str, password: str, profile_id: int, disabled: bool, actor: str) -> dict:
    username = username.strip()
    if len(password) < 8:
        raise HttpError(400, "La contraseña debe tener al menos 8 caracteres.")
    if Usuario.objects.filter(username=username).exists():
        raise HttpError(400, "El usuario ya existe.")
    perfil = _get_perfil_activo(profile_id)
    user = Usuario.objects.create(
        username=username,
        hashed_password=hash_password(password),
        perfil=perfil,
        disabled=disabled,
        creado_en=timezone.now(),
    )
    audit(actor, "create", "usuario", user.id, f"username={username};profile={perfil.codigo}")
    return {
        "id": user.id,
        "username": user.username,
        "profile": perfil.codigo,
        "profile_id": perfil.id,
        "disabled": user.disabled,
    }


@transaction.atomic
def update_usuario(
    user_id: int,
    username: str,
    profile_id: int,
    disabled: bool,
    password: str | None,
    actor: str,
) -> dict:
    user = Usuario.objects.select_related("perfil").filter(pk=user_id).first()
    if not user:
        raise HttpError(404, "Usuario no encontrado.")
    username = username.strip()
    if Usuario.objects.filter(username=username).exclude(pk=user_id).exists():
        raise HttpError(400, "Ya existe otro usuario con ese nombre.")
    perfil = _get_perfil_activo(profile_id)
    user.username = username
    user.perfil = perfil
    user.disabled = disabled
    user.actualizado_en = timezone.now()
    if password and password.strip():
        if len(password) < 8:
            raise HttpError(400, "La contraseña debe tener al menos 8 caracteres.")
        user.hashed_password = hash_password(password)
    user.save()
    audit(actor, "update", "usuario", user.id, f"username={username};profile={perfil.codigo}")
    return {
        "id": user.id,
        "username": user.username,
        "profile": perfil.codigo,
        "profile_id": perfil.id,
        "disabled": user.disabled,
    }


@transaction.atomic
def delete_usuario(user_id: int, actor: str) -> None:
    user = Usuario.objects.filter(pk=user_id).first()
    if not user:
        raise HttpError(404, "Usuario no encontrado.")
    if user.username == actor:
        raise HttpError(400, "No puede eliminar su propio usuario.")
    uid = user.id
    uname = user.username
    user.delete()
    audit(actor, "delete", "usuario", uid, f"username={uname}")


def ensure_admin_user(username: str = "admin", password: str = "Admin123!") -> Usuario:
    """Crea o actualiza el usuario admin inicial (solo uso de management command)."""
    perfil = Perfil.objects.filter(codigo="admin").first()
    if not perfil:
        raise RuntimeError("Perfil admin no existe. Ejecute sql/02_seed_permisos_perfiles.sql")
    user = Usuario.objects.filter(username=username).first()
    if user:
        user.hashed_password = hash_password(password)
        user.perfil = perfil
        user.disabled = False
        user.actualizado_en = timezone.now()
        user.save()
        return user
    return Usuario.objects.create(
        username=username,
        hashed_password=hash_password(password),
        perfil=perfil,
        disabled=False,
        creado_en=timezone.now(),
    )
