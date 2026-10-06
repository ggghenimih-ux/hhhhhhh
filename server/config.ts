/**
 * Configuration file for "Outils Réparation GSM" Platform (goods.tn style)
 * Configures DB, Currency, Tunisian Shipping Rates, Governorates, Payment & Store Info
 */

export const CONFIG = {
  // App & Environment
  APP_NAME: "Outils Réparation GSM",
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  // NOTE: this file is also bundled into the browser (imported by React components).
  // Never put secrets (JWT secret, DB URLs, API keys) here.

  // Store Contact & Location (Based in Tunisia)
  STORE: {
    name: "Outils Réparation GSM",
    domain: "goods.tn",
    phones: ["+216 26 383 876", "+216 26 383 876"],
    email: "contact@outils-reparation-gsm.tn",
    address: {
      street: "Tunis,tunis",
      city: "Tunis",
      postalCode: "1000",
      country: "Tunisie"
    },
    workingHours: {
      schedule: "Mardi - Dimanche : 08:00 - 16:00 (Lundi : Fermé)",
      scheduleAr: "الثلاثاء - الأحد: 08:00 - 16:00 (الاثنين: مغلق)",
      daysOpen: "Tue-Sun 08:00-16:00",
      closed: "Monday / الإثنين"
    }
  },

  // Currency & Financials
  FINANCIAL: {
    defaultCurrency: "TND", // Dinar Tunisien
    currencySymbol: "DT",
    currencySymbolAr: "د.ت",
    vatRate: 0.19, // 19% TVA
    freeShippingThreshold: 300, // Free shipping in Tunisia for orders above 300 TND
    exchangeRates: {
      TND: 1.0,
      EUR: 0.30,
      USD: 0.32
    }
  },

  // Tunisian Governorates (24 Wilayas) & Standard Shipping Fees
  SHIPPING: {
    standardRate: 7.000, // 7 TND
    expressRate: 10.000, // 10 TND (Aramex / Rapid-Poste)
    inStorePickupFee: 0,
    governorates: [
      { id: "tunis", nameFr: "Tunis", nameAr: "تونس", fee: 6.000 },
      { id: "ariana", nameFr: "Ariana", nameAr: "أريانة", fee: 6.000 },
      { id: "ben_arous", nameFr: "Ben Arous", nameAr: "بن عروس", fee: 6.000 },
      { id: "manouba", nameFr: "La Manouba", nameAr: "منوبة", fee: 6.000 },
      { id: "nabeul", nameFr: "Nabeul", nameAr: "نابل", fee: 7.000 },
      { id: "zaghouan", nameFr: "Zaghouan", nameAr: "زغوان", fee: 7.000 },
      { id: "bizerte", nameFr: "Bizerte", nameAr: "بنزرت", fee: 7.000 },
      { id: "beja", nameFr: "Béja", nameAr: "باجة", fee: 8.000 },
      { id: "jendouba", nameFr: "Jendouba", nameAr: "جندوبة", fee: 8.000 },
      { id: "le_kef", nameFr: "Le Kef", nameAr: "الكاف", fee: 8.000 },
      { id: "siliana", nameFr: "Siliana", nameAr: "سليانة", fee: 8.000 },
      { id: "sousse", nameFr: "Sousse", nameAr: "سوسة", fee: 7.000 },
      { id: "monastir", nameFr: "Monastir", nameAr: "المنستير", fee: 7.000 },
      { id: "mahdia", nameFr: "Mahdia", nameAr: "المهدية", fee: 7.000 },
      { id: "sfax", nameFr: "Sfax", nameAr: "صفاقس", fee: 7.000 },
      { id: "kairouan", nameFr: "Kairouan", nameAr: "القيروان", fee: 8.000 },
      { id: "kasserine", nameFr: "Kasserine", nameAr: "القصرين", fee: 9.000 },
      { id: "sidi_bouzid", nameFr: "Sidi Bouzid", nameAr: "سيدي بوزيد", fee: 9.000 },
      { id: "gabes", nameFr: "Gabès", nameAr: "قابس", fee: 8.000 },
      { id: "medenine", nameFr: "Médenine", nameAr: "مدنين", fee: 9.000 },
      { id: "tataouine", nameFr: "Tataouine", nameAr: "تطاوين", fee: 10.000 },
      { id: "gafsa", nameFr: "Gafsa", nameAr: "قفصة", fee: 9.000 },
      { id: "tozeur", nameFr: "Tozeur", nameAr: "توزر", fee: 10.000 },
      { id: "kebili", nameFr: "Kébili", nameAr: "قبلي", fee: 10.000 }
    ]
  },

  // Payment Gateways
  PAYMENT: {
    methods: {
      cod: {
        id: "cod",
        nameFr: "Paiement à la livraison (Espèces)",
        nameAr: "الدفع عند الاستلام (نقداً)",
        nameEn: "Cash on Delivery",
        enabled: true
      },
      credit_card: {
        id: "credit_card",
        nameFr: "Carte Bancaire Tunisienne (ClicToPay / GIM-TEL)",
        nameAr: "بطاقة بنكية تونسية",
        nameEn: "Tunisian Bank Card",
        enabled: true
      },
      bank_transfer: {
        id: "bank_transfer",
        nameFr: "Virement Bancaire / Poste Tunisienne (RIB)",
        nameAr: "تحويل بنكي أو بريدي",
        nameEn: "Bank Wire Transfer",
        rib: "TN59 08 000 001234567890 42 (BIAT / Poste)",
        enabled: true
      },
      stripe: {
        id: "stripe",
        nameFr: "Stripe (International)",
        nameAr: "بطاقة دولية Stripe",
        nameEn: "Stripe International",
        enabled: true,
        publishableKey: "pk_test_mock_stripe_key"
      },
      paypal: {
        id: "paypal",
        nameFr: "PayPal",
        nameAr: "باي بال",
        nameEn: "PayPal",
        enabled: true
      }
    }
  },

};

export default CONFIG;
