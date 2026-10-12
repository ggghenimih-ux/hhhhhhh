import React from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { CartDrawer } from '../components/CartDrawer';
import { WishlistDrawer } from '../components/WishlistDrawer';
import { ProductQuickView } from '../components/ProductQuickView';
import { Toasts } from '../components/Toasts';
import { SEOHead } from '../components/SEOHead';

export const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-orange-500 selection:text-white">
      <SEOHead />
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
      <ProductQuickView />

      {/* 5. Notifications */}
      <Toasts />
    </div>
  );
};
