import swaggerAutogen from 'swagger-autogen';

const doc = {
  info: { title: 'Review Kantin API', version: '1.0.0' },
  servers: [{ url: 'http://localhost:3000' }],
  securityDefinitions: {
    bearerAuth: {
      type: 'apiKey',
      name: 'Authorization',
      in: 'header',
      description: 'Masukkan Bearer diikuti token JWT: Bearer <token>',
    },
  },
  definitions: {
    OrderInput: {
      customerName: 'Customer Demo',
      phone: '081234567890',
      paymentMethod: 'cash',
      note: '',
      items: [{ menuId: 1, quantity: 2 }],
    },
    AuthInput: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email', example: 'budi@example.com' },
        password: { type: 'string', minLength: 8, maxLength: 72 },
      },
    },
    RegisterInput: {
      type: 'object',
      required: ['name', 'email', 'password'],
      properties: {
        name: { type: 'string', minLength: 3, maxLength: 100 },
        email: { type: 'string', format: 'email', example: 'budi@example.com' },
        password: { type: 'string', minLength: 8, maxLength: 72 },
      },
    },
    AuthUser: {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        name: { type: 'string' },
        email: { type: 'string', format: 'email' },
        role: { type: 'string', enum: ['admin', 'owner', 'customer'] },
      },
    },
    LoginResponse: {
      type: 'object',
      properties: {
        token: { type: 'string' },
        tokenType: { type: 'string', example: 'Bearer' },
        expiresIn: { type: 'string', example: '2h' },
        user: { $ref: '#/definitions/AuthUser' },
      },
    },
    AuditLog: {
      type: 'object',
      properties: {
        id: { type: 'integer', example: 21 },
        userId: { type: 'integer', example: 1 },
        userName: { type: 'string', example: 'Admin Kantin' },
        userEmail: { type: 'string', format: 'email', example: 'admin@kantin.test' },
        action: { type: 'string', example: 'LOGOUT' },
        targetTable: { type: 'string', example: 'USERS' },
        targetId: { type: 'integer', example: 1 },
        metadata: {
          oneOf: [
            { type: 'object', additionalProperties: true },
            { type: 'string' },
            { type: 'null' },
          ],
        },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
    AuditLogList: {
      type: 'object',
      properties: {
        items: { type: 'array', items: { $ref: '#/definitions/AuditLog' } },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer' },
            pageSize: { type: 'integer' },
            total: { type: 'integer' },
            totalPages: { type: 'integer' },
          },
        },
      },
    },
    FlagStatusUpdate: {
      status: 'resolved',
    },
    LikeInput: {
      reviewId: 1,
      userId: 2,
    },
    ReviewInput: {
      type: 'object',
      required: ['stallId', 'rating'],
      properties: {
        stallId: { type: 'integer', example: 1 },
        rating: { type: 'integer', minimum: 1, maximum: 5, example: 5 },
        comment: { type: 'string', maxLength: 1000, example: 'Makanannya enak' },
      },
    },
    MenuItemInput: {
      type: 'object',
      required: ['stallId', 'name', 'price'],
      properties: {
        stallId: { type: 'integer', example: 1 },
        name: { type: 'string', example: 'Nasi Goreng Spesial' },
        price: { type: 'integer', minimum: 0, example: 18000 },
        isAvailable: { type: 'boolean', example: true },
      },
    },
    MenuItemUpdate: {
      type: 'object',
      properties: {
        stallId: { type: 'integer', example: 1 },
        name: { type: 'string', example: 'Nasi Goreng Spesial' },
        price: { type: 'integer', minimum: 0, example: 18000 },
        isAvailable: { type: 'boolean', example: true },
      },
    },
    UserInput: {
      type: 'object',
      required: ['name', 'email', 'password'],
      properties: {
        name: { type: 'string', example: 'Budi Santoso' },
        email: { type: 'string', format: 'email', example: 'budi@example.com' },
        password: { type: 'string', example: 'password123' },
      },
    },
    StallInput: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string', example: 'Warung Baru' },
        category: { type: 'string', example: 'Nasi' },
        location: { type: 'string', example: 'Kantin FK' },
        description: { type: 'string' },
      },
    },
  },
};

const outputFile = './swagger-output.json';
const endpointsFiles = ['./src/app.ts'];

swaggerAutogen()(outputFile, endpointsFiles, doc);
