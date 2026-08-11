-- Índice compuesto para filtros por usuario + orden por fecha (idempotente)
-- Ejecutar contra la BD de aplicación (DBSISINDICADORE o DB_SIS_INDICADOR).
-- Ejemplo:
--   sqlcmd -S "localhost\SQLEXPRESS" -E -C -d DBSISINDICADORE -i "sql\04_index_sesiones_username_en.sql"
--   sqlcmd -S "192.168.0.3" -U sa -P "***" -C -d DB_SIS_INDICADOR -i "sql\04_index_sesiones_username_en.sql"

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_sesiones_ingreso_username_en'
      AND object_id = OBJECT_ID(N'dbo.sesiones_ingreso')
)
BEGIN
    CREATE INDEX IX_sesiones_ingreso_username_en
        ON dbo.sesiones_ingreso (username, ingresado_en DESC);
    PRINT 'Índice IX_sesiones_ingreso_username_en creado.';
END
ELSE
BEGIN
    PRINT 'Índice IX_sesiones_ingreso_username_en ya existe.';
END
GO
