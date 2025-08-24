import { Request, Response, NextFunction } from 'express';
import { CartService } from '../services/cartService';
import { CartRequest } from '../middlewares/cart';

export class CartController {
  static async getCart(req: CartRequest, res: Response, next: NextFunction) {
    try {
      const cart = await CartService.getCart(req.cartToken!);
      res.json(cart);
    } catch (error) {
      next(error);
    }
  }

  static async addItem(req: CartRequest, res: Response, next: NextFunction) {
    try {
      const { sku, qty } = req.body;
      const cart = await CartService.addItem(req.cartToken!, sku, qty);
      res.json(cart);
    } catch (error) {
      next(error);
    }
  }

  static async updateItem(req: CartRequest, res: Response, next: NextFunction) {
    try {
      const { sku } = req.params;
      const { qty } = req.body;
      if (!sku) {
        return res.status(400).json({ error: { message: 'SKU is required', code: 'VALIDATION_ERROR' } });
      }
      const cart = await CartService.updateItem(req.cartToken!, sku, qty);
      res.json(cart);
    } catch (error) {
      next(error);
    }
  }

  static async removeItem(req: CartRequest, res: Response, next: NextFunction) {
    try {
      const { sku } = req.params;
      if (!sku) {
        return res.status(400).json({ error: { message: 'SKU is required', code: 'VALIDATION_ERROR' } });
      }
      const cart = await CartService.removeItem(req.cartToken!, sku);
      return res.json(cart);
    } catch (error) {
      next(error);
    }
  }

  static async applyPromo(req: CartRequest, res: Response, next: NextFunction) {
    try {
      const { code } = req.body;
      const cart = await CartService.applyPromo(req.cartToken!, code);
      res.json(cart);
    } catch (error) {
      next(error);
    }
  }

  static async removePromo(req: CartRequest, res: Response, next: NextFunction) {
    try {
      const cart = await CartService.removePromo(req.cartToken!);
      res.json(cart);
    } catch (error) {
      next(error);
    }
  }
}
