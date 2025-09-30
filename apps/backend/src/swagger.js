const swaggerUi = require('swagger-ui-express');

const spec = {
  openapi: '3.0.0',
  info: { title: 'SGTO API', version: '1.0.0' },
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
    },
    schemas: {
      AuthRegisterRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          name: { type: 'string', example: 'Dev' },
          email: { type: 'string', example: 'dev@sgto.local' },
          password: { type: 'string', example: 'secret123' }
        }
      },
      AuthLoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', example: 'dev@sgto.local' },
          password: { type: 'string', example: 'secret123' }
        }
      },
      AuthResponse: {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string', nullable: true },
              email: { type: 'string' }
            }
          },
          token: { type: 'string' }
        }
      },
      Obligation: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          userId: { type: 'string' },
          title: { type: 'string', example: 'DAS 09/2025' },
          regime: { type: 'string', enum: ['SIMPLES','LUCRO_PRESUMIDO','LUCRO_REAL','MEI'] },
          periodStart: { type: 'string', format: 'date-time' },
          periodEnd:   { type: 'string', format: 'date-time' },
          dueDate:     { type: 'string', format: 'date-time' },
          status: { type: 'string', enum: ['PENDING','SUBMITTED','LATE','PAID','CANCELED'] },
          amount: { type: 'number', example: 0 },
          notes: { type: 'string', nullable: true }
        }
      },
      ObligationCreate: {
        type: 'object',
        required: ['title','regime','periodStart','periodEnd','dueDate'],
        properties: {
          title: { type: 'string', example: 'DAS 09/2025' },
          regime: { type: 'string', enum: ['SIMPLES','LUCRO_PRESUMIDO','LUCRO_REAL','MEI'] },
          periodStart: { type: 'string', example: '2025-09-01' },
          periodEnd:   { type: 'string', example: '2025-09-30' },
          dueDate:     { type: 'string', example: '2025-10-20' },
          amount: { type: 'number', example: 0 },
          notes: { type: 'string' }
        }
      },
      ObligationUpdate: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          regime: { type: 'string', enum: ['SIMPLES','LUCRO_PRESUMIDO','LUCRO_REAL','MEI'] },
          periodStart: { type: 'string' },
          periodEnd:   { type: 'string' },
          dueDate:     { type: 'string' },
          status: { type: 'string', enum: ['PENDING','SUBMITTED','LATE','PAID','CANCELED'] },
          amount: { type: 'number' },
          notes: { type: 'string' }
        }
      },
      ObligationFile: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          obligationId: { type: 'string' },
          fileName: { type: 'string' },
          originalName: { type: 'string' },
          fileSize: { type: 'integer' },
          mimeType: { type: 'string' },
          s3Key: { type: 'string' },
          s3Url: { type: 'string' },
          uploadedBy: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' }
        }
      }
    }
  },
  paths: {
    // 🔐 AUTH
    '/api/auth/register': {
      post: {
        summary: 'Register',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthRegisterRequest' } } }
        },
        responses: { '201': { description: 'Created' }, '409': { description: 'Email already in use' } }
      }
    },
    '/api/auth/login': {
      post: {
        summary: 'Login',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthLoginRequest' } } }
        },
        responses: { '200': { description: 'OK' }, '401': { description: 'Invalid credentials' } }
      }
    },
    '/api/auth/me': {
      get: {
        summary: 'Me',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'OK' }, '401': { description: 'Unauthorized' } }
      }
    },

    // 📋 OBLIGATIONS
    '/api/obligations': {
      get: {
        summary: 'List obligations',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'OK' } }
      },
      post: {
        summary: 'Create obligation',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ObligationCreate' } } } },
        responses: { '201': { description: 'Created' } }
      }
    },
    '/api/obligations/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      get: { summary: 'Get by ID', security: [{ bearerAuth: [] }], responses: { '200': { description: 'OK' }, '404': { description: 'Not found' } } },
      put: { summary: 'Update', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ObligationUpdate' } } } }, responses: { '200': { description: 'OK' } } },
      delete: { summary: 'Delete', security: [{ bearerAuth: [] }], responses: { '204': { description: 'No Content' } } }
    },

    // 📂 FILES
    '/api/obligations/{id}/files': {
      post: {
        summary: 'Upload files',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  files: { type: 'array', items: { type: 'string', format: 'binary' } }
                }
              }
            }
          }
        },
        responses: { '201': { description: 'Files uploaded successfully' }, '400': { description: 'No files uploaded' } }
      },
      get: {
        summary: 'List obligation files',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'OK' } }
      }
    },
    '/api/obligations/files/{fileId}/download': {
      get: {
        summary: 'Get signed download URL',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'fileId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'OK' }, '404': { description: 'File not found' } }
      }
    },
    '/api/obligations/files/{fileId}': {
      delete: {
        summary: 'Delete file',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'fileId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '204': { description: 'File deleted' }, '404': { description: 'File not found' } }
      }
    }
  }
};

function setupSwagger(app) {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(spec));
}

module.exports = { setupSwagger };
