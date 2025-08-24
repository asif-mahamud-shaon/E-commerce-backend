import request from 'supertest';
import app from '../index';
import { prisma } from '../config/database';

describe('Promo Math and Validation Tests', () => {
  let cartToken: string;
  let variantSku: string;

  beforeAll(async () => {
    // Create test product
    const product = await prisma.product.create({
      data: {
        title: 'Test Product',
        slug: 'test-product',
        description: 'Test product for promo tests',
        images: ['https://example.com/image.jpg'],
        status: 'active',
        variants: {
          create: {
            sku: 'TEST-SKU-001',
            options: { color: 'Red', size: 'M' },
            price: 10000, // $100.00
            currency: 'USD',
            stock: 10,
          },
        },
      },
      include: { variants: true },
    });

    variantSku = product.variants[0].sku;

    // Create test promos
    await prisma.promo.createMany({
      data: [
        {
          code: 'PERCENT10',
          type: 'percent',
          value: 10.00, // 10% discount
          startsAt: new Date('2024-01-01T00:00:00Z'),
          endsAt: new Date('2024-12-31T23:59:59Z'),
          active: true,
        },
        {
          code: 'FIXED20',
          type: 'fixed',
          value: 2000, // $20.00 discount
          startsAt: new Date('2024-01-01T00:00:00Z'),
          endsAt: new Date('2024-12-31T23:59:59Z'),
          active: true,
        },
        {
          code: 'EXPIRED',
          type: 'percent',
          value: 25.00, // 25% discount
          startsAt: new Date('2023-01-01T00:00:00Z'),
          endsAt: new Date('2023-12-31T23:59:59Z'),
          active: false,
        },
      ],
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.cart.deleteMany();
    await prisma.variant.deleteMany();
    await prisma.product.deleteMany();
    await prisma.promo.deleteMany();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clear cart items before each test
    await prisma.cartItem.deleteMany();
    await prisma.cart.deleteMany();
    
    // Create a new cart
    const response = await request(app).get('/api/carts');
    cartToken = response.body.token;
  });

  describe('Promo Math Calculations', () => {
    it('should apply 10% discount correctly', async () => {
      // Add item to cart (2 items at $100 each = $200 subtotal)
      await request(app)
        .post('/api/carts/items')
        .set('X-Cart-Token', cartToken)
        .send({
          sku: variantSku,
          qty: 2,
        });

      // Apply 10% promo
      const response = await request(app)
        .post('/api/carts/apply-promo')
        .set('X-Cart-Token', cartToken)
        .send({
          code: 'PERCENT10',
        })
        .expect(200);

      expect(response.body.subtotal).toBe(20000); // $200.00
      expect(response.body.discount).toBe(2000); // $20.00 (10% of $200)
      expect(response.body.grandTotal).toBe(18000); // $180.00
      expect(response.body.promoCode).toBe('PERCENT10');
    });

    it('should apply fixed discount correctly', async () => {
      // Add item to cart (1 item at $100 = $100 subtotal)
      await request(app)
        .post('/api/carts/items')
        .set('X-Cart-Token', cartToken)
        .send({
          sku: variantSku,
          qty: 1,
        });

      // Apply $20 fixed promo
      const response = await request(app)
        .post('/api/carts/apply-promo')
        .set('X-Cart-Token', cartToken)
        .send({
          code: 'FIXED20',
        })
        .expect(200);

      expect(response.body.subtotal).toBe(10000); // $100.00
      expect(response.body.discount).toBe(2000); // $20.00
      expect(response.body.grandTotal).toBe(8000); // $80.00
      expect(response.body.promoCode).toBe('FIXED20');
    });

    it('should not apply discount greater than subtotal', async () => {
      // Add item to cart (1 item at $100 = $100 subtotal)
      await request(app)
        .post('/api/carts/items')
        .set('X-Cart-Token', cartToken)
        .send({
          sku: variantSku,
          qty: 1,
        });

      // Create a promo with value greater than subtotal
      await prisma.promo.create({
        data: {
          code: 'BIGDISCOUNT',
          type: 'fixed',
          value: 15000, // $150.00 discount (more than $100 subtotal)
          startsAt: new Date('2024-01-01T00:00:00Z'),
          endsAt: new Date('2024-12-31T23:59:59Z'),
          active: true,
        },
      });

      // Apply the promo
      const response = await request(app)
        .post('/api/carts/apply-promo')
        .set('X-Cart-Token', cartToken)
        .send({
          code: 'BIGDISCOUNT',
        })
        .expect(200);

      expect(response.body.subtotal).toBe(10000); // $100.00
      expect(response.body.discount).toBe(10000); // $100.00 (capped at subtotal)
      expect(response.body.grandTotal).toBe(0); // $0.00 (minimum)
    });

    it('should round percent discounts to nearest cent', async () => {
      // Add item to cart (3 items at $100 each = $300 subtotal)
      await request(app)
        .post('/api/carts/items')
        .set('X-Cart-Token', cartToken)
        .send({
          sku: variantSku,
          qty: 3,
        });

      // Create a promo with 33.33% discount
      await prisma.promo.create({
        data: {
          code: 'THIRTYTHREE',
          type: 'percent',
          value: 33.33, // 33.33% discount
          startsAt: new Date('2024-01-01T00:00:00Z'),
          endsAt: new Date('2024-12-31T23:59:59Z'),
          active: true,
        },
      });

      // Apply the promo
      const response = await request(app)
        .post('/api/carts/apply-promo')
        .set('X-Cart-Token', cartToken)
        .send({
          code: 'THIRTYTHREE',
        })
        .expect(200);

      expect(response.body.subtotal).toBe(30000); // $300.00
      expect(response.body.discount).toBe(9999); // $99.99 (30000 * 0.3333 rounded)
      expect(response.body.grandTotal).toBe(20001); // $200.01
    });
  });

  describe('Promo Validation', () => {
    it('should reject expired promo codes', async () => {
      // Add item to cart
      await request(app)
        .post('/api/carts/items')
        .set('X-Cart-Token', cartToken)
        .send({
          sku: variantSku,
          qty: 1,
        });

      // Try to apply expired promo
      const response = await request(app)
        .post('/api/carts/apply-promo')
        .set('X-Cart-Token', cartToken)
        .send({
          code: 'EXPIRED',
        })
        .expect(404);

      expect(response.body.error.code).toBe('NOT_FOUND');
      expect(response.body.error.message).toContain('Invalid or expired promo code');
    });

    it('should reject promo codes for empty carts', async () => {
      const response = await request(app)
        .post('/api/carts/apply-promo')
        .set('X-Cart-Token', cartToken)
        .send({
          code: 'PERCENT10',
        })
        .expect(409);

      expect(response.body.error.code).toBe('CONFLICT');
      expect(response.body.error.message).toContain('Cannot apply promo to empty cart');
    });

    it('should reject non-existent promo codes', async () => {
      // Add item to cart
      await request(app)
        .post('/api/carts/items')
        .set('X-Cart-Token', cartToken)
        .send({
          sku: variantSku,
          qty: 1,
        });

      // Try to apply non-existent promo
      const response = await request(app)
        .post('/api/carts/apply-promo')
        .set('X-Cart-Token', cartToken)
        .send({
          code: 'NONEXISTENT',
        })
        .expect(404);

      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should validate promo code format', async () => {
      const response = await request(app)
        .post('/api/carts/apply-promo')
        .set('X-Cart-Token', cartToken)
        .send({
          code: '', // Empty code
        })
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Promo Management', () => {
    it('should remove promo code from cart', async () => {
      // Add item to cart
      await request(app)
        .post('/api/carts/items')
        .set('X-Cart-Token', cartToken)
        .send({
          sku: variantSku,
          qty: 1,
        });

      // Apply promo
      await request(app)
        .post('/api/carts/apply-promo')
        .set('X-Cart-Token', cartToken)
        .send({
          code: 'PERCENT10',
        });

      // Remove promo
      const response = await request(app)
        .delete('/api/carts/promo')
        .set('X-Cart-Token', cartToken)
        .expect(200);

      expect(response.body.promoCode).toBeNull();
      expect(response.body.discount).toBe(0);
      expect(response.body.grandTotal).toBe(response.body.subtotal);
    });

    it('should replace existing promo when applying new one', async () => {
      // Add item to cart
      await request(app)
        .post('/api/carts/items')
        .set('X-Cart-Token', cartToken)
        .send({
          sku: variantSku,
          qty: 1,
        });

      // Apply first promo
      await request(app)
        .post('/api/carts/apply-promo')
        .set('X-Cart-Token', cartToken)
        .send({
          code: 'PERCENT10',
        });

      // Apply second promo (should replace the first)
      const response = await request(app)
        .post('/api/carts/apply-promo')
        .set('X-Cart-Token', cartToken)
        .send({
          code: 'FIXED20',
        })
        .expect(200);

      expect(response.body.promoCode).toBe('FIXED20');
      expect(response.body.discount).toBe(2000); // $20.00 fixed discount
    });
  });
});

