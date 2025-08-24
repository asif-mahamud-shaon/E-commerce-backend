import { prisma } from '../config/database';
import { logger } from '../utils/logger';

const demoProducts = [
  {
    title: 'Premium Wireless Headphones',
    slug: 'premium-wireless-headphones',
    description: 'High-quality wireless headphones with noise cancellation and premium sound quality.',
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=500',
    ],
    status: 'active',
    variants: [
      {
        sku: 'HP-BLK-001',
        options: { color: 'Black', size: 'Standard' },
        price: 29900, // $299.00 in cents
        currency: 'USD',
        stock: 50,
      },
      {
        sku: 'HP-WHT-001',
        options: { color: 'White', size: 'Standard' },
        price: 29900,
        currency: 'USD',
        stock: 30,
      },
    ],
  },
  {
    title: 'Smart Fitness Watch',
    slug: 'smart-fitness-watch',
    description: 'Advanced fitness tracking watch with heart rate monitoring and GPS.',
    images: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
      'https://images.unsplash.com/photo-1544117519-31a4b719223d?w=500',
    ],
    status: 'active',
    variants: [
      {
        sku: 'FW-BLK-001',
        options: { color: 'Black', size: '42mm' },
        price: 19900, // $199.00 in cents
        currency: 'USD',
        stock: 25,
      },
      {
        sku: 'FW-SLV-001',
        options: { color: 'Silver', size: '42mm' },
        price: 19900,
        currency: 'USD',
        stock: 20,
      },
      {
        sku: 'FW-BLK-002',
        options: { color: 'Black', size: '46mm' },
        price: 22900, // $229.00 in cents
        currency: 'USD',
        stock: 15,
      },
    ],
  },
  {
    title: 'Ultra HD 4K Camera',
    slug: 'ultra-hd-4k-camera',
    description: 'Professional 4K camera with advanced autofocus and image stabilization.',
    images: [
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=500',
    ],
    status: 'active',
    variants: [
      {
        sku: 'CAM-4K-001',
        options: { color: 'Black', lens: '24-70mm' },
        price: 129900, // $1,299.00 in cents
        currency: 'USD',
        stock: 10,
      },
      {
        sku: 'CAM-4K-002',
        options: { color: 'Black', lens: '70-200mm' },
        price: 149900, // $1,499.00 in cents
        currency: 'USD',
        stock: 8,
      },
    ],
  },
  {
    title: 'Ergonomic Office Chair',
    slug: 'ergonomic-office-chair',
    description: 'Comfortable ergonomic office chair with adjustable features and premium materials.',
    images: [
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500',
      'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=500',
    ],
    status: 'active',
    variants: [
      {
        sku: 'CHR-BLK-001',
        options: { color: 'Black', material: 'Mesh' },
        price: 39900, // $399.00 in cents
        currency: 'USD',
        stock: 15,
      },
      {
        sku: 'CHR-GRY-001',
        options: { color: 'Gray', material: 'Leather' },
        price: 59900, // $599.00 in cents
        currency: 'USD',
        stock: 12,
      },
    ],
  },
  {
    title: 'Portable Bluetooth Speaker',
    slug: 'portable-bluetooth-speaker',
    description: 'Waterproof portable speaker with 360-degree sound and 20-hour battery life.',
    images: [
      'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500',
      'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=500',
    ],
    status: 'active',
    variants: [
      {
        sku: 'SPK-BLK-001',
        options: { color: 'Black', size: 'Standard' },
        price: 8900, // $89.00 in cents
        currency: 'USD',
        stock: 100,
      },
      {
        sku: 'SPK-RED-001',
        options: { color: 'Red', size: 'Standard' },
        price: 8900,
        currency: 'USD',
        stock: 75,
      },
      {
        sku: 'SPK-BLU-001',
        options: { color: 'Blue', size: 'Standard' },
        price: 8900,
        currency: 'USD',
        stock: 60,
      },
    ],
  },
];

const demoPromos = [
  {
    code: 'WELCOME10',
    type: 'percent',
    value: 10.00, // 10% discount
    startsAt: new Date('2024-01-01T00:00:00Z'),
    endsAt: new Date('2024-12-31T23:59:59Z'),
    active: true,
  },
  {
    code: 'SAVE20',
    type: 'percent',
    value: 20.00, // 20% discount
    startsAt: new Date('2024-01-01T00:00:00Z'),
    endsAt: new Date('2024-06-30T23:59:59Z'),
    active: true,
  },
  {
    code: 'FREESHIP',
    type: 'fixed',
    value: 1500, // $15.00 shipping discount in cents
    startsAt: new Date('2024-01-01T00:00:00Z'),
    endsAt: new Date('2024-12-31T23:59:59Z'),
    active: true,
  },
  {
    code: 'FLASH50',
    type: 'percent',
    value: 50.00, // 50% discount (flash sale)
    startsAt: new Date('2024-01-01T00:00:00Z'),
    endsAt: new Date('2024-01-31T23:59:59Z'),
    active: true,
  },
  {
    code: 'EXPIRED',
    type: 'percent',
    value: 25.00, // 25% discount (expired)
    startsAt: new Date('2023-01-01T00:00:00Z'),
    endsAt: new Date('2023-12-31T23:59:59Z'),
    active: false,
  },
];

async function seed() {
  try {
    logger.info('🌱 Starting database seeding...');

    // Clear existing data
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.cart.deleteMany();
    await prisma.variant.deleteMany();
    await prisma.product.deleteMany();
    await prisma.promo.deleteMany();

    logger.info('🗑️  Cleared existing data');

    // Seed products
    for (const productData of demoProducts) {
      await prisma.product.create({
        data: {
          title: productData.title,
          slug: productData.slug,
          description: productData.description,
          images: productData.images,
          status: productData.status,
          variants: {
            create: productData.variants,
          },
        },
      });
    }

    logger.info(`✅ Seeded ${demoProducts.length} products`);

    // Seed promos
    for (const promoData of demoPromos) {
      await prisma.promo.create({
        data: promoData,
      });
    }

    logger.info(`✅ Seeded ${demoPromos.length} promos`);

    logger.info('🎉 Database seeding completed successfully!');
    
    // Display seeded data summary
    const productCount = await prisma.product.count();
    const variantCount = await prisma.variant.count();
    const promoCount = await prisma.promo.count();

    logger.info(`📊 Summary:`);
    logger.info(`   - Products: ${productCount}`);
    logger.info(`   - Variants: ${variantCount}`);
    logger.info(`   - Promos: ${promoCount}`);

  } catch (error) {
    logger.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run seeder if this file is executed directly
if (require.main === module) {
  seed();
}

export { seed };

