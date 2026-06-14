import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from './errorHandler';

/**
 * Middleware to validate request body against a Zod schema
 */
export function validateRequest<T extends z.ZodTypeAny>(schema: T) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new AppError(
          400,
          'Validation failed',
          'VALIDATION_ERROR'
        );
      }
      next(error);
    }
  };
}

/**
 * Middleware to validate query parameters against a Zod schema
 */
export function validateQuery<T extends z.ZodTypeAny>(schema: T) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = await schema.parseAsync(req.query);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new AppError(
          400,
          'Invalid query parameters',
          'VALIDATION_ERROR'
        );
      }
      next(error);
    }
  };
}
