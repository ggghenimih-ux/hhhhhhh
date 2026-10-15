import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { getSafeImageUrl, handleImageError } from '../utils/image';
import { useDialogAccessibility } from '../hooks/useDialogAccessibility';
import {
  X,
  Star,
  ShoppingCart,
  Heart,
  ShieldCheck,
  Truck,
  Minus,
  Plus
} from 'lucide-react';
import { Variant } from '../types';

export const ProductQuickView: React.FC = () => {
  const {
    t,
    language,
    formatPrice,
    getLocalizedName,
    getLocalizedDesc,
    getProductPrice,
    quickViewProduct,
    setQuickViewProduct,
    addToCart,
    toggleWishlist,
    isInWishlist,
    navigateTo
  } = useStore();

  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<Variant | undefined>(
    quickViewProduct?.variants?.[0]
  );
  const dialogRef = useDialogAccessibility(Boolean(quickViewProduct), () => setQuickViewProduct(null));

  if (!quickViewProduct) return null;

  const product = quickViewProduct;
  const name = getLocalizedName(product);
  const description = getLocalizedDesc(product);
  const isFavorited = isInWishlist(product.id);
  const basePrice = getProductPrice(product);
  const currentPrice = basePrice + (selectedVariant?.priceAdjustment || 0);

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedVariant);
    setQuickViewProduct(null);
  };

  const openFullDetail = () => {
    const p = quickViewProduct;
    setQuickViewProduct(null);
    navigateTo('product-detail', { productSlug: p.slug, productId: p.id });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={name}
        tabIndex={-1}
        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col md:flex-row"
      >
        {/* Close button */}
        <button
          onClick={() => setQuickViewProduct(null)}
          aria-label={language === 'ar' ? 'إغلاق تفاصيل المنتج' : 'Fermer les détails du produit'}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/90 hover:bg-white text-slate-500 hover:text-slate-900 shadow-md border border-slate-200 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left: Product Image */}
        <div className="md:w-1/2 bg-slate-50 p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-200">
          <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-white shadow-sm border border-slate-200">
            <img
              src={getSafeImageUrl(product.images?.[0] || product.image)}
              alt={name}
              loading="lazy"
              width={640}
              height={640}
              onError={(e) => handleImageError(e)}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="mt-4 flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1 font-medium text-emerald-600">
              <ShieldCheck className="w-4 h-4" /> 100% Authentique
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 font-medium text-slate-700">
              <Truck className="w-4 h-4 text-orange-500" /> Expédition 24h
            </span>
          </div>
        </div>

        {/* Right: Product Details & Purchase Form */}
        <div className="md:w-1/2 p-6 overflow-y-auto flex flex-col justify-between">
          <div>
            {/* Brand, SKU & Rating */}
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="px-2.5 py-0.5 rounded-md font-bold bg-orange-100 text-orange-700 uppercase">
                {product.specs?.brand || product.specifications?.brand || product.brand || 'GSM'}
              </span>
              <span className="font-mono text-slate-400 text-xs">
                SKU: {product.sku || product.slug || product.id.slice(0, 8)}
              </span>
            </div>

            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug mb-2">
              {name}
            </h2>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center text-amber-400">
                <Star className="w-4 h-4 fill-amber-400" />
              </div>
              <span className="text-xs font-bold text-slate-800">
                {(product.rating || 5).toFixed(1)}
              </span>
              <span className="text-xs text-slate-400">
                ({product.reviewsCount || 12} avis)
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-2xl font-black text-slate-900">
                {formatPrice(currentPrice)}
              </span>
              {(product.compareAtPriceTND || product.originalPrice) && (
                <span className="text-sm text-slate-400 line-through">
                  {formatPrice(product.compareAtPriceTND || product.originalPrice)}
                </span>
              )}
            </div>

            {/* Short Description */}
            <p className="text-xs text-slate-600 mb-4 line-clamp-3 leading-relaxed">
              {description}
            </p>

            {/* Variants if present */}
            {product.variants && product.variants.length > 0 && (
              <div className="mb-4">
                <label className="text-xs font-bold text-slate-700 block mb-2">
                  Options disponibles :
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v: Variant) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                        selectedVariant?.id === v.id
                          ? 'border-orange-600 bg-orange-50 text-orange-700 ring-1 ring-orange-500'
                          : 'border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {v.value} {v.priceAdjustment > 0 && `(+${formatPrice(v.priceAdjustment)})`}
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Action Row */}
          <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              {/* Quantity step */}
              <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-1">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  aria-label={language === 'ar' ? 'إنقاص الكمية' : 'Diminuer la quantité'}
                  className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition"
                  disabled={quantity <= 1}
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-3 text-xs font-bold text-slate-900 min-w-[28px] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(q => q + 1)}
                  aria-label={language === 'ar' ? 'زيادة الكمية' : 'Augmenter la quantité'}
                  className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Add to Cart */}
              <button
                onClick={handleAddToCart}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-md transition"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>{t.addToCart}</span>
              </button>

              {/* Wishlist button */}
              <button
                onClick={() => toggleWishlist(product.id)}
                className={`p-3 rounded-xl border transition ${
                  isFavorited
                    ? 'bg-rose-50 border-rose-300 text-rose-600'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
                title={t.addToWishlist}
                aria-label={isFavorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              >
                <Heart className={`w-4 h-4 ${isFavorited ? 'fill-rose-500' : ''}`} />
              </button>
            </div>

            {/* View full page button */}
            <button
              onClick={openFullDetail}
              className="text-xs text-center font-bold text-orange-600 hover:text-orange-700 hover:underline py-1"
            >
              Voir la fiche technique complète & avis clients →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
