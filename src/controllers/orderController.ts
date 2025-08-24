import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/orderService';

export class OrderController {
  static async createOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { cartId } = req.body;
      const order = await OrderService.createOrder(cartId);
      res.status(201).json(order);
    } catch (error) {
      next(error);
    }
  }

  static async getOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = req.query;
      
      const result = await OrderService.getOrders(
        Number(page) || 1,
        Number(limit) || 10
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getOrderById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: { message: 'Order ID is required', code: 'VALIDATION_ERROR' } });
      }
      const order = await OrderService.getOrderById(id);
      res.json(order);
    } catch (error) {
      next(error);
    }
  }

  static async updateOrderStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!id) {
        return res.status(400).json({ error: { message: 'Order ID is required', code: 'VALIDATION_ERROR' } });
      }
      const order = await OrderService.updateOrderStatus(id, status);
      res.json(order);
    } catch (error) {
      next(error);
    }
  }
}
