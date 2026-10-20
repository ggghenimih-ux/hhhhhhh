import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
import { auth } from '../services/firebase';
import { useAuth } from './AuthContext';
import { StoreSlicesProvider } from './StoreSlices';
import { DEFAULT_STORE_SETTINGS, initialFilters } from './storeDefaults';
import { AppRoute, RouteParams, StoreContextType, ToastMessage } from './storeTypes';
import { useLocation, useNavigate } from 'react-router-dom';

export type { AppRoute, RouteParams, StoreContextType, ToastMessage } from './storeTypes';

const StoreContext = createContext<StoreContextType | undefined>(undefined);
const ORDER_NUMBER_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

const createOrderNumber = () => {
  const randomValues = crypto.getRandomValues(new Uint8Array(6));
  const code = Array.from(randomValues, (value) => ORDER_NUMBER_ALPHABET[value % ORDER_NUMBER_ALPHABET.length]).join('');
  return `ORD-${code}`;
};

const decodeSegment = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const routeForPath = (pathname: string): AppRoute => {
  const [root, section] = pathname.split('/').filter(Boolean);
  if (!root) return 'home';
  if (root === 'products') return 'products';
  if (root === 'product' && section) return 'product-detail';
  if (root === 'category' && section) return 'category';
  if (root === 'search') return 'search';
  if (root === 'cart') return 'cart';
  if (root === 'checkout') return 'checkout';
  if (root === 'order-success') return 'order-success';
  if (root === 'track') return 'track-order';
  if (root === 'login') return 'login';
  if (root === 'register') return 'register';
  if (root === 'profile') return 'profile';
  if (root === 'admin') {
    if (section === 'login') return 'admin-login';
    if (section === 'settings') return 'admin-settings';
    if (section === 'products') return 'admin-products';
    if (section === 'categories') return 'admin-categories';
    if (section === 'orders') return 'admin-orders';
    if (section === 'users') return 'admin-users';
    if (section === 'media') return 'admin-media';
    return 'admin';
  }
  return 'not-found';
};

const pathForLegacyHash = (hash: string): string | null => {
  const value = hash.replace(/^#\/?/, '');
  if (!value) return null;
  const [root, ...segments] = value.split('/');
  const tail = segments.map(encodeURIComponent).join('/');
  if (['products', 'search', 'cart', 'checkout', 'login', 'register', 'profile'].includes(root)) {
    return `/${root}${tail ? `/${tail}` : ''}`;
  }
  if (['product', 'category', 'order-success', 'track'].includes(root)) {
    return `/${root}${tail ? `/${tail}` : ''}`;
  }
  if (root === 'admin') return `/admin${tail ? `/${tail}` : ''}`;
  return null;
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const routerNavigate = useNavigate();
  const initialPathname = useRef(location.pathname);
  const hasResolvedLegacyHash = useRef(false);
  const {
    user,
    loading: isLoadingUser,
    logout: authLogout,
  } = useAuth();
  const isAdminPath = location.pathname === '/admin' || location.pathname.startsWith('/admin/');
  const canLoadStoreData = !isAdminPath || (!isLoadingUser && user?.role === 'ADMIN');

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

  // 2. Dynamic store settings loaded from Firestore.
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
    if (!canLoadStoreData) return;
    fetchSettings();
  }, [canLoadStoreData, fetchSettings]);

  useEffect(() => {
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

  // 3. History-based routing, with a one-way bridge for bookmarked hash URLs.
  const currentRoute = routeForPath(location.pathname);
  const pathParts = location.pathname.split('/').filter(Boolean).map(decodeSegment);
  const routeParams: RouteParams = {
    ...(currentRoute === 'product-detail' ? { productSlug: pathParts[1] } : {}),
    ...(currentRoute === 'admin-products' && new URLSearchParams(location.search).get('productId')
      ? {
          productId: new URLSearchParams(location.search).get('productId') || undefined,
          productAction: new URLSearchParams(location.search).get('productAction') === 'delete' ? 'delete' : 'edit',
        }
      : {}),
    ...(currentRoute === 'category' ? { categorySlug: pathParts[1] } : {}),
    ...(currentRoute === 'order-success' && pathParts[1] ? { orderNumber: pathParts[1] } : {}),
    ...(currentRoute === 'track-order' && pathParts[1] ? { orderNumber: pathParts[1] } : {}),
    ...(currentRoute === 'search' && new URLSearchParams(location.search).get('q')
      ? { searchQuery: new URLSearchParams(location.search).get('q') || undefined }
      : {}),
  };

  useEffect(() => {
    if (hasResolvedLegacyHash.current || isLoadingUser) return;
    hasResolvedLegacyHash.current = true;
    if (initialPathname.current !== '/' || location.pathname !== '/' || user) return;

    const legacyPath = pathForLegacyHash(window.location.hash);
    if (legacyPath) routerNavigate(legacyPath, { replace: true });
  }, [location.pathname, isLoadingUser, user, routerNavigate]);

  const navigateTo = useCallback((route: AppRoute, params: RouteParams = {}) => {
    let path = '/';
    switch (route) {
      case 'home':
        break;
      case 'products':
        path = '/products';
        break;
      case 'product-detail':
        path = `/product/${encodeURIComponent(params.productSlug || params.productId || '')}`;
        break;
      case 'category':
        path = `/category/${encodeURIComponent(params.categorySlug || '')}`;
        break;
      case 'search':
        path = params.searchQuery
          ? `/search?q=${encodeURIComponent(params.searchQuery)}`
          : '/search';
        break;
      case 'cart':
        path = '/cart';
        break;
      case 'checkout':
        path = '/checkout';
        break;
      case 'order-success':
        path = params.orderNumber
          ? `/order-success/${encodeURIComponent(params.orderNumber)}`
          : '/order-success';
        break;
      case 'track-order':
        path = params.orderNumber ? `/track/${encodeURIComponent(params.orderNumber)}` : '/track';
        break;
      case 'login':
        path = '/login';
        break;
      case 'register':
        path = '/register';
        break;
      case 'profile':
        path = '/profile';
        break;
      case 'admin':
        path = '/admin';
        break;
      case 'admin-login':
        path = '/admin/login';
        break;
      case 'admin-settings':
        path = '/admin/settings';
        break;
      case 'admin-products':
        path = params.productId
          ? `/admin/products?productId=${encodeURIComponent(params.productId)}&productAction=${params.productAction || 'edit'}`
          : '/admin/products';
        break;
      case 'admin-categories':
        path = '/admin/categories';
        break;
      case 'admin-orders':
        path = '/admin/orders';
        break;
      case 'admin-users':
        path = '/admin/users';
        break;
      case 'admin-media':
        path = '/admin/media';
        break;
      case 'not-found':
        path = '/404';
        break;
    }
    routerNavigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [routerNavigate]);

  useEffect(() => {
    if (currentRoute === 'register' && !isLoadingUser && user) {
      navigateTo('home');
    }
  }, [currentRoute, isLoadingUser, user, navigateTo]);

  // 4. Products & Categories from Backend Database
  const [filters, setFiltersState] = useState<FilterState>(initialFilters);
  const [productPage, setProductPage] = useState(1);
  const [productPagination, setProductPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const productRequestId = useRef(0);

  const setFilters: React.Dispatch<React.SetStateAction<FilterState>> = (action) => {
    setFiltersState((prev) => (typeof action === 'function' ? action(prev) : action));
    setProductPage(1);
  };

  const fetchProducts = async (
    page = productPage,
    currentFilters: FilterState = filters,
  ) => {
    const requestId = ++productRequestId.current;
    try {
      setIsLoadingProducts(true);
      setProductsError(null);
      const res = await api.products.getAll({
        limit: 12,
        page,
        search: currentFilters.searchQuery.trim() || undefined,
        sortBy: currentFilters.sortBy === 'popularity' ? 'rating' : currentFilters.sortBy,
        category: currentFilters.category || undefined,
        minPrice: currentFilters.minPrice || undefined,
        maxPrice: currentFilters.maxPrice < 2000 ? currentFilters.maxPrice : undefined,
        admin: user?.role === 'ADMIN' ? 'true' : undefined,
      });
      if (!Array.isArray(res?.data)) {
        throw new Error(res?.message || 'Le serveur a retourné un catalogue invalide.');
      }
      if (requestId !== productRequestId.current) return;
      setProducts(res.data);
      setProductPagination(res.pagination || {
        page,
        totalPages: 1,
        total: res.data.length,
      });
    } catch (err) {
      if (requestId !== productRequestId.current) return;
      setProducts([]);
      setProductsError(err instanceof Error ? err.message : 'Impossible de charger les produits.');
    } finally {
      if (requestId === productRequestId.current) setIsLoadingProducts(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setIsLoadingCategories(true);
      const res = await api.categories.getAll();
      if (res?.data && Array.isArray(res.data)) {
        setCategories(res.data);
      }
    } catch (err) {
      console.warn('Unable to load categories from the server:', err);
      setCategories([]);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  useEffect(() => {
    if (!canLoadStoreData) return;
    fetchCategories();
  }, [canLoadStoreData]);

  useEffect(() => {
    if (!canLoadStoreData) return;
    const timeout = window.setTimeout(() => {
      void fetchProducts(productPage, filters);
    }, 200);
    return () => window.clearTimeout(timeout);
  }, [canLoadStoreData, filters, productPage, user?.role]);

  const logout = async () => {
    await authLogout();
    showToast(language === 'ar' ? 'تم تسجيل الخروج بنجاح.' : 'Déconnexion effectuée.', 'info');
    navigateTo('home');
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

  useEffect(() => {
    if (!canLoadStoreData) return;
    const refreshSavedCart = async () => {
      const savedCart = cart;
      if (savedCart.length === 0) return;

      try {
        const refreshedCart = await Promise.all(
          savedCart.map(async (item) => {
            const res = await api.products.getById(item.product.id);
            const product = res?.data as Product | undefined;
            if (!product) return null;
            return {
              ...item,
              product,
              quantity: item.quantity,
            };
          }),
        );
        setCart(refreshedCart.filter((item): item is CartItem => item !== null));
      } catch (err) {
        console.warn('Unable to refresh saved cart product data:', err);
      }
    };

    refreshSavedCart();
  }, [canLoadStoreData]);

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
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [lastPlacedOrder, setLastPlacedOrder] = useState<Order | null>(null);

  // 9. Orders Store
  const [orders, setOrders] = useState<Order[]>(() => {
    localStorage.removeItem('gsm_orders');
    return [];
  });

  const fetchOrders = async () => {
    if (user?.role !== 'ADMIN') {
      setOrders([]);
      return;
    }
    try {
      const res = await api.orders.getAdminOrders({ limit: 50 });
      setOrders(res?.data && Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.warn('Error fetching orders from backend:', err);
    }
  };

  useEffect(() => {
    localStorage.removeItem('gsm_orders');
    if (user?.role === 'ADMIN') {
      void fetchOrders();
    } else {
      setOrders([]);
    }
  }, [user?.role]);

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status, orderStatus: status } : o))
    );
    showToast(
      language === 'ar' ? `تم تحديث حالة الطلبية إلى: ${status}` : `Statut de commande mis à jour: ${status}`,
      'success'
    );
  };

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
    if (product.isOutOfStock === true) {
      showToast(
        language === 'ar' ? 'هذا المنتج غير متوفر حالياً.' : 'Ce produit est actuellement en rupture de stock.',
        'error',
      );
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
          quantity: newQty,
        };
        return next;
      } else {
        return [...prev, { product, quantity, selectedVariant: variant }];
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
          if (quantity > item.quantity && item.product.isOutOfStock === true) return item;
          return { ...item, quantity };
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
  const freeShippingThreshold = settings.freeShippingThresholdTND;
  const defaultShipping = settings.defaultShippingTND;
  const shippingFee = cartSubtotal >= freeShippingThreshold || cart.length === 0 ? 0 : defaultShipping;
  const cartTotal = Math.round((cartSubtotal + shippingFee) * 1000) / 1000;

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

    if (
      filters.discountOnly &&
      (!product.compareAtPriceTND || product.compareAtPriceTND <= price)
    ) {
      return false;
    }

    return true;
  });

  // Direct Client-Side Order Creation to Firestore (Bypassing Cloud Functions & CORS issues)
  const createOrder = async (orderData: any): Promise<Order> => {
    try {
      const customerName = String(orderData.customerName ?? '').trim();
      const customerPhone = String(orderData.customerPhone ?? '').trim();
      const customerEmail = String(orderData.customerEmail ?? '').trim();
      const governorate = String(orderData.governorate ?? '').trim();
      const city = String(orderData.city ?? orderData.delegation ?? governorate).trim();
      const delegation = String(orderData.delegation ?? '').trim();
      const address = String(orderData.address ?? '').trim();
      const notes = String(orderData.notes ?? '').trim();

      if (!customerName || customerName.length > 120) throw new Error('Le nom est obligatoire (120 caractères maximum).');
      if (!/^[24579]\d{7}$/.test(customerPhone)) throw new Error('Numéro de téléphone tunisien invalide.');
      if (customerEmail.length > 254) throw new Error('Adresse e-mail trop longue.');
      if (!governorate || governorate.length > 100) throw new Error('Le gouvernorat est obligatoire.');
      if (!city || city.length > 120) throw new Error('La ville est obligatoire (120 caractères maximum).');
      if (delegation.length > 120) throw new Error('La délégation ne peut pas dépasser 120 caractères.');
      if (!address || address.length > 500) throw new Error('L’adresse est obligatoire (500 caractères maximum).');
      if (notes.length > 1000) throw new Error('Les instructions ne peuvent pas dépasser 1000 caractères.');
      if (cart.length === 0) throw new Error('Votre panier est vide.');
      if (cart.some((item) => item.product.isOutOfStock === true)) {
        throw new Error('Retirez les produits en rupture de stock du panier avant de confirmer la commande.');
      }

      const items = cart.map((item) => {
        const unitPrice = getProductPrice(item.product) + (item.selectedVariant?.priceAdjustment || 0);
        const lineTotal = Math.round(unitPrice * item.quantity * 1000) / 1000;
        if (!Number.isFinite(unitPrice) || unitPrice < 0 || !Number.isInteger(item.quantity) || item.quantity < 1) {
          throw new Error('Un article du panier contient un prix ou une quantité invalide.');
        }
        return {
          productId: item.product.id,
          name: getLocalizedName(item.product),
          unitPrice,
          qty: item.quantity,
          lineTotal,
          price: unitPrice,
          quantity: item.quantity,
          isOutOfStock: item.product.isOutOfStock === true,
          variant: item.selectedVariant ? item.selectedVariant.name : null,
        };
      });

      const payload = {
        orderNumber: createOrderNumber(),
        userId: auth.currentUser?.uid ?? null,
        customerName,
        customerPhone,
        customerEmail: customerEmail || null,
        governorate,
        city,
        delegation: delegation || null,
        address,
        notes: notes || null,
        paymentMethod: orderData.paymentMethod || 'cod',
        items,
        subtotal: cartSubtotal,
        deliveryFee: shippingFee,
        grandTotal: cartTotal,
        status: 'pending',
        orderStatus: 'pending',
        createdAt: new Date().toISOString(),
      };

      const { collection, addDoc } = await import('firebase/firestore');
      const { db } = await import('../services/firebase');

      const ordersRef = collection(db, 'orders');
      const docRef = await addDoc(ordersRef, payload);

      const newOrder: Order = {
        id: docRef.id,
        ...payload,
      } as any;

      setOrders((prev) => [newOrder, ...prev]);
      setLastPlacedOrder(newOrder);
      clearCart();
      void fetchProducts(productPage, filters);

      return newOrder;
    } catch (err: any) {
      console.error('Erreur lors de la création directe de la commande:', err);
      throw new Error(err.message || 'Erreur lors de la création de la commande.');
    }
  };

  const storeValue: StoreContextType = {
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
        productsError,
        setProducts,
        categories,
        isLoadingProducts,
        isLoadingCategories,
        productPagination,
        setProductPage,
        refreshProducts: () => fetchProducts(productPage, filters),
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
        wishlist,
        toggleWishlist,
        isInWishlist,
        quickViewProduct,
        setQuickViewProduct,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
        isWishlistDrawerOpen,
        setIsWishlistDrawerOpen,
        user,
        isLoadingUser,
        logout,
        orders,
        setOrders,
        refreshOrders: fetchOrders,
        updateOrderStatus,
        lastPlacedOrder,
        createOrder,
        toasts,
        showToast,
        removeToast,
  };

  return (
    <StoreContext.Provider value={storeValue}>
      <StoreSlicesProvider value={storeValue}>{children}</StoreSlicesProvider>
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