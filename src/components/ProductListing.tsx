import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from './ProductCard';
import { FilterDrawer } from './FilterDrawer';
import {
  SlidersHorizontal,
  X,
  RotateCcw,
  Search,
  Check
} from 'lucide-react';

export const ProductListing: React.FC = () => {
  const {
    t,
    language,
    formatPrice,
    getLocalizedName,
    categories,
    filters,
    setFilters,
    resetFilters,
    filteredProducts,
    products
  } = useStore();

  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Extract unique brands from catalogue
  const availableBrands: string[] = Array.from(
    new Set(
      products
        .map((p) => p.specs?.brand || p.specifications?.brand || p.brand || '')
        .filter((b): b is string => Boolean(b))
    )
  ).sort();

  return (
    <section id="products-grid" className="py-6 bg-slate-50 min-h-screen">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top Control Bar: Results count, active filters & Sort selector */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Mobile Filter toggle button */}
            <button
              type="button"
              onClick={() => setIsMobileFiltersOpen(true)}
              className="lg:hidden inline-flex items-center gap-2 min-h-[40px] px-3 py-1.5 rounded-lg bg-slate-100 text-slate-800 text-xs font-semibold hover:bg-slate-200 transition"
            >
              <SlidersHorizontal className="w-4 h-4 text-orange-600" />
              <span>{t.filters || 'Filtres'}</span>
            </button>

            {/* Total Results Count */}
            <div className="text-xs text-slate-600">
              <span className="font-bold text-slate-900">{filteredProducts.length}</span>{' '}
              {t.productsFound || 'produits trouvés'}
            </div>

            {/* Active filter tags */}
            {filters.category && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-orange-50 text-orange-800 text-xs font-medium border border-orange-200">
                <span>{getLocalizedName(categories.find((c) => c.id === filters.category)) || filters.category}</span>
                <button
                  type="button"
                  onClick={() => setFilters((prev) => ({ ...prev, category: null, subcategory: null }))}
                  className="hover:text-orange-950 p-0.5"
                  aria-label="Supprimer le filtre de catégorie"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.brand && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 text-slate-800 text-xs font-medium border border-slate-200">
                <span>{filters.brand}</span>
                <button
                  type="button"
                  onClick={() => setFilters((prev) => ({ ...prev, brand: null }))}
                  className="hover:text-slate-950 p-0.5"
                  aria-label="Supprimer le filtre de marque"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.searchQuery && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-50 text-blue-800 text-xs font-medium border border-blue-200">
                <span>« {filters.searchQuery} »</span>
                <button
                  type="button"
                  onClick={() => setFilters((prev) => ({ ...prev, searchQuery: '' }))}
                  className="hover:text-blue-950 p-0.5"
                  aria-label="Effacer le filtre de recherche"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>

          {/* Right: Sort selector */}
          <div className="flex items-center gap-2 ms-auto">
            <label htmlFor="sort-select" className="text-xs text-slate-500 font-medium hidden sm:inline">
              {t.sortBy || 'Trier par'} :
            </label>
            <select
              id="sort-select"
              value={filters.sortBy}
              onChange={(e) => setFilters((prev) => ({ ...prev, sortBy: e.target.value as any }))}
              className="bg-slate-50 border border-slate-300 text-slate-900 text-xs font-semibold rounded-lg px-2.5 py-2 outline-none cursor-pointer focus:border-orange-500"
            >
              <option value="popularity">{t.sortPopularity || 'Popularité'}</option>
              <option value="price-asc">{t.sortPriceAsc || 'Prix croissant'}</option>
              <option value="price-desc">{t.sortPriceDesc || 'Prix décroissant'}</option>
              <option value="rating">{t.sortRating || 'Mieux notés'}</option>
              <option value="newest">{t.sortNewest || 'Nouveautés'}</option>
            </select>
          </div>
        </div>

        {/* Main Grid: Sidebar Filters (Desktop) + Products Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* DESKTOP SIDEBAR FILTERS (1 col) */}
          <aside className="hidden lg:block space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-900">
                  {t.filters || 'Filtres'}
                </span>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-xs text-orange-600 hover:text-orange-700 flex items-center gap-1 font-medium"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{t.clearFilters || 'Effacer'}</span>
                </button>
              </div>

              {/* Categories */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 mb-2">
                  {t.categories || 'Catégories'}
                </h4>
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setFilters((prev) => ({ ...prev, category: null, subcategory: null }))}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition text-start ${
                      !filters.category
                        ? 'bg-slate-900 text-white font-semibold'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
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
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition text-start ${
                          active
                            ? 'bg-slate-900 text-white font-semibold'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
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
                <div className="pt-3 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-900 mb-2">
                    {t.brand || 'Marques'}
                  </h4>
                  <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                    {availableBrands.map((b) => {
                      const active = filters.brand === b;
                      return (
                        <label
                          key={b}
                          className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-slate-50 cursor-pointer text-xs text-slate-700 select-none"
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

              {/* Price Filter */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">{t.priceRange || 'Prix maximum'}</span>
                  <span className="font-bold text-orange-600">{formatPrice(filters.maxPrice)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2000"
                  step="25"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters((prev) => ({ ...prev, maxPrice: Number(e.target.value) }))}
                  className="w-full accent-orange-600 cursor-pointer"
                  aria-label="Prix maximum"
                />
                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>0 DT</span>
                  <span>2000 DT</span>
                </div>
              </div>

              {/* Toggles */}
              <div className="pt-3 border-t border-slate-100 space-y-1.5">
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={filters.inStockOnly}
                    onChange={(e) => setFilters((prev) => ({ ...prev, inStockOnly: e.target.checked }))}
                    className="rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                  />
                  <span>{t.inStockOnly || 'En stock uniquement'}</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={filters.discountOnly}
                    onChange={(e) => setFilters((prev) => ({ ...prev, discountOnly: e.target.checked }))}
                    className="rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                  />
                  <span>{t.onSaleOnly || 'En promotion'}</span>
                </label>
              </div>
            </div>
          </aside>

          {/* PRODUCTS LIST GRID (3 cols on desktop) */}
          <main className="lg:col-span-3">
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center border border-slate-200 space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  {t.noProductsFound || 'Aucun produit trouvé'}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {language === 'ar'
                    ? 'لم يتم العثور على أي منتج يطابق معايير التصفية المحددة. جرّب إعادة ضبط الفلاتر.'
                    : 'Aucun article ne correspond à vos filtres actuels. Réinitialisez la recherche ou les filtres.'}
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center justify-center min-h-[44px] px-5 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs transition"
                >
                  {t.clearFilters || 'Réinitialiser les filtres'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 min-[380px]:grid-cols-2 md:grid-cols-3">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* MOBILE FILTERS DRAWER */}
      <FilterDrawer
        isOpen={isMobileFiltersOpen}
        onClose={() => setIsMobileFiltersOpen(false)}
        availableBrands={availableBrands}
      />
    </section>
  );
};
