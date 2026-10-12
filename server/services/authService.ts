import jwt, { JwtPayload } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Response, CookieOptions } from 'express';
import { JWT_SECRET, JWT_ALGORITHM, isProduction } from '../security';

// Source unique de la durée de session : le token ET le cookie en dérivent (plus de décalage possible).
const SESSION_SECONDS = {
  CUSTOMER: 7 * 24 * 60 * 60, // 7 jours
  ADMIN: 12 * 60 * 60, // 12 heures
} as const;

// Dummy hash so login takes the same time whether or not the account exists
export const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', 12);

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

/**
 * Le token ne contient plus que : sub (id utilisateur) et tv (tokenVersion).
 * Le rôle est TOUJOURS relu en base : il ne faut jamais faire confiance à un rôle porté par le token.
 * Incrémenter user.tokenVersion invalide immédiatement tous les tokens existants de l'utilisateur.
 */
export const generateToken = (payload: {
  id?: string;
  userId?: string;
  email?: string;
  role: string;
  tokenVersion?: number;
}): string => {
  const uid = payload.userId || payload.id || '';
  const ttl = payload.role === 'ADMIN' ? SESSION_SECONDS.ADMIN : SESSION_SECONDS.CUSTOMER;
  return jwt.sign({ tv: payload.tokenVersion ?? 0 }, JWT_SECRET, {
    algorithm: JWT_ALGORITHM,
    subject: uid,
    expiresIn: ttl,
  });
};

// SameSite=None is only needed when the site is embedded in a cross-site iframe.
// Default is Lax (protects against CSRF); opt in with COOKIE_SAMESITE_NONE=true.
const crossSite = process.env.COOKIE_SAMESITE_NONE === 'true';

const baseCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: isProduction || crossSite,
  sameSite: crossSite ? 'none' : 'lax',
  path: '/',
});

export const setAuthCookie = (res: Response, token: string) => {
  const exp = (jwt.decode(token) as JwtPayload | null)?.exp;
  const maxAge = exp ? Math.max(0, exp * 1000 - Date.now()) : SESSION_SECONDS.CUSTOMER * 1000;
  res.cookie('gsm_token', token, { ...baseCookieOptions(), maxAge });
};

export const clearAuthCookie = (res: Response) => {
  res.clearCookie('gsm_token', baseCookieOptions());
  res.clearCookie('token', baseCookieOptions()); // legacy cookie name
};
