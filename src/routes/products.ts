import { Router } from 'express';
import { ProductController } from '../controllers/productController';
import { validate } from '../middlewares/validation';
import {
  createProductSchema,
  updateProductSchema,
  getProductBySlugSchema,
  productQuerySchema,
} from '../schemas';

const router = Router();

// Get all products with pagination and filters
router.get('/', validate(productQuerySchema), ProductController.getProducts);

// Get product by slug
router.get('/:slug', validate(getProductBySlugSchema), ProductController.getProductBySlug);

// Create new product
router.post('/', validate(createProductSchema), ProductController.createProduct);

// Update product
router.put('/:id', validate(updateProductSchema), ProductController.updateProduct);

// Delete product
router.delete('/:id', ProductController.deleteProduct);

export default router;

