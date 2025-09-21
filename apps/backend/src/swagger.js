const swaggerUi = require('swagger-ui-express');

const spec = {
  openapi: '3.0.0',
  info: { title: 'SGOT API', version: '1.0.0' },
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
          email: { type: 'string', example: 'dev@sgot.local' },
          password: { type: 'string', example: 'secret123' }
        }
      },
      AuthLoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', example: 'dev@sgot.local' },
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
          periodStart: { type: 'string', format: 'date-time', example: '2025-09-01T00:00:00Z' },
          periodEnd:   { type: 'string', format: 'date-time', example: '2025-09-30T00:00:00Z' },
          dueDate:     { type: 'string', format: 'date-time', example: '2025-10-20T00:00:00Z' },
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
          regime: { type: 'string', enum: ['SIMPLES','LUCRO_PRESUMIDO','LUCRO_REAL','MEI'], example: 'SIMPLES' },
          periodStart: { type: 'string', example: '2025-09-01' },
          periodEnd:   { type: 'string', example: '2025-09-30' },
          dueDate:     { type: 'string', example: '2025-10-20' },
          amount: { type: 'number', example: 0 },
          notes: { type: 'string', example: 'Padaria Bom Pão ME' }
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
      }
    }
  },
  paths: {
    '/api/auth/register': {
      post: {
        summary: 'Register',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AuthRegisterRequest' }
            }
          }
        },
        responses: {
          '201': { description: 'Created', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
          '409': { description: 'Email already in use' }
        }
      }
    },
    '/api/auth/login': {
      post: {
        summary: 'Login',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AuthLoginRequest' }
            }
          }
        },
        responses: {
          '200': { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
          '401': { description: 'Invalid credentials' }
        }
      }
    },
    '/api/auth/me': {
      get: {
        summary: 'Me',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'OK' }, '401': { description: 'Unauthorized' } }
      }
    },
    '/api/obligations': {
      get: {
        summary: 'List',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'OK',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Obligation' } } } }
          }
        }
      },
      post: {
        summary: 'Create',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ObligationCreate' } } }
        },
        responses: { '201': { description: 'Created' }, '401': { description: 'Unauthorized' } }
      }
    },
    '/api/obligations/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      get: {
        summary: 'Get',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/Obligation' } } } }, '404': { description: 'Not found' } }
      },
      put: {
        summary: 'Update',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ObligationUpdate' } } }
        },
        responses: { '200': { description: 'OK' }, '404': { description: 'Not found' } }
      },
      delete: {
        summary: 'Delete',
        security: [{ bearerAuth: [] }],
        responses: { '204': { description: 'No Content' }, '404': { description: 'Not found' } }
      }
    }
  }
};

function setupSwagger(app) {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(spec));
}
module.exports = { setupSwagger };
