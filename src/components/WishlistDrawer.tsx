import React from 'react';
import { useStore } from '../context/StoreContext';
import { getSafeImageUrl, handleImageError } from '../utils/image';
import {
  X,
  Heart,
  ShoppingCart,
  Trash2,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

export const WishlistDrawer: React.FC = () => {
  const {
    t,
    language,
    formatPrice,
    getLocalizedName,
    getProductPrice,
    wishlist,
    products,
    toggleWishlist,
    addToCart,
    isWishlistDrawerOpen,
    setIsWishlistDrawerOpen,
    setDetailProduct
  } = useStore();

  if (!isWishlistDrawerOpen) return null;

  const savedProducts = products.filter(p => wishlist.includes(p.id));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        onClick={() => setIsWishlistDrawerOpen(false)}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between border-l border-slate-200">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white">
                <Heart className="w-4 h-4 fill-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold tracking-tight">
                  {t.wishlist} ({savedProducts.length})
                </h2>
                <span className="text-[11px] text-slate-400">
                  Vos équipements sauvegardés
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsWishlistDrawerOpen(false)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* List */}
          <div className="p-4 sm:p-5 overflow-y-auto flex-1 divide-y divide-slate-100">
            {savedProducts.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 mb-1">
                  Votre liste de favoris est vide.
                </h3>
                <p className="text-xs text-slate-500 mb-6 max-w-xs mx-auto">
                  Cliquez sur le cœur d'un produit pour le retrouver facilement plus tard.
                </p>
                <button
                  onClick={() => setIsWishlistDrawerOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md transition"
                >
                  Découvrir les produits
                </button>
              </div>
            ) : (
              savedProducts.map(product => {
                const name = getLocalizedName(product);

                return (
                  <div key={product.id} className="py-3.5 flex gap-3 items-center">
                    <img
                      src={getSafeImageUrl(product.images?.[0] || product.image)}
                      alt={name}
                      onError={(e) => handleImageError(e)}
                      onClick={() => {
                        setIsWishlistDrawerOpen(false);
                        setDetailProduct(product);
                      }}
                      className="w-16 h-16 rounded-xl object-cover border border-slate-200 cursor-pointer flex-shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <h4
                        onClick={() => {
                          setIsWishlistDrawerOpen(false);
                          setDetailProduct(product);
                        }}
                        className="text-xs font-bold text-slate-900 line-clamp-1 cursor-pointer hover:text-orange-600 transition"
                      >
                        {name}
                      </h4>
                      <div className="text-[11px] font-mono text-slate-400">
                        {product.sku || product.slug || product.id.slice(0, 8)}
                      </div>
                      <div className="text-xs font-black text-orange-600 mt-1">
                        {formatPrice(getProductPrice(product))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => {
                          addToCart(product, 1);
                        }}
                        disabled={product.stock <= 0}
                        className="p-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white transition disabled:bg-slate-200"
                        title={t.addToCart}
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleWishlist(product.id)}
                        className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 transition"
                        title="Supprimer des favoris"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {savedProducts.length > 0 && (
            <div className="p-4 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => {
                  savedProducts.forEach(p => addToCart(p, 1));
                  setIsWishlistDrawerOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Ajouter tous les favoris au panier</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
