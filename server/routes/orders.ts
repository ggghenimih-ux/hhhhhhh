import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  createOrder,
  getOrderById,
  getOrderByNumber,
  updateOrderStatus,
  updateAdminOrder,
  getAdminOrders,
  getAdminStats,
  deleteOrder,
} from '../controllers/orderController';
import {
  archiveExportedOrders,
  exportOrderArchive,
  getArchivedOrders,
  previewOrderArchive,
  restoreArchivedOrder,
} from '../controllers/orderArchiveController';
import { requireAdmin } from '../middleware/auth';

const router = Router();

const adminArchiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'TooManyRequests',
    message: 'Trop d’opérations d’archivage. Réessayez plus tard.',
  },
});

// Public / Customer routes
router.post('/', createOrder);
router.get('/number/:orderNumber', getOrderByNumber);

// Admin routes sous /admin/* : requireAdmin appliqué UNE fois, et déclarées AVANT les routes "/:id"
// (une nouvelle route /admin/xxx ne peut donc plus être interceptée par "/:id" ni oubliée sans protection).
router.use('/admin', requireAdmin);
router.get('/admin/stats', getAdminStats);
router.get('/admin/all', getAdminOrders);
router.get('/admin/archive/preview', adminArchiveLimiter, previewOrderArchive);
router.post('/admin/archive/export', adminArchiveLimiter, exportOrderArchive);
router.post('/admin/archive/apply', adminArchiveLimiter, archiveExportedOrders);
router.get('/admin/archive/archived', adminArchiveLimiter, getArchivedOrders);
router.patch('/admin/archive/:id/restore', adminArchiveLimiter, restoreArchivedOrder);

router.get('/', requireAdmin, getAdminOrders);
router.get('/:id', getOrderById);
router.patch('/:id', requireAdmin, updateAdminOrder);
router.patch('/:id/status', requireAdmin, updateOrderStatus);
router.delete('/:id', requireAdmin, deleteOrder);

export default router;
