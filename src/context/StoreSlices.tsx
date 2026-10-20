import React, { createContext, useContext } from 'react';
import type { StoreContextType } from './storeTypes';

type RoutingSlice = Pick<StoreContextType, 'currentRoute' | 'routeParams' | 'navigateTo'>;
type CartSlice = Pick<
  StoreContextType,
  | 'cart'
  | 'addToCart'
  | 'removeFromCart'
  | 'updateQuantity'
  | 'clearCart'
  | 'cartCount'
  | 'cartSubtotal'
  | 'shippingFee'
  | 'freeShippingThreshold'
  | 'cartTotal'
  | 'createOrder'
  | 'wishlist'
  | 'toggleWishlist'
  | 'isInWishlist'
  | 'isCartDrawerOpen'
  | 'setIsCartDrawerOpen'
  | 'isWishlistDrawerOpen'
  | 'setIsWishlistDrawerOpen'
>
type ProductsSlice = Pick<
  StoreContextType,
  | 'products'
  | 'productsError'
  | 'setProducts'
  | 'categories'
  | 'isLoadingProducts'
  | 'isLoadingCategories'
  | 'productPagination'
  | 'setProductPage'
  | 'refreshProducts'
  | 'refreshCategories'
  | 'filters'
  | 'setFilters'
  | 'resetFilters'
  | 'filteredProducts'
  | 'quickViewProduct'
  | 'setQuickViewProduct'
  | 'getLocalizedName'
  | 'getLocalizedDesc'
  | 'getProductPrice'
>
type SettingsSlice = Pick<
  StoreContextType,
  | 'language'
  | 'setLanguage'
  | 'currency'
  | 'setCurrency'
  | 't'
  | 'formatPrice'
  | 'settings'
  | 'isLoadingSettings'
  | 'refetchSettings'
  | 'updateSettings'
>
type NotificationsSlice = Pick<StoreContextType, 'toasts' | 'showToast' | 'removeToast'>;

const RoutingContext = createContext<RoutingSlice | undefined>(undefined);
const CartContext = createContext<CartSlice | undefined>(undefined);
const ProductsContext = createContext<ProductsSlice | undefined>(undefined);
const SettingsContext = createContext<SettingsSlice | undefined>(undefined);
const NotificationsContext = createContext<NotificationsSlice | undefined>(undefined);

export const StoreSlicesProvider: React.FC<{
  value: StoreContextType;
  children: React.ReactNode;
}> = ({ value, children }) => (
  <RoutingContext.Provider value={value}>
    <CartContext.Provider value={value}>
      <ProductsContext.Provider value={value}>
        <SettingsContext.Provider value={value}>
          <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
        </SettingsContext.Provider>
      </ProductsContext.Provider>
    </CartContext.Provider>
  </RoutingContext.Provider>
);

const useSlice = <T,>(context: React.Context<T | undefined>, sliceName: string): T => {
  const value = useContext(context);
  if (!value) throw new Error(`${sliceName} must be used within a StoreSlicesProvider`);
  return value;
};

export const useStoreRouting = () => useSlice(RoutingContext, 'useStoreRouting');
export const useStoreCart = () => useSlice(CartContext, 'useStoreCart');
export const useStoreProducts = () => useSlice(ProductsContext, 'useStoreProducts');
export const useStoreSettings = () => useSlice(SettingsContext, 'useStoreSettings');
export const useStoreNotifications = () => useSlice(NotificationsContext, 'useStoreNotifications');
