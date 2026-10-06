import React from 'react';
import { useStore } from '../context/StoreContext';
import {
  Wrench,
  Flame,
  Eye,
  Zap,
  Cpu,
  Smartphone,
  Layers,
  LayoutGrid
} from 'lucide-react';

interface CategoryNavProps {
  className?: string;
}

export const CategoryNav: React.FC<CategoryNavProps> = ({ className = '' }) => {
  const { language, filters, setFilters, navigateTo } = useStore();

  const coreCategories = [
    {
      id: 'all',
      name: { ar: 'جميع الأقسام', fr: 'Tous les rayons', en: 'All Categories' },
      icon: LayoutGrid,
    },
    {
      id: 'equipments-tools',
      name: { ar: 'معدات وأدوات', fr: 'Équipements & Outils', en: 'Equipment & Tools' },
      icon: Wrench,
    },
    {
      id: 'soldering-hot-air',
      name: { ar: 'لحام وهواء ساخن', fr: 'Soudure & BGA', en: 'Soldering & Rework' },
      icon: Flame,
    },
    {
      id: 'microscopes',
      name: { ar: 'ميكروسكوبات', fr: 'Microscopes & Optique', en: 'Microscopes' },
      icon: Eye,
    },
    {
      id: 'power-supplies',
      name: { ar: 'مزودات طاقة', fr: 'Alimentation & Test', en: 'Power Supplies' },
      icon: Zap,
    },
    {
      id: 'programmers',
      name: { ar: 'مبرمجات وبوكسات', fr: 'Programmeurs & Dongles', en: 'Programmers' },
      icon: Cpu,
    },
    {
      id: 'spare-parts',
      name: { ar: 'قطع غيار', fr: 'Pièces Détachées', en: 'Spare Parts' },
      icon: Smartphone,
    },
    {
      id: 'consumables',
      name: { ar: 'مستهلكات ولحام', fr: 'Consommables & Étain', en: 'Consumables' },
      icon: Layers,
    },
  ];

  const handleSelect = (categoryId: string) => {
    if (categoryId === 'all') {
      setFilters((prev) => ({
        ...prev,
        category: null,
        subcategory: null,
      }));
    } else {
      setFilters((prev) => ({
        ...prev,
        category: categoryId,
        subcategory: null,
      }));
    }
    navigateTo('products');
  };

  const isSelected = (id: string) => {
    if (id === 'all') return !filters.category;
    return filters.category === id;
  };

  return (
    <nav
      className={`border-b border-slate-200 bg-white ${className}`}
      aria-label="Catégories principales"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
          {coreCategories.map((cat) => {
            const Icon = cat.icon;
            const active = isSelected(cat.id);
            const label = cat.name[language] || cat.name.fr;

            return (
              <button
                key={cat.id}
                onClick={() => handleSelect(cat.id)}
                type="button"
                className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex-shrink-0 ${
                  active
                    ? 'bg-slate-900 text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-orange-400' : 'text-slate-400'}`} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
