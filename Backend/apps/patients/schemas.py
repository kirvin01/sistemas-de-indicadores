from ninja import Schema


class PacienteOut(Schema):
    abrev_tipo_doc: str
    numero_documento: str
    fecha_nacimiento: str
    genero: str
    edad: int


class PacienteListOut(Schema):
    result: list[PacienteOut]


class AtencionOut(Schema):
    n: int
    id_cita: str
    f_atencion: str
    codigo_item: str
    descripcion_item: str
    lab1: str
    lab2: str
    lab3: str
    f_registro: str
    f_modificacion: str
    establecimiento: str
    distrito_provincia: str
    sistema: str
    registrador: str


class AtencionListOut(Schema):
    result: list[AtencionOut]
