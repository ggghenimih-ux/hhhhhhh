import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/client';
import { addStream, removeStream, broadcast } from '../services/notificationService';
import { sendAdminWhatsApp } from '../services/whatsappService';

// Flux temps réel (Server-Sent Events). Authentification par cookie (requireAdmin appliqué en amont).
export const streamNotifications = (req: Request, res: Response) => {
  if (!addStream(res)) {
    return res.status(503).json({
      error: 'ServiceUnavailable',
      message: 'Trop de connexions de notification ouvertes.',
    });
  }
  req.on('close', () => removeStream(res));
};

// Nombre de commandes à traiter (statut PENDING) + les plus récentes : sert de pastille et de rattrapage
export const getNotificationSummary = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const where = { status: 'PENDING', archivedAt: null };
    const [pending, latest] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, orderNumber: true, customerName: true, customerPhone: true, totalTND: true, createdAt: true },
      }),
    ]);
    res.json({ success: true, data: { pending, latest } });
  } catch (err) {
    next(err);
  }
};

// Bouton "Tester les notifications" : alerte en direct + message WhatsApp de test
export const sendTestNotification = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    broadcast('test', { at: new Date().toISOString() });
    const whatsapp = await sendAdminWhatsApp({
      text: '✅ Test de notification : la connexion WhatsApp de votre boutique fonctionne.',
      templateParams: ['TEST-0001', 'Client Test', '00000000', '0.000', 'Tunis'],
    });
    res.json({ success: true, whatsapp });
  } catch (err) {
    next(err);
  }
};
