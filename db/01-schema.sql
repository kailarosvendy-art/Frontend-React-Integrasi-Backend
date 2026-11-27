-- Jalankan pada database tujuan (sqlcmd -d review_kantin). Tidak menghapus data.

-- ---------------------------------------------------------------- USERS
IF OBJECT_ID('dbo.USERS', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.USERS (
        id            INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_USERS PRIMARY KEY,
        name          NVARCHAR(100) NOT NULL,
        email         NVARCHAR(150) NOT NULL CONSTRAINT UQ_USERS_email UNIQUE,
        password_hash NVARCHAR(255) NOT NULL,
        role          NVARCHAR(20)  NOT NULL
            CONSTRAINT CK_USERS_role CHECK (role IN ('admin', 'owner', 'customer')),
        created_at    DATETIME2(0)  NOT NULL CONSTRAINT DF_USERS_created_at DEFAULT SYSDATETIME()
    );
END
GO

-- --------------------------------------------------------------- STALLS
IF OBJECT_ID('dbo.STALLS', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.STALLS (
        id           INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_STALLS PRIMARY KEY,
        owner_id     INT NOT NULL,
        name         NVARCHAR(100) NOT NULL,
        category     NVARCHAR(50)  NULL,
        location     NVARCHAR(100) NULL,
        description  NVARCHAR(MAX) NULL,
        avg_rating   DECIMAL(3,2) NOT NULL CONSTRAINT DF_STALLS_avg_rating DEFAULT (0),
        review_count INT          NOT NULL CONSTRAINT DF_STALLS_review_count DEFAULT (0),
        created_at   DATETIME2(0) NOT NULL CONSTRAINT DF_STALLS_created_at DEFAULT SYSDATETIME(),
        CONSTRAINT FK_STALLS_USERS FOREIGN KEY (owner_id) REFERENCES dbo.USERS (id)
    );
END
GO

-- ----------------------------------------------------------- MENU_ITEMS
IF OBJECT_ID('dbo.MENU_ITEMS', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.MENU_ITEMS (
        id           INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_MENU_ITEMS PRIMARY KEY,
        stall_id     INT NOT NULL,
        name         NVARCHAR(100) NOT NULL,
        price        INT NOT NULL CONSTRAINT CK_MENU_ITEMS_price CHECK (price >= 0),
        is_available BIT NOT NULL CONSTRAINT DF_MENU_ITEMS_is_available DEFAULT (1),
        CONSTRAINT FK_MENU_ITEMS_STALLS FOREIGN KEY (stall_id)
            REFERENCES dbo.STALLS (id) ON DELETE CASCADE
    );
END
GO

-- -------------------------------------------------------------- REVIEWS
IF OBJECT_ID('dbo.REVIEWS', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.REVIEWS (
        id         INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_REVIEWS PRIMARY KEY,
        stall_id   INT NOT NULL,
        user_id    INT NOT NULL,
        rating     INT NOT NULL CONSTRAINT CK_REVIEWS_rating CHECK (rating BETWEEN 1 AND 5),
        comment    NVARCHAR(MAX) NULL,
        like_count INT NOT NULL CONSTRAINT DF_REVIEWS_like_count DEFAULT (0),
        created_at DATETIME2(0) NOT NULL CONSTRAINT DF_REVIEWS_created_at DEFAULT SYSDATETIME(),
        updated_at DATETIME2(0) NULL,
        CONSTRAINT UQ_REVIEWS_user_stall UNIQUE (user_id, stall_id),
        CONSTRAINT FK_REVIEWS_STALLS FOREIGN KEY (stall_id)
            REFERENCES dbo.STALLS (id) ON DELETE CASCADE,
        CONSTRAINT FK_REVIEWS_USERS FOREIGN KEY (user_id)
            REFERENCES dbo.USERS (id)
    );
END
GO

-- ---------------------------------------------------------------- LIKES
IF OBJECT_ID('dbo.LIKES', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.LIKES (
        id         INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_LIKES PRIMARY KEY,
        review_id  INT NOT NULL,
        user_id    INT NOT NULL,
        created_at DATETIME2(0) NOT NULL CONSTRAINT DF_LIKES_created_at DEFAULT SYSDATETIME(),
        CONSTRAINT UQ_LIKES_review_user UNIQUE (review_id, user_id),
        CONSTRAINT FK_LIKES_REVIEWS FOREIGN KEY (review_id)
            REFERENCES dbo.REVIEWS (id) ON DELETE CASCADE,
        CONSTRAINT FK_LIKES_USERS FOREIGN KEY (user_id)
            REFERENCES dbo.USERS (id)
    );
END
GO

-- ---------------------------------------------------------------- FLAGS
IF OBJECT_ID('dbo.FLAGS', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.FLAGS (
        id          INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_FLAGS PRIMARY KEY,
        review_id   INT NOT NULL,
        reported_by INT NOT NULL,
        reason      NVARCHAR(255) NULL,
        status      NVARCHAR(20) NOT NULL
            CONSTRAINT DF_FLAGS_status DEFAULT ('pending')
            CONSTRAINT CK_FLAGS_status CHECK (status IN ('pending', 'resolved', 'dismissed')),
        created_at  DATETIME2(0) NOT NULL CONSTRAINT DF_FLAGS_created_at DEFAULT SYSDATETIME(),
        CONSTRAINT FK_FLAGS_REVIEWS FOREIGN KEY (review_id)
            REFERENCES dbo.REVIEWS (id) ON DELETE CASCADE,
        CONSTRAINT FK_FLAGS_USERS FOREIGN KEY (reported_by)
            REFERENCES dbo.USERS (id)
    );
END
GO

-- ----------------------------------------------------------- AUDIT_LOGS
IF OBJECT_ID('dbo.AUDIT_LOGS', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.AUDIT_LOGS (
        id           INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_AUDIT_LOGS PRIMARY KEY,
        user_id      INT NOT NULL,
        action       NVARCHAR(50) NOT NULL,
        target_table NVARCHAR(50) NOT NULL,
        target_id    INT NOT NULL,
        metadata     NVARCHAR(MAX) NULL,
        created_at   DATETIME2(0) NOT NULL CONSTRAINT DF_AUDIT_LOGS_created_at DEFAULT SYSDATETIME(),
        CONSTRAINT FK_AUDIT_LOGS_USERS FOREIGN KEY (user_id)
            REFERENCES dbo.USERS (id)
    );
END
GO


-- ============================================================
-- Pertemuan 08 - Hands-on 2
-- Migrasi aditif untuk fitur checkout customer.
--
-- Jalankan setelah 01-menu-schema.sql dan schema Pertemuan 03.
-- Script ini idempoten: aman dijalankan lebih dari sekali.
-- ============================================================


IF OBJECT_ID('dbo.USERS', 'U') IS NULL
   OR OBJECT_ID('dbo.MENU_ITEMS', 'U') IS NULL
BEGIN
    THROW 50001, 'Tabel USERS/MENU_ITEMS belum ada. Jalankan schema Pertemuan 03 terlebih dahulu.', 1;
END
GO

-- ---------------------------------------------------------------- ORDERS
IF OBJECT_ID('dbo.ORDERS', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ORDERS (
        id             INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_ORDERS PRIMARY KEY,
        order_code     NVARCHAR(30) NOT NULL CONSTRAINT UQ_ORDERS_order_code UNIQUE,
        customer_id    INT NOT NULL,
        customer_name  NVARCHAR(80) NOT NULL,
        phone          NVARCHAR(20) NOT NULL,
        payment_method NVARCHAR(20) NOT NULL
            CONSTRAINT CK_ORDERS_payment_method
            CHECK (payment_method IN (N'cash', N'qris', N'transfer')),
        note           NVARCHAR(200) NULL,
        total          INT NOT NULL CONSTRAINT CK_ORDERS_total CHECK (total > 0),
        status         NVARCHAR(20) NOT NULL
            CONSTRAINT DF_ORDERS_status DEFAULT (N'confirmed')
            CONSTRAINT CK_ORDERS_status
            CHECK (status IN (N'confirmed', N'completed', N'cancelled')),
        created_at     DATETIME2(0) NOT NULL
            CONSTRAINT DF_ORDERS_created_at DEFAULT SYSDATETIME(),
        CONSTRAINT FK_ORDERS_USERS FOREIGN KEY (customer_id)
            REFERENCES dbo.USERS (id)
    );

    PRINT 'Tabel ORDERS dibuat.';
END
ELSE
BEGIN
    PRINT 'Tabel ORDERS sudah ada.';
END
GO

-- ----------------------------------------------------------- ORDER_ITEMS
IF OBJECT_ID('dbo.ORDER_ITEMS', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ORDER_ITEMS (
        id         INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_ORDER_ITEMS PRIMARY KEY,
        order_id   INT NOT NULL,
        menu_id    INT NULL,
        stall_id   INT NULL,
        stall_name NVARCHAR(100) NULL,
        menu_name  NVARCHAR(100) NOT NULL,
        unit_price INT NOT NULL CONSTRAINT CK_ORDER_ITEMS_unit_price CHECK (unit_price > 0),
        quantity   INT NOT NULL CONSTRAINT CK_ORDER_ITEMS_quantity CHECK (quantity BETWEEN 1 AND 20),
        subtotal   INT NOT NULL CONSTRAINT CK_ORDER_ITEMS_subtotal CHECK (subtotal > 0),
        CONSTRAINT UQ_ORDER_ITEMS_order_menu UNIQUE (order_id, menu_id),
        CONSTRAINT FK_ORDER_ITEMS_ORDERS FOREIGN KEY (order_id)
            REFERENCES dbo.ORDERS (id) ON DELETE CASCADE,
        -- Snapshot nama/harga tetap tersimpan walau menu aslinya dihapus.
        CONSTRAINT FK_ORDER_ITEMS_MENU FOREIGN KEY (menu_id)
            REFERENCES dbo.MENU_ITEMS (id) ON DELETE SET NULL
    );

    PRINT 'Tabel ORDER_ITEMS dibuat.';
END
ELSE
BEGIN
    PRINT 'Tabel ORDER_ITEMS sudah ada.';
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_ORDERS_customer_id'
      AND object_id = OBJECT_ID(N'dbo.ORDERS')
)
BEGIN
    CREATE INDEX IX_ORDERS_customer_id ON dbo.ORDERS (customer_id, id DESC);
    PRINT 'Index IX_ORDERS_customer_id dibuat.';
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_ORDER_ITEMS_order_id'
      AND object_id = OBJECT_ID(N'dbo.ORDER_ITEMS')
)
BEGIN
    CREATE INDEX IX_ORDER_ITEMS_order_id ON dbo.ORDER_ITEMS (order_id);
    PRINT 'Index IX_ORDER_ITEMS_order_id dibuat.';
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_ORDER_ITEMS_stall_id'
      AND object_id = OBJECT_ID(N'dbo.ORDER_ITEMS')
)
BEGIN
    CREATE INDEX IX_ORDER_ITEMS_stall_id ON dbo.ORDER_ITEMS (stall_id);
    PRINT 'Index IX_ORDER_ITEMS_stall_id dibuat.';
END
GO

PRINT 'Schema Pertemuan 08 Hands-on 2 selesai.';
GO
