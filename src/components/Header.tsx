import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import {
  ShoppingCart,
  User as UserIcon,
  Menu,
  Phone,
  Truck,
  CheckCircle2
} from 'lucide-react';
import { Logo } from './Logo';
import { SearchBar } from './SearchBar';
import { CategoryNav } from './CategoryNav';
import { MobileMenu } from './MobileMenu';

export const Header: React.FC = () => {
  const {
    t,
    language,
    setLanguage,
    cartCount,
    setIsCartDrawerOpen,
    setIsAuthModalOpen,
    user,
    navigateTo,
    settings,
  } = useStore();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const displayPhone = settings?.phone || '+216 26 383 876';

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
        {/* 1. TOP BAR (شريط علوي صغير للمعلومات المهمة) */}
        <div className="bg-slate-900 text-slate-300 text-xs py-1.5 border-b border-slate-800">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
            {/* Delivery & Cash on delivery notices */}
            <div className="flex items-center gap-3 sm:gap-6 flex-wrap text-[11px] sm:text-xs">
              <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                <Truck className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                <span>
                  {language === 'ar'
                    ? 'توصيل سريع لكافة الـ 24 ولاية 🇹🇳'
                    : 'Livraison express sur toute la Tunisie'}
                </span>
              </span>

              <span className="hidden md:flex items-center gap-1.5 text-slate-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>
                  {language === 'ar'
                    ? 'الدفع عند الاستلام بعد المعاينة'
                    : 'Paiement à la livraison après vérification'}
                </span>
              </span>
            </div>

            {/* Phone hotline & language switch */}
            <div className="flex items-center gap-4 flex-shrink-0 text-[11px] sm:text-xs">
              <a
                href={`tel:${displayPhone.replace(/[\s\-\(\)]/g, '')}`}
                className="flex items-center gap-1 text-slate-300 hover:text-white transition font-mono"
                title="Service Client Téléphonique"
              >
                <Phone className="w-3 h-3 text-orange-400" />
                <span>{displayPhone}</span>
              </a>

              {/* Language Switcher */}
              <div className="flex items-center gap-1 border-l border-slate-700 pl-3">
                <button
                  type="button"
                  onClick={() => setLanguage('ar')}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-medium transition ${
                    language === 'ar'
                      ? 'bg-orange-600 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  عربي
                </button>
                <span className="text-slate-600">·</span>
                <button
                  type="button"
                  onClick={() => setLanguage('fr')}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-medium transition ${
                    language === 'fr'
                      ? 'bg-orange-600 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  FR
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 2. MAIN HEADER BAR */}
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Mobile Menu Button + Logo */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 -ml-2 text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition"
                aria-label="Ouvrir le menu mobile"
              >
                <Menu className="w-6 h-6" />
              </button>

              <Logo size="md" />
            </div>

            {/* Desktop Search Bar (Centered) */}
            <div className="hidden lg:block flex-1 max-w-xl mx-8">
              <SearchBar />
            </div>

            {/* Account & Cart Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Admin Dashboard shortcut if admin */}
              {user?.isAdmin && (
                <button
                  type="button"
                  onClick={() => navigateTo('admin')}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-xs transition"
                >
                  <span>{language === 'ar' ? 'لوحة الإدارة' : 'Admin'}</span>
                </button>
              )}

              {/* Account Button */}
              <button
                type="button"
                onClick={() => {
                  if (user) {
                    navigateTo('profile');
                  } else {
                    setIsAuthModalOpen(true);
                  }
                }}
                className="hidden sm:flex items-center gap-2 px-3 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-semibold transition"
                title={user ? (user.firstName || user.name || 'Compte') : t.account}
              >
                <UserIcon className="w-4 h-4 text-slate-600" />
                <span className="max-w-[120px] truncate">
                  {user ? (user.firstName || user.name || 'Mon Compte') : t.account}
                </span>
              </button>

              {/* Cart Button */}
              <button
                type="button"
                onClick={() => setIsCartDrawerOpen(true)}
                className="relative flex items-center gap-2 px-3 py-2 bg-orange-50 hover:bg-orange-100 text-orange-900 rounded-lg text-xs font-bold transition border border-orange-200"
                aria-label={`Panier d'achats avec ${cartCount} articles`}
              >
                <div className="relative">
                  <ShoppingCart className="w-4 h-4 text-orange-600" />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-orange-600 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </div>
                <span className="hidden sm:inline">{t.cart || 'Panier'}</span>
              </button>
            </div>
          </div>

          {/* Mobile Search Row (Row 2 on Mobile - full width, max 2 rows total) */}
          <div className="mt-2.5 lg:hidden">
            <SearchBar />
          </div>
        </div>

        {/* 3. CATEGORY NAVIGATION BAR (Desktop / Tablet) */}
        <CategoryNav />
      </header>

      {/* Mobile Drawer Navigation */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
    </>
  );
};
