/** Lien WhatsApp "cliquer pour discuter" vers un client tunisien. */
export function whatsappLink(phone: string, message?: string): string {
  const digits = phone.replace(/\D/g, '').replace(/^00/, '');
  const full = /^[24579]\d{7}$/.test(digits) ? `216${digits}` : digits;
  const text = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${full}${text}`;
}

export const orderConfirmationMessage = (name: string, orderNumber: string): string =>
  `Bonjour ${name}, nous avons bien reçu votre commande ${orderNumber}. Nous allons la confirmer très bientôt. Merci de votre confiance !`;
