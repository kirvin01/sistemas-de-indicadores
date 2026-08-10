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


class MeOut(Schema):
    id: int
    username: str
    profile: str
    profile_id: int
    permissions: list[str]
    disabled: bool


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


class UsuarioCreateIn(Schema):
    username: str
    password: str
    profile_id: int
    disabled: bool = False


class UsuarioUpdateIn(Schema):
    username: str
    profile_id: int
    disabled: bool = False
    password: str | None = None


class MessageOut(Schema):
    message: str
