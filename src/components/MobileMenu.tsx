import React from 'react';
import { useStoreProducts, useStoreRouting, useStoreSettings } from '../context/StoreSlices';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Phone,
  Truck,
  User as UserIcon,
  Package,
  ChevronRight,
  Globe
} from 'lucide-react';
import { Logo } from './Logo';
import { useDialogAccessibility } from '../hooks/useDialogAccessibility';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose }) => {
  const { t, language, setLanguage, settings } = useStoreSettings();
  const { categories, getLocalizedName, setFilters } = useStoreProducts();
  const { navigateTo } = useStoreRouting();
  const { user } = useAuth();
  const dialogRef = useDialogAccessibility(isOpen, onClose);

  if (!isOpen) return null;

  const handleCategoryClick = (slug: string) => {
    setFilters((prev) => ({
      ...prev,
      category: slug,
      subcategory: null,
    }));
    onClose();
    navigateTo('category', { categorySlug: slug });
  };

  const handleAccountClick = () => {
    onClose();
    navigateTo(user ? 'profile' : 'login');
  };

  return (
    <div className="fixed inset-0 z-50 flex lg:hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={language === 'ar' ? 'القائمة' : 'Menu'}
        tabIndex={-1}
        className="relative w-full max-w-xs bg-white h-full flex flex-col shadow-2xl z-10 overflow-y-auto"
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <Logo size="sm" showTagline={false} />
          <button
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-200 transition"
            aria-label="Fermer le menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Language Selection */}
        <div className="p-4 border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
            <span className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span>{language === 'ar' ? 'اللغة' : 'Langue'}</span>
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg text-xs">
            <button
              onClick={() => setLanguage('ar')}
              className={`py-1.5 rounded font-medium transition ${
                language === 'ar' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600'
              }`}
            >
              العربية
            </button>
            <button
              onClick={() => setLanguage('fr')}
              className={`py-1.5 rounded font-medium transition ${
                language === 'fr' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600'
              }`}
            >
              Français
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`py-1.5 rounded font-medium transition ${
                language === 'en' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600'
              }`}
            >
              English
            </button>
          </div>
        </div>

        {/* Quick Action Navigation */}
        <div className="p-2 border-b border-slate-200">
          <button
            onClick={handleAccountClick}
            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 text-slate-800 text-sm font-medium transition text-start"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                <UserIcon className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-xs text-slate-900">
                  {user ? (user.firstName || user.name || 'Mon Compte') : t.account}
                </p>
                <p className="text-[11px] text-slate-500">
                  {user ? user.email : (language === 'ar' ? 'تسجيل الدخول / إنشاء حساب' : 'Connexion / Inscription')}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            onClick={() => {
              onClose();
              navigateTo('track-order');
            }}
            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 text-slate-800 text-sm font-medium transition text-start"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-xs text-slate-900">{t.trackOrder}</p>
                <p className="text-[11px] text-slate-500">
                  {language === 'ar' ? 'تتبع شحنتك بالرقم المرجعي' : 'Vérifier statut livraison'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Category List */}
        <div className="flex-1 p-2">
          <p className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {language === 'ar' ? 'التصنيفات' : 'Rayons'}
          </p>
          <div className="space-y-0.5">
            <button
              onClick={() => {
                setFilters((prev) => ({ ...prev, category: null, subcategory: null }));
                onClose();
                navigateTo('products');
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 text-slate-800 text-xs font-semibold transition text-start"
            >
              <span className="flex items-center gap-2.5">
                <Package className="w-4 h-4 text-orange-600" />
                <span>{language === 'ar' ? 'جميع المنتجات (الكتالوج)' : 'Tous les produits'}</span>
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {categories.map((cat) => {
              const label = getLocalizedName(cat);
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.slug)}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 text-slate-800 text-xs font-medium transition text-start"
                >
                  <span className="flex items-center gap-2.5">
                    <Package className="w-4 h-4 text-slate-500" />
                    <span>{label}</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              );
            })}
          </div>
        </div>

        {user?.role === 'ADMIN' && (
          <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50">
            <button
              onClick={() => {
                onClose();
                navigateTo('admin');
              }}
              className="w-full flex items-center justify-between text-xs text-slate-600 hover:text-orange-600 font-semibold py-1.5 transition"
            >
              <span>{language === 'ar' ? '⚙️ فضاء إدارة المتجر' : '⚙️ Espace Administration'}</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        )}

        {/* Footer Support Hotline */}
        <div className="p-4 bg-slate-50 border-t border-slate-200">
          <p className="text-[11px] text-slate-500 mb-2">
            {language === 'ar' ? 'خدمة العملاء والطلبات:' : 'Assistance & Commandes :'}
          </p>
          <a
            href={`tel:${settings.phone.replace(/[\s\-\(\)]/g, '')}`}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-orange-600 text-white rounded-lg text-xs font-bold shadow-xs hover:bg-orange-700 transition"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>{settings.phone}</span>
          </a>
        </div>
      </div>
    </div>
  );
};
