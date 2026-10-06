import React from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { CartDrawer } from '../components/CartDrawer';
import { WishlistDrawer } from '../components/WishlistDrawer';
import { CheckoutModal } from '../components/CheckoutModal';
import { OrderSuccessModal } from '../components/OrderSuccessModal';
import { TrackOrderModal } from '../components/TrackOrderModal';
import { AdminModal } from '../components/AdminModal';
import { AuthModal } from '../components/AuthModal';
import { ProductQuickView } from '../components/ProductQuickView';
import { ProductDetailModal } from '../components/ProductDetailModal';
import { Toasts } from '../components/Toasts';

export const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-orange-500 selection:text-white">
      {/* 1. Header (Top Bar + Main Header + CategoryNav + MobileMenu) */}
      <Header />

      {/* 2. Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* 3. Footer */}
      <Footer />

      {/* 4. Modals & Drawers */}
      <CartDrawer />
      <WishlistDrawer />
      <CheckoutModal />
      <OrderSuccessModal />
      <TrackOrderModal />
      <AdminModal />
      <AuthModal />
      <ProductQuickView />
      <ProductDetailModal />

      {/* 5. Notifications */}
      <Toasts />
    </div>
  );
};
