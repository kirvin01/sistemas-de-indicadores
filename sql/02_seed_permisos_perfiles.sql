-- Seed inicial de permisos y perfiles (equivalente al RBAC legado)
USE DBSISINDICADORE;
GO

MERGE dbo.permisos AS t
USING (VALUES
    (N'*', N'Todo', N'Acceso total'),
    (N'fed:read', N'Lectura FED', N'Ver indicadores FED'),
    (N'cg:read', N'Lectura CG', N'Ver reportes CG'),
    (N'pacientes:read', N'Lectura pacientes', N'Consulta pacientes y atenciones'),
    (N'admin:users', N'Admin usuarios', N'Crear y gestionar usuarios'),
    (N'admin:profiles', N'Admin perfiles', N'Gestionar perfiles y permisos'),
    (N'admin:sesiones', N'Seguimiento ingresos', N'Ver registro de inicios de sesión')
) AS s (codigo, nombre, descripcion)
ON t.codigo = s.codigo
WHEN NOT MATCHED THEN
    INSERT (codigo, nombre, descripcion) VALUES (s.codigo, s.nombre, s.descripcion);
GO

MERGE dbo.perfiles AS t
USING (VALUES
    (N'admin', N'Administrador'),
    (N'fed', N'FED'),
    (N'cg', N'CG'),
    (N'atenciones', N'Atenciones'),
    (N'user', N'Usuario')
) AS s (codigo, nombre)
ON t.codigo = s.codigo
WHEN NOT MATCHED THEN
    INSERT (codigo, nombre, activo) VALUES (s.codigo, s.nombre, 1);
GO

-- Limpiar y reasignar permisos por perfil (idempotente)
DELETE FROM dbo.perfil_permisos;
GO

INSERT INTO dbo.perfil_permisos (perfil_id, permiso_id)
SELECT p.id, perm.id
FROM dbo.perfiles p
CROSS JOIN dbo.permisos perm
WHERE p.codigo = N'admin' AND perm.codigo = N'*';

INSERT INTO dbo.perfil_permisos (perfil_id, permiso_id)
SELECT p.id, perm.id
FROM dbo.perfiles p
INNER JOIN dbo.permisos perm ON perm.codigo IN (N'fed:read', N'pacientes:read')
WHERE p.codigo = N'fed';

INSERT INTO dbo.perfil_permisos (perfil_id, permiso_id)
SELECT p.id, perm.id
FROM dbo.perfiles p
INNER JOIN dbo.permisos perm ON perm.codigo IN (N'cg:read', N'pacientes:read')
WHERE p.codigo = N'cg';

INSERT INTO dbo.perfil_permisos (perfil_id, permiso_id)
SELECT p.id, perm.id
FROM dbo.perfiles p
INNER JOIN dbo.permisos perm ON perm.codigo = N'pacientes:read'
WHERE p.codigo IN (N'atenciones', N'user');
GO

PRINT 'Seed permisos/perfiles OK.';
GO
