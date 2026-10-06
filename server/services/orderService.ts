import crypto from 'crypto';
import { prisma } from '../db/client';

export interface CreateOrderParams {
  userId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  governorate: string;
  delegation?: string | null;
  address: string;
  notes?: string | null;
  paymentMethod: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
}

export function calculateShipping(subtotal: number): number {
  const threshold = Number(process.env.FREE_SHIPPING_THRESHOLD_TND) || 300.0;
  const standardFee = Number(process.env.DEFAULT_SHIPPING_TND) || 7.0;
  return subtotal >= threshold ? 0.0 : standardFee;
}

export function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const randomPart = crypto.randomInt(10_000_000, 100_000_000); // 8 digits, unpredictable
  return `GSM-TN-${year}-${randomPart}`;
}

export async function processOrderCreation(params: CreateOrderParams) {
  // 1. Fetch all products from DB using their IDs
  const productIds = params.items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      isActive: true,
    },
  });

  if (products.length !== params.items.length) {
    const foundIds = new Set(products.map((p) => p.id));
    const missing = params.items.find((i) => !foundIds.has(i.productId));
    throw {
      status: 400,
      message: `Le produit sélectionné (${missing?.productId}) n'existe plus ou est désactivé.`,
    };
  }

  // 2. Map and check stock availability for every requested item
  const productMap = new Map(products.map((p) => [p.id, p]));
  const orderItemsData: Array<{
    productId: string;
    productName: string;
    priceTND: number;
    quantity: number;
    totalTND: number;
  }> = [];

  let subtotalTND = 0;

  for (const item of params.items) {
    const product = productMap.get(item.productId)!;

    if (product.stock < item.quantity) {
      throw {
        status: 400,
        message: `Stock insuffisant pour « ${product.name} ». Stock restant : ${product.stock} unité(s).`,
      };
    }

    const itemTotal = Math.round(product.priceTND * item.quantity * 1000) / 1000;
    subtotalTND += itemTotal;

    orderItemsData.push({
      productId: product.id,
      productName: product.name,
      priceTND: product.priceTND,
      quantity: item.quantity,
      totalTND: itemTotal,
    });
  }

  subtotalTND = Math.round(subtotalTND * 1000) / 1000;
  const shippingTND = calculateShipping(subtotalTND);
  const totalTND = Math.round((subtotalTND + shippingTND) * 1000) / 1000;
  const orderNumber = generateOrderNumber();

  // 3. Execute atomic transaction to reserve/decrement stock and persist Order & Items
  const createdOrder = await prisma.$transaction(async (tx) => {
    // Decrement stock for each item safely
    for (const item of params.items) {
      const updated = await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });

      if (updated.stock < 0) {
        throw new Error(`Concurrence de stock détectée pour ${updated.name}`);
      }
    }

    // Create the order with all items
    const order = await tx.order.create({
      data: {
        orderNumber,
        userId: params.userId || null,
        customerName: params.customerName.trim(),
        customerPhone: params.customerPhone.trim(),
        customerEmail: params.customerEmail ? params.customerEmail.trim() : null,
        governorate: params.governorate.trim(),
        delegation: params.delegation ? params.delegation.trim() : null,
        address: params.address.trim(),
        notes: params.notes ? params.notes.trim() : null,
        subtotalTND,
        shippingTND,
        totalTND,
        status: 'PENDING',
        paymentMethod: params.paymentMethod,
        paymentStatus: 'pending',
        items: {
          create: orderItemsData,
        },
      },
      include: {
        items: true,
      },
    });

    return order;
  });

  return createdOrder;
}
