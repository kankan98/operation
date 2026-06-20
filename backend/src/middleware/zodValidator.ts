import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from './errorHandler';

function isZodError(error: unknown): error is z.ZodError {
  return error instanceof z.ZodError ||
    (typeof error === 'object' &&
      error !== null &&
      'issues' in error &&
      Array.isArray((error as { issues?: unknown }).issues) &&
      (error as { name?: unknown }).name === 'ZodError');
}

/**
 * Middleware to validate request body against a Zod schema
 */
export function validateRequest<T extends z.ZodTypeAny>(schema: T) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body) as unknown;
      next();
    } catch (error) {
      if (isZodError(error)) {
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
      const parsedQuery = await schema.parseAsync(req.query) as Request['query'];
      Object.defineProperty(req, 'query', {
        value: parsedQuery,
        configurable: true,
      });
      next();
    } catch (error) {
      if (isZodError(error)) {
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
