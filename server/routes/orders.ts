import { Router } from 'express';
import {
  createOrder,
  getOrderById,
  getOrderByNumber,
  updateOrderStatus,
  getAdminOrders,
  getAdminStats,
  deleteOrder,
} from '../controllers/orderController';
import { requireAdmin } from '../middleware/auth';

const router = Router();

// Public / Customer routes
router.post('/', createOrder);
router.get('/number/:orderNumber', getOrderByNumber);
router.get('/:id', getOrderById);

// Admin routes
router.get('/', requireAdmin, getAdminOrders);
router.get('/admin/stats', requireAdmin, getAdminStats);
router.get('/admin/all', requireAdmin, getAdminOrders);
router.patch('/:id/status', requireAdmin, updateOrderStatus);
router.delete('/:id', requireAdmin, deleteOrder);

export default router;
