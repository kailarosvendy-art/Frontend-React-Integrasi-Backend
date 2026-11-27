-- Jalankan pada database tujuan sebagai administrator.
CREATE OR ALTER TRIGGER dbo.TR_AUDIT_LOGS_AppendOnly
ON dbo.AUDIT_LOGS
INSTEAD OF UPDATE, DELETE
AS
BEGIN
  SET NOCOUNT ON;
  THROW 50010, 'AUDIT_LOGS bersifat append-only.', 1;
END;
GO
