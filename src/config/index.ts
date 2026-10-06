/**
 * Public (browser-safe) configuration for the "Outils Réparation GSM" storefront.
 *
 * SECURITY: this module is bundled into the browser. It must never contain
 * secrets (JWT secrets, DB URLs, Stripe/Cloudinary/AWS keys). Those live only
 * on the server, read from environment variables.
 */

const getEnvNumber = (key: string, defaultValue: number): number => {
  try {
    const v = (import.meta as any)?.env?.[`VITE_${key}`];
    const n = v !== undefined ? Number(v) : NaN;
    return Number.isFinite(n) ? n : defaultValue;
  } catch {
    return defaultValue;
  }
};

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
  phones: [
    getEnv('STORE_PHONE_PRIMARY', '+216 26 383 876'),
    getEnv('STORE_PHONE_SECONDARY', '+216 26 383 876'),
  ],
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
    freeShippingThreshold: getEnvNumber('FREE_SHIPPING_THRESHOLD', 300), // Free shipping above 300 DT
    standardShippingFee: getEnvNumber('STANDARD_SHIPPING_FEE', 7.0),
    expressShippingFee: getEnvNumber('EXPRESS_SHIPPING_FEE', 10.0),
  },
  // Tunisian Governorates (24 Wilayas)
  governorates: [
    { id: 'tunis', nameFr: 'Tunis', nameAr: 'تونس', fee: 6.0 },
    { id: 'ariana', nameFr: 'Ariana', nameAr: 'أريانة', fee: 6.0 },
    { id: 'ben_arous', nameFr: 'Ben Arous', nameAr: 'بن عروس', fee: 6.0 },
    { id: 'manouba', nameFr: 'La Manouba', nameAr: 'منوبة', fee: 6.0 },
    { id: 'nabeul', nameFr: 'Nabeul', nameAr: 'نابل', fee: 7.0 },
    { id: 'zaghouan', nameFr: 'Zaghouan', nameAr: 'زغوان', fee: 7.0 },
    { id: 'bizerte', nameFr: 'Bizerte', nameAr: 'بنزرت', fee: 7.0 },
    { id: 'beja', nameFr: 'Béja', nameAr: 'باجة', fee: 8.0 },
    { id: 'jendouba', nameFr: 'Jendouba', nameAr: 'جندوبة', fee: 8.0 },
    { id: 'le_kef', nameFr: 'Le Kef', nameAr: 'الكاف', fee: 8.0 },
    { id: 'siliana', nameFr: 'Siliana', nameAr: 'سليانة', fee: 8.0 },
    { id: 'sousse', nameFr: 'Sousse', nameAr: 'سوسة', fee: 7.0 },
    { id: 'monastir', nameFr: 'Monastir', nameAr: 'المنستير', fee: 7.0 },
    { id: 'mahdia', nameFr: 'Mahdia', nameAr: 'المهدية', fee: 7.0 },
    { id: 'sfax', nameFr: 'Sfax', nameAr: 'صفاقس', fee: 7.0 },
    { id: 'kairouan', nameFr: 'Kairouan', nameAr: 'القيروان', fee: 8.0 },
    { id: 'kasserine', nameFr: 'Kasserine', nameAr: 'القصرين', fee: 9.0 },
    { id: 'sidi_bouzid', nameFr: 'Sidi Bouzid', nameAr: 'سيدي بوزيد', fee: 9.0 },
    { id: 'gabes', nameFr: 'Gabès', nameAr: 'قابس', fee: 8.0 },
    { id: 'medenine', nameFr: 'Médenine', nameAr: 'مدنين', fee: 9.0 },
    { id: 'tataouine', nameFr: 'Tataouine', nameAr: 'تطاوين', fee: 10.0 },
    { id: 'gafsa', nameFr: 'Gafsa', nameAr: 'قفصة', fee: 9.0 },
    { id: 'tozeur', nameFr: 'Tozeur', nameAr: 'توزر', fee: 10.0 },
    { id: 'kebili', nameFr: 'Kébili', nameAr: 'قبلي', fee: 10.0 },
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
