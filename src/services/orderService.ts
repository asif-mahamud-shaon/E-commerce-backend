import { prisma } from '../config/database';
import { NotFoundError, ConflictError } from '../utils/errors';
import { CartService } from './cartService';
import { PromoService } from './promoService';

export class OrderService {
  static async createOrder(cartId: string) {
    // Check if order already exists for this cart (idempotency)
    const existingOrder = await prisma.order.findFirst({
      where: { cartId },
    });

    if (existingOrder) {
      return existingOrder;
    }

    // Get cart with items
    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: { items: true },
    });

    if (!cart) {
      throw new NotFoundError('Cart not found');
    }

    if (cart.items.length === 0) {
      throw new ConflictError('Cannot create order from empty cart');
    }

    // Calculate totals
    const totals = await CartService.calculateTotalsWithPromo(cart.items, cart.promoCode);

    // Create order items
    const orderItems = cart.items.map(item => ({
      sku: item.sku,
      title: item.title,
      unitPrice: item.unitPrice,
      currency: item.currency,
      qty: item.qty,
      lineTotal: item.unitPrice * item.qty,
    }));

    // Create order
    const order = await prisma.order.create({
      data: {
        cartId: cart.id,
        promoCode: cart.promoCode,
        subtotal: totals.subtotal,
        discount: totals.discount,
        grandTotal: totals.grandTotal,
        status: 'created',
        items: {
          create: orderItems,
        },
      },
      include: {
        items: true,
      },
    });

    return order;
  }

  static async getOrders(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        skip,
        take: limit,
        include: {
          items: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count(),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  static async getOrderById(id: string) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    return order;
  }

  static async updateOrderStatus(id: string, status: string) {
    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if (!['created', 'paid', 'cancelled'].includes(status)) {
      throw new ConflictError('Invalid order status');
    }

    return prisma.order.update({
      where: { id },
      data: { status },
      include: {
        items: true,
      },
    });
  }

  static async getOrderByCartId(cartId: string) {
    const order = await prisma.order.findFirst({
      where: { cartId },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    return order;
  }
}

