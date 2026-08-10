-- Sistemas de Indicadores GERESA CUSCO
-- Crea la base de datos de aplicación (auth, perfiles, catálogos propios)
-- Servidor típico DEV: localhost\SQLEXPRESS

IF DB_ID(N'DBSISINDICADORE') IS NULL
BEGIN
    CREATE DATABASE DBSISINDICADORE;
    PRINT 'Base de datos DBSISINDICADORE creada.';
END
ELSE
BEGIN
    PRINT 'Base de datos DBSISINDICADORE ya existe.';
END
GO
