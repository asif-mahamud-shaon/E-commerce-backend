import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../config/database';

export interface CartRequest extends Request {
  cartToken?: string;
  cart?: any;
}

export const cartTokenMiddleware = async (
  req: CartRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get cart token from header or cookie
    let cartToken = req.headers['x-cart-token'] as string;
    
    if (!cartToken && req.cookies?.cartToken) {
      cartToken = req.cookies.cartToken;
    }

    // If no token exists, create a new cart
    if (!cartToken) {
      cartToken = uuidv4();
      
      // Create new cart in database
      await prisma.cart.create({
        data: {
          token: cartToken,
        },
      });

      // Set cookie for future requests
      res.cookie('cartToken', cartToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });
    } else {
      // Verify cart exists
      const cart = await prisma.cart.findUnique({
        where: { token: cartToken },
        include: {
          items: true,
        },
      });

      if (!cart) {
        // Create new cart if token is invalid
        cartToken = uuidv4();
        await prisma.cart.create({
          data: {
            token: cartToken,
          },
        });

        res.cookie('cartToken', cartToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 30 * 24 * 60 * 60 * 1000,
        });
      } else {
        req.cart = cart;
      }
    }

    req.cartToken = cartToken;
    next();
  } catch (error) {
    next(error);
  }
};

