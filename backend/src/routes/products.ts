import { Router, Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/productService';
import { AppError } from '../middleware/errorHandler';
import { validateRequest } from '../middleware/zodValidator';
import {
  createProductSchema,
  updateProductSchema,
} from '../schemas/product.schema';

const router = Router();
const productService = new ProductService();

// POST /api/products - 创建产品
router.post(
  '/',
  validateRequest(createProductSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const product = await productService.createProduct(req.body);
      res.status(201).json(product);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/products - 列表查询
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { platform, monitoring, page, limit } = req.query;

    const result = await productService.listProducts({
      platform: platform as string,
      monitoring: monitoring === 'true' ? true : monitoring === 'false' ? false : undefined,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/products/:id - 获取详情
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const product = await productService.getProductById(id);

    if (!product) {
      throw new AppError(404, 'Product not found', 'PRODUCT_NOT_FOUND');
    }

    res.json(product);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/products/:id - 更新产品
router.patch(
  '/:id',
  validateRequest(updateProductSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const product = await productService.updateProduct(id, req.body);
      res.json(product);
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/products/:id - 删除产品
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await productService.deleteProduct(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
