-- Copia portable DBSISINDICADORE (tablas de negocio)
-- No incluye DBFED2026 ni DBGERESA (datos externos / sensibles).
-- Uso: aplicar 00_create_database.sql + 01_schema_accounts.sql, luego este archivo.
SET NOCOUNT ON;
SET XACT_ABORT ON;
BEGIN TRAN;

-- permisos: 6 filas
DELETE FROM [permisos];
INSERT INTO [permisos] ([id], [codigo], [nombre], [descripcion]) VALUES (1, '*', 'Todo', 'Acceso total');
INSERT INTO [permisos] ([id], [codigo], [nombre], [descripcion]) VALUES (2, 'fed:read', 'Lectura FED', 'Ver indicadores FED');
INSERT INTO [permisos] ([id], [codigo], [nombre], [descripcion]) VALUES (3, 'cg:read', 'Lectura CG', 'Ver reportes CG');
INSERT INTO [permisos] ([id], [codigo], [nombre], [descripcion]) VALUES (4, 'pacientes:read', 'Lectura pacientes', 'Consulta pacientes y atenciones');
INSERT INTO [permisos] ([id], [codigo], [nombre], [descripcion]) VALUES (5, 'admin:users', 'Admin usuarios', 'Crear y gestionar usuarios');
INSERT INTO [permisos] ([id], [codigo], [nombre], [descripcion]) VALUES (6, 'admin:profiles', 'Admin perfiles', 'Gestionar perfiles y permisos');

-- perfiles: 7 filas
DELETE FROM [perfiles];
INSERT INTO [perfiles] ([id], [codigo], [nombre], [activo], [creado_en]) VALUES (1, 'admin', 'Administrador', 1, '2026-08-09 03:15:11.573111');
INSERT INTO [perfiles] ([id], [codigo], [nombre], [activo], [creado_en]) VALUES (2, 'fed', 'FED', 1, '2026-08-09 03:15:11.573111');
INSERT INTO [perfiles] ([id], [codigo], [nombre], [activo], [creado_en]) VALUES (3, 'cg', 'CG', 1, '2026-08-09 03:15:11.573111');
INSERT INTO [perfiles] ([id], [codigo], [nombre], [activo], [creado_en]) VALUES (4, 'atenciones', 'Atenciones', 1, '2026-08-09 03:15:11.573111');
INSERT INTO [perfiles] ([id], [codigo], [nombre], [activo], [creado_en]) VALUES (5, 'user', 'Usuario', 1, '2026-08-09 03:15:11.573111');
INSERT INTO [perfiles] ([id], [codigo], [nombre], [activo], [creado_en]) VALUES (6, 'analisis', 'Analista FED', 1, '2026-08-09 03:22:43.556514');
INSERT INTO [perfiles] ([id], [codigo], [nombre], [activo], [creado_en]) VALUES (7, 'tmp_587', 'Temporal 2', 1, '2026-08-09 03:29:59.698779');

-- perfil_permisos: 10 filas
DELETE FROM [perfil_permisos];
INSERT INTO [perfil_permisos] ([perfil_id], [permiso_id]) VALUES (1, 1);
INSERT INTO [perfil_permisos] ([perfil_id], [permiso_id]) VALUES (2, 2);
INSERT INTO [perfil_permisos] ([perfil_id], [permiso_id]) VALUES (2, 4);
INSERT INTO [perfil_permisos] ([perfil_id], [permiso_id]) VALUES (3, 3);
INSERT INTO [perfil_permisos] ([perfil_id], [permiso_id]) VALUES (3, 4);
INSERT INTO [perfil_permisos] ([perfil_id], [permiso_id]) VALUES (4, 4);
INSERT INTO [perfil_permisos] ([perfil_id], [permiso_id]) VALUES (5, 4);
INSERT INTO [perfil_permisos] ([perfil_id], [permiso_id]) VALUES (6, 2);
INSERT INTO [perfil_permisos] ([perfil_id], [permiso_id]) VALUES (7, 2);
INSERT INTO [perfil_permisos] ([perfil_id], [permiso_id]) VALUES (7, 4);

-- usuarios: 2 filas
DELETE FROM [usuarios];
INSERT INTO [usuarios] ([id], [username], [hashed_password], [perfil_id], [disabled], [creado_en], [actualizado_en]) VALUES (1, 'admin', 'pbkdf2_sha256$1000000$IadMTTPHmR5fckVJqkjved$Tkik1r03k60NrFmQAnB2pLPQIKaKoXznb+nQZwGLTFc=', 1, 0, '2026-08-09 03:22:00.989270', NULL);
INSERT INTO [usuarios] ([id], [username], [hashed_password], [perfil_id], [disabled], [creado_en], [actualizado_en]) VALUES (2, 'operador1', 'pbkdf2_sha256$1000000$R6IgMCf2s0kmGRA0lP4Po1$xI/tBY4h2Txem1ZAdvl1sks8L4HqW6Jch1D2lYj3GIs=', 2, 0, '2026-08-09 03:22:33.868946', NULL);

COMMIT;
