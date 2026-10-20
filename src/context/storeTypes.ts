import React from 'react';
import {
  CartItem,
  Category,
  Currency,
  FilterState,
  Language,
  Order,
  OrderStatus,
  Product,
  StoreSettings,
  User,
  Variant,
} from '../types';
import { TRANSLATIONS } from '../translations';

export type AppRoute =
  | 'home'
  | 'products'
  | 'product-detail'
  | 'category'
  | 'search'
  | 'cart'
  | 'checkout'
  | 'order-success'
  | 'track-order'
  | 'login'
  | 'register'
  | 'profile'
  | 'admin'
  | 'admin-login'
  | 'admin-products'
  | 'admin-categories'
  | 'admin-orders'
  | 'admin-users'
  | 'admin-media'
  | 'admin-settings'
  | 'not-found';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export interface RouteParams {
  productId?: string;
  productAction?: 'edit' | 'delete';
  productSlug?: string;
  categorySlug?: string;
  searchQuery?: string;
  orderNumber?: string;
}

export interface StoreContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  currency: Currency;
  setCurrency: (curr: Currency) => void;
  t: (typeof TRANSLATIONS)['fr'];
  formatPrice: (amount?: number | null) => string;
  getLocalizedName: (item: any) => string;
  getLocalizedDesc: (item: any) => string;
  getProductPrice: (product: Product) => number;
  currentRoute: AppRoute;
  routeParams: RouteParams;
  navigateTo: (route: AppRoute, params?: RouteParams) => void;
  settings: StoreSettings;
  isLoadingSettings: boolean;
  refetchSettings: () => Promise<void>;
  updateSettings: (data: Partial<StoreSettings>) => Promise<StoreSettings>;
  products: Product[];
  productsError: string | null;
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  categories: Category[];
  isLoadingProducts: boolean;
  isLoadingCategories: boolean;
  productPagination: { page: number; totalPages: number; total: number };
  setProductPage: (page: number) => void;
  refreshProducts: () => Promise<void>;
  refreshCategories: () => Promise<void>;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  resetFilters: () => void;
  filteredProducts: Product[];
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, variant?: Variant) => void;
  removeFromCart: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  shippingFee: number;
  freeShippingThreshold: number;
  cartTotal: number;
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  quickViewProduct: Product | null;
  setQuickViewProduct: (product: Product | null) => void;
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;
  isWishlistDrawerOpen: boolean;
  setIsWishlistDrawerOpen: (open: boolean) => void;
  user: User | null;
  isLoadingUser: boolean;
  logout: () => Promise<void>;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  refreshOrders: () => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  lastPlacedOrder: Order | null;
  createOrder: (orderData: any) => Promise<Order>;
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}
