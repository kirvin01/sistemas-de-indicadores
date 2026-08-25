-- Índices para Historial de atenciones (HisAtenciones en DBGERESA).
-- Idempotente. Requiere permiso ALTER sobre la tabla (db_owner / db_ddladmin).
-- El usuario de la app (indicadores_web) suele ser solo lectura: ejecutar este script
-- con un login administrador, por ejemplo:
--   sqlcmd -S "192.168.0.3" -U sa -P "***" -C -d DBGERESA -i "sql\06_his_atenciones_indexes.sql"

IF OBJECT_ID(N'dbo.HisAtenciones', N'U') IS NULL
BEGIN
    RAISERROR('No existe dbo.HisAtenciones en esta base.', 16, 1);
    RETURN;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_HisAtenciones_Ndoc_Anio_Mes_Fecha'
      AND object_id = OBJECT_ID(N'dbo.HisAtenciones')
)
BEGIN
    CREATE INDEX IX_HisAtenciones_Ndoc_Anio_Mes_Fecha
        ON dbo.HisAtenciones (NUMERO, anio, mes, FECHA_ATENCION DESC);
    PRINT 'Índice IX_HisAtenciones_Ndoc_Anio_Mes_Fecha creado.';
END
ELSE
    PRINT 'Índice IX_HisAtenciones_Ndoc_Anio_Mes_Fecha ya existe.';
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_HisAtenciones_Ndoc_Anio_Fecha'
      AND object_id = OBJECT_ID(N'dbo.HisAtenciones')
)
BEGIN
    CREATE INDEX IX_HisAtenciones_Ndoc_Anio_Fecha
        ON dbo.HisAtenciones (NUMERO, anio, FECHA_ATENCION DESC);
    PRINT 'Índice IX_HisAtenciones_Ndoc_Anio_Fecha creado.';
END
ELSE
    PRINT 'Índice IX_HisAtenciones_Ndoc_Anio_Fecha ya existe.';
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_HisAtenciones_Ndoc_Anio_Codigo'
      AND object_id = OBJECT_ID(N'dbo.HisAtenciones')
)
BEGIN
    CREATE INDEX IX_HisAtenciones_Ndoc_Anio_Codigo
        ON dbo.HisAtenciones (NUMERO, anio, Codigo);
    PRINT 'Índice IX_HisAtenciones_Ndoc_Anio_Codigo creado.';
END
ELSE
    PRINT 'Índice IX_HisAtenciones_Ndoc_Anio_Codigo ya existe.';
GO
