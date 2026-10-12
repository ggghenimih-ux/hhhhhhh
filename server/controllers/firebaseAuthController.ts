import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { prisma } from '../db/client';
import { generateToken, hashPassword, setAuthCookie } from '../services/authService';
import { AppError } from '../middleware/errorHandler';

const firebaseProjectId = process.env.FIREBASE_PROJECT_ID?.trim();

if (firebaseProjectId && !getApps().length) {
  initializeApp({ projectId: firebaseProjectId });
}

const BodySchema = z.object({
  idToken: z.string().min(20).max(4000),
});

const randomPasswordHash = async () => hashPassword(crypto.randomBytes(32).toString('hex'));

export const firebaseLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { idToken } = BodySchema.parse(req.body);
    if (!firebaseProjectId) {
      throw new AppError(503, 'ServiceUnavailable', 'La connexion Firebase n’est pas configurée sur le serveur.');
    }

    let decoded;
    try {
      // NB : ne pas passer checkRevoked=true ici — cela exige un compte de service, que ce projet n'utilise pas.
      decoded = await getAuth().verifyIdToken(idToken);
    } catch {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Jeton Firebase invalide ou expiré.',
      });
    }

    if (!decoded.email || !decoded.email_verified) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Adresse email non vérifiée.',
      });
    }

    const email = decoded.email.toLowerCase().trim();
    const displayName = (decoded.name || email.split('@')[0] || 'Client').toString().trim().slice(0, 100);

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      try {
        user = await prisma.user.create({
          data: {
            name: displayName.length >= 2 ? displayName : 'Client',
            email,
            phone: '',
            passwordHash: await randomPasswordHash(),
            role: 'CUSTOMER',
            emailVerifiedAt: new Date(),
          },
        });
      } catch (err) {
        // Deux premiers logins simultanés : l'autre requête a créé le compte entre-temps
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
          user = await prisma.user.findUnique({ where: { email } });
        } else {
          throw err;
        }
      }
    }
    if (!user) throw new AppError(500, 'InternalServerError', 'Création du compte impossible.');

    // Le compte ADMIN peut se connecter via Firebase (l'interface passe par Firebase pour email + mot de passe).
    // Sécurité : l'email doit être VÉRIFIÉ par Firebase (contrôle plus haut), et le rôle ADMIN vient de la base,
    // jamais du client ni du token.
    if (!user.emailVerifiedAt) {
      if (user.role === 'ADMIN') {
        // Compte créé par l'installation (seed / admin:make), pas par l'inscription publique :
        // on marque l'email comme vérifié SANS toucher au mot de passe local.
        user = await prisma.user.update({
          where: { id: user.id },
          data: { emailVerifiedAt: new Date() },
        });
      } else {
        // Anti pré-piratage : ce compte a été créé (par inscription locale) SANS preuve que l'email appartient
        // à son créateur. Firebase prouve maintenant la propriété : on invalide le mot de passe choisi par un
        // éventuel tiers ainsi que toutes les sessions existantes.
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            passwordHash: await randomPasswordHash(),
            emailVerifiedAt: new Date(),
            tokenVersion: { increment: 1 },
          },
        });
      }
    }

    if (user.role === 'ADMIN') {
      console.warn(`[AUTH] Connexion administrateur via Firebase : user=${user.id} ip=${req.ip}`);
    }

    const token = generateToken({ id: user.id, role: user.role, tokenVersion: user.tokenVersion });
    setAuthCookie(res, token);

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
    };

    res.json({
      success: true,
      user: safeUser,
      data: safeUser,
      ...(process.env.RETURN_TOKEN_IN_BODY === 'true' ? { token } : {}),
    });
  } catch (err) {
    next(err);
  }
};