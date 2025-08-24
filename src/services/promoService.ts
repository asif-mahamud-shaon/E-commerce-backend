import { prisma } from '../config/database';
import { NotFoundError, ConflictError } from '../utils/errors';

export class PromoService {
  static async getPromos(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [promos, total] = await Promise.all([
      prisma.promo.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.promo.count(),
    ]);

    return {
      promos,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  static async getPromoById(id: string) {
    const promo = await prisma.promo.findUnique({
      where: { id },
    });

    if (!promo) {
      throw new NotFoundError('Promo not found');
    }

    return promo;
  }

  static async getPromoByCode(code: string) {
    const promo = await prisma.promo.findFirst({
      where: { code: code.toUpperCase() },
    });

    if (!promo) {
      throw new NotFoundError('Promo not found');
    }

    return promo;
  }

  static async createPromo(data: {
    code: string;
    type: string;
    value: number;
    startsAt: Date;
    endsAt: Date;
    active: boolean;
  }) {
    // Check if code already exists
    const existingPromo = await prisma.promo.findFirst({
      where: { code: data.code.toUpperCase() },
    });

    if (existingPromo) {
      throw new ConflictError('Promo code already exists');
    }

    return prisma.promo.create({
      data: {
        code: data.code.toUpperCase(),
        type: data.type,
        value: data.value,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
        active: data.active,
      },
    });
  }

  static async updatePromo(id: string, data: {
    code?: string;
    type?: string;
    value?: number;
    startsAt?: Date;
    endsAt?: Date;
    active?: boolean;
  }) {
    const promo = await prisma.promo.findUnique({
      where: { id },
    });

    if (!promo) {
      throw new NotFoundError('Promo not found');
    }

    // Check if new code conflicts with existing
    if (data.code && data.code !== promo.code) {
      const existingPromo = await prisma.promo.findFirst({
        where: { code: data.code.toUpperCase() },
      });

      if (existingPromo) {
        throw new ConflictError('Promo code already exists');
      }
    }

    return prisma.promo.update({
      where: { id },
      data: {
        ...data,
        code: data.code?.toUpperCase(),
      },
    });
  }

  static async deletePromo(id: string) {
    const promo = await prisma.promo.findUnique({
      where: { id },
    });

    if (!promo) {
      throw new NotFoundError('Promo not found');
    }

    await prisma.promo.delete({
      where: { id },
    });

    return { message: 'Promo deleted successfully' };
  }

  static async validatePromo(code: string) {
    const promo = await prisma.promo.findFirst({
      where: {
        code: code.toUpperCase(),
        active: true,
        startsAt: { lte: new Date() },
        endsAt: { gte: new Date() },
      },
    });

    return promo;
  }

  static calculateDiscount(subtotal: number, promo: any): number {
    if (promo.type === 'percent') {
      return Math.round(subtotal * (Number(promo.value) / 100));
    } else {
      return Math.min(Number(promo.value), subtotal);
    }
  }
}

