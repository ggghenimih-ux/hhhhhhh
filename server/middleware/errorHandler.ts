import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import multer from 'multer';

/** Erreur applicative : status + code stable (traduisible côté interface) + message sûr à afficher. */
export class AppError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/** Express 4 ne capte pas les rejets de Promise : ce wrapper les envoie à errorHandler. */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

const DB_UNAVAILABLE_CODES = new Set(['P1001', 'P1002', 'P1008', 'P1017', 'P2024']);
const DB_SCHEMA_MISMATCH_CODES = new Set(['P2021', 'P2022']);
const JWT_ERROR_NAMES = new Set(['TokenExpiredError', 'JsonWebTokenError', 'NotBeforeError']);

export const errorHandler = (err: unknown, req: Request, res: Response, next: NextFunction) => {
  // Si la réponse est déjà partie, on délègue au gestionnaire par défaut d'Express
  if (res.headersSent) return next(err);

  const e = err as any;

  // 1. Zod
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'ValidationError',
      message: 'Données de formulaire invalides.',
      details: err.issues.map((i) => ({
        field: i.path.map(String).join('.'),
        message: i.message,
      })),
    });
  }

  // 2. Erreurs de body-parser (JSON invalide, corps trop gros)
  if (e?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'BadRequest', message: 'Corps de requête JSON invalide.' });
  }
  if (e?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'PayloadTooLarge', message: 'Requête trop volumineuse.' });
  }

  // 3. Erreur applicative
  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: err.code,
      message: err.message,
      ...(err.details !== undefined ? { details: err.details } : {}),
    });
  }

  // 4. Multer
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'FileTooLarge',
        message: 'La taille du fichier dépasse la limite maximale de 5 Mo.',
      });
    }
    return res.status(400).json({ error: 'UploadError', message: err.message });
  }

  // 5. Prisma
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      // Le nom du champ n'est révélé qu'aux administrateurs (évite l'énumération d'emails)
      const target = Array.isArray(err.meta?.target) ? (err.meta!.target as string[]).join(', ') : undefined;
      return res.status(409).json({
        error: 'Conflict',
        message:
          req.user?.role === 'ADMIN' && target
            ? `Une entrée existe déjà avec cette valeur (${target}).`
            : 'Une entrée existe déjà avec cette valeur.',
      });
    }
    if (err.code === 'P2003') {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Opération impossible : cet élément est lié à d’autres données.',
      });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({
        error: 'NotFound',
        message: 'L’élément demandé n’existe pas dans la base de données.',
      });
    }
    if (err.code === 'P2034') {
      res.setHeader('Retry-After', '1');
      return res.status(503).json({
        error: 'Busy',
        message: 'Le serveur est occupé, veuillez réessayer dans un instant.',
      });
    }
    if (DB_UNAVAILABLE_CODES.has(err.code)) {
      return res.status(503).json({ error: 'ServiceUnavailable', message: 'Base de données indisponible.' });
    }
    if (DB_SCHEMA_MISMATCH_CODES.has(err.code)) {
      return res.status(503).json({
        error: 'ServiceUnavailable',
        message: 'La base de données nécessite une mise à jour avant cette opération.',
      });
    }
  }
  if (err instanceof Prisma.PrismaClientInitializationError) {
    return res.status(503).json({ error: 'ServiceUnavailable', message: 'Base de données indisponible.' });
  }

  // 6. Erreurs JWT qui auraient échappé aux middlewares d'authentification
  if (JWT_ERROR_NAMES.has(e?.name)) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Session invalide ou expirée.' });
  }

  // 7. Erreurs "legacy" portant un status 4xx : message exposé (intentionnellement destiné au client).
  //    Les 5xx ne sont JAMAIS exposés.
  if (typeof e?.status === 'number' && e.status >= 400 && e.status < 500) {
    return res.status(e.status).json({
      error: e.name || 'ApplicationError',
      message: e.message,
    });
  }

  // 8. 500 : journalisation avec contexte + identifiant de requête renvoyé au client
  const requestId = res.locals.requestId as string | undefined;
  console.error('[SERVER ERROR]', {
    requestId,
    method: req.method,
    url: req.originalUrl,
    userId: req.user?.id,
    name: e?.name,
    message: e?.message,
    stack: e?.stack,
  });

  const isDev = process.env.NODE_ENV === 'development';
  return res.status(500).json({
    error: 'InternalServerError',
    message: 'Une erreur interne est survenue sur le serveur.',
    ...(requestId ? { requestId } : {}),
    ...(isDev ? { stack: e?.stack, raw: e?.message } : {}),
  });
};

export const apiNotFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    error: 'NotFound',
    message: `Le point d'accès API [${req.method} ${req.originalUrl}] est introuvable.`,
  });
};
