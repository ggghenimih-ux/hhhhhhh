import type { Prisma } from '@prisma/client';

type OrderWithItems = Prisma.OrderGetPayload<{ include: { items: true } }>;

export interface WhatsAppResult {
  ok: boolean;
  provider: string;
  detail?: string;
  retryable?: boolean;
}

const getProvider = () => (process.env.WHATSAPP_PROVIDER || 'none').trim().toLowerCase();

/** "26 383 876", "+216 26 383 876", "00216..." → "21626383876" (format international sans +). */
export function normalizeWhatsAppNumber(raw: string | undefined): string | null {
  const digits = (raw ?? '').replace(/\D/g, '').replace(/^00/, '');
  if (/^[24579]\d{7}$/.test(digits)) return `216${digits}`;
  return /^\d{10,15}$/.test(digits) ? digits : null;
}

// Les champs viennent du client : on retire les caractères de contrôle et on limite la longueur
const clean = (value: unknown, max = 200): string =>
  String(value ?? '')
    .replace(/[\u0000-\u001f\u007f]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, max);

const money = (n: number | null | undefined) => (Number(n) || 0).toFixed(3);

export function buildOrderMessage(order: OrderWithItems): { text: string; templateParams: string[] } {
  const lines = order.items
    .slice(0, 15)
    .map((i) => `• ${i.quantity} × ${clean(i.productName, 80)}`);
  if (order.items.length > 15) lines.push(`… +${order.items.length - 15} autre(s) article(s)`);

  const place = [clean(order.governorate, 60), clean(order.delegation, 60)].filter(Boolean).join(' / ');

  const text = [
    `🛒 *Nouvelle commande ${clean(order.orderNumber, 40)}*`,
    `👤 ${clean(order.customerName, 100)}`,
    `📞 ${clean(order.customerPhone, 30)}`,
    `📍 ${place}`,
    clean(order.address, 200) ? `🏠 ${clean(order.address, 200)}` : '',
    '',
    ...lines,
    '',
    `🚚 Livraison : ${money(order.shippingTND)} DT`,
    `💰 *Total : ${money(order.totalTND)} DT* (${clean(order.paymentMethod, 30)})`,
    order.notes ? `📝 ${clean(order.notes, 200)}` : '',
    process.env.ADMIN_URL ? `🔗 ${clean(process.env.ADMIN_URL, 200)}` : '',
  ]
    .filter((l, i, arr) => l !== '' || (arr[i - 1] !== '' && i !== 0))
    .join('\n')
    .trim();

  // Variables du modèle (template) Meta : {{1}} n° commande, {{2}} nom, {{3}} téléphone, {{4}} total, {{5}} gouvernorat
  const templateParams = [
    clean(order.orderNumber, 40),
    clean(order.customerName, 100),
    clean(order.customerPhone, 30),
    money(order.totalTND),
    clean(order.governorate, 60) || '-',
  ];

  return { text, templateParams };
}

async function fetchWithTimeout(url: string, init: RequestInit = {}, ms = 8000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function sendCloud(to: string, text: string, templateParams: string[]): Promise<WhatsAppResult> {
  const token = process.env.WHATSAPP_TOKEN?.trim();
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  if (!token || !phoneId) {
    return { ok: false, provider: 'cloud', detail: 'WHATSAPP_TOKEN ou WHATSAPP_PHONE_NUMBER_ID manquant.' };
  }

  const version = process.env.WHATSAPP_API_VERSION?.trim() || 'v23.0';
  const template = process.env.WHATSAPP_TEMPLATE_NAME?.trim();

  // Hors fenêtre de 24 h, WhatsApp n'accepte qu'un MODÈLE approuvé ; un simple texte n'est livré
  // que si vous avez écrit au numéro professionnel dans les dernières 24 h.
  const body = template
    ? {
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: template,
          language: { code: process.env.WHATSAPP_TEMPLATE_LANG?.trim() || 'fr' },
          components: [
            {
              type: 'body',
              parameters: templateParams.map((t) => ({ type: 'text', text: t.replace(/\s+/g, ' ') })),
            },
          ],
        },
      }
    : { messaging_product: 'whatsapp', to, type: 'text', text: { body: text, preview_url: false } };

  const res = await fetchWithTimeout(`https://graph.facebook.com/${version}/${phoneId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (res.ok) return { ok: true, provider: 'cloud' };
  const err: any = await res.json().catch(() => null);
  return {
    ok: false,
    provider: 'cloud',
    detail: `HTTP ${res.status} : ${err?.error?.message ?? 'erreur inconnue'}`,
    retryable: res.status >= 500 || res.status === 429,
  };
}

async function sendCallMeBot(to: string, text: string): Promise<WhatsAppResult> {
  const apiKey = process.env.CALLMEBOT_API_KEY?.trim();
  if (!apiKey) return { ok: false, provider: 'callmebot', detail: 'CALLMEBOT_API_KEY manquant.' };

  const url =
    'https://api.callmebot.com/whatsapp.php' +
    `?phone=${encodeURIComponent('+' + to)}&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(apiKey)}`;
  const res = await fetchWithTimeout(url);
  if (res.ok) return { ok: true, provider: 'callmebot' };
  return { ok: false, provider: 'callmebot', detail: `HTTP ${res.status}`, retryable: res.status >= 500 };
}

async function attempt(text: string, templateParams: string[]): Promise<WhatsAppResult> {
  const provider = getProvider();
  if (provider === 'none') {
    return { ok: false, provider, detail: 'WHATSAPP_PROVIDER non configuré (none).' };
  }
  const to = normalizeWhatsAppNumber(process.env.ADMIN_WHATSAPP_NUMBER);
  if (!to) return { ok: false, provider, detail: 'ADMIN_WHATSAPP_NUMBER absent ou invalide.' };

  try {
    if (provider === 'cloud') return await sendCloud(to, text, templateParams);
    if (provider === 'callmebot') return await sendCallMeBot(to, text);
    return { ok: false, provider, detail: `Fournisseur inconnu : ${provider}` };
  } catch (err) {
    return { ok: false, provider, detail: (err as Error).message, retryable: true };
  }
}

/** Envoie un message au WhatsApp de l'administrateur. Ne lève jamais d'exception. */
export async function sendAdminWhatsApp(msg: { text: string; templateParams: string[] }): Promise<WhatsAppResult> {
  let result = await attempt(msg.text, msg.templateParams);
  if (!result.ok && result.retryable) {
    await new Promise((r) => setTimeout(r, 1500));
    result = await attempt(msg.text, msg.templateParams);
  }
  return result;
}

export async function sendWhatsAppNewOrder(order: OrderWithItems): Promise<WhatsAppResult> {
  const result = await sendAdminWhatsApp(buildOrderMessage(order));
  if (!result.ok && result.provider !== 'none') {
    console.error(`[WHATSAPP] Échec d'envoi (commande ${order.orderNumber}) :`, result.detail);
  }
  return result;
}
