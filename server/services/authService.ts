import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Response, CookieOptions } from 'express';
import { JWT_SECRET, JWT_ALGORITHM, isProduction } from '../security';

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

// Dummy hash so login takes the same time whether or not the account exists
export const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', 12);

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateToken = (payload: { id?: string; userId?: string; email?: string; role: string }): string => {
  const uid = payload.userId || payload.id || '';
  return jwt.sign(
    { userId: uid, id: uid, role: payload.role },
    JWT_SECRET,
    { algorithm: JWT_ALGORITHM, expiresIn: JWT_EXPIRES_IN as any }
  );
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
  res.cookie('gsm_token', token, { ...baseCookieOptions(), maxAge: COOKIE_MAX_AGE });
};

export const clearAuthCookie = (res: Response) => {
  res.clearCookie('gsm_token', baseCookieOptions());
  res.clearCookie('token', baseCookieOptions()); // legacy cookie name
};
