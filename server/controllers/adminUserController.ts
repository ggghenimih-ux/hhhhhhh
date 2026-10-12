import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../db/client';
import { AppError } from '../middleware/errorHandler';

const UserRoleSchema = z.object({ role: z.enum(['CUSTOMER', 'ADMIN']) });

export const getAdminUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Number.parseInt(String(req.query.page || '1'), 10);
    const limit = Number.parseInt(String(req.query.limit || '25'), 10);
    const pageNumber = Number.isFinite(page) ? Math.max(1, page) : 1;
    const pageSize = Number.isFinite(limit) ? Math.min(100, Math.max(1, limit)) : 25;
    const search = typeof req.query.search === 'string'
      ? req.query.search.trim().replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 120)
      : '';
    const where = search
      ? {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
            { phone: { contains: search } },
          ],
        }
      : {};

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          createdAt: true,
          _count: { select: { orders: true } },
        },
      }),
    ]);

    await prisma.adminAuditLog.create({
      data: {
        actorId: req.user!.id,
        action: 'USER_LIST',
        targetType: 'USER',
        targetCount: users.length,
        outcome: 'SUCCESS',
        details: JSON.stringify({ page: pageNumber, limit: pageSize }),
      },
    });

    res.json({
      success: true,
      data: users,
      pagination: {
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
      capabilities: {
        canCreate: false,
        canDelete: false,
        reason: 'Firebase Admin credentials are not configured for user provisioning.',
      },
    });
  } catch (err) {
    next(err);
  }
};

export const updateAdminUserRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { role } = UserRoleSchema.parse(req.body);
    const updated = await prisma.$transaction(async (tx) => {
      const target = await tx.user.findUnique({
        where: { id: req.params.id },
        select: { id: true, name: true, role: true },
      });
      if (!target) throw new AppError(404, 'NotFound', 'Utilisateur introuvable.');
      if (target.id === req.user!.id && role !== 'ADMIN') {
        throw new AppError(409, 'SelfDemotionBlocked', 'Vous ne pouvez pas retirer votre propre rôle administrateur.');
      }
      if (target.role === 'ADMIN' && role !== 'ADMIN') {
        const adminCount = await tx.user.count({ where: { role: 'ADMIN' } });
        if (adminCount <= 1) {
          throw new AppError(409, 'LastAdminBlocked', 'Le dernier compte administrateur ne peut pas être rétrogradé.');
        }
      }

      const user = await tx.user.update({
        where: { id: target.id },
        data: { role },
        select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
      });
      await tx.adminAuditLog.create({
        data: {
          actorId: req.user!.id,
          action: 'USER_ROLE_UPDATE',
          targetType: 'USER',
          targetCount: 1,
          outcome: 'SUCCESS',
          details: JSON.stringify({ userId: target.id, from: target.role, to: role }),
        },
      });
      return user;
    });

    res.json({ success: true, message: 'Rôle utilisateur mis à jour.', data: updated });
  } catch (err) {
    next(err);
  }
};
