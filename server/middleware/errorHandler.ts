import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  // 1. Zod Validation Errors
  if (err instanceof ZodError) {
    const rawIssues = (err as any).issues || (err as any).errors || [];
    const formattedErrors = rawIssues.map((e: any) => ({
      field: Array.isArray(e.path) ? e.path.join('.') : String(e.path || ''),
      message: e.message,
    }));
    return res.status(400).json({
      error: 'ValidationError',
      message: 'Données de formulaire invalides.',
      details: formattedErrors,
    });
  }

  // 2. Prisma Database Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[])?.join(', ') || 'champ';
      return res.status(409).json({
        error: 'Conflict',
        message: `Une entrée existe déjà avec cette valeur (${target}).`,
      });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({
        error: 'NotFound',
        message: 'L’élément demandé n’existe pas dans la base de données.',
      });
    }
  }

  // 3. Multer upload errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'FileTooLarge',
        message: 'La taille du fichier dépasse la limite maximale de 5 Mo.',
      });
    }
    return res.status(400).json({
      error: 'UploadError',
      message: err.message,
    });
  }

  // 4. Custom application error with status
  if (err.status && typeof err.status === 'number') {
    return res.status(err.status).json({
      error: err.name || 'ApplicationError',
      message: err.message,
    });
  }

  // 5. Default 500 Internal Server Error
  console.error('[UNHANDLED SERVER ERROR]', err);
  const isDev = process.env.NODE_ENV === 'development';

  return res.status(500).json({
    error: 'InternalServerError',
    message: 'Une erreur interne est survenue sur le serveur.',
    ...(isDev ? { stack: err.stack, raw: err.message } : {}),
  });
};

export const apiNotFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    error: 'NotFound',
    message: `Le point d'accès API [${req.method} ${req.originalUrl}] est introuvable.`,
  });
};
