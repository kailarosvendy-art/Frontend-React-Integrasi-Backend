-- Jalankan pada database tujuan sebagai administrator; tidak mengubah baris data.
SELECT TOP (20) id, user_id, action, target_table, target_id, metadata, created_at
FROM dbo.AUDIT_LOGS ORDER BY created_at DESC, id DESC;
GO
EXECUTE AS USER = N'praktikum_user';
SELECT USER_NAME() AS app_user,
    HAS_PERMS_BY_NAME(N'dbo.AUDIT_LOGS', N'OBJECT', N'SELECT') AS can_select,
    HAS_PERMS_BY_NAME(N'dbo.AUDIT_LOGS', N'OBJECT', N'INSERT') AS can_insert,
    HAS_PERMS_BY_NAME(N'dbo.AUDIT_LOGS', N'OBJECT', N'UPDATE') AS can_update,
    HAS_PERMS_BY_NAME(N'dbo.AUDIT_LOGS', N'OBJECT', N'DELETE') AS can_delete;
REVERT;
GO
BEGIN TRY
    UPDATE dbo.AUDIT_LOGS SET action=action WHERE 1=0;
    THROW 50012, 'FAIL: UPDATE tidak ditolak trigger.', 1;
END TRY
BEGIN CATCH
    SELECT N'UPDATE' AS operation, ERROR_NUMBER() AS error_number, ERROR_MESSAGE() AS message;
END CATCH;
GO
BEGIN TRY
    DELETE FROM dbo.AUDIT_LOGS WHERE 1=0;
    THROW 50012, 'FAIL: DELETE tidak ditolak trigger.', 1;
END TRY
BEGIN CATCH
    SELECT N'DELETE' AS operation, ERROR_NUMBER() AS error_number, ERROR_MESSAGE() AS message;
END CATCH;
GO
