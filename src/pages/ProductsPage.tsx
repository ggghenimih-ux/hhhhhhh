import React, { useEffect } from 'react';
import { ProductListing } from '../components/ProductListing';
import { useStore } from '../context/StoreContext';
import { AlertCircle, RefreshCw, Wrench } from 'lucide-react';

export const ProductsPage: React.FC = () => {
  const {
    t,
    language,
    productsError,
    isLoadingProducts,
    refreshProducts,
    routeParams,
    filters,
    setFilters,
  } = useStore();

  useEffect(() => {
    const categorySlug = routeParams.categorySlug;
    if (categorySlug && categorySlug !== filters.category) {
      setFilters((prev) => ({ ...prev, category: categorySlug, subcategory: null }));
    }
  }, [routeParams.categorySlug]);

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 mb-4">
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
          <span>{t.home}</span>
          <span>/</span>
          <span className="text-slate-900 font-bold">{t.shop}</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Wrench className="w-6 h-6 text-orange-600" />
              <span>{language === 'ar' ? 'كتالوج معدات وقطع غيار GSM' : 'Catalogue Outillage & Matériel GSM'}</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {language === 'ar'
                ? 'استعرض جميع المعدات المتوفرة في تونس مع الأسعار الرسمية والضمان'
                : 'Tous les équipements disponibles en Tunisie avec tarifs en Dinar Tunisien et garantie'}
            </p>
          </div>
        </div>
      </div>

      {productsError ? (
        <div className="mx-auto max-w-xl px-4 py-16 text-center">
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-rose-600" />
          <p className="mb-4 text-sm text-rose-700">{productsError}</p>
          <button
            type="button"
            onClick={() => void refreshProducts()}
            disabled={isLoadingProducts}
            className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-xs font-bold text-white disabled:bg-slate-300"
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingProducts ? 'animate-spin' : ''}`} />
            {language === 'ar' ? 'إعادة المحاولة' : 'Réessayer'}
          </button>
        </div>
      ) : (
        <ProductListing />
      )}
    </div>
  );
};
