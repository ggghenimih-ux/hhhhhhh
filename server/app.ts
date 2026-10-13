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

  // 1. Security headers via Helmet.
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

  // 2. CORS: Automatic Netlify wildcard and environment configuration
  const envAllowedOrigins = env.CORS_ORIGIN ? env.CORS_ORIGimport express, { Express } from 'express';
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

  // 1. Security headers via Helmet.
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

  // 2. CORS: Automatic Netlify wildcard and environment configuration
  const envAllowedOrigins = env.CORS_ORIGIN ? env.CORS_ORIG