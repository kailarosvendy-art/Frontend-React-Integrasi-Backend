-- Jalankan sesudah 01-schema.sql pada database tujuan.
-- Waktu audit disimpan UTC; UI mengubahnya ke zona waktu browser.
DECLARE @defaultName sysname;
SELECT @defaultName = dc.name
FROM sys.default_constraints dc
JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
WHERE dc.parent_object_id = OBJECT_ID(N'dbo.AUDIT_LOGS') AND c.name = N'created_at';
IF @defaultName IS NOT NULL
BEGIN
    DECLARE @dropDefault nvarchar(max) = N'ALTER TABLE dbo.AUDIT_LOGS DROP CONSTRAINT ' + QUOTENAME(@defaultName);
    EXEC sp_executesql @dropDefault;
END;
ALTER TABLE dbo.AUDIT_LOGS ADD CONSTRAINT DF_AUDIT_LOGS_created_at
    DEFAULT SYSUTCDATETIME() FOR created_at;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.AUDIT_LOGS') AND name = N'IX_AUDIT_LOGS_created_at')
    CREATE INDEX IX_AUDIT_LOGS_created_at ON dbo.AUDIT_LOGS(created_at DESC, id DESC);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.AUDIT_LOGS') AND name = N'IX_AUDIT_LOGS_user_created')
    CREATE INDEX IX_AUDIT_LOGS_user_created ON dbo.AUDIT_LOGS(user_id, created_at DESC);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.AUDIT_LOGS') AND name = N'IX_AUDIT_LOGS_action_target_created')
    CREATE INDEX IX_AUDIT_LOGS_action_target_created ON dbo.AUDIT_LOGS(action, target_table, created_at DESC);
GO
