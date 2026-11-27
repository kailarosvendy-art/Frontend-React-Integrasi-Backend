-- Login SQL Server praktikum_user harus sudah tersedia (lihat README).
-- Jika DB_USER berbeda, sesuaikan nama akun di file ini.
IF SUSER_ID(N'praktikum_user') IS NULL
    THROW 50011, 'Buat login praktikum_user sesuai petunjuk README terlebih dahulu.', 1;
IF USER_ID(N'praktikum_user') IS NULL
    CREATE USER [praktikum_user] FOR LOGIN [praktikum_user];
GO

GRANT SELECT, INSERT, UPDATE, DELETE ON OBJECT::dbo.USERS TO [praktikum_user];
GRANT SELECT, INSERT, UPDATE, DELETE ON OBJECT::dbo.STALLS TO [praktikum_user];
GRANT SELECT, INSERT, UPDATE, DELETE ON OBJECT::dbo.MENU_ITEMS TO [praktikum_user];
GRANT SELECT, INSERT, UPDATE, DELETE ON OBJECT::dbo.REVIEWS TO [praktikum_user];
GRANT SELECT, INSERT, UPDATE, DELETE ON OBJECT::dbo.LIKES TO [praktikum_user];
GRANT SELECT, INSERT, UPDATE, DELETE ON OBJECT::dbo.FLAGS TO [praktikum_user];
GRANT SELECT, INSERT, UPDATE, DELETE ON OBJECT::dbo.ORDERS TO [praktikum_user];
GRANT SELECT, INSERT, UPDATE, DELETE ON OBJECT::dbo.ORDER_ITEMS TO [praktikum_user];
GRANT SELECT, INSERT ON OBJECT::dbo.AUDIT_LOGS TO [praktikum_user];
DENY UPDATE, DELETE ON OBJECT::dbo.AUDIT_LOGS TO [praktikum_user];
GO

EXECUTE AS USER = N'praktikum_user';
SELECT
    HAS_PERMS_BY_NAME(N'dbo.AUDIT_LOGS', N'OBJECT', N'SELECT') AS can_select,
    HAS_PERMS_BY_NAME(N'dbo.AUDIT_LOGS', N'OBJECT', N'INSERT') AS can_insert,
    HAS_PERMS_BY_NAME(N'dbo.AUDIT_LOGS', N'OBJECT', N'UPDATE') AS can_update,
    HAS_PERMS_BY_NAME(N'dbo.AUDIT_LOGS', N'OBJECT', N'DELETE') AS can_delete;
REVERT;
GO
