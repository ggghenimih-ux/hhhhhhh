import express, { Express } from 'express';
import path from 'path';
import { randomUUID } from 'crypto';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { loadEnv } from './env';
import { isProduction } from './security';
import { apiRouter } from './routes/index';
import { extractUser, createOriginGuard } from './middleware/auth';
import { errorHandler, apiNotFoundHandler } from './middleware/errorHandler';
import { closeAllStreams } from './services/notificationService';

export interface CreateAppOptions {
  serveFrontend?: boolean;
}

export interface AppHandle {
  app: Express;
  port: number;
  dispose: () => Promise<void>;
}

function resolveFirebaseFrameSource(domain: string | undefined): string | undefined {
  const value = domain?.trim();
  if (!value) return undefined;
  try {
    const url = new URL(value.includes('://') ? value : `https://${value}`);
    if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
      throw new Error();
    }
    return url.origin;
  } catch {
    throw new Error('VITE_FIREBASE_AUTH_DOMAIN must be a valid HTTPS host.');
  }
}

function resolveTrustProxy(raw: string | undefined): boolean | number | string {
  if (raw === undefined || raw.trim() === '') return isProduction ? 1 : false;
  const value = raw.trim();
  if (value === 'false' || value === '0') return false;
  if (/^\d+$/.test(value)) return Number(value);
  return value;
}

export async function createApp(options: CreateAppOptions = {}): Promise<AppHandle> {
  const { serveFrontend = true } = options;
  const env = loadEnv();
  const app = express();
  let closeVite: (() => Promise<void>) | undefined;

  const firebaseAuthFrameSource = resolveFirebaseFrameSource(env.VITE_FIREBASE_AUTH_DOMAIN);

  app.set('trust proxy', resolveTrustProxy(env.TRUST_PROXY));
  app.disable('x-powered-by');

  app.use((_req, res, next) => {
    const id = randomUUID();
    res.locals.requestId = id;
    res.setHeader('X-Request-Id', id);
    next();
  });

  app.use(
    helmet({
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
      contentSecurityPolicy: isProduction
        ? {
            useDefaults: true,
            directives: {
              'script-src': ["'self'", 'https://apis.google.com'],
              'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
              'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
              'img-src': ["'self'", 'data:', 'blob:', 'https:'],
              'connect-src': ["'self'", 'https://*.googleapis.com'],
              'frame-src': [
                "'self'",
                'https://accounts.google.com',
                ...(firebaseAuthFrameSource ? [firebaseAuthFrameSource] : ['https://*.firebaseapp.com']),
              ],
              'object-src': ["'none'"],
              'frame-ancestors': ["'self'"],
            },
          }
        : false,
      crossOriginResourcePolicy: { policy: 'same-site' },
    })
  );

  const envAllowedOrigins = env.CORS_ORIGIN ? env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean) : [];

  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin) return cb(null, true);
        if (/\.netlify\.app$/.test(origin)) return cb(null, true);
        if (envAllowedOrigins.includes(origin) || envAllowedOrigins.includes('*')) return cb(null, true);
        if (!isProduction && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return cb(null, true);
        return cb(null, true);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  app.use(express.json({ limit: '2mb' }));
  app.use(cookieParser());

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

  app.use((req, _res, next) => {
    if (req.path.startsWith('/api')) {
      console.log(`[API ${req.method}] ${req.path}`);
    }
    next();
  });

  const allowedOriginsForGuard = [
    ...envAllowedOrigins,
    'https://zingy-sprinkles-c91c18.netlify.app'
  ];

  app.use('/api', extractUser);
  app.use('/api', createOriginGuard(allowedOriginsForGuard));
  app.use('/api', apiRouter);

  app.use('/api', apiNotFoundHandler);

  if (serveFrontend) {
    if (!isProduction) {
      const { createServer } = await import('vite');
      const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
      app.use(vite.middlewares);
      closeVite = () => vite.close();
    } else {
      const distPath = path.resolve(process.cwd(), 'dist');

      app.use('/assets', express.static(path.join(distPath, 'assets'), { immutable: true, maxAge: '1y', index: false }));
      app.use(
        express.static(distPath, {
          index: false,
          setHeaders: (res, filePath) => {
            if (filePath.endsWith('index.html')) res.setHeader('Cache-Control', 'no-cache');
          },
        })
      );

      app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || path.extname(req.path)) {
          return next();
        }
        res.setHeader('Cache-Control', 'no-cache');
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  app.use((_req, res) => {
    res.status(404).type('text/plain').send('Not found');
  });
  app.use(errorHandler);

  return {
    app,
    port: env.PORT,
    dispose: async () => {
      closeAllStreams();
      await closeVite?.();
    },
  };
}

export default createApp;