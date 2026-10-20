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
      className={`border-b border-[#E3E8F0] bg-white ${className}`}
      aria-label={language === 'ar' ? 'الفئات الرئيسية' : language === 'en' ? 'Main categories' : 'Catégories principales'}
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 overflow-x-auto py-2.5 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            type="button"
            onClick={() => handleSelect(null)}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-full border px-4 py-2 text-xs font-semibold transition-colors flex-shrink-0 ${
              !filters.category
                ? 'border-[#0F1B2D] bg-[#0F1B2D] text-white shadow-sm'
                : 'border-[#E3E8F0] bg-white text-[#5B6B82] hover:border-[#0F1B2D] hover:text-[#0F1B2D]'
            }`}
          >
            <LayoutGrid className={`w-3.5 h-3.5 ${!filters.category ? 'text-orange-400' : 'text-slate-400'}`} />
            <span>{language === 'ar' ? 'جميع المنتجات' : language === 'en' ? 'All products' : 'Tous les produits'}</span>
          </button>
          {categories.filter((category) => category.isActive !== false).map((category) => {
            const active = filters.category === category.slug;
            return (
              <button
                key={category.id}
                onClick={() => handleSelect(category.slug)}
                type="button"
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-full border px-4 py-2 text-xs font-semibold transition-colors flex-shrink-0 ${
                  active
                    ? 'border-[#0F1B2D] bg-[#0F1B2D] text-white shadow-sm'
                    : 'border-[#E3E8F0] bg-white text-[#5B6B82] hover:border-[#0F1B2D] hover:text-[#0F1B2D]'
                }`}
              >
                <Package className={`w-3.5 h-3.5 ${active ? 'text-orange-300' : 'text-[#0F1B2D]'}`} />
                <span>{getLocalizedName(category)}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
