const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('../config/swagger');

const swaggerOptions = {
  explorer: true,
  swaggerOptions: {
    persistAuthorization: true,
    // Add this to make authorization more obvious to users
    displayRequestDuration: true,
    docExpansion: 'none',
    filter: true,
    showExtensions: true,
    syntaxHighlight: {
      theme: 'agate',
    },
    tryItOutEnabled: true,
  },
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .auth-wrapper { margin-top: 15px; }
    .swagger-ui .auth-btn-wrapper { display: flex; justify-content: center; }
    .swagger-ui .auth-btn-wrapper .btn { margin-right: 10px; }
    .swagger-ui .auth-container { margin: 0 0 20px 0; padding: 10px; background-color: #f0f0f0; border-radius: 4px; }
    .swagger-ui .auth-container h2 { margin-top: 0; }
  `,
  customSiteTitle: 'WebCom API Documentation',
  // This forces the "Authorize" button to be clearly visible
  customfavIcon: null,
};

module.exports = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, swaggerOptions));
};
