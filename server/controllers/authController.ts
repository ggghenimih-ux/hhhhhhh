import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/client';
import { RegisterSchema, LoginSchema, sanitizePhone } from '../validators/schemas';
import {
  hashPassword,
  comparePassword,
  generateToken,
  setAuthCookie,
  clearAuthCookie,
  DUMMY_HASH,
} from '../services/authService';
import { isLocked, recordFailure, clearFailures, retryAfterSeconds } from '../services/loginGuard';

// Le token vit dans le cookie HttpOnly. Le renvoyer dans le JSON l'expose à tout script (XSS).
// Désactivé par défaut ; mettre RETURN_TOKEN_IN_BODY=true uniquement si l'interface en dépend encore.
const exposeToken = () => process.env.RETURN_TOKEN_IN_BODY === 'true';

const toPublicUser = (u: {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  createdAt: Date;
}) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  phone: u.phone,
  role: u.role,
  createdAt: u.createdAt,
});

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = RegisterSchema.parse(req.body);
    const email = validated.email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Un compte existe déjà avec cette adresse email.',
      });
    }

    const passwordHash = await hashPassword(validated.password);

    // En cas de course (deux inscriptions simultanées) la contrainte unique lève P2002 → 409 via errorHandler
    const user = await prisma.user.create({
      data: {
        name: validated.name.trim(),
        email,
        phone: sanitizePhone(validated.phone),
        passwordHash,
        role: 'CUSTOMER',
      },
    });

    const token = generateToken({ id: user.id, role: user.role, tokenVersion: user.tokenVersion });
    setAuthCookie(res, token);

    const userSanitized = toPublicUser(user);
    res.status(201).json({
      success: true,
      message: 'Compte créé avec succès !',
      user: userSanitized,
      data: userSanitized,
      ...(exposeToken() ? { token } : {}),
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = LoginSchema.parse(req.body);
    const email = validated.email.toLowerCase().trim();

    // Verrou par email (indépendant de l'IP) : bloque le "credential stuffing" distribué
    if (isLocked(email)) {
      res.setHeader('Retry-After', String(retryAfterSeconds(email)));
      return res.status(429).json({
        error: 'TooManyRequests',
        message: 'Trop de tentatives pour ce compte. Veuillez patienter quelques minutes avant de réessayer.',
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Always run a bcrypt comparison so response time doesn't reveal whether the account exists
    const isMatch = await comparePassword(validated.password, user ? user.passwordHash : DUMMY_HASH);
    if (!user || !isMatch) {
      recordFailure(email);
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Email ou mot de passe incorrect.',
      });
    }

    clearFailures(email);

    const token = generateToken({ id: user.id, role: user.role, tokenVersion: user.tokenVersion });
    setAuthCookie(res, token);

    const userSanitized = toPublicUser(user);
    res.json({
      success: true,
      message: 'Connexion réussie.',
      user: userSanitized,
      data: userSanitized,
      ...(exposeToken() ? { token } : {}),
    });
  } catch (err) {
    next(err);
  }
};

export const logout = async (_req: Request, res: Response) => {
  clearAuthCookie(res);
  res.json({
    success: true,
    message: 'Déconnexion effectuée avec succès.',
  });
};

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.json({ success: true, user: null, data: null });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
    });

    if (!user) {
      clearAuthCookie(res);
      return res.json({ success: true, user: null, data: null });
    }

    res.json({ success: true, user, data: user });
  } catch (err) {
    next(err);
  }
};
