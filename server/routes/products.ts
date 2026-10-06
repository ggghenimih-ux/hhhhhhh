import { Router } from 'express';
import {
  getProducts,
  getProductById,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  patchProductStatus,
  patchProductStock,
  uploadProductImage,
  deleteProductImage,
} from '../controllers/productController';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { uploadSingleImage } from '../middleware/upload';

const router = Router();

// Public routes
router.get('/', getProducts);
router.get('/slug/:slug', getProductBySlug);
router.get('/:id', getProductById);

// Admin-protected routes
router.post('/', requireAuth, requireAdmin, createProduct);
router.put('/:id', requireAuth, requireAdmin, updateProduct);
router.delete('/:id', requireAuth, requireAdmin, deleteProduct);
router.patch('/:id/status', requireAuth, requireAdmin, patchProductStatus);
router.patch('/:id/toggle-active', requireAuth, requireAdmin, patchProductStatus);
router.patch('/:id/stock', requireAuth, requireAdmin, patchProductStock);
router.post('/:id/images', requireAuth, requireAdmin, uploadSingleImage, uploadProductImage);
router.delete('/:id/images/:imageId', requireAuth, requireAdmin, deleteProductImage);

export default router;
