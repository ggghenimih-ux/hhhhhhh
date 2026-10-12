import React from 'react';
import { useStoreProducts, useStoreSettings, useStoreRouting } from '../context/StoreSlices';
import { LayoutGrid, Package } from 'lucide-react';

interface CategoryNavProps {
  className?: string;
}

export const CategoryNav: React.FC<CategoryNavProps> = ({ className = '' }) => {
  const { language } = useStoreSettings();
  const { filters, setFilters, categories, getLocalizedName } = useStoreProducts();
  const { navigateTo } = useStoreRouting();

  const handleSelect = (slug: string | null) => {
    setFilters((prev) => ({
      ...prev,
      category: slug,
      subcategory: null,
    }));
    if (slug) {
      navigateTo('category', { categorySlug: slug });
    } else {
      navigateTo('products');
    }
  };

  return (
    <nav
      className={`border-b border-slate-200 bg-white ${className}`}
      aria-label="Catégories principales"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            type="button"
            onClick={() => handleSelect(null)}
            className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex-shrink-0 ${
              !filters.category
                ? 'bg-slate-900 text-white font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <LayoutGrid className={`w-3.5 h-3.5 ${!filters.category ? 'text-orange-400' : 'text-slate-400'}`} />
            <span>{language === 'ar' ? 'جميع الأقسام' : 'Tous les rayons'}</span>
          </button>
          {categories.map((category) => {
            const active = filters.category === category.slug;
            return (
              <button
                key={category.id}
                onClick={() => handleSelect(category.slug)}
                type="button"
                className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex-shrink-0 ${
                  active
                    ? 'bg-slate-900 text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Package className={`w-3.5 h-3.5 ${active ? 'text-orange-400' : 'text-slate-400'}`} />
                <span>{getLocalizedName(category)}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
