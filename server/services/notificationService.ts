import type { Response } from 'express';
import type { Prisma } from '@prisma/client';
import { prisma } from '../db/client';
import { sendWhatsAppNewOrder } from './whatsappService';

type OrderWithItems = Prisma.OrderGetPayload<{ include: { items: true } }>;

// Connexions SSE des administrateurs (stockage en mémoire : une seule instance du serveur)
const MAX_CLIENTS = 20;
const clients = new Set<Response>();
let heartbeat: NodeJS.Timeout | undefined;

function startHeartbeat() {
  if (heartbeat) return;
  // Un commentaire SSE toutes les 25 s empêche les proxys de couper la connexion inactive
  heartbeat = setInterval(() => {
    for (const res of clients) safeWrite(res, ': ping\n\n');
  }, 25_000);
  heartbeat.unref();
}

function stopHeartbeatIfIdle() {
  if (clients.size === 0 && heartbeat) {
    clearInterval(heartbeat);
    heartbeat = undefined;
  }
}

function safeWrite(res: Response, chunk: string) {
  try {
    res.write(chunk);
  } catch {
    clients.delete(res);
  }
}

export function addStream(res: Response): boolean {
  if (clients.size >= MAX_CLIENTS) return false;

  res.status(200).set({
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no', // Nginx : ne pas mettre la réponse en mémoire tampon
  });
  res.flushHeaders();
  res.write('retry: 5000\n\nevent: ready\ndata: {}\n\n');

  clients.add(res);
  startHeartbeat();
  return true;
}

export function removeStream(res: Response) {
  clients.delete(res);
  stopHeartbeatIfIdle();
}

export function broadcast(event: string, data: unknown) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of clients) safeWrite(res, payload);
}

/** Fermeture propre à l'arrêt du serveur (sinon les connexions SSE bloquent server.close()). */
export function closeAllStreams() {
  for (const res of clients) {
    try {
      res.end();
    } catch {
      /* déjà fermée */
    }
  }
  clients.clear();
  stopHeartbeatIfIdle();
}

const toEventPayload = (o: OrderWithItems) => ({
  id: o.id,
  orderNumber: o.orderNumber,
  customerName: o.customerName,
  customerPhone: o.customerPhone,
  governorate: o.governorate,
  totalTND: o.totalTND,
  itemsCount: o.items.reduce((sum, i) => sum + i.quantity, 0),
  createdAt: o.createdAt,
});

/**
 * Appelée après la création d'une commande : alerte en direct dans l'admin + message WhatsApp.
 * Ne lève jamais d'exception et n'est jamais attendue : un problème de notification ne doit
 * en aucun cas faire échouer ou ralentir la commande du client.
 */
export async function notifyNewOrder(orderId: string): Promise<void> {
  try {
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) return;

    broadcast('new-order', toEventPayload(order));
    await sendWhatsAppNewOrder(order);
  } catch (err) {
    console.error('[NOTIFY] Échec de la notification de commande :', err);
  }
}
