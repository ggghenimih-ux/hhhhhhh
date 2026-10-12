import { Router } from 'express';
import rateLimit, { Options } from 'express-rate-limit';
import { checkDatabaseConnection } from '../db/client';
import productRoutes from './products';
import categoryRoutes from './categories';
import orderRoutes from './orders';
import authRoutes from './auth';
import uploadRoutes from './upload';
import reviewRoutes from './reviews';
import settingsRoutes from './settings';
import adminUsersRoutes from './adminUsers';
import { getAdminStats, getAdminOrders } from '../controllers/orderController';
import { requireAdmin } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import {
  streamNotifications,
  getNotificationSummary,
  sendTestNotification,
} from '../controllers/notificationController';

export const apiRouter = Router();

// Rate limiting. Uses req.ip, which honours Express's "trust proxy" setting.
// (Never read X-Forwarded-For / Forwarded directly: clients can spoof them to bypass the limit.)
// ⚠️ Beaucoup d'abonnés mobiles tunisiens partagent une même IP publique (CGNAT) : les limites par IP
// restent donc généreuses ; le verrou par email (services/loginGuard.ts) protège les comptes.
const limiter = (opts: Partial<Options> & { windowMs: number; limit: number; message: string }) =>
  rateLimit({
    standardHeaders: true,
    legacyHeaders: false,
    ...opts,
    message: { error: 'TooManyRequests', message: opts.message },
  });

// Plafond global sur toute l'API (les limites ci-dessous s'ajoutent par-dessus)
apiRouter.use(
  limiter({ windowMs: 60 * 1000, limit: 600, message: 'Trop de requêtes. Réessayez dans un instant.' })
);

const loginLimiter = limiter({
  windowMs: 15 * 60 * 1000,
  limit: 30, // échecs par IP et par fenêtre
  skipSuccessfulRequests: true,
  message: 'Trop de tentatives. Veuillez patienter quelques minutes avant de réessayer.',
});

const registerLimiter = limiter({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  message: 'Trop de créations de compte depuis cette adresse. Réessayez plus tard.',
});

const orderLimiter = limiter({
  windowMs: 10 * 60 * 1000,
  limit: 25,
  skip: (req) => req.method !== 'POST',
  message: 'Limite de commandes atteinte pour cette adresse IP.',
});

const trackLimiter = limiter({
  windowMs: 10 * 60 * 1000,
  limit: 60,
  message: 'Trop de requêtes de suivi. Réessayez plus tard.',
});

const reviewLimiter = limiter({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  skip: (req) => req.method !== 'POST',
  message: 'Trop d’avis envoyés. Réessayez plus tard.',
});

const healthLimiter = limiter({
  windowMs: 60 * 1000,
  limit: 60,
  message: 'Trop de requêtes.',
});

const testNotificationLimiter = limiter({
  windowMs: 10 * 60 * 1000,
  limit: 5,
  message: 'Trop de tests de notification. Réessayez plus tard.',
});

// 1. Health check route (ne révèle ni l'environnement ni d'autres détails)
apiRouter.get(
  '/health',
  healthLimiter,
  asyncHandler(async (_req, res) => {
    const isDbConnected = await checkDatabaseConnection();
    res.status(isDbConnected ? 200 : 503).json({
      status: isDbConnected ? 'ok' : 'error',
      database: isDbConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    });
  })
);

// 2. Mount feature routers
apiRouter.post('/auth/login', loginLimiter);
apiRouter.post('/auth/firebase', loginLimiter);
apiRouter.post('/auth/register', registerLimiter);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/products', productRoutes);
apiRouter.use('/categories', categoryRoutes);
apiRouter.use('/orders/number', trackLimiter);
apiRouter.use('/orders', orderLimiter, orderRoutes);
apiRouter.use('/upload', uploadRoutes);
apiRouter.use('/reviews', reviewLimiter, reviewRoutes);
apiRouter.use('/settings', settingsRoutes);

// 3. Tout ce qui est /admin/* passe par UN seul garde : impossible d'oublier requireAdmin sur une nouvelle route
const adminRouter = Router();
adminRouter.use(requireAdmin);
adminRouter.use('/users', adminUsersRoutes);
adminRouter.get('/dashboard', getAdminStats);
adminRouter.get('/orders', getAdminOrders);
// Notifications : flux temps réel (SSE), résumé des commandes à traiter, test WhatsApp
adminRouter.get('/notifications/stream', streamNotifications);
adminRouter.get('/notifications/summary', getNotificationSummary);
adminRouter.post('/notifications/test', testNotificationLimiter, sendTestNotification);
apiRouter.use('/admin', adminRouter);

export default apiRouter;
