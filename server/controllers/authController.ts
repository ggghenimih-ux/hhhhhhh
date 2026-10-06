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

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = RegisterSchema.parse(req.body);

    const existing = await prisma.user.findUnique({
      where: { email: validated.email.toLowerCase().trim() },
    });

    if (existing) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Un compte existe déjà avec cette adresse email.',
      });
    }

    const passwordHash = await hashPassword(validated.password);
    const sanitizedPhone = sanitizePhone(validated.phone);

    const user = await prisma.user.create({
      data: {
        name: validated.name.trim(),
        email: validated.email.toLowerCase().trim(),
        phone: sanitizedPhone,
        passwordHash,
        role: 'CUSTOMER',
      },
    });

    const token = generateToken({
      userId: user.id,
      id: user.id,
      email: user.email,
      role: user.role,
    });

    setAuthCookie(res, token);

    const userSanitized = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
    };

    res.status(201).json({
      success: true,
      message: 'Compte créé avec succès !',
      user: userSanitized,
      data: userSanitized,
      token,
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = LoginSchema.parse(req.body);
    const normalizedEmail = validated.email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Always run a bcrypt comparison so response time doesn't reveal whether the account exists
    const isMatch = await comparePassword(validated.password, user ? user.passwordHash : DUMMY_HASH);
    if (!user || !isMatch) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Email ou mot de passe incorrect.',
      });
    }

    const token = generateToken({
      userId: user.id,
      id: user.id,
      email: user.email,
      role: user.role,
    });

    setAuthCookie(res, token);

    const userSanitized = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
    };

    res.json({
      success: true,
      message: 'Connexion réussie.',
      user: userSanitized,
      data: userSanitized,
      token,
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
      return res.json({
        success: true,
        user: null,
        data: null,
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      clearAuthCookie(res);
      return res.json({
        success: true,
        user: null,
        data: null,
      });
    }

    res.json({
      success: true,
      user,
      data: user,
    });
  } catch (err) {
    next(err);
  }
};
