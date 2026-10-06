import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
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

// Verifies a token and loads a fresh user from the DB (so role changes / deletions apply immediately)
async function resolveUser(token: string): Promise<AuthenticatedUser | null> {
  const decoded = jwt.verify(token, JWT_SECRET, { algorithms: [JWT_ALGORITHM] }) as {
    userId?: string;
    id?: string;
  };

  const targetId = decoded.userId || decoded.id;
  if (!targetId || typeof targetId !== 'string') return null;

  const user = await prisma.user.findUnique({
    where: { id: targetId },
    select: { id: true, name: true, email: true, role: true, phone: true },
  });
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role === 'ADMIN' ? 'ADMIN' : 'CUSTOMER',
  };
}

// Global middleware: attaches req.user when a valid token exists, never blocks
export const extractUser = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const { token } = getTokenFromRequest(req);
    if (token) {
      const user = await resolveUser(token);
      if (user) req.user = user;
    }
  } catch {
    // Expired or invalid token: continue as unauthenticated
  }
  next();
};

// Enforces a valid authenticated user
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const { token } = getTokenFromRequest(req);

  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Veuillez vous connecter pour accéder à cette ressource.',
    });
  }

  try {
    const user = await resolveUser(token);
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Utilisateur introuvable. Veuillez vous reconnecter.',
      });
    }
    req.user = user;
    next();
  } catch (err: any) {
    return res.status(401).json({
      error: 'Unauthorized',
      message:
        err?.name === 'TokenExpiredError'
          ? 'Session expirée. Veuillez vous reconnecter.'
          : 'Token invalide.',
    });
  }
};

// Enforces ADMIN role
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  requireAuth(req, res, () => {
    if (!req.user || req.user.role !== 'ADMIN') {
      console.warn(`[AUTH-FORBIDDEN] user=${req.user?.id} denied on ${req.method} ${req.path}`);
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Accès réservé uniquement aux administrateurs (Rôle ADMIN requis).',
      });
    }
    next();
  });
};
