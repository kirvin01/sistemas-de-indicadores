from django.db import models


class Permiso(models.Model):
    codigo = models.CharField(max_length=64, unique=True)
    nombre = models.CharField(max_length=150)
    descripcion = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        managed = False
        db_table = "permisos"

    def __str__(self) -> str:
        return self.codigo


class Perfil(models.Model):
    codigo = models.CharField(max_length=64, unique=True)
    nombre = models.CharField(max_length=150)
    activo = models.BooleanField(default=True)
    creado_en = models.DateTimeField()
    permisos = models.ManyToManyField(
        Permiso,
        through="PerfilPermiso",
        related_name="perfiles",
    )

    class Meta:
        managed = False
        db_table = "perfiles"

    def __str__(self) -> str:
        return self.nombre


class PerfilPermiso(models.Model):
    perfil = models.ForeignKey(Perfil, on_delete=models.CASCADE, db_column="perfil_id")
    permiso = models.ForeignKey(Permiso, on_delete=models.CASCADE, db_column="permiso_id")

    class Meta:
        managed = False
        db_table = "perfil_permisos"
        unique_together = (("perfil", "permiso"),)


class Usuario(models.Model):
    username = models.CharField(max_length=100, unique=True)
    hashed_password = models.CharField(max_length=255)
    perfil = models.ForeignKey(Perfil, on_delete=models.PROTECT, db_column="perfil_id")
    disabled = models.BooleanField(default=False)
    creado_en = models.DateTimeField()
    actualizado_en = models.DateTimeField(null=True, blank=True)

    class Meta:
        managed = False
        db_table = "usuarios"

    def __str__(self) -> str:
        return self.username

    @property
    def permission_codes(self) -> list[str]:
        return list(self.perfil.permisos.values_list("codigo", flat=True))


class AuditoriaAdmin(models.Model):
    actor_username = models.CharField(max_length=100)
    accion = models.CharField(max_length=64)
    entidad = models.CharField(max_length=64)
    entidad_id = models.IntegerField(null=True, blank=True)
    detalle = models.TextField(null=True, blank=True)
    creado_en = models.DateTimeField()

    class Meta:
        managed = False
        db_table = "auditoria_admin"
