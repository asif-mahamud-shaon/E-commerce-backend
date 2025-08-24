import { Router } from 'express';
import productRoutes from './products';
import cartRoutes from './carts';
import promoRoutes from './promos';
import orderRoutes from './orders';

const router = Router();

// API routes
router.use('/api/products', productRoutes);
router.use('/api/carts', cartRoutes);
router.use('/api/promos', promoRoutes);
router.use('/api/orders', orderRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

export default router;

