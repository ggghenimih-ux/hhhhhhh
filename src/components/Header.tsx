import React, { useState } from 'react';
import { useStoreCart, useStoreRouting, useStoreSettings } from '../context/StoreSlices';
import { useAuth } from '../context/AuthContext';
import { ShoppingBasket, Truck, Phone, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Logo } from './Logo';
import { SearchBar } from './SearchBar';
import { CategoryNav } from './CategoryNav';
import { AccountDrawer } from './AccountDrawer';

export const Header: React.FC = () => {
  const { language, settings, formatPrice } = useStoreSettings();
  const { cartCount, setIsCartDrawerOpen } = useStoreCart();
  const { navigateTo } = useStoreRouting();
  const { user } = useAuth();
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const displayPhone = settings.phone?.trim() || '';
  const topShippingLine = language === 'ar'
    ? `توصيل سريع في كامل تونس · مصاريف الشحن: ${formatPrice(settings.defaultShippingTND)}`
    : language === 'en'
      ? `Express delivery across Tunisia · Fee: ${formatPrice(settings.defaultShippingTND)}`
      : `Livraison express sur toute la Tunisie · Frais : ${formatPrice(settings.defaultShippingTND)}`;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[#E3E8F0] bg-white shadow-sm">
        <div className="bg-[#0F1B2D] text-white">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-5 gap-y-1 px-4 py-2 text-[10px] sm:px-6 sm:text-xs lg:px-8">
            <span className="flex items-center gap-2 text-white/85">
              <Truck className="h-3.5 w-3.5 shrink-0 text-orange-400" />
              {topShippingLine}
            </span>
            <div className="flex items-center gap-3 sm:gap-5">
              <span className="hidden items-center gap-1.5 text-white/75 sm:flex">
                <CheckCircle2 className="h-3.5 w-3.5 text-orange-400" />
                {language === 'ar' ? 'الدفع عند الاستلام' : language === 'en' ? 'Cash on delivery' : 'Paiement à la livraison'}
              </span>
              {displayPhone && (
                <a
                  href={`tel:${displayPhone.replace(/[\s\-().]/g, '')}`}
                  className="flex items-center gap-1.5 whitespace-nowrap text-white/85 transition hover:text-white"
                >
                  <Phone className="h-3.5 w-3.5 text-orange-400" />
                  {displayPhone}
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <Logo size="sm" showTagline={false} className="min-w-0 max-w-[42%] sm:max-w-[32%] lg:max-w-[25%]" />

            <div className="hidden min-w-0 flex-1 px-5 lg:block">
              <SearchBar className="mx-auto max-w-2xl" />
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setIsCartDrawerOpen(true)}
                className="relative inline-flex h-10 items-center gap-2 rounded-xl border border-[#E3E8F0] bg-white px-2.5 text-xs font-bold text-[#0F1B2D] transition hover:border-orange-200 hover:bg-orange-50 sm:px-4"
                aria-label={`${language === 'ar' ? 'سلة التسوق' : language === 'en' ? 'Cart' : 'Panier'} (${cartCount})`}
              >
                <ShoppingBasket className="h-4 w-4 text-[#D63F06]" />
                <span className="hidden sm:inline">{language === 'ar' ? 'السلة' : language === 'en' ? 'Cart' : 'Panier'}</span>
                {cartCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#D63F06] px-1 text-[10px] font-black text-white">
                    {cartCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsAccountOpen(true)}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#0F1B2D] px-2.5 text-[10px] font-bold text-white transition hover:bg-[#192b45] sm:gap-2 sm:px-4 sm:text-xs"
                aria-haspopup="dialog"
                aria-expanded={isAccountOpen}
              >
                {user?.role === 'ADMIN' && <ShieldCheck className="hidden h-4 w-4 text-orange-300 sm:block" />}
                <span>Mon compte</span>
                <span className="text-white/60" aria-hidden="true">·</span>
                <span lang="ar" dir="rtl">حسابي</span>
              </button>

              {user?.role === 'ADMIN' && (
                <button
                  type="button"
                  onClick={() => navigateTo('admin')}
                  className="hidden items-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold text-[#0F1B2D] hover:bg-[#F3F5F9] xl:inline-flex"
                >
                  <ShieldCheck className="h-4 w-4 text-orange-700" />
                  Espace Administration
                </button>
              )}
            </div>
          </div>

          <div className="mt-3 lg:hidden">
            <SearchBar />
          </div>
        </div>

        <CategoryNav />
      </header>

      <AccountDrawer isOpen={isAccountOpen} onClose={() => setIsAccountOpen(false)} />
    </>
  );
};

export default Header;
