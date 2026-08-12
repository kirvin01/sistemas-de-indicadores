-- Permiso Nutrición (idempotente). Ejecutar en la BD de aplicación.
-- sqlcmd ... -d DB_SIS_INDICADOR -i "sql\05_seed_nutricion.sql"

MERGE dbo.permisos AS t
USING (VALUES
    (N'nutricion:read', N'Lectura Nutrición', N'Ver indicadores de Nutrición')
) AS s (codigo, nombre, descripcion)
ON t.codigo = s.codigo
WHEN NOT MATCHED THEN
    INSERT (codigo, nombre, descripcion) VALUES (s.codigo, s.nombre, s.descripcion);
GO

-- Admin (*) ya cubre todo. Asignar nutricion:read al perfil fed si existe.
IF EXISTS (SELECT 1 FROM dbo.perfiles WHERE codigo = N'fed')
AND EXISTS (SELECT 1 FROM dbo.permisos WHERE codigo = N'nutricion:read')
AND NOT EXISTS (
    SELECT 1
    FROM dbo.perfil_permisos pp
    INNER JOIN dbo.perfiles p ON p.id = pp.perfil_id
    INNER JOIN dbo.permisos perm ON perm.id = pp.permiso_id
    WHERE p.codigo = N'fed' AND perm.codigo = N'nutricion:read'
)
BEGIN
    INSERT INTO dbo.perfil_permisos (perfil_id, permiso_id)
    SELECT p.id, perm.id
    FROM dbo.perfiles p
    INNER JOIN dbo.permisos perm ON perm.codigo = N'nutricion:read'
    WHERE p.codigo = N'fed';
END
GO

PRINT 'Seed Nutrición OK.';
GO
