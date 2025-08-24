import { Request, Response, NextFunction } from 'express';
import { PromoService } from '../services/promoService';

export class PromoController {
  static async getPromos(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = req.query;
      
      const result = await PromoService.getPromos(
        Number(page) || 1,
        Number(limit) || 10
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getPromoById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const promo = await PromoService.getPromoById(id);
      res.json(promo);
    } catch (error) {
      next(error);
    }
  }

  static async createPromo(req: Request, res: Response, next: NextFunction) {
    try {
      const promoData = {
        ...req.body,
        startsAt: new Date(req.body.startsAt),
        endsAt: new Date(req.body.endsAt),
      };
      
      const promo = await PromoService.createPromo(promoData);
      res.status(201).json(promo);
    } catch (error) {
      next(error);
    }
  }

  static async updatePromo(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };
      
      if (req.body.startsAt) {
        updateData.startsAt = new Date(req.body.startsAt);
      }
      if (req.body.endsAt) {
        updateData.endsAt = new Date(req.body.endsAt);
      }
      
      const promo = await PromoService.updatePromo(id, updateData);
      res.json(promo);
    } catch (error) {
      next(error);
    }
  }

  static async deletePromo(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await PromoService.deletePromo(id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

