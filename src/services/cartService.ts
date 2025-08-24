import { prisma } from '../config/database';
import { NotFoundError, ConflictError } from '../utils/errors';

export interface CartTotals {
  subtotal: number;
  discount: number;
  grandTotal: number;
}

export class CartService {
  static async getCart(token: string) {
    const cart = await prisma.cart.findUnique({
      where: { token },
      include: {
        items: true,
      },
    });

    if (!cart) {
      throw new NotFoundError('Cart not found');
    }

    const totals = this.calculateTotals(cart.items, cart.promoCode);
    
    return {
      ...cart,
      ...totals,
    };
  }

  static async addItem(token: string, sku: string, qty: number) {
    // Find variant by SKU
    const variant = await prisma.variant.findUnique({
      where: { sku },
      include: {
        product: true,
      },
    });

    if (!variant) {
      throw new NotFoundError('Product variant not found');
    }

    if (variant.stock < qty) {
      throw new ConflictError('Insufficient stock');
    }

    // Get or create cart
    let cart = await prisma.cart.findUnique({
      where: { token },
      include: { items: true },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { token },
        include: { items: true },
      });
    }

    // Check if item already exists in cart
    const existingItem = cart.items.find(item => item.sku === sku);

    if (existingItem) {
      // Update existing item
      const newQty = existingItem.qty + qty;
      if (variant.stock < newQty) {
        throw new ConflictError('Insufficient stock');
      }

      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { qty: newQty },
      });
    } else {
      // Add new item
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          sku: variant.sku,
          title: variant.product.title,
          unitPrice: variant.price,
          currency: variant.currency,
          qty,
        },
      });
    }

    return this.getCart(token);
  }

  static async updateItem(token: string, sku: string, qty: number) {
    const cart = await prisma.cart.findUnique({
      where: { token },
      include: { items: true },
    });

    if (!cart) {
      throw new NotFoundError('Cart not found');
    }

    const item = cart.items.find(item => item.sku === sku);
    if (!item) {
      throw new NotFoundError('Item not found in cart');
    }

    if (qty === 0) {
      // Remove item
      await prisma.cartItem.delete({
        where: { id: item.id },
      });
    } else {
      // Check stock
      const variant = await prisma.variant.findUnique({
        where: { sku },
      });

      if (!variant || variant.stock < qty) {
        throw new ConflictError('Insufficient stock');
      }

      // Update quantity
      await prisma.cartItem.update({
        where: { id: item.id },
        data: { qty },
      });
    }

    return this.getCart(token);
  }

  static async removeItem(token: string, sku: string) {
    const cart = await prisma.cart.findUnique({
      where: { token },
      include: { items: true },
    });

    if (!cart) {
      throw new NotFoundError('Cart not found');
    }

    const item = cart.items.find(item => item.sku === sku);
    if (!item) {
      throw new NotFoundError('Item not found in cart');
    }

    await prisma.cartItem.delete({
      where: { id: item.id },
    });

    return this.getCart(token);
  }

  static async applyPromo(token: string, code: string) {
    const promo = await prisma.promo.findFirst({
      where: {
        code: code.toUpperCase(),
        active: true,
        startsAt: { lte: new Date() },
        endsAt: { gte: new Date() },
      },
    });

    if (!promo) {
      throw new NotFoundError('Invalid or expired promo code');
    }

    const cart = await prisma.cart.findUnique({
      where: { token },
      include: { items: true },
    });

    if (!cart) {
      throw new NotFoundError('Cart not found');
    }

    if (cart.items.length === 0) {
      throw new ConflictError('Cannot apply promo to empty cart');
    }

    // Update cart with promo code
    await prisma.cart.update({
      where: { token },
      data: { promoCode: promo.code },
    });

    return this.getCart(token);
  }

  static async removePromo(token: string) {
    const cart = await prisma.cart.findUnique({
      where: { token },
    });

    if (!cart) {
      throw new NotFoundError('Cart not found');
    }

    await prisma.cart.update({
      where: { token },
      data: { promoCode: null },
    });

    return this.getCart(token);
  }

  static calculateTotals(items: any[], promoCode?: string | null): CartTotals {
    const subtotal = items.reduce((sum, item) => sum + (item.unitPrice * item.qty), 0);
    let discount = 0;

    if (promoCode) {
      // In a real implementation, you'd fetch the promo here
      // For now, we'll calculate discount as 0 and let the service handle it
      discount = 0;
    }

    const grandTotal = Math.max(subtotal - discount, 0);

    return {
      subtotal,
      discount,
      grandTotal,
    };
  }

  static async calculateTotalsWithPromo(items: any[], promoCode?: string | null): Promise<CartTotals> {
    const subtotal = items.reduce((sum, item) => sum + (item.unitPrice * item.qty), 0);
    let discount = 0;

    if (promoCode) {
      const promo = await prisma.promo.findFirst({
        where: {
          code: promoCode.toUpperCase(),
          active: true,
          startsAt: { lte: new Date() },
          endsAt: { gte: new Date() },
        },
      });

      if (promo) {
        if (promo.type === 'percent') {
          discount = Math.round(subtotal * (Number(promo.value) / 100));
        } else {
          discount = Math.min(Number(promo.value), subtotal);
        }
      }
    }

    const grandTotal = Math.max(subtotal - discount, 0);

    return {
      subtotal,
      discount,
      grandTotal,
    };
  }
}

