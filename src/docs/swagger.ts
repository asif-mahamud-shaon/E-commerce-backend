import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'E-commerce API',
      version: '1.0.0',
      description: 'A production-ready TypeScript Node.js + Express e-commerce backend with PostgreSQL',
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      schemas: {
        Product: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            slug: { type: 'string' },
            description: { type: 'string' },
            images: { type: 'array', items: { type: 'string' } },
            status: { type: 'string', enum: ['active', 'draft'] },
            variants: {
              type: 'array',
              items: { $ref: '#/components/schemas/Variant' },
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Variant: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            sku: { type: 'string' },
            options: { type: 'object' },
            price: { type: 'integer' },
            currency: { type: 'string' },
            stock: { type: 'integer' },
          },
        },
        Cart: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            token: { type: 'string' },
            items: {
              type: 'array',
              items: { $ref: '#/components/schemas/CartItem' },
            },
            promoCode: { type: 'string' },
            subtotal: { type: 'integer' },
            discount: { type: 'integer' },
            grandTotal: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CartItem: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            sku: { type: 'string' },
            title: { type: 'string' },
            unitPrice: { type: 'integer' },
            currency: { type: 'string' },
            qty: { type: 'integer' },
          },
        },
        Promo: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            code: { type: 'string' },
            type: { type: 'string', enum: ['percent', 'fixed'] },
            value: { type: 'number' },
            startsAt: { type: 'string', format: 'date-time' },
            endsAt: { type: 'string', format: 'date-time' },
            active: { type: 'boolean' },
          },
        },
        Order: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            cartId: { type: 'string', format: 'uuid' },
            items: {
              type: 'array',
              items: { $ref: '#/components/schemas/OrderItem' },
            },
            promoCode: { type: 'string' },
            subtotal: { type: 'integer' },
            discount: { type: 'integer' },
            grandTotal: { type: 'integer' },
            status: { type: 'string', enum: ['created', 'paid', 'cancelled'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        OrderItem: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            sku: { type: 'string' },
            title: { type: 'string' },
            unitPrice: { type: 'integer' },
            currency: { type: 'string' },
            qty: { type: 'integer' },
            lineTotal: { type: 'integer' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                code: { type: 'string' },
                details: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      path: { type: 'string' },
                      issue: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      securitySchemes: {
        cartToken: {
          type: 'apiKey',
          in: 'header',
          name: 'X-Cart-Token',
          description: 'Cart token for guest cart management',
        },
      },
    },
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const specs = swaggerJsdoc(options);

