-- Perfil de usuario, sesiones de ingreso y tokens de recuperación (idempotente)
USE DBSISINDICADORE;
GO

IF COL_LENGTH('dbo.usuarios', 'correo') IS NULL
    ALTER TABLE dbo.usuarios ADD correo NVARCHAR(150) NULL;
GO
IF COL_LENGTH('dbo.usuarios', 'celular') IS NULL
    ALTER TABLE dbo.usuarios ADD celular NVARCHAR(30) NULL;
GO
IF COL_LENGTH('dbo.usuarios', 'red') IS NULL
    ALTER TABLE dbo.usuarios ADD red NVARCHAR(120) NULL;
GO
IF COL_LENGTH('dbo.usuarios', 'cargo') IS NULL
    ALTER TABLE dbo.usuarios ADD cargo NVARCHAR(150) NULL;
GO
IF COL_LENGTH('dbo.usuarios', 'debe_cambiar_password') IS NULL
BEGIN
    ALTER TABLE dbo.usuarios ADD debe_cambiar_password BIT NOT NULL
        CONSTRAINT DF_usuarios_debe_cambiar_password DEFAULT (0);
END
GO

UPDATE dbo.usuarios SET debe_cambiar_password = 0 WHERE username = N'admin';
GO

IF OBJECT_ID(N'dbo.sesiones_ingreso', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.sesiones_ingreso (
        id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_sesiones_ingreso PRIMARY KEY,
        usuario_id INT NOT NULL,
        username NVARCHAR(100) NOT NULL,
        ingresado_en DATETIME2 NOT NULL CONSTRAINT DF_sesiones_ingreso_en DEFAULT (SYSUTCDATETIME()),
        ip NVARCHAR(64) NULL,
        CONSTRAINT FK_sesiones_ingreso_usuario FOREIGN KEY (usuario_id)
            REFERENCES dbo.usuarios(id) ON DELETE CASCADE
    );
    CREATE INDEX IX_sesiones_ingreso_en ON dbo.sesiones_ingreso (ingresado_en DESC);
    CREATE INDEX IX_sesiones_ingreso_username ON dbo.sesiones_ingreso (username);
END
GO

IF OBJECT_ID(N'dbo.password_reset_tokens', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.password_reset_tokens (
        id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_password_reset_tokens PRIMARY KEY,
        usuario_id INT NOT NULL,
        token_hash NVARCHAR(64) NOT NULL,
        expira_en DATETIME2 NOT NULL,
        usado_en DATETIME2 NULL,
        creado_en DATETIME2 NOT NULL CONSTRAINT DF_password_reset_creado DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT FK_password_reset_usuario FOREIGN KEY (usuario_id)
            REFERENCES dbo.usuarios(id) ON DELETE CASCADE
    );
    CREATE INDEX IX_password_reset_hash ON dbo.password_reset_tokens (token_hash);
END
GO

MERGE dbo.permisos AS t
USING (VALUES
    (N'admin:sesiones', N'Seguimiento ingresos', N'Ver registro de inicios de sesión')
) AS s (codigo, nombre, descripcion)
ON t.codigo = s.codigo
WHEN NOT MATCHED THEN
    INSERT (codigo, nombre, descripcion) VALUES (s.codigo, s.nombre, s.descripcion);
GO

PRINT 'Esquema perfil/sesiones/reset OK.';
GO
