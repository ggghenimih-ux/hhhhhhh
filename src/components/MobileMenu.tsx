import React from 'react';
import { useStore } from '../context/StoreContext';
import {
  X,
  Phone,
  Truck,
  User as UserIcon,
  Package,
  Wrench,
  Flame,
  Eye,
  Zap,
  Cpu,
  Smartphone,
  Layers,
  ChevronRight,
  Globe
} from 'lucide-react';
import { Logo } from './Logo';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose }) => {
  const {
    t,
    language,
    setLanguage,
    user,
    setFilters,
    navigateTo,
    setIsAuthModalOpen,
    setIsTrackOrderModalOpen
  } = useStore();

  if (!isOpen) return null;

  const categories = [
    { id: 'equipments-tools', name: { ar: 'معدات وأدوات', fr: 'Équipements & Outils', en: 'Equipment & Tools' }, icon: Wrench },
    { id: 'soldering-hot-air', name: { ar: 'لحام وهواء ساخن', fr: 'Soudure & BGA', en: 'Soldering & Rework' }, icon: Flame },
    { id: 'microscopes', name: { ar: 'ميكروسكوبات', fr: 'Microscopes & Optique', en: 'Microscopes' }, icon: Eye },
    { id: 'power-supplies', name: { ar: 'مزودات طاقة', fr: 'Alimentation & Test', en: 'Power Supplies' }, icon: Zap },
    { id: 'programmers', name: { ar: 'مبرمجات وبوكسات', fr: 'Programmeurs & Dongles', en: 'Programmers' }, icon: Cpu },
    { id: 'spare-parts', name: { ar: 'قطع غيار', fr: 'Pièces Détachées', en: 'Spare Parts' }, icon: Smartphone },
    { id: 'consumables', name: { ar: 'مستهلكات ولحام', fr: 'Consommables & Étain', en: 'Consumables' }, icon: Layers },
  ];

  const handleCategoryClick = (catId: string) => {
    setFilters((prev) => ({
      ...prev,
      category: catId,
      subcategory: null,
    }));
    onClose();
    navigateTo('products');
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
      <div className="relative w-full max-w-xs bg-white h-full flex flex-col shadow-2xl z-10 overflow-y-auto">
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
            onClick={() => {
              onClose();
              if (user) {
                navigateTo('profile');
              } else {
                setIsAuthModalOpen(true);
              }
            }}
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
              setIsTrackOrderModalOpen(true);
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
              const Icon = cat.icon;
              const label = cat.name[language] || cat.name.fr;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 text-slate-800 text-xs font-medium transition text-start"
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-slate-500" />
                    <span>{label}</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Admin Navigation Shortcut */}
        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={() => {
              onClose();
              navigateTo(user?.role === 'ADMIN' ? 'admin' : 'admin-login');
            }}
            className="w-full flex items-center justify-between text-xs text-slate-600 hover:text-orange-600 font-semibold py-1.5 transition"
          >
            <span>{language === 'ar' ? '⚙️ فضاء إدارة المتجر' : '⚙️ Espace Administration'}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>

        {/* Footer Support Hotline */}
        <div className="p-4 bg-slate-50 border-t border-slate-200">
          <p className="text-[11px] text-slate-500 mb-2">
            {language === 'ar' ? 'خدمة العملاء والطلبات:' : 'Assistance & Commandes :'}
          </p>
          <a
            href="tel:+21626383876"
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-orange-600 text-white rounded-lg text-xs font-bold shadow-xs hover:bg-orange-700 transition"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>+216 26 383 876</span>
          </a>
        </div>
      </div>
    </div>
  );
};
