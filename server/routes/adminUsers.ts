import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { getAdminUsers, updateAdminUserRole } from '../controllers/adminUserController';
import { requireAdmin } from '../middleware/auth';

const router = Router();

const adminUserListLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'TooManyRequests',
    message: 'Trop de demandes de consultation des utilisateurs. Réessayez plus tard.',
  },
});

router.use(requireAdmin);
router.get('/', adminUserListLimiter, getAdminUsers);
router.patch('/:id/role', updateAdminUserRole);

export default router;
