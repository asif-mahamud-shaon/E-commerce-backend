import { z } from 'zod';

// Product schemas
export const createProductSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(255),
    slug: z.string().min(1, 'Slug is required').max(255).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens only'),
    description: z.string().optional(),
    images: z.array(z.string().url()).min(1, 'At least one image is required'),
    status: z.enum(['active', 'draft']),
    variants: z.array(z.object({
      sku: z.string().min(1, 'SKU is required').max(100),
      options: z.record(z.any()),
      price: z.number().int().positive('Price must be positive'),
      currency: z.string().length(3, 'Currency must be 3 characters'),
      stock: z.number().int().min(0, 'Stock cannot be negative'),
    })).min(1, 'At least one variant is required'),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid product ID'),
  }),
  body: z.object({
    title: z.string().min(1).max(255).optional(),
    slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/).optional(),
    description: z.string().optional(),
    images: z.array(z.string().url()).optional(),
    status: z.enum(['active', 'draft']).optional(),
  }).partial(),
});

export const getProductBySlugSchema = z.object({
  params: z.object({
    slug: z.string().min(1, 'Slug is required'),
  }),
});

// Cart schemas
export const addCartItemSchema = z.object({
  body: z.object({
    sku: z.string().min(1, 'SKU is required'),
    qty: z.number().int().min(1, 'Quantity must be at least 1'),
  }),
});

export const updateCartItemSchema = z.object({
  body: z.object({
    qty: z.number().int().min(1, 'Quantity must be at least 1'),
  }),
});

export const removeCartItemSchema = z.object({
  params: z.object({
    sku: z.string().min(1, 'SKU is required'),
  }),
});

export const applyPromoSchema = z.object({
  body: z.object({
    code: z.string().min(1, 'Promo code is required'),
  }),
});

// Promo schemas
export const createPromoSchema = z.object({
  body: z.object({
    code: z.string().min(1, 'Code is required').max(50).toUpperCase(),
    type: z.enum(['percent', 'fixed']),
    value: z.number().positive('Value must be positive'),
    startsAt: z.string().datetime('Invalid start date'),
    endsAt: z.string().datetime('Invalid end date'),
    active: z.boolean(),
  }).refine((data) => {
    if (data.type === 'percent' && data.value > 100) {
      return false;
    }
    return true;
  }, {
    message: 'Percent value cannot exceed 100',
    path: ['value'],
  }).refine((data) => {
    return new Date(data.startsAt) < new Date(data.endsAt);
  }, {
    message: 'End date must be after start date',
    path: ['endsAt'],
  }),
});

export const updatePromoSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid promo ID'),
  }),
  body: z.object({
    code: z.string().min(1).max(50).toUpperCase().optional(),
    type: z.enum(['percent', 'fixed']).optional(),
    value: z.number().positive().optional(),
    startsAt: z.string().datetime().optional(),
    endsAt: z.string().datetime().optional(),
    active: z.boolean().optional(),
  }).partial(),
});

export const getPromoSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid promo ID'),
  }),
});

// Order schemas
export const createOrderSchema = z.object({
  body: z.object({
    cartId: z.string().uuid('Invalid cart ID'),
  }),
});

export const updateOrderSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid order ID'),
  }),
  body: z.object({
    status: z.enum(['created', 'paid', 'cancelled']),
  }),
});

export const getOrderSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid order ID'),
  }),
});

// Query schemas
export const paginationSchema = z.object({
  query: z.object({
    page: z.string().transform(Number).pipe(z.number().int().min(1)).optional().default('1'),
    limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).optional().default('10'),
  }),
});

export const productQuerySchema = z.object({
  query: z.object({
    page: z.string().transform(Number).pipe(z.number().int().min(1)).optional().default('1'),
    limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).optional().default('10'),
    status: z.enum(['active', 'draft']).optional(),
    search: z.string().optional(),
  }),
});

