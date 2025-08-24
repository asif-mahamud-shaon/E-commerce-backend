import { Router } from 'express';
import { OrderController } from '../controllers/orderController';
import { validate } from '../middlewares/validation';
import {
  createOrderSchema,
  updateOrderSchema,
  getOrderSchema,
  paginationSchema,
} from '../schemas';

const router = Router();

// Get all orders with pagination
router.get('/', validate(paginationSchema), OrderController.getOrders);

// Get order by ID
router.get('/:id', validate(getOrderSchema), OrderController.getOrderById);

// Create new order (checkout)
router.post('/', validate(createOrderSchema), OrderController.createOrder);

// Update order status
router.put('/:id/status', validate(updateOrderSchema), OrderController.updateOrderStatus);

export default router;

