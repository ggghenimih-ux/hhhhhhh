import { getApp, getApps, initializeApp } from 'firebase-admin/app';
import { DocumentData, getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

const app = getApps().length ? getApp() : initializeApp();
const db = getFirestore(app);
const maxOrderItems = 30;

type RequestedItem = {
  productId: string;
  quantity: number;
};

type CreateOrderInput = {
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  governorate: string;
  delegation?: string | null;
  address: string;
  notes?: string | null;
  couponCode?: string | null;
  paymentMethod: 'cod' | 'bank_transfer';
  items: RequestedItem[];
  requestId?: string;
};

const roundTnd = (amount: number) => Math.round((amount + Number.EPSILON) * 1000) / 1000;

const requiredText = (value: unknown, label: string, maxLength: number) => {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > maxLength) {
    throw new HttpsError('invalid-argument', `Champ invalide : ${label}.`);
  }
  return value.trim();
};

export const createOrder = onCall(
  { region: 'europe-west1' },
  async (request): Promise<{ success: true; data: Record<string, unknown> }> => {
    const input = request.data as Partial<CreateOrderInput> | null;
    if (!input || !Array.isArray(input.items) || input.items.length === 0 || input.items.length > maxOrderItems) {
      throw new HttpsError('invalid-argument', 'La commande doit contenir entre 1 et 30 lignes.');
    }

    const customerName = requiredText(input.customerName, 'nom', 120);
    const customerPhone = requiredText(input.customerPhone, 'téléphone', 8);
    if (!/^[24579]\d{7}$/.test(customerPhone)) {
      throw new HttpsError('invalid-argument', 'Le numéro de téléphone tunisien est invalide.');
    }
    const governorate = requiredText(input.governorate, 'gouvernorat', 120);
    const address = requiredText(input.address, 'adresse', 500);
    const paymentMethod = input.paymentMethod;
    if (paymentMethod !== 'cod' && paymentMethod !== 'bank_transfer') {
      throw new HttpsError('invalid-argument', 'Le mode de paiement est invalide.');
    }

    const requestedItems = input.items.map((item) => {
      if (
        !item
        || typeof item.productId !== 'string'
        || !item.productId.trim()
        || !Number.isSafeInteger(item.quantity)
        || item.quantity < 1
      ) {
        throw new HttpsError('invalid-argument', 'Une ligne de commande est invalide.');
      }
      return { productId: item.productId.trim(), quantity: item.quantity };
    });

    const productIds = [...new Set(requestedItems.map(({ productId }) => productId))];
    const productRefs = productIds.map((id) => db.collection('products').doc(id));
    const settingsRef = db.collection('settings').doc('store');
    const requestId = typeof input.requestId === 'string'
      && /^[A-Za-z0-9_-]{20,64}$/.test(input.requestId)
      ? input.requestId
      : undefined;
    const orderRef = requestId
      ? db.collection('orders').doc(requestId)
      : db.collection('orders').doc();
    const createdAt = new Date().toISOString();
    const orderNumber = `GSM-TN-${new Date().getFullYear()}-${orderRef.id.slice(-8).toUpperCase()}`;

    const order = await db.runTransaction(async (transaction) => {
      const settingsSnapshot = await transaction.get(settingsRef);
      const productSnapshots = [];
      for (const productRef of productRefs) productSnapshots.push(await transaction.get(productRef));
      const existingOrder = await transaction.get(orderRef);

      if (existingOrder.exists) {
        const existingData = existingOrder.data()!;
        if ((existingData.userId ?? null) !== (request.auth?.uid ?? null)) {
          throw new HttpsError('already-exists', 'Cet identifiant de commande est déjà utilisé.');
        }
        return existingData;
      }

      const productsById = new Map<string, FirebaseFirestore.DocumentData>();
      productSnapshots.forEach((snapshot) => {
        if (!snapshot.exists) throw new HttpsError('not-found', 'Un produit de la commande n’existe plus.');
        const product = snapshot.data()!;
        if (product.isActive === false) {
          throw new HttpsError('failed-precondition', 'Un produit de la commande n’est plus disponible.');
        }
        productsById.set(snapshot.id, product);
      });

      const items = requestedItems.map(({ productId, quantity }) => {
        const product = productsById.get(productId);
        if (!product) throw new HttpsError('not-found', 'Un produit de la commande est introuvable.');
        const priceTND = Number(product.priceTND ?? product.price);
        if (!Number.isFinite(priceTND) || priceTND < 0) {
          throw new HttpsError('failed-precondition', 'Le prix d’un produit est invalide.');
        }
        return {
          productId,
          productName: typeof product.name === 'string' ? product.name : product.name?.fr ?? '',
          name: typeof product.name === 'string' ? product.name : product.name?.fr ?? '',
          image: product.image ?? '',
          sku: product.sku ?? '',
          priceTND,
          quantity,
          totalTND: roundTnd(priceTND * quantity),
        };
      });
      const subtotalTND = roundTnd(items.reduce((total, item) => total + item.totalTND, 0));
      const settings = settingsSnapshot.exists ? settingsSnapshot.data()! : {};
      const freeShippingThresholdTND = Number(settings.freeShippingThresholdTND ?? 300);
      const defaultShippingTND = Number(settings.defaultShippingTND ?? 7);
      if (!Number.isFinite(freeShippingThresholdTND) || freeShippingThresholdTND < 0
        || !Number.isFinite(defaultShippingTND) || defaultShippingTND < 0) {
        throw new HttpsError('failed-precondition', 'Les paramètres de livraison sont invalides.');
      }
      const shippingTND = subtotalTND >= freeShippingThresholdTND ? 0 : defaultShippingTND;
      const couponCode = input.couponCode === 'GSM10' ? 'GSM10' : null;
      const discountAmount = couponCode ? roundTnd(subtotalTND * 0.1) : 0;
      const totalTND = roundTnd(subtotalTND - discountAmount + shippingTND);
      const userId = request.auth?.uid ?? null;

      const data: DocumentData = {
        id: orderRef.id,
        trackingToken: orderRef.id,
        orderNumber,
        userId,
        customerName,
        customerPhone,
        customerEmail: typeof input.customerEmail === 'string' ? input.customerEmail.trim() : null,
        governorate,
        delegation: typeof input.delegation === 'string' ? input.delegation.trim() : null,
        address,
        notes: typeof input.notes === 'string' ? input.notes.trim() : null,
        couponCode,
        paymentMethod,
        items,
        subtotalTND,
        subtotal: subtotalTND,
        shippingTND,
        shippingCost: shippingTND,
        discountAmount,
        totalTND,
        totalPrice: totalTND,
        status: 'PENDING',
        orderStatus: 'PENDING',
        paymentStatus: 'pending',
        createdAt,
        updatedAt: createdAt,
      };
      transaction.create(orderRef, data);
      return data;
    });

    return { success: true, data: order };
  },
);
