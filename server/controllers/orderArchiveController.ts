import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '../db/client';

const MAX_EXPORT_ORDERS = 1000;
const EXPORT_TOKEN_TTL_MS = 30 * 60 * 1000;

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, 'Date invalide.');

const rangeSchema = z.object({
  fromDate: dateSchema,
  toDate: dateSchema,
}).refine(({ fromDate, toDate }) => fromDate <= toDate, {
  message: 'La date de début doit précéder ou égaler la date de fin.',
  path: ['toDate'],
});

const tokenSchema = z.object({
  token: z.string().min(40).max(100),
  confirmedCount: z.number().int().positive(),
});

const getRange = (fromDate: string, toDate: string) => {
  const from = new Date(`${fromDate}T00:00:00.000Z`);
  const toExclusive = new Date(`${toDate}T00:00:00.000Z`);
  toExclusive.setUTCDate(toExclusive.getUTCDate() + 1);
  return { from, toExclusive };
};

const getDateRangeBody = (req: Request) => rangeSchema.parse({
  fromDate: req.method === 'GET' ? req.query.fromDate : req.body.fromDate,
  toDate: req.method === 'GET' ? req.query.toDate : req.body.toDate,
});

const getOrderWhere = (from: Date, toExclusive: Date) => ({
  archivedAt: null,
  createdAt: { gte: from, lt: toExclusive },
});

const recordAudit = (
  req: Request,
  action: string,
  outcome: string,
  targetCount = 0,
  details: Record<string, unknown> = {},
) => prisma.adminAuditLog.create({
  data: {
    actorId: req.user!.id,
    action,
    targetType: 'ORDER',
    targetCount,
    outcome,
    details: JSON.stringify(details),
  },
});

export const previewOrderArchive = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fromDate, toDate } = getDateRangeBody(req);
    const { from, toExclusive } = getRange(fromDate, toDate);
    const count = await prisma.order.count({ where: getOrderWhere(from, toExclusive) });

    await prisma.adminAuditLog.create({
      data: {
        actorId: req.user!.id,
        action: 'ORDER_ARCHIVE_PREVIEW',
        targetType: 'ORDER',
        targetCount: count,
        outcome: 'SUCCESS',
        details: JSON.stringify({ fromDate, toDate }),
      },
    });

    res.json({ success: true, count, fromDate, toDate });
  } catch (err) {
    try {
      await recordAudit(req, 'ORDER_ARCHIVE_PREVIEW', 'FAILED');
    } catch (auditError) {
      return next(auditError);
    }
    next(err);
  }
};

export const exportOrderArchive = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fromDate, toDate } = getDateRangeBody(req);
    const { from, toExclusive } = getRange(fromDate, toDate);
    const snapshotAt = new Date();
    const where = getOrderWhere(from, toExclusive);
    const count = await prisma.order.count({ where });

    if (count > MAX_EXPORT_ORDERS) {
      await recordAudit(req, 'ORDER_EXPORT', 'REJECTED_TOO_LARGE', count, { fromDate, toDate });
      return res.status(413).json({
        error: 'ExportTooLarge',
        message: `La période correspond à ${count} commandes. Réduisez la période à ${MAX_EXPORT_ORDERS} commandes maximum par export.`,
        count,
      });
    }

    const orders = await prisma.order.findMany({
      where: { ...where, updatedAt: { lte: snapshotAt } },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      include: { items: true },
      take: MAX_EXPORT_ORDERS + 1,
    });

    if (orders.length !== count) {
      await recordAudit(req, 'ORDER_EXPORT', 'FAILED_SELECTION_CHANGED', count, { fromDate, toDate });
      return res.status(409).json({
        error: 'SelectionChanged',
        message: 'Les commandes ont changé pendant la préparation. Actualisez le décompte et recommencez.',
      });
    }

    let selectionToken: string | undefined;
    res.setHeader('Cache-Control', 'no-store');
    if (orders.length > 0) {
      selectionToken = crypto.randomBytes(32).toString('base64url');
      const tokenHash = crypto.createHash('sha256').update(selectionToken).digest('hex');
      const expiresAt = new Date(Date.now() + EXPORT_TOKEN_TTL_MS);

      await prisma.$transaction(async (tx) => {
        await tx.adminOrderExport.deleteMany({
          where: {
            OR: [
              { expiresAt: { lte: snapshotAt } },
              { consumedAt: { not: null } },
            ],
          },
        });
        await tx.adminOrderExport.create({
          data: {
            actorId: req.user!.id,
            tokenHash,
            fromDate: from,
            toDate: toExclusive,
            snapshotAt,
            orderIdsJson: JSON.stringify(orders.map((order) => ({
              id: order.id,
              updatedAt: order.updatedAt.toISOString(),
            }))),
            orderCount: orders.length,
            expiresAt,
          },
        });
        await tx.adminAuditLog.create({
          data: {
            actorId: req.user!.id,
            action: 'ORDER_EXPORT',
            targetType: 'ORDER',
            targetCount: orders.length,
            outcome: 'SUCCESS',
            details: JSON.stringify({ fromDate, toDate }),
          },
        });
      });

      res.setHeader('X-Order-Archive-Token', selectionToken);
    }

    res.json({
      success: true,
      count: orders.length,
      fromDate,
      toDate,
      data: orders,
    });
  } catch (err) {
    try {
      await recordAudit(req, 'ORDER_EXPORT', 'FAILED');
    } catch (auditError) {
      return next(auditError);
    }
    next(err);
  }
};

export const archiveExportedOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, confirmedCount } = tokenSchema.parse(req.body);
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const selection = await prisma.adminOrderExport.findUnique({ where: { tokenHash } });

    if (
      !selection ||
      selection.actorId !== req.user!.id ||
      selection.consumedAt ||
      selection.expiresAt <= new Date()
    ) {
      await recordAudit(req, 'ORDER_ARCHIVE', 'REJECTED_INVALID_EXPORT');
      return res.status(409).json({
        error: 'ExportSelectionInvalid',
        message: 'Cet export est introuvable, expiré ou déjà utilisé. Exportez à nouveau la sélection.',
      });
    }

    if (selection.orderCount === 0 || confirmedCount !== selection.orderCount) {
      await recordAudit(req, 'ORDER_ARCHIVE', 'REJECTED_CONFIRMATION_MISMATCH', selection.orderCount);
      return res.status(400).json({
        error: 'ConfirmationMismatch',
        message: 'Le nombre confirmé ne correspond pas au nombre exporté.',
      });
    }

    const manifest = JSON.parse(selection.orderIdsJson) as Array<{ id: string; updatedAt: string }>;
    if (manifest.length !== selection.orderCount) {
      await recordAudit(req, 'ORDER_ARCHIVE', 'FAILED_INVALID_MANIFEST', selection.orderCount);
      return res.status(409).json({
        error: 'ExportSelectionInvalid',
        message: 'La sélection exportée est invalide. Exportez à nouveau la sélection.',
      });
    }

    const archivedAt = new Date();
    await prisma.$transaction(async (tx) => {
      const currentOrders = await tx.order.findMany({
        where: {
          id: { in: manifest.map(({ id }) => id) },
          archivedAt: null,
          createdAt: { gte: selection.fromDate, lt: selection.toDate },
        },
        select: { id: true, updatedAt: true },
      });
      const currentById = new Map(currentOrders.map((order) => [order.id, order.updatedAt.toISOString()]));

      if (
        currentOrders.length !== selection.orderCount ||
        manifest.some((order) => currentById.get(order.id) !== order.updatedAt)
      ) {
        throw Object.assign(
          new Error('Au moins une commande a été modifiée depuis son export. Aucune commande n’a été archivée.'),
          { status: 409, name: 'ExportSelectionChanged' },
        );
      }

      for (const order of manifest) {
        const updated = await tx.order.updateMany({
          where: {
            id: order.id,
            archivedAt: null,
            createdAt: { gte: selection.fromDate, lt: selection.toDate },
            updatedAt: new Date(order.updatedAt),
          },
          data: { archivedAt, archivedBy: req.user!.id },
        });
        if (updated.count !== 1) {
          throw Object.assign(
            new Error('Au moins une commande a changé pendant l’archivage. Aucune commande n’a été archivée.'),
            { status: 409, name: 'ExportSelectionChanged' },
          );
        }
      }

      await tx.adminOrderExport.update({
        where: { id: selection.id, consumedAt: null },
        data: { consumedAt: archivedAt },
      });
      await tx.adminAuditLog.create({
        data: {
          actorId: req.user!.id,
          action: 'ORDER_ARCHIVE',
          targetType: 'ORDER',
          targetCount: selection.orderCount,
          outcome: 'SUCCESS',
          details: JSON.stringify({
            fromDate: selection.fromDate.toISOString(),
            toDateExclusive: selection.toDate.toISOString(),
            exportId: selection.id,
          }),
        },
      });
    });

    res.json({
      success: true,
      archivedCount: selection.orderCount,
      message: `${selection.orderCount} commande(s) archivée(s). Elles restent restaurables.`,
    });
  } catch (err) {
    try {
      await recordAudit(req, 'ORDER_ARCHIVE', 'FAILED');
    } catch (auditError) {
      return next(auditError);
    }
    next(err);
  }
};

export const getArchivedOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Number.parseInt(String(req.query.page || '1'), 10);
    const limit = Number.parseInt(String(req.query.limit || '25'), 10);
    const pageNumber = Number.isFinite(page) ? Math.max(1, page) : 1;
    const pageSize = Number.isFinite(limit) ? Math.min(100, Math.max(1, limit)) : 25;
    const where = { archivedAt: { not: null } };
    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        orderBy: { archivedAt: 'desc' },
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          totalTND: true,
          createdAt: true,
          archivedAt: true,
        },
      }),
    ]);

    res.json({
      success: true,
      data: orders,
      pagination: {
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const restoreArchivedOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order || !order.archivedAt) {
      return res.status(404).json({ error: 'NotFound', message: 'Commande archivée introuvable.' });
    }

    await prisma.$transaction(async (tx) => {
      const restored = await tx.order.updateMany({
        where: { id: order.id, archivedAt: order.archivedAt },
        data: { archivedAt: null, archivedBy: null },
      });
      if (restored.count !== 1) {
        throw Object.assign(new Error('La commande a changé. Actualisez la liste.'), { status: 409 });
      }
      await tx.adminAuditLog.create({
        data: {
          actorId: req.user!.id,
          action: 'ORDER_RESTORE',
          targetType: 'ORDER',
          targetCount: 1,
          outcome: 'SUCCESS',
          details: JSON.stringify({ orderId: order.id }),
        },
      });
    });

    res.json({ success: true, message: `Commande #${order.orderNumber} restaurée.` });
  } catch (err) {
    try {
      await prisma.adminAuditLog.create({
        data: {
          actorId: req.user!.id,
          action: 'ORDER_RESTORE',
          targetType: 'ORDER',
          targetCount: 1,
          outcome: 'FAILED',
          details: JSON.stringify({ orderId: req.params.id }),
        },
      });
    } catch (auditError) {
      return next(auditError);
    }
    next(err);
  }
};
