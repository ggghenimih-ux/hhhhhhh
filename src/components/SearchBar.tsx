import React, { useState, useRef, useEffect } from 'react';
import { useStoreProducts, useStoreRouting, useStoreSettings } from '../context/StoreSlices';
import { Search, X, ChevronRight } from 'lucide-react';
import { Product } from '../types';

interface SearchBarProps {
  className?: string;
  onSearchSubmitted?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ className = '', onSearchSubmitted }) => {
  const { t, language, formatPrice } = useStoreSettings();
  const { filters, setFilters, products, getLocalizedName, getProductPrice } = useStoreProducts();
  const { navigateTo } = useStoreRouting();

  const [query, setQuery] = useState(filters.searchQuery || '');
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync internal query when filters change outside
  useEffect(() => {
    setQuery(filters.searchQuery || '');
  }, [filters.searchQuery]);

  // Live matching on input
  useEffect(() => {
    const trimmed = query.trim().toLowerCase();
    if (trimmed.length >= 2) {
      const matches = products
        .filter((p) => {
          const name = getLocalizedName(p).toLowerCase();
          const brand = (p.specs?.brand || p.specifications?.brand || p.brand || '').toLowerCase();
          const sku = (p.sku || '').toLowerCase();
          return name.includes(trimmed) || brand.includes(trimmed) || sku.includes(trimmed);
        })
        .slice(0, 5);

      setSuggestions(matches);
      setIsOpen(true);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  }, [query, products, getLocalizedName]);

  // Close when clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters((prev) => ({
      ...prev,
      searchQuery: query.trim(),
    }));
    setIsOpen(false);
    navigateTo('products');
    if (onSearchSubmitted) {
      onSearchSubmitted();
    }
  };

  const handleClear = () => {
    setQuery('');
    setFilters((prev) => ({
      ...prev,
      searchQuery: '',
    }));
    setIsOpen(false);
  };

  const handleSelectProduct = (product: Product) => {
    setIsOpen(false);
    navigateTo('product-detail', { productSlug: product.slug, productId: product.id });
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <form
        onSubmit={handleSubmit}
        className="relative flex items-center w-full bg-slate-50 border border-slate-300 rounded-lg focus-within:border-orange-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-orange-100 transition-all overflow-hidden"
      >
        <div className="pl-3 pr-2 text-slate-400 flex items-center justify-center">
          <Search className="w-4 h-4" />
        </div>

        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.searchPlaceholder || 'Rechercher une station, microscope, IC, outil...'}
          className="w-full py-2.5 px-1 text-sm bg-transparent text-slate-900 placeholder:text-slate-400 outline-none"
          autoComplete="off"
        />

        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1.5 mr-1 text-slate-400 hover:text-slate-700 transition"
            aria-label="Effacer la recherche"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          type="submit"
          className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold px-4 py-2.5 transition self-stretch flex items-center justify-center flex-shrink-0"
        >
          {language === 'ar' ? 'بحث' : 'Rechercher'}
        </button>
      </form>

      {/* Autocomplete Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden divide-y divide-slate-100">
          <div className="px-3 py-1.5 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            {t.productsFound || 'Produits correspondants'} ({suggestions.length})
          </div>

          <div className="max-h-72 overflow-y-auto">
            {suggestions.map((p) => {
              const name = getLocalizedName(p);
              const price = getProductPrice(p);
              const image = p.images?.[0] || p.image;

              return (
                <div
                  key={p.id}
                  onClick={() => handleSelectProduct(p)}
                  className="p-2.5 hover:bg-slate-50 cursor-pointer flex items-center gap-3 transition"
                >
                  <div className="w-10 h-10 bg-slate-100 rounded border border-slate-200 flex-shrink-0 overflow-hidden">
                    {image?.trim() ? (
                      <img
                        src={image.trim()}
                        alt={name}
                        loading="lazy"
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">GSM</div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-900 truncate">{name}</p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span>{p.specs?.brand || p.specifications?.brand || p.brand || 'GSM'}</span>
                      <span>·</span>
                      <span className="font-bold text-orange-600">{formatPrice(price)}</span>
                    </div>
                  </div>

                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            className="w-full py-2 px-3 text-center text-xs font-semibold text-orange-600 hover:bg-orange-50 transition block"
          >
            {language === 'ar' ? `عرض كافة النتائج لـ "${query}"` : `Voir tous les résultats pour "${query}"`}
          </button>
        </div>
      )}
    </div>
  );
};
