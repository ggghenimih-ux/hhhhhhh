/**
 * Public (browser-safe) configuration for the "Outils Réparation GSM" storefront.
 *
 * SECURITY: this module is bundled into the browser. It must never contain
 * secrets (JWT secrets, DB URLs, Stripe/Cloudinary/AWS keys). Those live only
 * on the server, read from environment variables.
 */

const getEnv = (key: string, defaultValue = ''): string => {
  try {
    const v = (import.meta as any)?.env?.[`VITE_${key}`];
    return v !== undefined ? String(v) : defaultValue;
  } catch {
    return defaultValue;
  }
};

export const STORE_CONFIG = {
  name: 'Outils Réparation GSM',
  domain: 'goods.tn',
  email: getEnv('STORE_EMAIL', 'contact@outils-reparation-gsm.tn'),
  workingHours: {
    scheduleFr: 'Mardi - Dimanche : 08:00 - 16:00 (Lundi : Fermé)',
    scheduleAr: 'الثلاثاء - الأحد: 08:00 - 16:00 (الاثنين: مغلق)',
    scheduleEn: 'Tue - Sun: 08:00 - 16:00 (Monday: Closed)',
  },
  address: {
    street: 'Tunis,tunis',
    city: 'Tunis',
    postalCode: '1000',
    country: 'Tunisie',
  },
  financial: {
    currency: 'TND',
    currencySymbol: 'DT',
    currencySymbolAr: 'د.ت',
    vatRate: 0.19, // 19% TVA
  },
  // Tunisian Governorates (24 Wilayas)
  governorates: [
    { id: 'tunis', nameFr: 'Tunis', nameAr: 'تونس' },
    { id: 'ariana', nameFr: 'Ariana', nameAr: 'أريانة' },
    { id: 'ben_arous', nameFr: 'Ben Arous', nameAr: 'بن عروس' },
    { id: 'manouba', nameFr: 'La Manouba', nameAr: 'منوبة' },
    { id: 'nabeul', nameFr: 'Nabeul', nameAr: 'نابل' },
    { id: 'zaghouan', nameFr: 'Zaghouan', nameAr: 'زغوان' },
    { id: 'bizerte', nameFr: 'Bizerte', nameAr: 'بنزرت' },
    { id: 'beja', nameFr: 'Béja', nameAr: 'باجة' },
    { id: 'jendouba', nameFr: 'Jendouba', nameAr: 'جندوبة' },
    { id: 'le_kef', nameFr: 'Le Kef', nameAr: 'الكاف' },
    { id: 'siliana', nameFr: 'Siliana', nameAr: 'سليانة' },
    { id: 'sousse', nameFr: 'Sousse', nameAr: 'سوسة' },
    { id: 'monastir', nameFr: 'Monastir', nameAr: 'المنستير' },
    { id: 'mahdia', nameFr: 'Mahdia', nameAr: 'المهدية' },
    { id: 'sfax', nameFr: 'Sfax', nameAr: 'صفاقس' },
    { id: 'kairouan', nameFr: 'Kairouan', nameAr: 'القيروان' },
    { id: 'kasserine', nameFr: 'Kasserine', nameAr: 'القصرين' },
    { id: 'sidi_bouzid', nameFr: 'Sidi Bouzid', nameAr: 'سيدي بوزيد' },
    { id: 'gabes', nameFr: 'Gabès', nameAr: 'قابس' },
    { id: 'medenine', nameFr: 'Médenine', nameAr: 'مدنين' },
    { id: 'tataouine', nameFr: 'Tataouine', nameAr: 'تطاوين' },
    { id: 'gafsa', nameFr: 'Gafsa', nameAr: 'قفصة' },
    { id: 'tozeur', nameFr: 'Tozeur', nameAr: 'توزر' },
    { id: 'kebili', nameFr: 'Kébili', nameAr: 'قبلي' },
  ],
  // Supported payment methods
  paymentMethods: [
    { id: 'cod', nameFr: 'Paiement à la livraison (Espèces)', nameAr: 'الدفع عند الاستلام', enabled: true },
    { id: 'credit_card', nameFr: 'Carte Bancaire (ClicToPay)', nameAr: 'بطاقة بنكية تونسية', enabled: true },
    { id: 'bank_transfer', nameFr: 'Virement Bancaire (RIB BIAT/Poste)', nameAr: 'تحويل بنكي أو بريدي', enabled: true },
    { id: 'stripe', nameFr: 'Stripe International', nameAr: 'بطاقة دولية Stripe', enabled: true },
    { id: 'paypal', nameFr: 'PayPal', nameAr: 'باي بال', enabled: true },
  ],
};

export const CONFIG = {
  store: STORE_CONFIG,
};

export default CONFIG;
