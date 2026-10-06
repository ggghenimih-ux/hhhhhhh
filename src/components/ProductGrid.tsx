import React from 'react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';
import { useStore } from '../context/StoreContext';
import { PackageOpen } from 'lucide-react';

interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  isLoading = false,
  emptyMessage,
  className = '',
}) => {
  const { language, resetFilters } = useStore();

  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 gap-4 min-[380px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 ${className}`}>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse space-y-3">
            <div className="w-full aspect-square bg-slate-100 rounded-lg" />
            <div className="h-4 bg-slate-100 rounded w-2/3" />
            <div className="h-4 bg-slate-100 rounded w-full" />
            <div className="h-6 bg-slate-100 rounded w-1/3" />
            <div className="h-10 bg-slate-100 rounded w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center max-w-md mx-auto my-8 space-y-4">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
          <PackageOpen className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">
            {emptyMessage || (language === 'ar' ? 'لا توجد منتجات مطابقة' : 'Aucun produit trouvé')}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'ar'
              ? 'جرّب تغيير كلمات البحث أو إعادة ضبط خيارات التصفية'
              : 'Essayez de modifier vos critères de recherche ou réinitialisez les filtres.'}
          </p>
        </div>
        <button
          type="button"
          onClick={resetFilters}
          className="inline-flex items-center justify-center min-h-[44px] px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition"
        >
          {language === 'ar' ? 'إعادة ضبط الفلاتر' : 'Réinitialiser les filtres'}
        </button>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 gap-4 min-[380px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 ${className}`}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};
