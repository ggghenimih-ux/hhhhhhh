import React from 'react';
import { useStore } from '../context/StoreContext';
import { X, RotateCcw, Check } from 'lucide-react';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  availableBrands: string[];
}

export const FilterDrawer: React.FC<FilterDrawerProps> = ({
  isOpen,
  onClose,
  availableBrands,
}) => {
  const {
    t,
    language,
    categories,
    filters,
    setFilters,
    resetFilters,
    getLocalizedName,
  } = useStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex lg:hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="relative ms-auto w-full max-w-xs bg-white h-full flex flex-col shadow-2xl z-10 overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">{t.filters || 'Filtres'}</h3>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={resetFilters}
              className="p-1.5 text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 rounded"
              title="Réinitialiser"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t.clearFilters || 'Effacer'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-200"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters Body */}
        <div className="p-4 space-y-6 flex-1">
          {/* Categories */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
              {t.categories || 'Catégories'}
            </h4>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setFilters((prev) => ({ ...prev, category: null, subcategory: null }))}
                className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition text-start ${
                  !filters.category
                    ? 'bg-slate-900 text-white font-bold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>{t.allCategories || 'Toutes les catégories'}</span>
                {!filters.category && <Check className="w-3.5 h-3.5" />}
              </button>

              {categories.map((c) => {
                const active = filters.category === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        category: active ? null : c.id,
                        subcategory: null,
                      }))
                    }
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition text-start ${
                      active
                        ? 'bg-slate-900 text-white font-bold'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{getLocalizedName(c)}</span>
                    {active && <Check className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Brands */}
          {availableBrands.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
                {t.brand || 'Marques'}
              </h4>
              <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                {availableBrands.map((b) => {
                  const active = filters.brand === b;
                  return (
                    <label
                      key={b}
                      className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-50 cursor-pointer text-xs text-slate-700 select-none"
                    >
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={() =>
                          setFilters((prev) => ({
                            ...prev,
                            brand: active ? null : b,
                          }))
                        }
                        className="rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                      />
                      <span>{b}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Availability & Deals Toggles */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer text-xs text-slate-700 select-none">
              <span>{t.inStockOnly || 'En stock uniquement'}</span>
              <input
                type="checkbox"
                checked={filters.inStockOnly}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, inStockOnly: e.target.checked }))
                }
                className="rounded border-slate-300 text-orange-600 focus:ring-orange-500"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer text-xs text-slate-700 select-none">
              <span>{t.onSaleOnly || 'En promotion'}</span>
              <input
                type="checkbox"
                checked={filters.discountOnly}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, discountOnly: e.target.checked }))
                }
                className="rounded border-slate-300 text-orange-600 focus:ring-orange-500"
              />
            </label>
          </div>
        </div>

        {/* Footer Apply Button */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 sticky bottom-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-[44px] flex items-center justify-center bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-lg shadow-xs transition"
          >
            {language === 'ar' ? 'عرض النتائج' : 'Appliquer les filtres'}
          </button>
        </div>
      </div>
    </div>
  );
};
