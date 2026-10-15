import { FilterState, StoreSettings } from '../types';

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  id: 'default',
  storeName: 'Outils Réparation GSM Tunisie',
  storeDescription: 'N°1 en Outillage & Équipements de Réparation Smartphone en Tunisie. Stations de soudure, microscopes, programmeurs et pièces détachées.',
  logoUrl: '/logo.jpg',
  faviconUrl: '/logo.jpg',
  phone: '+216 26 383 876',
  whatsapp: '+216 26 383 876',
  email: 'contact@reparation-gsm.tn',
  address: 'Tunis,tunis',
  facebookUrl: 'https://facebook.com/outils.reparation.gsm',
  instagramUrl: 'https://instagram.com/outils.reparation.gsm',
  tiktokUrl: 'https://tiktok.com/@outilsreparationgsm',
  youtubeUrl: 'https://youtube.com/@outilsreparationgsm',
  workingHours: 'Mar - Dim: 08:00 - 18:00 | Lundi: Fermé',
  defaultShippingTND: 7.0,
  freeShippingThresholdTND: 300.0,
  currency: 'DT',
  primaryColor: '#ea580c',
  secondaryColor: '#0f172a',
  heroTitle: 'معدات وأدوات صيانة الهواتف الذكية للمحترفين',
  heroSubtitle: 'محطات لحام دقيقة، ميكروسكوبات ثلاثية العيون، مبرمجات سوفتوير، ومزودات طاقة أصلية مع توصيل سريع 24/48 ساعة وضمان حقيقي.',
  heroButtonText: 'عرض جميع المنتجات',
  heroButtonLink: 'products',
  heroImage: '/logo.jpg',
};

export const initialFilters: FilterState = {
  category: null,
  subcategory: null,
  brand: null,
  minPrice: 0,
  maxPrice: 2000,
  discountOnly: false,
  searchQuery: '',
  sortBy: 'popularity',
};
