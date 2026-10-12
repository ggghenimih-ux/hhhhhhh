import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/client';
import { CreateOrderSchema, OrderStatusSchema, OrderUpdateSchema } from '../validators/schemas';
import { processOrderCreation } from '../services/orderService';
import { AppError } from '../middleware/errorHandler';
import { broadcast, notifyNewOrder } from '../services/notificationService';
import { TRACK_STOCK } from '../config/stock';

// Transitions de statut autorisées (adaptez-les à votre processus : retours après livraison, etc.)
const ORDER_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
};

// ⚠️ Vérifiez services/orderService.ts : si processOrderCreation NE décrémente PAS le stock
// (cherchez `stock: { decrement`), mettez cette constante à false.
const RESTOCK_ON_CANCEL = TRACK_STOCK;

// The order number is a public tracking code, so never expose full personal data through it
const maskName = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => {
      const chars = Array.from(part); // gère correctement les caractères hors BMP
      return chars[0] + '*'.repeat(Math.max(chars.length - 1, 1));
    })
    .join(' ');

const maskPhone = (phone: string): string =>
  phone.length > 4 ? '*'.repeat(phone.length - 4) + phone.slice(-4) : '****';

// "2026-10-08" en toDate signifie "jusqu'à la fin de ce jour" (sinon la journée entière est exclue)
const parseDate = (value: unknown, endOfDay = false): Date | undefined => {
  const raw = String(value).trim();
  const d = new Date(raw);
  if (isNaN(d.getTime())) return undefined;
  if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(raw)) d.setUTCHours(23, 59, 59, 999);
  return d;
};

const parseHistory = (raw: string | null | undefined): any[] => {
  try {
    const value = JSON.parse(raw || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

// Version destinée au client : sans le nom ni l'identifiant de l'administrateur
const publicHistory = (raw: string | null | undefined): string =>
  JSON.stringify(
    parseHistory(raw).map((h) => ({ from: h?.from, to: h?.to, changedAt: h?.changedAt ?? h?.at }))
  );

// PostgreSQL est sensible à la casse pour `contains` ; SQLite non
const caseInsensitive = process.env.DATABASE_URL?.startsWith('postgres')
  ? { mode: 'insensitive' as const }
  : {};

export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = CreateOrderSchema.parse(req.body);

    const order = await processOrderCreation({
      ...validated,
      userId: req.user?.id,
    });

    // Alerte admin + WhatsApp en arrière-plan : jamais attendue, ne fait jamais échouer la commande
    void notifyNewOrder((order as { id: string }).id);

    res.status(201).json({
      success: true,
      message: 'Commande enregistrée avec succès.',
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

export const getOrderById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: { image: true, slug: true },
            },
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Commande introuvable.',
      });
    }

    // Access control: only an admin or the order's owner may read the full record
    if (!req.user || (req.user.role !== 'ADMIN' && order.userId !== req.user.id)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Vous n’êtes pas autorisé à consulter cette commande.',
      });
    }

    const data =
      req.user.role === 'ADMIN' ? order : { ...order, statusHistory: publicHistory(order.statusHistory) };

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const getOrderByNumber = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderNumber } = req.params;

    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Aucune commande trouvée avec ce numéro.',
      });
    }

    // Return safe public tracking representation
    res.json({
      success: true,
      data: {
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: maskName(order.customerName),
        customerPhone: maskPhone(order.customerPhone),
        governorate: order.governorate,
        address: '••••••••', // hidden on the public tracking endpoint
        status: order.status,
        subtotalTND: order.subtotalTND,
        shippingTND: order.shippingTND,
        totalTND: order.totalTND,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
        itemsCount: order.items.length,
        items: order.items.map((i) => ({
          productName: i.productName,
          quantity: i.quantity,
          priceTND: i.priceTND,
          totalTND: i.totalTND,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
};

export const updateOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const validated = OrderStatusSchema.parse(req.body);
    const actor = req.user!;

    // Tout dans une transaction : contrôle de transition, historique, restitution du stock, audit
    const updated = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id }, include: { items: true } });
      if (!order) throw new AppError(404, 'NotFound', 'Commande introuvable.');
      if (order.archivedAt) {
        throw new AppError(
          409,
          'ArchivedOrder',
          'Cette commande est archivée. Restaurez-la avant de modifier son statut.'
        );
      }

      const statusChanged = validated.status !== order.status;
      if (statusChanged && !(ORDER_TRANSITIONS[order.status] ?? []).includes(validated.status)) {
        throw new AppError(
          409,
          'InvalidTransition',
          `Transition de statut interdite : ${order.status} → ${validated.status}.`
        );
      }

      const history = parseHistory(order.statusHistory);
      if (statusChanged) {
        history.push({
          from: order.status,
          to: validated.status,
          changedAt: new Date().toISOString(),
          changedBy: actor.name, // conservé pour l'affichage existant
          changedById: actor.id, // identifiant stable pour l'audit
        });
      }

      // Condition sur le statut lu : si un autre administrateur a modifié la commande entre-temps, count = 0
      const { count } = await tx.order.updateMany({
        where: { id, status: order.status, archivedAt: null },
        data: {
          status: validated.status,
          ...(validated.paymentStatus && { paymentStatus: validated.paymentStatus }),
          statusHistory: JSON.stringify(history),
        },
      });
      if (count === 0) {
        throw new AppError(409, 'Conflict', 'La commande vient d’être modifiée. Rechargez puis réessayez.');
      }

      if (statusChanged && validated.status === 'CANCELLED' && RESTOCK_ON_CANCEL) {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }

      await tx.adminAuditLog.create({
        data: {
          actorId: actor.id,
          action: 'ORDER_STATUS_UPDATE',
          targetType: 'ORDER',
          targetCount: 1,
          outcome: 'OK',
          details: JSON.stringify({
            orderId: id,
            from: order.status,
            to: validated.status,
            paymentStatus: validated.paymentStatus,
          }),
        },
      });

      return tx.order.findUnique({ where: { id }, include: { items: true } });
    });

    if (updated) {
      broadcast('order-updated', { id: updated.id, status: updated.status });
    }

    res.json({
      success: true,
      message: 'Statut de la commande mis à jour.',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

export const updateAdminOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = OrderUpdateSchema.parse(req.body);
    const updated = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: req.params.id } });
      if (!order) throw new AppError(404, 'NotFound', 'Commande introuvable.');
      if (order.archivedAt) {
        throw new AppError(409, 'ArchivedOrder', 'Restaurez cette commande avant de la modifier.');
      }

      const result = await tx.order.update({
        where: { id: order.id },
        data,
        include: { items: true },
      });
      await tx.adminAuditLog.create({
        data: {
          actorId: req.user!.id,
          action: 'ORDER_DETAILS_UPDATE',
          targetType: 'ORDER',
          targetCount: 1,
          outcome: 'SUCCESS',
          details: JSON.stringify({ orderId: order.id, fields: Object.keys(data) }),
        },
      });
      return result;
    });

    broadcast('order-updated', { id: updated.id, status: updated.status });
    res.json({ success: true, message: 'Commande mise à jour.', data: updated });
  } catch (err) {
    next(err);
  }
};

export const getAdminOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, search, fromDate, toDate, page = '1', limit = '20' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where: any = { archivedAt: null };

    if (typeof status === 'string' && status && status !== 'all') {
      const parsed = OrderStatusSchema.shape.status.safeParse(status);
      if (!parsed.success) throw new AppError(400, 'BadRequest', 'Statut de filtre invalide.');
      where.status = parsed.data;
    }

    if (fromDate || toDate) {
      const from = fromDate ? parseDate(fromDate) : undefined;
      const to = toDate ? parseDate(toDate, true) : undefined;
      if (from || to) {
        where.createdAt = {};
        if (from) where.createdAt.gte = from;
        if (to) where.createdAt.lte = to;
      }
    }

    if (typeof search === 'string' && search.trim()) {
      const q = search.trim().slice(0, 100);
      where.OR = [
        { orderNumber: { contains: q, ...caseInsensitive } },
        { customerName: { contains: q, ...caseInsensitive } },
        { customerPhone: { contains: q } },
        { customerEmail: { contains: q, ...caseInsensitive } },
      ];
    }

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
        include: {
          items: true,
        },
      }),
    ]);

    res.json({
      success: true,
      data: orders,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getAdminStats = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    // Chiffre d'affaires = commandes réellement encaissées/livrées (pas les commandes en attente ou annulées)
    const realizedWhere = {
      archivedAt: null,
      status: { not: 'CANCELLED' },
      OR: [{ paymentStatus: 'paid' }, { status: 'DELIVERED' }],
    };

    const [ordersCount, revenueAggregate, pendingAggregate, activeProducts, totalProducts, categoryCount, deliveredOrders, recentOrders] = await Promise.all([
      prisma.order.count({ where: { archivedAt: null } }),
      prisma.order.aggregate({ _sum: { totalTND: true }, where: realizedWhere }),
      prisma.order.aggregate({
        _sum: { totalTND: true },
        where: { archivedAt: null, status: { notIn: ['CANCELLED', 'DELIVERED'] }, paymentStatus: { not: 'paid' } },
      }),
      // Le seuil d'alerte est propre à chaque produit : Prisma ne compare pas deux colonnes, on filtre ici
      prisma.product.findMany({
        where: { isActive: true, deletedAt: null },
        select: { stock: true, lowStockThreshold: true },
      }),
      prisma.product.count(),
      prisma.category.count({ where: { isActive: true } }),
      prisma.order.count({ where: { archivedAt: null, status: 'DELIVERED' } }),
      prisma.order.findMany({
        where: { archivedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { items: true },
      }),
    ]);

    const round3 = (n: number | null | undefined) => Math.round((n || 0) * 1000) / 1000;

    res.json({
      success: true,
      data: {
        totalOrders: ordersCount,
        totalRevenue: round3(revenueAggregate._sum.totalTND),
        pendingRevenue: round3(pendingAggregate._sum.totalTND),
        totalProducts: activeProducts.length,
        catalogProducts: totalProducts,
        totalCategories: categoryCount,
        deliveredOrders,
        lowStockProducts: TRACK_STOCK
          ? activeProducts.filter((p) => p.stock <= p.lowStockThreshold).length
          : 0,
        recentOrders,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const deleteOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: req.params.id },
        select: { id: true, orderNumber: true },
      });
      if (!order) throw new AppError(404, 'NotFound', 'Commande introuvable.');

      await tx.adminAuditLog.create({
        data: {
          actorId: req.user!.id,
          action: 'ORDER_DELETE',
          targetType: 'ORDER',
          targetCount: 1,
          outcome: 'SUCCESS',
          details: JSON.stringify({ orderId: order.id, orderNumber: order.orderNumber }),
        },
      });
      await tx.order.delete({ where: { id: order.id } });
      return order;
    });

    broadcast('order-deleted', { id: deleted.id });
    return res.json({ success: true, message: 'Commande supprimée.', data: { id: deleted.id } });
  } catch (err) {
    next(err);
  }
};
