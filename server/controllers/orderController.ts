import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/client';
import { CreateOrderSchema, OrderStatusSchema } from '../validators/schemas';
import { processOrderCreation } from '../services/orderService';

// The order number is a public tracking code, so never expose full personal data through it
const maskName = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0] + '*'.repeat(Math.max(part.length - 1, 1)))
    .join(' ');

const maskPhone = (phone: string): string =>
  phone.length > 4 ? '*'.repeat(phone.length - 4) + phone.slice(-4) : '****';

const parseDate = (value: unknown): Date | undefined => {
  const d = new Date(String(value));
  return isNaN(d.getTime()) ? undefined : d;
};

export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = CreateOrderSchema.parse(req.body);

    const order = await processOrderCreation({
      ...validated,
      userId: req.user?.id,
    });

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

    res.json({
      success: true,
      data: order,
    });
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

    const existingOrder = await prisma.order.findUnique({ where: { id } });
    if (!existingOrder) {
      return res.status(404).json({ error: 'NotFound', message: 'Commande introuvable.' });
    }

    let history: any[] = [];
    try {
      history = JSON.parse(existingOrder.statusHistory || '[]');
    } catch {
      history = [];
    }

    history.push({
      from: existingOrder.status,
      to: validated.status,
      changedAt: new Date().toISOString(),
      changedBy: (req as any).user?.name || 'Admin',
    });

    const updated = await prisma.order.update({
      where: { id },
      data: {
        status: validated.status,
        ...(validated.paymentStatus && { paymentStatus: validated.paymentStatus }),
        statusHistory: JSON.stringify(history),
      },
      include: {
        items: true,
      },
    });

    res.json({
      success: true,
      message: 'Statut de la commande mis à jour.',
      data: updated,
    });
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

    const where: any = {};

    if (status && status !== 'all') {
      where.status = String(status);
    }

    if (fromDate || toDate) {
      where.createdAt = {};
      const from = fromDate ? parseDate(fromDate) : undefined;
      const to = toDate ? parseDate(toDate) : undefined;
      if (from) where.createdAt.gte = from;
      if (to) where.createdAt.lte = to;
      if (!from && !to) delete where.createdAt;
    }

    if (search) {
      const q = String(search).trim();
      where.OR = [
        { orderNumber: { contains: q } },
        { customerName: { contains: q } },
        { customerPhone: { contains: q } },
        { customerEmail: { contains: q } },
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
    const [ordersCount, totalRevenueAggregate, productsCount, lowStockCount, recentOrders] =
      await Promise.all([
        prisma.order.count(),
        prisma.order.aggregate({
          _sum: { totalTND: true },
          where: { status: { not: 'CANCELLED' } },
        }),
        prisma.product.count({ where: { isActive: true } }),
        prisma.product.count({ where: { isActive: true, stock: { lte: 5 } } }),
        prisma.order.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: { items: true },
        }),
      ]);

    const totalRevenue = Math.round((totalRevenueAggregate._sum.totalTND || 0) * 1000) / 1000;

    res.json({
      success: true,
      data: {
        totalOrders: ordersCount,
        totalRevenue,
        totalProducts: productsCount,
        lowStockProducts: lowStockCount,
        recentOrders,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const deleteOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'NotFound', message: 'Commande introuvable.' });
    }

    // Delete associated order items first if not cascade
    await prisma.orderItem.deleteMany({ where: { orderId: id } });
    await prisma.order.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Commande supprimée avec succès.',
    });
  } catch (err) {
    next(err);
  }
};
