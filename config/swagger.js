const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'WebCom API Documentation',
      version: '1.0.0',
      description: 'API documentation for the WebCom application',
      contact: {
        name: 'WebCom Support',
        email: 'support@webcom.com',
      },
    },
    servers: [
      {
        url: '/api/v1',
        description: 'API v1',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token (without Bearer prefix)',
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  apis: ['./controllers/**/*.js', './routes/**/*.js', './models/**/*.js', './docs/**/*.yaml'],
};

const specs = swaggerJsdoc(options);

module.exports = specs;
