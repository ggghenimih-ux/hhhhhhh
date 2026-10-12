import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { prisma } from '../db/client';
import { JWT_SECRET, JWT_ALGORITHM } from '../security';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: 'CUSTOMER' | 'ADMIN';
  phone?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

// Extract token from the HttpOnly cookie or the Authorization Bearer header
export const getTokenFromRequest = (req: Request): { token?: string; source?: string } => {
  if (req.cookies && typeof req.cookies.gsm_token === 'string' && req.cookies.gsm_token) {
    return { token: req.cookies.gsm_token, source: 'cookie' };
  }
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    const token = auth.slice(7).trim();
    if (token) return { token, source: 'header' };
  }
  return {};
};

type AuthFailure = 'missing' | 'expired' | 'invalid' | 'not_found';
type AuthResult = { user: AuthenticatedUser } | { failure: AuthFailure };

const FAILURE_MESSAGES: Record<AuthFailure, string> = {
  missing: 'Veuillez vous connecter pour accéder à cette ressource.',
  expired: 'Session expirée. Veuillez vous reconnecter.',
  invalid: 'Token invalide.',
  not_found: 'Utilisateur introuvable. Veuillez vous reconnecter.',
};

/**
 * Vérifie le token puis recharge l'utilisateur depuis la base (rôle/suppression pris en compte immédiatement).
 * - Les erreurs JWT deviennent un "failure" (→ 401).
 * - Toute autre erreur (base indisponible, bug...) est RELANCÉE : elle ne doit jamais devenir un 401,
 *   sinon une panne temporaire déconnecte tous les utilisateurs.
 */
async function authenticate(req: Request): Promise<AuthResult> {
  const { token } = getTokenFromRequest(req);
  if (!token) return { failure: 'missing' };

  let decoded: JwtPayload;
  try {
    const raw = jwt.verify(token, JWT_SECRET, { algorithms: [JWT_ALGORITHM] });
    if (typeof raw === 'string') return { failure: 'invalid' };
    decoded = raw;
  } catch (err: any) {
    if (err?.name === 'TokenExpiredError') return { failure: 'expired' };
    if (err?.name === 'JsonWebTokenError' || err?.name === 'NotBeforeError') return { failure: 'invalid' };
    throw err;
  }

  // "sub" est le standard ; userId / id sont acceptés pour les anciens tokens encore valides
  const id = [decoded.sub, decoded.userId, decoded.id].find((v) => typeof v === 'string' && v) as
    | string
    | undefined;
  if (!id) return { failure: 'invalid' };

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, phone: true, tokenVersion: true },
  });
  if (!user) return { failure: 'not_found' };

  // Les anciens tokens n'ont pas de "tv" : ils correspondent à la version 0
  const tv = typeof decoded.tv === 'number' ? decoded.tv : 0;
  if (tv !== user.tokenVersion) return { failure: 'invalid' };

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role === 'ADMIN' ? 'ADMIN' : 'CUSTOMER',
    },
  };
}

// Une seule vérification (signature + requête SQL) par requête, partagée via res.locals
async function resolveAuth(req: Request, res: Response): Promise<AuthResult> {
  if (res.locals.auth) return res.locals.auth as AuthResult;
  const result = await authenticate(req);
  res.locals.auth = result;
  return result;
}

// Global middleware: attaches req.user when a valid token exists, never blocks
export const extractUser: RequestHandler = async (req, res, next) => {
  try {
    const result = await resolveAuth(req, res);
    if ('user' in result) req.user = result.user;
  } catch (err) {
    // Base indisponible, etc. : on continue en visiteur ; requireAuth retentera et renverra une 503.
    console.error('[AUTH] Résolution utilisateur impossible :', (err as Error).message);
  }
  next();
};

// Enforces a valid authenticated user
export const requireAuth: RequestHandler = async (req, res, next) => {
  try {
    const result = await resolveAuth(req, res);
    if ('failure' in result) {
      return res.status(401).json({ error: 'Unauthorized', message: FAILURE_MESSAGES[result.failure] });
    }
    req.user = result.user;
    next();
  } catch (err) {
    next(err); // → errorHandler (503 si base indisponible, sinon 500)
  }
};

// Enforces ADMIN role
export const requireAdmin: RequestHandler = async (req, res, next) => {
  try {
    const result = await resolveAuth(req, res);
    if ('failure' in result) {
      return res.status(401).json({ error: 'Unauthorized', message: FAILURE_MESSAGES[result.failure] });
    }
    req.user = result.user;
    if (result.user.role !== 'ADMIN') {
      console.warn(
        `[AUTH-FORBIDDEN] user=${result.user.id} ip=${req.ip} denied on ${req.method} ${req.originalUrl}`
      );
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Accès réservé uniquement aux administrateurs (Rôle ADMIN requis).',
      });
    }
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Défense CSRF supplémentaire (en plus de SameSite=Lax) : une requête qui modifie des données et
 * qui s'authentifie par COOKIE doit venir d'une origine autorisée. Les requêtes Bearer ne sont pas concernées.
 */
export const createOriginGuard =
  (allowedOrigins: string[]): RequestHandler =>
  (req, res, next) => {
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return next();
    if (getTokenFromRequest(req).source !== 'cookie') return next();

    const origin = req.get('origin');
    if (!origin) return next();

    try {
      const forwardedHost = req.get('x-forwarded-host')?.split(',')[0]?.trim();
      const hosts = [req.get('host'), forwardedHost].filter(Boolean);
      if (allowedOrigins.includes(origin) || hosts.includes(new URL(origin).host)) return next();
    } catch {
      // origine illisible → refusée ci-dessous
    }

    return res.status(403).json({
      error: 'Forbidden',
      message: 'Origine de la requête non autorisée.',
    });
  };
