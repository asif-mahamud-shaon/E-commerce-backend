import request from 'supertest';
import app from '../index';
import { prisma } from '../config/database';

describe('Checkout Idempotency Tests', () => {
  let cartToken: string;
  let cartId: string;
  let variantSku: string;

  beforeAll(async () => {
    // Create test product
    const product = await prisma.product.create({
      data: {
        title: 'Test Product',
        slug: 'test-product',
        description: 'Test product for checkout tests',
        images: ['https://example.com/image.jpg'],
        status: 'active',
        variants: {
          create: {
            sku: 'TEST-SKU-001',
            options: { color: 'Red', size: 'M' },
            price: 5000, // $50.00
            currency: 'USD',
            stock: 10,
          },
        },
      },
      include: { variants: true },
    });

    variantSku = product.variants[0].sku;

    // Create test promo
    await prisma.promo.create({
      data: {
        code: 'CHECKOUT10',
        type: 'percent',
        value: 10.00, // 10% discount
        startsAt: new Date('2024-01-01T00:00:00Z'),
        endsAt: new Date('2024-12-31T23:59:59Z'),
        active: true,
      },
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
    // Clear data before each test
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.cart.deleteMany();
    
    // Create a new cart
    const response = await request(app).get('/api/carts');
    cartToken = response.body.token;
    cartId = response.body.id;
  });

  describe('Checkout Process', () => {
    it('should create order from cart with items', async () => {
      // Add items to cart
      await request(app)
        .post('/api/carts/items')
        .set('X-Cart-Token', cartToken)
        .send({
          sku: variantSku,
          qty: 2,
        });

      // Create order
      const response = await request(app)
        .post('/api/orders')
        .send({
          cartId: cartId,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.cartId).toBe(cartId);
      expect(response.body.status).toBe('created');
      expect(response.body.items).toHaveLength(1);
      expect(response.body.items[0].sku).toBe(variantSku);
      expect(response.body.items[0].qty).toBe(2);
      expect(response.body.items[0].lineTotal).toBe(10000); // 2 * $50.00
      expect(response.body.subtotal).toBe(10000);
      expect(response.body.discount).toBe(0);
      expect(response.body.grandTotal).toBe(10000);
    });

    it('should create order with promo code applied', async () => {
      // Add items to cart
      await request(app)
        .post('/api/carts/items')
        .set('X-Cart-Token', cartToken)
        .send({
          sku: variantSku,
          qty: 2,
        });

      // Apply promo code
      await request(app)
        .post('/api/carts/apply-promo')
        .set('X-Cart-Token', cartToken)
        .send({
          code: 'CHECKOUT10',
        });

      // Create order
      const response = await request(app)
        .post('/api/orders')
        .send({
          cartId: cartId,
        })
        .expect(201);

      expect(response.body.promoCode).toBe('CHECKOUT10');
      expect(response.body.subtotal).toBe(10000); // $100.00
      expect(response.body.discount).toBe(1000); // $10.00 (10% of $100)
      expect(response.body.grandTotal).toBe(9000); // $90.00
    });

    it('should prevent creating order from empty cart', async () => {
      const response = await request(app)
        .post('/api/orders')
        .send({
          cartId: cartId,
        })
        .expect(409);

      expect(response.body.error.code).toBe('CONFLICT');
      expect(response.body.error.message).toContain('Cannot create order from empty cart');
    });

    it('should prevent creating order with non-existent cart', async () => {
      const response = await request(app)
        .post('/api/orders')
        .send({
          cartId: 'non-existent-cart-id',
        })
        .expect(404);

      expect(response.body.error.code).toBe('NOT_FOUND');
      expect(response.body.error.message).toContain('Cart not found');
    });
  });

  describe('Checkout Idempotency', () => {
    it('should return same order when checkout is called multiple times', async () => {
      // Add items to cart
      await request(app)
        .post('/api/carts/items')
        .set('X-Cart-Token', cartToken)
        .send({
          sku: variantSku,
          qty: 1,
        });

      // First checkout
      const firstResponse = await request(app)
        .post('/api/orders')
        .send({
          cartId: cartId,
        })
        .expect(201);

      const orderId = firstResponse.body.id;

      // Second checkout with same cart
      const secondResponse = await request(app)
        .post('/api/orders')
        .send({
          cartId: cartId,
        })
        .expect(201);

      // Should return the same order
      expect(secondResponse.body.id).toBe(orderId);
      expect(secondResponse.body.cartId).toBe(cartId);
      expect(secondResponse.body.status).toBe('created');
      expect(secondResponse.body.items).toHaveLength(1);
      expect(secondResponse.body.subtotal).toBe(5000);
      expect(secondResponse.body.grandTotal).toBe(5000);
    });

    it('should maintain idempotency with promo codes', async () => {
      // Add items to cart
      await request(app)
        .post('/api/carts/items')
        .set('X-Cart-Token', cartToken)
        .send({
          sku: variantSku,
          qty: 2,
        });

      // Apply promo code
      await request(app)
        .post('/api/carts/apply-promo')
        .set('X-Cart-Token', cartToken)
        .send({
          code: 'CHECKOUT10',
        });

      // First checkout
      const firstResponse = await request(app)
        .post('/api/orders')
        .send({
          cartId: cartId,
        })
        .expect(201);

      const orderId = firstResponse.body.id;

      // Second checkout with same cart
      const secondResponse = await request(app)
        .post('/api/orders')
        .send({
          cartId: cartId,
        })
        .expect(201);

      // Should return the same order with same promo applied
      expect(secondResponse.body.id).toBe(orderId);
      expect(secondResponse.body.promoCode).toBe('CHECKOUT10');
      expect(secondResponse.body.subtotal).toBe(10000);
      expect(secondResponse.body.discount).toBe(1000);
      expect(secondResponse.body.grandTotal).toBe(9000);
    });

    it('should create separate orders for different carts', async () => {
      // Create first cart and add items
      const firstCartResponse = await request(app).get('/api/carts');
      const firstCartToken = firstCartResponse.body.token;
      const firstCartId = firstCartResponse.body.id;

      await request(app)
        .post('/api/carts/items')
        .set('X-Cart-Token', firstCartToken)
        .send({
          sku: variantSku,
          qty: 1,
        });

      // Create second cart and add items
      const secondCartResponse = await request(app).get('/api/carts');
      const secondCartToken = secondCartResponse.body.token;
      const secondCartId = secondCartResponse.body.id;

      await request(app)
        .post('/api/carts/items')
        .set('X-Cart-Token', secondCartToken)
        .send({
          sku: variantSku,
          qty: 2,
        });

      // Checkout first cart
      const firstOrderResponse = await request(app)
        .post('/api/orders')
        .send({
          cartId: firstCartId,
        })
        .expect(201);

      // Checkout second cart
      const secondOrderResponse = await request(app)
        .post('/api/orders')
        .send({
          cartId: secondCartId,
        })
        .expect(201);

      // Should create different orders
      expect(firstOrderResponse.body.id).not.toBe(secondOrderResponse.body.id);
      expect(firstOrderResponse.body.cartId).toBe(firstCartId);
      expect(secondOrderResponse.body.cartId).toBe(secondCartId);
      expect(firstOrderResponse.body.subtotal).toBe(5000); // 1 * $50
      expect(secondOrderResponse.body.subtotal).toBe(10000); // 2 * $50
    });
  });

  describe('Order Management', () => {
    it('should retrieve order by ID', async () => {
      // Add items to cart
      await request(app)
        .post('/api/carts/items')
        .set('X-Cart-Token', cartToken)
        .send({
          sku: variantSku,
          qty: 1,
        });

      // Create order
      const createResponse = await request(app)
        .post('/api/orders')
        .send({
          cartId: cartId,
        });

      const orderId = createResponse.body.id;

      // Retrieve order
      const response = await request(app)
        .get(`/api/orders/${orderId}`)
        .expect(200);

      expect(response.body.id).toBe(orderId);
      expect(response.body.cartId).toBe(cartId);
      expect(response.body.status).toBe('created');
      expect(response.body.items).toHaveLength(1);
    });

    it('should update order status', async () => {
      // Add items to cart
      await request(app)
        .post('/api/carts/items')
        .set('X-Cart-Token', cartToken)
        .send({
          sku: variantSku,
          qty: 1,
        });

      // Create order
      const createResponse = await request(app)
        .post('/api/orders')
        .send({
          cartId: cartId,
        });

      const orderId = createResponse.body.id;

      // Update order status
      const response = await request(app)
        .put(`/api/orders/${orderId}/status`)
        .send({
          status: 'paid',
        })
        .expect(200);

      expect(response.body.id).toBe(orderId);
      expect(response.body.status).toBe('paid');
    });

    it('should list orders with pagination', async () => {
      // Add items to cart
      await request(app)
        .post('/api/carts/items')
        .set('X-Cart-Token', cartToken)
        .send({
          sku: variantSku,
          qty: 1,
        });

      // Create order
      await request(app)
        .post('/api/orders')
        .send({
          cartId: cartId,
        });

      // List orders
      const response = await request(app)
        .get('/api/orders')
        .expect(200);

      expect(response.body).toHaveProperty('orders');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.orders).toHaveLength(1);
      expect(response.body.pagination.total).toBe(1);
    });
  });
});

