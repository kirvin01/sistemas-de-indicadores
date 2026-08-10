-- Esquema de autenticación y perfiles de acceso
USE DBSISINDICADORE;
GO

IF OBJECT_ID(N'dbo.permisos', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.permisos (
        id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_permisos PRIMARY KEY,
        codigo NVARCHAR(64) NOT NULL,
        nombre NVARCHAR(150) NOT NULL,
        descripcion NVARCHAR(255) NULL,
        CONSTRAINT UQ_permisos_codigo UNIQUE (codigo)
    );
END
GO

IF OBJECT_ID(N'dbo.perfiles', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.perfiles (
        id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_perfiles PRIMARY KEY,
        codigo NVARCHAR(64) NOT NULL,
        nombre NVARCHAR(150) NOT NULL,
        activo BIT NOT NULL CONSTRAINT DF_perfiles_activo DEFAULT (1),
        creado_en DATETIME2 NOT NULL CONSTRAINT DF_perfiles_creado DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT UQ_perfiles_codigo UNIQUE (codigo)
    );
END
GO

IF OBJECT_ID(N'dbo.perfil_permisos', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.perfil_permisos (
        perfil_id INT NOT NULL,
        permiso_id INT NOT NULL,
        CONSTRAINT PK_perfil_permisos PRIMARY KEY (perfil_id, permiso_id),
        CONSTRAINT FK_perfil_permisos_perfil FOREIGN KEY (perfil_id) REFERENCES dbo.perfiles(id),
        CONSTRAINT FK_perfil_permisos_permiso FOREIGN KEY (permiso_id) REFERENCES dbo.permisos(id)
    );
END
GO

IF OBJECT_ID(N'dbo.usuarios', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.usuarios (
        id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_usuarios PRIMARY KEY,
        username NVARCHAR(100) NOT NULL,
        hashed_password NVARCHAR(255) NOT NULL,
        perfil_id INT NOT NULL,
        disabled BIT NOT NULL CONSTRAINT DF_usuarios_disabled DEFAULT (0),
        creado_en DATETIME2 NOT NULL CONSTRAINT DF_usuarios_creado DEFAULT (SYSUTCDATETIME()),
        actualizado_en DATETIME2 NULL,
        CONSTRAINT UQ_usuarios_username UNIQUE (username),
        CONSTRAINT FK_usuarios_perfil FOREIGN KEY (perfil_id) REFERENCES dbo.perfiles(id)
    );
END
GO

IF OBJECT_ID(N'dbo.auditoria_admin', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.auditoria_admin (
        id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_auditoria_admin PRIMARY KEY,
        actor_username NVARCHAR(100) NOT NULL,
        accion NVARCHAR(64) NOT NULL,
        entidad NVARCHAR(64) NOT NULL,
        entidad_id INT NULL,
        detalle NVARCHAR(MAX) NULL,
        creado_en DATETIME2 NOT NULL CONSTRAINT DF_auditoria_creado DEFAULT (SYSUTCDATETIME())
    );
END
GO

PRINT 'Esquema accounts OK.';
GO
