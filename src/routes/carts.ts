import { Router } from 'express';
import { CartController } from '../controllers/cartController';
import { cartTokenMiddleware } from '../middlewares/cart';
import { validate } from '../middlewares/validation';
import {
  addCartItemSchema,
  updateCartItemSchema,
  removeCartItemSchema,
  applyPromoSchema,
} from '../schemas';

const router = Router();

// Apply cart token middleware to all cart routes
router.use(cartTokenMiddleware);

// Get current cart
router.get('/', CartController.getCart);

// Add item to cart
router.post('/items', validate(addCartItemSchema), CartController.addItem);

// Update cart item quantity
router.put('/items/:sku', validate(updateCartItemSchema), CartController.updateItem);

// Remove item from cart
router.delete('/items/:sku', validate(removeCartItemSchema), CartController.removeItem);

// Apply promo code
router.post('/apply-promo', validate(applyPromoSchema), CartController.applyPromo);

// Remove promo code
router.delete('/promo', CartController.removePromo);

export default router;

