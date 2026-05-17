// FILE: backend/src/config/swagger.js
// Swagger/OpenAPI 3.0 configuration

const swaggerJsdoc = require('swagger-jsdoc');
const env = require('./env');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Secure File Vault API',
      version: '1.0.0',
      description: 'Production-grade secure file storage and sharing API',
      contact: {
        name: 'API Support',
        email: 'support@vault.dev',
      },
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}/api/${env.API_VERSION}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string' },
            code: { type: 'string' },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            role: { type: 'string', enum: ['admin', 'user'] },
            storageUsed: { type: 'number' },
            storageQuota: { type: 'number' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        File: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            mimeType: { type: 'string' },
            size: { type: 'number' },
            visibility: { type: 'string', enum: ['public', 'private', 'specific_users'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
