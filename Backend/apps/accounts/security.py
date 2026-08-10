"""JWT y hashing de contraseñas."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from django.conf import settings
from django.contrib.auth.hashers import check_password, make_password
from django.http import HttpRequest
from ninja.errors import HttpError
from ninja.security import HttpBearer

from apps.accounts.models import Usuario


ALGORITHM = "HS256"


def hash_password(plain: str) -> str:
    return make_password(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return check_password(plain, hashed)


def create_access_token(user: Usuario) -> tuple[str, int]:
    expires_minutes = int(getattr(settings, "ACCESS_TOKEN_EXPIRE_MINUTES", 60))
    expire = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)
    permissions = user.permission_codes
    payload = {
        "sub": user.username,
        "uid": user.id,
        "profile": user.perfil.codigo,
        "profile_id": user.perfil_id,
        "permissions": permissions,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)
    return token, expires_minutes * 60


def decode_token(token: str) -> dict[str, Any]:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError as exc:
        raise HttpError(401, "Token expirado.") from exc
    except jwt.InvalidTokenError as exc:
        raise HttpError(401, "Token inválido.") from exc


def get_user_from_username(username: str) -> Usuario | None:
    return (
        Usuario.objects.select_related("perfil")
        .prefetch_related("perfil__permisos")
        .filter(username=username, disabled=False)
        .first()
    )


class AuthBearer(HttpBearer):
    def authenticate(self, request: HttpRequest, token: str) -> Usuario:
        payload = decode_token(token)
        username = payload.get("sub")
        if not username:
            raise HttpError(401, "Token sin sujeto.")
        user = get_user_from_username(username)
        if not user:
            raise HttpError(401, "Usuario no autorizado.")
        request.auth_user = user  # type: ignore[attr-defined]
        return user


auth_bearer = AuthBearer()


def require_permission(user: Usuario, permission: str) -> None:
    codes = set(user.permission_codes)
    if "*" in codes or permission in codes:
        return
    module = permission.split(":")[0]
    if f"{module}:*" in codes:
        return
    raise HttpError(403, "Acceso denegado para su perfil.")
