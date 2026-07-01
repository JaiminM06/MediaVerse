import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MediaVerse API',
      version: '1.0.0',
      description: 'YouTube + Twitter hybrid platform API — video pipeline, real-time features, search, analytics'
    },
    servers: [
      { url: 'http://localhost:8000/api/v1', description: 'Development server' }
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'accessToken'
        }
      },
      schemas: {
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data:    { type: 'object' },
            message: { type: 'string' }
          }
        },
        ApiError: {
          type: 'object',
          properties: {
            success:    { type: 'boolean', example: false },
            message:    { type: 'string' },
            errors:     { type: 'array', items: { type: 'object' } },
            statusCode: { type: 'number' }
          }
        }
      }
    },
    security: [{ cookieAuth: [] }]
  },
  apis: ['./src/routes/*.js']    // JSDoc comments in route files
};

export const swaggerSpec = swaggerJsdoc(options);
