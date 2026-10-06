export type Language = 'ar' | 'fr' | 'en';
export type Currency = 'TND' | 'EUR' | 'USD';

export interface Specification {
  brand?: string;
  model?: string;
  dimensions?: string;
  weight?: string;
  warranty?: string;
  voltage?: string;
  power?: string;
  compatibility?: string;
  temperature?: string;
  airflow?: string;
  display?: string;
  magnification?: string;
  [key: string]: any;
}

export interface Variant {
  id: string;
  name: string;
  value: string;
  priceAdjustment: number;
  stock?: number;
}

export interface Review {
  id: string;
  productId?: string;
  name?: string;
  rating: number; // 1-5
  comment: string;
  isApproved?: boolean;
  createdAt: string;
  userId?: string;
  userName?: string;
  userCity?: string;
  title?: string;
  helpful?: number;
}

export interface Product {
  id: string;
  sku?: string;
  name: string | { fr: string; ar: string; en: string };
  slug?: string;
  shortDescription?: string | { fr: string; ar: string; en: string };
  description: string | { fr: string; ar: string; en: string };
  priceTND?: number;
  price?: number; // fallback alias for priceTND
  compareAtPriceTND?: number | null;
  originalPrice?: number; // fallback alias for compareAtPriceTND
  discount?: number; // computed percentage
  category: string;
  subcategory?: string;
  image?: string;
  images: string[];
  stock: number;
  lowStockThreshold?: number;
  warranty?: string;
  rating: number;
  reviewsCount?: number;
  reviews?: Review[];
  isNew?: boolean;
  isFeatured?: boolean;
  isHot?: boolean;
  isActive?: boolean;
  specs?: Specification;
  specifications?: Specification;
  variants?: Variant[];
  tags?: string[];
  brand?: string;
  ordersCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface StoreSettings {
  id: string;
  storeName: string;
  storeDescription: string;
  logoUrl: string;
  faviconUrl: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  facebookUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  youtubeUrl: string;
  workingHours: string;
  defaultShippingTND: number;
  freeShippingThresholdTND: number;
  currency: string;
  primaryColor: string;
  secondaryColor: string;
  heroTitle: string;
  heroSubtitle: string;
  heroButtonText: string;
  heroButtonLink: string;
  heroImage: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string | { fr: string; ar: string; en: string };
  slug: string;
  description?: string | null | { fr: string; ar: string; en: string };
  image?: string | null;
  isActive?: boolean;
  iconName?: string;
  order?: number;
  subcategories?: Subcategory[];
}

export interface Subcategory {
  id: string;
  categoryId: string;
  name: string | { fr: string; ar: string; en: string };
  slug: string;
  image?: string;
  order?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariant?: Variant;
}

export interface Address {
  id?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  secondaryPhone?: string;
  governorate: string; // Tunisian Governorate (Wilaya)
  delegation?: string;
  city?: string;
  postalCode?: string;
  street?: string;
  notes?: string;
}

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'completed' | 'failed';
export type PaymentMethod = 'cod' | 'bank_transfer' | 'credit_card' | 'online' | string;

export interface OrderItem {
  id?: string;
  productId: string;
  productName?: string;
  name?: string;
  image?: string;
  sku?: string;
  priceTND?: number;
  price?: number;
  quantity: number;
  totalTND?: number;
  variant?: Variant;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. "GSM-TN-2024-1082"
  userId?: string | null;
  customerName: string;
  customerEmail?: string | null;
  customerPhone: string;
  governorate?: string;
  delegation?: string | null;
  address?: string;
  shippingAddress?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    governorate?: string;
    city?: string;
    street?: string;
    postalCode?: string;
    [key: string]: any;
  };
  notes?: string | null;
  subtotalTND?: number;
  shippingTND?: number;
  totalTND?: number;
  // Aliases for compatibility
  subtotal?: number;
  shippingCost?: number;
  tax?: number;
  discountAmount?: number;
  couponCode?: string;
  totalPrice?: number;
  status?: OrderStatus;
  orderStatus?: OrderStatus;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  items: OrderItem[];
  trackingNumber?: string;
  carrierName?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone: string;
  role?: 'CUSTOMER' | 'ADMIN';
  isAdmin?: boolean;
  avatar?: string;
  addresses?: any[];
  createdAt?: string;
  updatedAt?: string;
}

export interface FilterState {
  category: string | null;
  subcategory?: string | null;
  brand: string | null;
  minPrice: number;
  maxPrice: number;
  inStockOnly: boolean;
  discountOnly: boolean;
  searchQuery: string;
  sortBy: 'popularity' | 'price-asc' | 'price-desc' | 'rating' | 'newest';
}
