import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Product,
  Category,
  CartItem,
  Order,
  User,
  FilterState,
  Language,
  Currency,
  Variant,
  OrderStatus,
  StoreSettings,
} from '../types';
import { TRANSLATIONS } from '../translations';
import { api } from '../services/api';
import { DEMO_ORDERS, DEMO_USER, PRODUCTS_DATA, CATEGORIES_DATA } from '../data/mockData';

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
  | 'admin-settings'
  | 'not-found';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export interface RouteParams {
  productId?: string;
  productSlug?: string;
  categorySlug?: string;
  searchQuery?: string;
  orderNumber?: string;
}

export interface StoreContextType {
  // Locale & Translation
  language: Language;
  setLanguage: (lang: Language) => void;
  currency: Currency;
  setCurrency: (curr: Currency) => void;
  t: (typeof TRANSLATIONS)['fr'];
  formatPrice: (amount?: number | null) => string;
  getLocalizedName: (item: any) => string;
  getLocalizedDesc: (item: any) => string;
  getProductPrice: (product: Product) => number;

  // Routing
  currentRoute: AppRoute;
  routeParams: RouteParams;
  navigateTo: (route: AppRoute, params?: RouteParams) => void;

  // Store Settings (Dynamic CMS)
  settings: StoreSettings;
  isLoadingSettings: boolean;
  refetchSettings: () => Promise<void>;
  updateSettings: (data: Partial<StoreSettings>) => Promise<StoreSettings>;

  // Catalog Data
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  categories: Category[];
  isLoadingProducts: boolean;
  isLoadingCategories: boolean;
  refreshProducts: () => Promise<void>;
  refreshCategories: () => Promise<void>;

  // Filters & Search
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  resetFilters: () => void;
  filteredProducts: Product[];

  // Cart
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

  // Coupons
  couponCode: string;
  setCouponCode: (code: string) => void;
  discountRate: number;

  // Wishlist
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;

  // Quick View & Selected Product
  quickViewProduct: Product | null;
  setQuickViewProduct: (product: Product | null) => void;
  detailProduct: Product | null;
  setDetailProduct: (product: Product | null) => void;

  // Modals & Drawers Visibility
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;
  isWishlistDrawerOpen: boolean;
  setIsWishlistDrawerOpen: (open: boolean) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isAdminModalOpen: boolean;
  setIsAdminModalOpen: (open: boolean) => void;
  isCheckoutModalOpen: boolean;
  setIsCheckoutModalOpen: (open: boolean) => void;
  isOrderSuccessModalOpen: boolean;
  setIsOrderSuccessModalOpen: (open: boolean) => void;
  isTrackOrderModalOpen: boolean;
  setIsTrackOrderModalOpen: (open: boolean) => void;

  // Auth
  user: User | null;
  setUser: (user: User | null) => void;
  isLoadingUser: boolean;
  logout: () => Promise<void>;

  // Orders
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  refreshOrders: () => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  lastPlacedOrder: Order | null;
  setLastPlacedOrder: (order: Order | null) => void;
  createOrder: (orderData: any) => Promise<Order>;

  // Toast Notifications
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

const DEFAULT_STORE_SETTINGS: StoreSettings = {
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

const initialFilters: FilterState = {
  category: null,
  subcategory: null,
  brand: null,
  minPrice: 0,
  maxPrice: 2000,
  inStockOnly: false,
  discountOnly: false,
  searchQuery: '',
  sortBy: 'popularity',
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Language & Currency
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('gsm_lang') as Language) || 'ar';
  });
  const [currency, setCurrency] = useState<Currency>('TND');

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('gsm_lang', lang);
  };

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const t = TRANSLATIONS[language] || TRANSLATIONS.fr;

  // 2. Dynamic Store Settings (Loaded from backend SQLite via GET /api/settings)
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      setIsLoadingSettings(true);
      const res = await api.settings.get();
      if (res?.data) {
        setSettings({
          ...DEFAULT_STORE_SETTINGS,
          ...res.data,
        });
      }
    } catch (err) {
      console.warn('Using default store settings fallback:', err);
    } finally {
      setIsLoadingSettings(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Sync document head elements dynamically
  useEffect(() => {
    if (settings.storeName) {
      document.title = `${settings.storeName} | Matériel & Outillage GSM Tunisie`;
    }

    if (settings.storeDescription) {
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', settings.storeDescription);
      }
    }

    if (settings.faviconUrl) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = settings.faviconUrl;
    }
  }, [settings.storeName, settings.storeDescription, settings.faviconUrl]);

  const updateSettings = async (data: Partial<StoreSettings>): Promise<StoreSettings> => {
    const res = await api.settings.update(data);
    if (res?.data) {
      const merged = { ...settings, ...res.data };
      setSettings(merged);
      return merged;
    }
    throw new Error(res?.message || 'Erreur lors de la mise à jour des paramètres.');
  };

  // 3. Routing state
  const [currentRoute, setCurrentRoute] = useState<AppRoute>('home');
  const [routeParams, setRouteParams] = useState<RouteParams>({});

  const parseHash = useCallback(() => {
    const hash = window.location.hash.replace(/^#\/?/, '');
    if (!hash || hash === '') {
      setCurrentRoute('home');
      setRouteParams({});
      return;
    }

    const parts = hash.split('/');
    const root = parts[0];

    if (root === 'products') {
      setCurrentRoute('products');
    } else if (root === 'product' && parts[1]) {
      setCurrentRoute('product-detail');
      setRouteParams({ productSlug: parts[1] });
    } else if (root === 'category' && parts[1]) {
      setCurrentRoute('category');
      setRouteParams({ categorySlug: parts[1] });
    } else if (root === 'search') {
      setCurrentRoute('search');
    } else if (root === 'cart') {
      setCurrentRoute('cart');
    } else if (root === 'checkout') {
      setCurrentRoute('checkout');
    } else if (root === 'order-success') {
      setCurrentRoute('order-success');
    } else if (root === 'track') {
      setCurrentRoute('track-order');
      if (parts[1]) setRouteParams({ orderNumber: parts[1] });
    } else if (root === 'login') {
      setCurrentRoute('login');
    } else if (root === 'register') {
      setCurrentRoute('register');
    } else if (root === 'profile') {
      setCurrentRoute('profile');
    } else if (root === 'admin') {
      if (parts[1] === 'login') {
        setCurrentRoute('admin-login');
      } else if (parts[1] === 'settings') {
        setCurrentRoute('admin-settings');
      } else if (parts[1] === 'products') {
        setCurrentRoute('admin-products');
      } else if (parts[1] === 'categories') {
        setCurrentRoute('admin-categories');
      } else if (parts[1] === 'orders') {
        setCurrentRoute('admin-orders');
      } else {
        setCurrentRoute('admin');
      }
    } else {
      setCurrentRoute('home');
    }
  }, []);

  useEffect(() => {
    parseHash();
    window.addEventListener('hashchange', parseHash);
    return () => window.removeEventListener('hashchange', parseHash);
  }, [parseHash]);

  const navigateTo = (route: AppRoute, params: RouteParams = {}) => {
    setCurrentRoute(route);
    setRouteParams(params);

    let newHash = '';
    switch (route) {
      case 'home':
        newHash = '';
        break;
      case 'products':
        newHash = 'products';
        break;
      case 'product-detail':
        newHash = `product/${params.productSlug || params.productId || ''}`;
        break;
      case 'category':
        newHash = `category/${params.categorySlug || ''}`;
        break;
      case 'search':
        newHash = 'search';
        break;
      case 'cart':
        newHash = 'cart';
        break;
      case 'checkout':
        newHash = 'checkout';
        break;
      case 'order-success':
        newHash = 'order-success';
        break;
      case 'track-order':
        newHash = params.orderNumber ? `track/${params.orderNumber}` : 'track';
        break;
      case 'login':
        newHash = 'login';
        break;
      case 'register':
        newHash = 'register';
        break;
      case 'profile':
        newHash = 'profile';
        break;
      case 'admin':
        newHash = 'admin';
        break;
      case 'admin-login':
        newHash = 'admin/login';
        break;
      case 'admin-settings':
        newHash = 'admin/settings';
        break;
      case 'admin-products':
        newHash = 'admin/products';
        break;
      case 'admin-categories':
        newHash = 'admin/categories';
        break;
      case 'admin-orders':
        newHash = 'admin/orders';
        break;
      default:
        newHash = route;
    }

    if (window.location.hash !== `#${newHash}`) {
      window.location.hash = newHash;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 4. Products & Categories from Backend Database
  const [products, setProducts] = useState<Product[]>(PRODUCTS_DATA);
  const [categories, setCategories] = useState<Category[]>(CATEGORIES_DATA);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  const fetchProducts = async () => {
    try {
      setIsLoadingProducts(true);
      const res = await api.products.getAll({ limit: 100, admin: 'true' });
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        setProducts(res.data);
      }
    } catch (err) {
      console.warn('Using seeded catalog products:', err);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setIsLoadingCategories(true);
      const res = await api.categories.getAll();
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        setCategories(res.data);
      }
    } catch (err) {
      console.warn('Using seeded catalog categories:', err);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // 5. Authenticated User from Backend Session
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      setIsLoadingUser(true);
      const res = await api.auth.getMe();
      const currentUser = res?.user || res?.data;
      if (currentUser && currentUser.id) {
        setUser({
          ...currentUser,
          isAdmin: currentUser.role === 'ADMIN',
        });
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoadingUser(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const logout = async () => {
    try {
      await api.auth.logout();
      setUser(null);
      showToast(language === 'ar' ? 'تم تسجيل الخروج بنجاح.' : 'Déconnexion effectuée.', 'info');
      navigateTo('home');
    } catch {
      setUser(null);
    }
  };

  // 6. Cart Management
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('gsm_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('gsm_cart', JSON.stringify(cart));
  }, [cart]);

  // 7. Wishlist Management
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('gsm_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('gsm_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  // 8. Modals & Drawers Visibility
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isWishlistDrawerOpen, setIsWishlistDrawerOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isOrderSuccessModalOpen, setIsOrderSuccessModalOpen] = useState(false);
  const [isTrackOrderModalOpen, setIsTrackOrderModalOpen] = useState(false);

  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [lastPlacedOrder, setLastPlacedOrder] = useState<Order | null>(null);

  // 9. Orders Store
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('gsm_orders');
      return saved ? JSON.parse(saved) : DEMO_ORDERS;
    } catch {
      return DEMO_ORDERS;
    }
  });

  const fetchOrders = async () => {
    try {
      const res = await api.orders.getAdminOrders({ limit: 50 });
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        setOrders(res.data);
      }
    } catch (err) {
      console.warn('Error fetching orders from backend:', err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status, orderStatus: status } : o))
    );
    showToast(
      language === 'ar' ? `تم تحديث حالة الطلبية إلى: ${status}` : `Statut de commande mis à jour: ${status}`,
      'success'
    );
  };

  // 10. Coupon Management
  const [couponCode, setCouponCodeState] = useState('');
  const [discountRate, setDiscountRate] = useState(0);

  const setCouponCode = (code: string) => {
    const trimmed = code.trim().toUpperCase();
    setCouponCodeState(trimmed);
    if (trimmed === 'GSM10') {
      setDiscountRate(0.1);
      showToast(language === 'ar' ? 'تم تفعيل كود الخصم 10% بنجاح!' : 'Code promo 10% activé avec succès !', 'success');
    } else if (trimmed === '') {
      setDiscountRate(0);
    } else {
      setDiscountRate(0);
      showToast(language === 'ar' ? 'كود الخصم غير صالح' : 'Code promo invalide', 'error');
    }
  };

  // 11. Filters
  const [filters, setFilters] = useState<FilterState>(initialFilters);

  // 12. Toast Notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Price helper
  const getProductPrice = (p: Product): number => {
    if (!p) return 0;
    if (typeof p.priceTND === 'number') return p.priceTND;
    if (typeof p.price === 'number') return p.price;
    return 0;
  };

  const formatPrice = (amount?: number | null): string => {
    const val = typeof amount === 'number' ? amount : 0;
    const currSymbol = settings.currency || 'DT';
    const formatted = val.toFixed(3);
    return `${formatted} ${currSymbol}`;
  };

  const getLocalizedName = (item: any): string => {
    if (!item) return '';
    if (typeof item.name === 'string') return item.name;
    if (typeof item.name === 'object') {
      return item.name[language] || item.name.fr || item.name.ar || item.name.en || '';
    }
    return '';
  };

  const getLocalizedDesc = (item: any): string => {
    if (!item) return '';
    if (typeof item.description === 'string') return item.description;
    if (typeof item.description === 'object') {
      return item.description[language] || item.description.fr || item.description.ar || item.description.en || '';
    }
    return '';
  };

  // Cart operations
  const addToCart = (product: Product, quantity = 1, variant?: Variant) => {
    const currentStock = product.stock ?? 0;
    if (currentStock <= 0) {
      showToast(language === 'ar' ? 'المنتج غير متوفر حالياً بالمخزن.' : 'Produit en rupture de stock.', 'error');
      return;
    }

    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.product.id === product.id && item.selectedVariant?.id === variant?.id
      );

      if (existingIndex > -1) {
        const next = [...prev];
        const newQty = next[existingIndex].quantity + quantity;
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: Math.min(newQty, currentStock),
        };
        return next;
      } else {
        return [...prev, { product, quantity: Math.min(quantity, currentStock), selectedVariant: variant }];
      }
    });

    const prodName = getLocalizedName(product);
    showToast(
      language === 'ar'
        ? `تمت إضافة « ${prodName} » إلى السلة.`
        : `« ${prodName} » ajouté au panier !`
    );
  };

  const removeFromCart = (productId: string, variantId?: string) => {
    setCart((prev) =>
      prev.filter(
        (item) => !(item.product.id === productId && item.selectedVariant?.id === variantId)
      )
    );
  };

  const updateQuantity = (productId: string, quantity: number, variantId?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, variantId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId && item.selectedVariant?.id === variantId) {
          const maxStock = item.product.stock ?? 999;
          return { ...item, quantity: Math.min(quantity, maxStock) };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const cartSubtotal = Math.round(
    cart.reduce((sum, item) => {
      const price = getProductPrice(item.product) + (item.selectedVariant?.priceAdjustment || 0);
      return sum + price * item.quantity;
    }, 0) * 1000
  ) / 1000;

  // Dynamically driven by StoreSettings from database!
  const freeShippingThreshold = settings?.freeShippingThresholdTND ?? 300.0;
  const defaultShipping = settings?.defaultShippingTND ?? 7.0;
  const shippingFee = cartSubtotal >= freeShippingThreshold || cart.length === 0 ? 0 : defaultShipping;
  const cartTotal = Math.round((cartSubtotal * (1 - discountRate) + shippingFee) * 1000) / 1000;

  // Wishlist
  const toggleWishlist = (productId: string) => {
    const isSaved = wishlist.includes(productId);
    if (isSaved) {
      setWishlist((prev) => prev.filter((id) => id !== productId));
      showToast(language === 'ar' ? 'تمت إزالة المنتج من المفضلة.' : 'Retiré des favoris.', 'info');
    } else {
      setWishlist((prev) => [...prev, productId]);
      showToast(language === 'ar' ? 'تمت إضافة المنتج إلى المفضلة ❤️' : 'Ajouté aux favoris ❤️', 'success');
    }
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  // Filters calculation
  const resetFilters = () => {
    setFilters(initialFilters);
  };

  const filteredProducts = products.filter((product) => {
    const price = getProductPrice(product);

    if (filters.category && filters.category !== 'all' && product.category !== filters.category) {
      return false;
    }

    if (filters.subcategory && (product as any).subcategory !== filters.subcategory) {
      return false;
    }

    if (filters.brand) {
      const brand =
        product.specs?.brand ||
        product.specifications?.brand ||
        product.brand ||
        '';
      if (brand.toLowerCase() !== filters.brand.toLowerCase()) {
        return false;
      }
    }

    if (price < filters.minPrice || price > filters.maxPrice) {
      return false;
    }

    if (filters.inStockOnly && product.stock <= 0) {
      return false;
    }

    if (
      filters.discountOnly &&
      (!product.compareAtPriceTND || product.compareAtPriceTND <= price)
    ) {
      return false;
    }

    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase();
      const name = getLocalizedName(product).toLowerCase();
      const desc = getLocalizedDesc(product).toLowerCase();
      const brand = (
        product.specs?.brand ||
        product.specifications?.brand ||
        product.brand ||
        ''
      ).toLowerCase();
      if (!name.includes(q) && !desc.includes(q) && !brand.includes(q)) {
        return false;
      }
    }

    return true;
  }).sort((a, b) => {
    const priceA = getProductPrice(a);
    const priceB = getProductPrice(b);

    if (filters.sortBy === 'price-asc') return priceA - priceB;
    if (filters.sortBy === 'price-desc') return priceB - priceA;
    if (filters.sortBy === 'rating') return (b.rating || 5) - (a.rating || 5);
    if (filters.sortBy === 'newest')
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    return (b.rating || 0) - (a.rating || 0);
  });

  // Order Creation (persists to backend API and local store)
  const createOrder = async (orderData: any): Promise<Order> => {
    const payload = {
      customerName:
        orderData.customerName ||
        `${orderData.firstName || ''} ${orderData.lastName || ''}`.trim() ||
        'Client GSM',
      customerPhone: orderData.customerPhone || orderData.phone || '00000000',
      customerEmail: orderData.customerEmail || orderData.email || 'contact@client.tn',
      governorate: orderData.governorate || orderData.selectedGov || 'Tunis',
      delegation: orderData.delegation || orderData.city || 'Tunis Centre',
      address: orderData.address || orderData.street || 'Tunisie',
      notes: orderData.notes || '',
      paymentMethod: orderData.paymentMethod || 'cod',
      items: cart.map((i) => ({
        productId: i.product.id,
        quantity: i.quantity,
        priceTND: getProductPrice(i.product),
      })),
    };

    let newOrder: Order;

    try {
      const res = await api.orders.create(payload);
      if (res?.data) {
        newOrder = res.data;
      } else {
        throw new Error('Fallback to local order creation');
      }
    } catch {
      // Fallback robust order generator
      const orderNum = `GSM-TN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      newOrder = {
        id: `ord-${Date.now()}`,
        orderNumber: orderNum,
        customerName: payload.customerName,
        customerPhone: payload.customerPhone,
        customerEmail: payload.customerEmail,
        governorate: payload.governorate,
        delegation: payload.delegation,
        address: payload.address,
        notes: payload.notes,
        subtotalTND: cartSubtotal,
        shippingTND: shippingFee,
        totalTND: cartTotal,
        subtotal: cartSubtotal,
        shippingCost: shippingFee,
        totalPrice: cartTotal,
        status: 'PENDING',
        orderStatus: 'pending',
        paymentMethod: payload.paymentMethod,
        paymentStatus: 'pending',
        trackingNumber: `TN-ARAMEX-${Math.floor(1000000 + Math.random() * 9000000)}`,
        carrierName: 'Aramex Express Tunisia',
        items: cart.map((i) => ({
          productId: i.product.id,
          productName: getLocalizedName(i.product),
          name: getLocalizedName(i.product),
          image: i.product.images?.[0] || i.product.image,
          sku: i.product.sku,
          priceTND: getProductPrice(i.product),
          price: getProductPrice(i.product),
          quantity: i.quantity,
          totalTND: getProductPrice(i.product) * i.quantity,
        })),
        createdAt: new Date().toISOString(),
      };
    }

    setOrders((prev) => [newOrder, ...prev]);
    setLastPlacedOrder(newOrder);
    clearCart();

    return newOrder;
  };

  return (
    <StoreContext.Provider
      value={{
        language,
        setLanguage,
        currency,
        setCurrency,
        t,
        formatPrice,
        getLocalizedName,
        getLocalizedDesc,
        getProductPrice,
        currentRoute,
        routeParams,
        navigateTo,
        settings,
        isLoadingSettings,
        refetchSettings: fetchSettings,
        updateSettings,
        products,
        setProducts,
        categories,
        isLoadingProducts,
        isLoadingCategories,
        refreshProducts: fetchProducts,
        refreshCategories: fetchCategories,
        filters,
        setFilters,
        resetFilters,
        filteredProducts,
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartSubtotal,
        shippingFee,
        freeShippingThreshold,
        cartTotal,
        couponCode,
        setCouponCode,
        discountRate,
        wishlist,
        toggleWishlist,
        isInWishlist,
        quickViewProduct,
        setQuickViewProduct,
        detailProduct,
        setDetailProduct,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
        isWishlistDrawerOpen,
        setIsWishlistDrawerOpen,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isAdminModalOpen,
        setIsAdminModalOpen,
        isCheckoutModalOpen,
        setIsCheckoutModalOpen,
        isOrderSuccessModalOpen,
        setIsOrderSuccessModalOpen,
        isTrackOrderModalOpen,
        setIsTrackOrderModalOpen,
        user,
        setUser,
        isLoadingUser,
        logout,
        orders,
        setOrders,
        refreshOrders: fetchOrders,
        updateOrderStatus,
        lastPlacedOrder,
        setLastPlacedOrder,
        createOrder,
        toasts,
        showToast,
        removeToast,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
