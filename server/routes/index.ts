import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { checkDatabaseConnection } from '../db/client';
import productRoutes from './products';
import categoryRoutes from './categories';
import orderRoutes from './orders';
import authRoutes from './auth';
import uploadRoutes from './upload';
import reviewRoutes from './reviews';
import settingsRoutes from './settings';
import { getAdminStats, getAdminOrders } from '../controllers/orderController';
import { requireAdmin } from '../middleware/auth';

export const apiRouter = Router();

// Rate limiting. Uses req.ip, which honours Express's "trust proxy" setting.
// (Never read X-Forwarded-For / Forwarded directly: clients can spoof them to bypass the limit.)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // 10 failed attempts per IP per window
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'TooManyRequests',
    message: 'Trop de tentatives. Veuillez patienter quelques minutes avant de réessayer.',
  },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'TooManyRequests',
    message: 'Trop de créations de compte depuis cette adresse. Réessayez plus tard.',
  },
});

const orderLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 25,
  skip: (req) => req.method !== 'POST',
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'TooManyRequests',
    message: 'Limite de commandes atteinte pour cette adresse IP.',
  },
});

const trackLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'TooManyRequests', message: 'Trop de requêtes de suivi. Réessayez plus tard.' },
});

const reviewLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  skip: (req) => req.method !== 'POST',
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'TooManyRequests', message: 'Trop d’avis envoyés. Réessayez plus tard.' },
});

// 1. Health check route
apiRouter.get('/health', async (_req, res) => {
  const isDbConnected = await checkDatabaseConnection();
  const env = process.env.NODE_ENV || 'development';

  if (!isDbConnected) {
    return res.status(503).json({
      status: 'error',
      database: 'disconnected',
      environment: env,
      timestamp: new Date().toISOString(),
    });
  }

  res.json({
    status: 'ok',
    database: 'connected',
    environment: env,
    timestamp: new Date().toISOString(),
  });
});

// 2. Mount feature routers
apiRouter.post('/auth/login', loginLimiter);
apiRouter.post('/auth/register', registerLimiter);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/products', productRoutes);
apiRouter.use('/categories', categoryRoutes);
apiRouter.use('/orders/number', trackLimiter);
apiRouter.use('/orders', orderLimiter, orderRoutes);
apiRouter.use('/upload', uploadRoutes);
apiRouter.use('/reviews', reviewLimiter, reviewRoutes);
apiRouter.use('/settings', settingsRoutes);

// Admin dashboard shortcut
apiRouter.get('/admin/dashboard', requireAdmin, getAdminStats);
apiRouter.get('/admin/orders', requireAdmin, getAdminOrders);

export default apiRouter;
