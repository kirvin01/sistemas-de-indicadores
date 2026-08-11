from ninja import Schema


class HealthOut(Schema):
    status: str
    app: str
    database: str


class LoginIn(Schema):
    username: str
    password: str


class TokenOut(Schema):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    debe_cambiar_password: bool = False


class MeOut(Schema):
    id: int
    username: str
    profile: str
    profile_id: int
    permissions: list[str]
    disabled: bool
    correo: str | None = None
    celular: str | None = None
    red: str | None = None
    cargo: str | None = None
    debe_cambiar_password: bool = False


class PerfilSelfIn(Schema):
    correo: str | None = None
    celular: str | None = None
    red: str | None = None
    cargo: str | None = None


class ChangePasswordIn(Schema):
    current_password: str
    new_password: str


class ForgotPasswordIn(Schema):
    correo: str


class ResetPasswordIn(Schema):
    token: str
    password: str


class SesionIngresoOut(Schema):
    id: int
    usuario_id: int
    username: str
    profile: str | None = None
    ingresado_en: str
    ip: str | None = None


class PermisoOut(Schema):
    id: int
    codigo: str
    nombre: str
    descripcion: str | None = None


class PerfilOut(Schema):
    id: int
    codigo: str
    nombre: str
    activo: bool
    permisos: list[str] = []


class PerfilCreateIn(Schema):
    codigo: str
    nombre: str
    activo: bool = True
    permisos: list[str] = []


class PerfilUpdateIn(Schema):
    nombre: str
    activo: bool = True
    permisos: list[str] = []


class UsuarioOut(Schema):
    id: int
    username: str
    profile: str
    profile_id: int
    disabled: bool
    correo: str | None = None
    celular: str | None = None
    red: str | None = None
    cargo: str | None = None
    debe_cambiar_password: bool = False


class UsuarioCreateIn(Schema):
    username: str
    password: str
    profile_id: int
    disabled: bool = False
    correo: str | None = None


class UsuarioUpdateIn(Schema):
    username: str
    profile_id: int
    disabled: bool = False
    password: str | None = None
    correo: str | None = None


class MessageOut(Schema):
    message: str
