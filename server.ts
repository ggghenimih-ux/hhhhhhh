import 'dotenv/config'; // must be first: loads .env (DATABASE_URL, JWT_SECRET...) before anything else
import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './server/routes/index';
import { extractUser } from './server/middleware/auth';
import { errorHandler, apiNotFoundHandler } from './server/middleware/errorHandler';

let serverInstance: any = null;

async function startServer() {
  // Prevent running server twice
  if (serverInstance) {
    return serverInstance;
  }

  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  // Exact check ensuring NODE_ENV is used cleanly (fixing any NODE_NODE_ENV typos)
  const isProduction = process.env.NODE_ENV === 'production';

  // Trust reverse proxy headers (e.g. X-Forwarded-For, Forwarded) from the hosting environment
  app.set('trust proxy', 1);

  // 1. Security headers via Helmet. CSP is enforced in production (Vite dev needs inline/eval scripts).
  app.use(
    helmet({
      contentSecurityPolicy: isProduction
        ? {
            useDefaults: true,
            directives: {
              'script-src': ["'self'"],
              'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
              'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
              'img-src': ["'self'", 'data:', 'blob:', 'https:'],
              'connect-src': ["'self'"],
              'object-src': ["'none'"],
              'frame-ancestors': ["'self'"],
            },
          }
        : false,
      crossOriginResourcePolicy: { policy: 'same-site' },
    })
  );
  app.disable('x-powered-by');

  // 2. CORS: only explicitly allowed origins may send credentialed requests
  const allowedOrigins = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.use(
    cors({
      origin: (origin, cb) => {
        // Same-origin / non-browser requests have no Origin header
        if (!origin) return cb(null, true);
        if (allowedOrigins.includes(origin)) return cb(null, true);
        if (!isProduction && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return cb(null, true);
        return cb(null, false);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  // 3. Request parsers with safe size limits
  app.use(express.json({ limit: '2mb' }));
    app.use(cookieParser());

  // 4. Extract authenticated user token from cookie or Authorization header
  app.use(extractUser);

  // 5. Static uploads directory for product images and receipts
  const uploadsDir = path.resolve(process.cwd(), 'uploads');
  app.use(
    '/uploads',
    express.static(uploadsDir, {
      index: false,
      dotfiles: 'deny',
      setHeaders: (res) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'");
      },
    })
  );

  // 6. Request logger for API calls
  app.use((req, _res, next) => {
    if (req.path.startsWith('/api')) {
      console.log(`[API ${req.method}] ${req.path}`);
    }
    next();
  });

  // 7. Mount API Routes
  app.use('/api', apiRouter);

  // 8. 404 handler strictly for unmatched /api routes (NEVER returns index.html for /api)
  app.use('/api', apiNotFoundHandler);

  // 9. Central API Error Handler
  app.use(errorHandler);

  // 10. Frontend Serving (Development with Vite Middleware vs Production Static)
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));

    // Serve index.html ONLY for non-API routes
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
        return next();
      }
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  // 11. Start Express Server
  serverInstance = app.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`> Outils Réparation GSM Tunisie (Production Engine)`);
    console.log(`> Server running on: http://0.0.0.0:${PORT}`);
    console.log(`> Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`> Database: SQLite (Prisma ORM)`);
    console.log(`> Hotline: +216 26 383 876`);
    console.log(`====================================================`);
  });

  // 12. Graceful Shutdown
  const handleShutdown = (signal: string) => {
    console.log(`\nReceived ${signal}. Shutting down server gracefully...`);
    if (serverInstance) {
      serverInstance.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  };

  process.on('SIGINT', () => handleShutdown('SIGINT'));
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));

  return app;
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});

export { startServer };
export default startServer;
