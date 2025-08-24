import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/productService';

export class ProductController {
  static async getProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, status, search } = req.query;
      
      const result = await ProductService.getProducts(
        Number(page) || 1,
        Number(limit) || 10,
        status as string,
        search as string
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getProductBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const product = await ProductService.getProductBySlug(slug);
      res.json(product);
    } catch (error) {
      next(error);
    }
  }

  static async getProductById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const product = await ProductService.getProductById(id);
      res.json(product);
    } catch (error) {
      next(error);
    }
  }

  static async createProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await ProductService.createProduct(req.body);
      res.status(201).json(product);
    } catch (error) {
      next(error);
    }
  }

  static async updateProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const product = await ProductService.updateProduct(id, req.body);
      res.json(product);
    } catch (error) {
      next(error);
    }
  }

  static async deleteProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await ProductService.deleteProduct(id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

