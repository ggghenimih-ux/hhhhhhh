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
  /** false dans les tests (supertest) : pas de Vite, pas de fichiers statiques du front */
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
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.pathname !== '/' ||
      url.search ||
      url.hash
    ) {
      throw new Error();
    }
    return url.origin;
  } catch {
    throw new Error('VITE_FIREBASE_AUTH_DOMAIN must be a valid HTTPS host.');
  }
}

// TRUST_PROXY : nombre de proxys devant l'application (1 chez la plupart des hébergeurs), "false"/"0" si aucun.
// Une valeur trop haute permet de falsifier X-Forwarded-For et de contourner les limites de débit.
function resolveTrustProxy(raw: string | undefined): boolean | number | string {
  if (raw === undefined || raw.trim() === '') return isProduction ? 1 : false;
  const value = raw.trim();
  if (value === 'false' || value === '0') return false;
  if (/^\d+$/.test(value)) return Number(value);
  return value; // ex. "loopback, 10.0.0.0/8"
}

export async function createApp(options: CreateAppOptions = {}): Promise<AppHandle> {
  const { serveFrontend = true } = options;
  const env = loadEnv();
  const app = express();
  let closeVite: (() => Promise<void>) | undefined;

  const firebaseAuthFrameSource = resolveFirebaseFrameSource(env.VITE_FIREBASE_AUTH_DOMAIN);

  app.set('trust proxy', resolveTrustProxy(env.TRUST_PROXY));
  app.disable('x-powered-by');

  // Identifiant de requête : renvoyé au client en cas d'erreur 500 et présent dans les logs
  app.use((_req, res, next) => {
    const id = randomUUID();
    res.locals.requestId = id;
    res.setHeader('X-Request-Id', id);
    next();
  });

  // 1. Security headers via Helmet. CSP is enforced in production (Vite dev needs inline/eval scripts).
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
                // Le joker n'est gardé que si le domaine d'authentification exact n'est pas configuré
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

  // 2. CORS: only explicitly allowed origins may send credentialed requests
  const allowedOrigins = env.CORS_ORIGIN.split(',')
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

  // 4. Static uploads directory for product images and receipts
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

  // 5. Request logger for API calls
  app.use((req, _res, next) => {
    if (req.path.startsWith('/api')) {
      console.log(`[API ${req.method}] ${req.path}`);
    }
    next();
  });

  // 6. API : authentification (uniquement pour /api, pas pour les fichiers du front) + garde d'origine CSRF
  app.use('/api', extractUser);
  app.use('/api', createOriginGuard(allowedOrigins));
  app.use('/api', apiRouter);

  // 7. 404 handler strictly for unmatched /api routes (NEVER returns index.html for /api)
  app.use('/api', apiNotFoundHandler);

  // 8. Frontend
  if (serveFrontend) {
    if (!isProduction) {
      // Import dynamique : Vite (et esbuild) ne sont chargés qu'en développement
      const { createServer } = await import('vite');
      const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
      app.use(vite.middlewares);
      closeVite = () => vite.close();
    } else {
      const distPath = path.resolve(process.cwd(), 'dist');

      // Fichiers à empreinte (hash dans le nom) : cache d'un an. index.html : jamais mis en cache.
      app.use('/assets', express.static(path.join(distPath, 'assets'), { immutable: true, maxAge: '1y', index: false }));
      app.use(
        express.static(distPath, {
          index: false,
          setHeaders: (res, filePath) => {
            if (filePath.endsWith('index.html')) res.setHeader('Cache-Control', 'no-cache');
          },
        })
      );

      // index.html uniquement pour les routes de l'application (pas /api, pas /uploads, pas les fichiers manquants)
      app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || path.extname(req.path)) {
          return next();
        }
        res.setHeader('Cache-Control', 'no-cache');
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  // 9. 404 générique puis gestionnaire d'erreurs : TOUJOURS en dernier pour couvrir aussi le front
  app.use((_req, res) => {
    res.status(404).type('text/plain').send('Not found');
  });
  app.use(errorHandler);

  return {
    app,
    port: env.PORT,
    dispose: async () => {
      closeAllStreams(); // ferme les flux SSE ouverts, sinon server.close() attendrait indéfiniment
      await closeVite?.();
    },
  };
}
