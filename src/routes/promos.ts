import { Router } from 'express';
import { PromoController } from '../controllers/promoController';
import { validate } from '../middlewares/validation';
import {
  createPromoSchema,
  updatePromoSchema,
  getPromoSchema,
  paginationSchema,
} from '../schemas';

const router = Router();

// Get all promos with pagination
router.get('/', validate(paginationSchema), PromoController.getPromos);

// Get promo by ID
router.get('/:id', validate(getPromoSchema), PromoController.getPromoById);

// Create new promo
router.post('/', validate(createPromoSchema), PromoController.createPromo);

// Update promo
router.put('/:id', validate(updatePromoSchema), PromoController.updatePromo);

// Delete promo
router.delete('/:id', validate(getPromoSchema), PromoController.deletePromo);

export default router;

