import request from 'supertest';
import app from '../index';
import { prisma } from '../config/database';

describe('Cart Flow Tests', () => {
  let cartToken: string;
  let productSlug: string;
  let variantSku: string;

  beforeAll(async () => {
    // Create a test product
    const product = await prisma.product.create({
      data: {
        title: 'Test Product',
        slug: 'test-product',
        description: 'Test product for cart tests',
        images: ['https://example.com/image.jpg'],
        status: 'active',
        variants: {
          create: {
            sku: 'TEST-SKU-001',
            options: { color: 'Red', size: 'M' },
            price: 2500, // $25.00
            currency: 'USD',
            stock: 10,
          },
        },
      },
      include: { variants: true },
    });

    productSlug = product.slug;
    variantSku = product.variants[0].sku;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.cart.deleteMany();
    await prisma.variant.deleteMany();
    await prisma.product.deleteMany();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clear cart items before each test
    await prisma.cartItem.deleteMany();
    await prisma.cart.deleteMany();
  });

  describe('Cart Creation and Management', () => {
    it('should create a new cart when no token is provided', async () => {
      const response = await request(app)
        .get('/api/carts')
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('items');
      expect(response.body.items).toHaveLength(0);
      expect(response.body).toHaveProperty('subtotal', 0);
      expect(response.body).toHaveProperty('discount', 0);
      expect(response.body).toHaveProperty('grandTotal', 0);

      cartToken = response.body.token;
    });

    it('should retrieve existing cart with token', async () => {
      // First create a cart
      const createResponse = await request(app)
        .get('/api/carts')
        .expect(200);

      const token = createResponse.body.token;

      // Then retrieve it with the token
      const response = await request(app)
        .get('/api/carts')
        .set('X-Cart-Token', token)
        .expect(200);

      expect(response.body.token).toBe(token);
      expect(response.body.id).toBe(createResponse.body.id);
    });
  });

  describe('Cart Item Operations', () => {
    beforeEach(async () => {
      // Create a cart for each test
      const response = await request(app).get('/api/carts');
      cartToken = response.body.token;
    });

    it('should add item to cart', async () => {
      const response = await request(app)
        .post('/api/carts/items')
        .set('X-Cart-Token', cartToken)
        .send({
          sku: variantSku,
          qty: 2,
        })
        .expect(200);

      expect(response.body.items).toHaveLength(1);
      expect(response.body.items[0].sku).toBe(variantSku);
      expect(response.body.items[0].qty).toBe(2);
      expect(response.body.items[0].unitPrice).toBe(2500);
      expect(response.body.subtotal).toBe(5000); // 2 * $25.00
      expect(response.body.grandTotal).toBe(5000);
    });

    it('should update item quantity in cart', async () => {
      // First add an item
      await request(app)
        .post('/api/carts/items')
        .set('X-Cart-Token', cartToken)
        .send({
          sku: variantSku,
          qty: 1,
        });

      // Then update the quantity
      const response = await request(app)
        .put(`/api/carts/items/${variantSku}`)
        .set('X-Cart-Token', cartToken)
        .send({
          qty: 3,
        })
        .expect(200);

      expect(response.body.items[0].qty).toBe(3);
      expect(response.body.subtotal).toBe(7500); // 3 * $25.00
    });

    it('should remove item from cart when quantity is 0', async () => {
      // First add an item
      await request(app)
        .post('/api/carts/items')
        .set('X-Cart-Token', cartToken)
        .send({
          sku: variantSku,
          qty: 2,
        });

      // Then set quantity to 0
      const response = await request(app)
        .put(`/api/carts/items/${variantSku}`)
        .set('X-Cart-Token', cartToken)
        .send({
          qty: 0,
        })
        .expect(200);

      expect(response.body.items).toHaveLength(0);
      expect(response.body.subtotal).toBe(0);
    });

    it('should remove item from cart', async () => {
      // First add an item
      await request(app)
        .post('/api/carts/items')
        .set('X-Cart-Token', cartToken)
        .send({
          sku: variantSku,
          qty: 2,
        });

      // Then remove it
      const response = await request(app)
        .delete(`/api/carts/items/${variantSku}`)
        .set('X-Cart-Token', cartToken)
        .expect(200);

      expect(response.body.items).toHaveLength(0);
      expect(response.body.subtotal).toBe(0);
    });

    it('should prevent adding item with insufficient stock', async () => {
      const response = await request(app)
        .post('/api/carts/items')
        .set('X-Cart-Token', cartToken)
        .send({
          sku: variantSku,
          qty: 15, // More than available stock (10)
        })
        .expect(409);

      expect(response.body.error.code).toBe('CONFLICT');
      expect(response.body.error.message).toContain('Insufficient stock');
    });

    it('should prevent adding non-existent SKU', async () => {
      const response = await request(app)
        .post('/api/carts/items')
        .set('X-Cart-Token', cartToken)
        .send({
          sku: 'NON-EXISTENT-SKU',
          qty: 1,
        })
        .expect(404);

      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('Cart Validation', () => {
    beforeEach(async () => {
      const response = await request(app).get('/api/carts');
      cartToken = response.body.token;
    });

    it('should validate required fields when adding item', async () => {
      const response = await request(app)
        .post('/api/carts/items')
        .set('X-Cart-Token', cartToken)
        .send({})
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details).toHaveLength(2);
    });

    it('should validate quantity is positive', async () => {
      const response = await request(app)
        .post('/api/carts/items')
        .set('X-Cart-Token', cartToken)
        .send({
          sku: variantSku,
          qty: 0,
        })
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});

