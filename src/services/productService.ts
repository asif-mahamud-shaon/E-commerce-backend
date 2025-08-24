import { prisma } from '../config/database';
import { NotFoundError } from '../utils/errors';

export class ProductService {
  static async getProducts(page: number = 1, limit: number = 10, status?: string, search?: string) {
    const skip = (page - 1) * limit;
    
    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          variants: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  static async getProductBySlug(slug: string) {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        variants: true,
      },
    });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    return product;
  }

  static async getProductById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        variants: true,
      },
    });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    return product;
  }

  static async createProduct(data: {
    title: string;
    slug: string;
    description?: string;
    images: string[];
    status: string;
    variants: Array<{
      sku: string;
      options: any;
      price: number;
      currency: string;
      stock: number;
    }>;
  }) {
    return prisma.product.create({
      data: {
        title: data.title,
        slug: data.slug,
        description: data.description,
        images: data.images,
        status: data.status,
        variants: {
          create: data.variants,
        },
      },
      include: {
        variants: true,
      },
    });
  }

  static async updateProduct(id: string, data: {
    title?: string;
    slug?: string;
    description?: string;
    images?: string[];
    status?: string;
  }) {
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    return prisma.product.update({
      where: { id },
      data,
      include: {
        variants: true,
      },
    });
  }

  static async deleteProduct(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    await prisma.product.delete({
      where: { id },
    });

    return { message: 'Product deleted successfully' };
  }
}

