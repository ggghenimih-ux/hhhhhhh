import { Router } from 'express';
import {
  getSettings,
  updateSettings,
  uploadLogo,
  uploadFavicon,
} from '../controllers/settingsController';
import { requireAdmin } from '../middleware/auth';
import { uploadSingleImage } from '../middleware/upload';

const router = Router();

// GET /api/settings - Public
router.get('/', getSettings);

// PUT /api/settings - Admin only
router.put('/', requireAdmin, updateSettings);

// POST /api/settings/logo - Admin only
router.post('/logo', requireAdmin, uploadSingleImage, uploadLogo);

// POST /api/settings/favicon - Admin only
router.post('/favicon', requireAdmin, uploadSingleImage, uploadFavicon);

export default router;
