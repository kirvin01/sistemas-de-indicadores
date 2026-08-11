"""Casos de uso: auth, usuarios, perfiles, sesiones y recuperación."""



from __future__ import annotations



import hashlib

import logging

import secrets

from datetime import timedelta



from django.conf import settings

from django.core.mail import send_mail

from django.db import transaction
from django.utils import timezone

from ninja.errors import HttpError



from apps.accounts.models import (

    AuditoriaAdmin,

    PasswordResetToken,

    Perfil,

    PerfilPermiso,

    Permiso,

    SesionIngreso,

    Usuario,

)

from apps.accounts.security import create_access_token, hash_password, verify_password



logger = logging.getLogger(__name__)



GENERIC_FORGOT_MSG = (

    "Si el correo está registrado, recibirás un enlace para restablecer la contraseña."

)





def audit(actor: str, accion: str, entidad: str, entidad_id: int | None = None, detalle: str | None = None) -> None:

    AuditoriaAdmin.objects.create(

        actor_username=actor,

        accion=accion,

        entidad=entidad,

        entidad_id=entidad_id,

        detalle=detalle,

        creado_en=timezone.now(),

    )





def _usuario_out(user: Usuario) -> dict:

    return {

        "id": user.id,

        "username": user.username,

        "profile": user.perfil.codigo,

        "profile_id": user.perfil_id,

        "disabled": user.disabled,

        "correo": user.correo,

        "celular": user.celular,

        "red": user.red,

        "cargo": user.cargo,

        "debe_cambiar_password": bool(user.debe_cambiar_password),

    }





def record_login(user: Usuario, ip: str | None = None) -> None:

    SesionIngreso.objects.create(

        usuario=user,

        username=user.username,

        ingresado_en=timezone.now(),

        ip=(ip or None),

    )





def login(username: str, password: str, ip: str | None = None) -> tuple[str, int, bool]:

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

    record_login(user, ip=ip)

    token, expires_in = create_access_token(user)

    return token, expires_in, bool(user.debe_cambiar_password)





def me_payload(user: Usuario) -> dict:

    return {

        "id": user.id,

        "username": user.username,

        "profile": user.perfil.codigo,

        "profile_id": user.perfil_id,

        "permissions": user.permission_codes,

        "disabled": user.disabled,

        "correo": user.correo,

        "celular": user.celular,

        "red": user.red,

        "cargo": user.cargo,

        "debe_cambiar_password": bool(user.debe_cambiar_password),

    }





def update_my_perfil(

    user: Usuario,

    correo: str | None,

    celular: str | None,

    red: str | None,

    cargo: str | None,

) -> dict:

    user.correo = (correo or "").strip() or None

    user.celular = (celular or "").strip() or None

    user.red = (red or "").strip() or None

    user.cargo = (cargo or "").strip() or None

    user.actualizado_en = timezone.now()

    user.save(update_fields=["correo", "celular", "red", "cargo", "actualizado_en"])

    return me_payload(Usuario.objects.select_related("perfil").prefetch_related("perfil__permisos").get(pk=user.pk))





def change_my_password(user: Usuario, current_password: str, new_password: str) -> None:

    if not verify_password(current_password, user.hashed_password):

        raise HttpError(400, "La contraseña actual no es correcta.")

    if len(new_password) < 8:

        raise HttpError(400, "La contraseña debe tener al menos 8 caracteres.")

    if current_password == new_password:

        raise HttpError(400, "La nueva contraseña debe ser distinta a la actual.")

    user.hashed_password = hash_password(new_password)

    user.debe_cambiar_password = False

    user.actualizado_en = timezone.now()

    user.save(update_fields=["hashed_password", "debe_cambiar_password", "actualizado_en"])





def _hash_token(token: str) -> str:

    return hashlib.sha256(token.encode("utf-8")).hexdigest()





def forgot_password(correo: str) -> str:

    correo_norm = (correo or "").strip().lower()

    if not correo_norm:

        return GENERIC_FORGOT_MSG



    user = (

        Usuario.objects.filter(disabled=False)

        .filter(correo__iexact=correo_norm)

        .first()

    )

    if not user or not user.correo:

        return GENERIC_FORGOT_MSG



    raw = secrets.token_urlsafe(32)

    token_hash = _hash_token(raw)

    now = timezone.now()

    expire_min = int(getattr(settings, "PASSWORD_RESET_EXPIRE_MINUTES", 30))



    PasswordResetToken.objects.filter(usuario=user, usado_en__isnull=True).update(usado_en=now)

    PasswordResetToken.objects.create(

        usuario=user,

        token_hash=token_hash,

        expira_en=now + timedelta(minutes=expire_min),

        usado_en=None,

        creado_en=now,

    )



    front = getattr(settings, "FRONTEND_URL", "http://localhost:5173").rstrip("/")

    link = f"{front}/restablecer?token={raw}"

    subject = "Restablecer contraseña — Sistemas de Indicadores GERESA"

    body = (

        f"Hola {user.username},\n\n"

        f"Solicitaste restablecer tu contraseña. Usa este enlace (válido {expire_min} minutos):\n\n"

        f"{link}\n\n"

        "Si no solicitaste este cambio, ignora este mensaje.\n"

    )

    try:

        send_mail(

            subject,

            body,

            settings.DEFAULT_FROM_EMAIL,

            [user.correo],

            fail_silently=False,

        )

    except Exception:

        logger.exception("No se pudo enviar correo de recuperación a usuario_id=%s", user.id)



    return GENERIC_FORGOT_MSG





@transaction.atomic

def reset_password(token: str, new_password: str) -> None:

    if not token or not token.strip():

        raise HttpError(400, "Token inválido o expirado.")

    if len(new_password) < 8:

        raise HttpError(400, "La contraseña debe tener al menos 8 caracteres.")



    token_hash = _hash_token(token.strip())

    now = timezone.now()

    row = (

        PasswordResetToken.objects.select_related("usuario")

        .filter(token_hash=token_hash, usado_en__isnull=True, expira_en__gte=now)

        .first()

    )

    if not row:

        raise HttpError(400, "Token inválido o expirado.")



    user = row.usuario

    if user.disabled:

        raise HttpError(400, "Token inválido o expirado.")



    user.hashed_password = hash_password(new_password)

    user.debe_cambiar_password = False

    user.actualizado_en = now

    user.save(update_fields=["hashed_password", "debe_cambiar_password", "actualizado_en"])

    row.usado_en = now

    row.save(update_fields=["usado_en"])

    PasswordResetToken.objects.filter(usuario=user, usado_en__isnull=True).exclude(pk=row.pk).update(usado_en=now)





def list_sesiones(

    username: str | None = None,

    desde: str | None = None,

    hasta: str | None = None,

    limit: int = 100,

) -> list[dict]:

    limit = max(1, min(limit, 500))

    qs = SesionIngreso.objects.select_related("usuario__perfil").order_by("-ingresado_en")

    if username and username.strip():

        qs = qs.filter(username__icontains=username.strip())

    if desde:

        qs = qs.filter(ingresado_en__date__gte=desde)

    if hasta:

        qs = qs.filter(ingresado_en__date__lte=hasta)

    rows = list(qs[:limit])

    out = []

    for r in rows:

        profile = None

        try:

            profile = r.usuario.perfil.codigo

        except Exception:

            profile = None

        out.append(

            {

                "id": r.id,

                "usuario_id": r.usuario_id,

                "username": r.username,

                "profile": profile,

                "ingresado_en": r.ingresado_en.isoformat() if r.ingresado_en else "",

                "ip": r.ip,

            }

        )

    return out





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

    return [_usuario_out(u) for u in users]





def _get_perfil_activo(profile_id: int) -> Perfil:

    perfil = Perfil.objects.filter(pk=profile_id, activo=True).first()

    if not perfil:

        raise HttpError(400, "Perfil inválido o inactivo.")

    return perfil





@transaction.atomic

def create_usuario(

    username: str,

    password: str,

    profile_id: int,

    disabled: bool,

    actor: str,

    correo: str | None = None,

) -> dict:

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

        correo=(correo or "").strip() or None,

        debe_cambiar_password=True,

    )

    audit(actor, "create", "usuario", user.id, f"username={username};profile={perfil.codigo}")

    return _usuario_out(Usuario.objects.select_related("perfil").get(pk=user.pk))





@transaction.atomic

def update_usuario(

    user_id: int,

    username: str,

    profile_id: int,

    disabled: bool,

    password: str | None,

    actor: str,

    correo: str | None = None,

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

    if correo is not None:

        user.correo = correo.strip() or None

    if password and password.strip():

        if len(password) < 8:

            raise HttpError(400, "La contraseña debe tener al menos 8 caracteres.")

        user.hashed_password = hash_password(password)

        user.debe_cambiar_password = True

    user.save()

    audit(actor, "update", "usuario", user.id, f"username={username};profile={perfil.codigo}")

    return _usuario_out(Usuario.objects.select_related("perfil").get(pk=user.pk))





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

        user.debe_cambiar_password = False

        user.actualizado_en = timezone.now()

        user.save()

        return user

    return Usuario.objects.create(

        username=username,

        hashed_password=hash_password(password),

        perfil=perfil,

        disabled=False,

        creado_en=timezone.now(),

        debe_cambiar_password=False,

    )


