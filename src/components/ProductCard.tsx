import React from 'react';
import { useStore } from '../context/StoreContext';
import { Product } from '../types';
import { getSafeImageUrl, handleImageError } from '../utils/image';
import { ShoppingCart, Star, Heart } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const {
    t,
    language,
    formatPrice,
    getLocalizedName,
    getProductPrice,
    addToCart,
    toggleWishlist,
    isInWishlist,
    setDetailProduct,
  } = useStore();

  const isFavorited = isInWishlist(product.id);
  const name = getLocalizedName(product);
  const price = getProductPrice(product);
  const originalPrice = product.compareAtPriceTND || product.originalPrice;
  const isOutOfStock = product.stock <= 0;
  const image = getSafeImageUrl(product.images?.[0] || product.image);

  const handleCardClick = () => {
    setDetailProduct(product);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOutOfStock) {
      addToCart(product, 1);
    }
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer h-full"
      role="article"
      aria-label={name}
    >
      {/* 1. Image Container (Fixed aspect-square, object-contain, clean white) */}
      <div className="relative aspect-square w-full bg-white p-3 flex items-center justify-center overflow-hidden border-b border-slate-100">
        <img
          src={image}
          alt={name}
          loading="lazy"
          onError={(e) => handleImageError(e)}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
        />

        {/* 2. Optional clean single badge (Discount or New) - max 1 badge */}
        <div className="absolute top-2.5 start-2.5 flex flex-col gap-1 pointer-events-none">
          {product.discount && product.discount > 0 ? (
            <span className="px-2 py-0.5 text-[11px] font-bold bg-rose-600 text-white rounded">
              -{product.discount}%
            </span>
          ) : product.isNew ? (
            <span className="px-2 py-0.5 text-[11px] font-bold bg-slate-900 text-white rounded">
              {language === 'ar' ? 'جديد' : 'Nouveau'}
            </span>
          ) : null}
        </div>

        {/* Wishlist quick action */}
        <button
          type="button"
          onClick={handleWishlist}
          className={`absolute top-2.5 end-2.5 p-1.5 rounded-full border transition-colors ${
            isFavorited
              ? 'bg-rose-50 text-rose-600 border-rose-200'
              : 'bg-white/90 text-slate-400 hover:text-rose-500 border-slate-200'
          }`}
          aria-label={isFavorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          <Heart className={`w-3.5 h-3.5 ${isFavorited ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>
      </div>

      {/* Product Content (Fixed padding, min-height for uniformity) */}
      <div className="p-3.5 flex-1 flex flex-col justify-between">
        <div className="space-y-1.5">
          {/* Brand tag (unboxed text) */}
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            {product.specs?.brand || product.specifications?.brand || product.brand || 'GSM Tunisie'}
          </div>

          {/* 3. Product Name (line-clamp-2, uniform min-height) */}
          <h3 className="text-xs sm:text-sm font-semibold text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-2 min-h-[2.5rem] leading-snug">
            {name}
          </h3>

          {/* 4. Rating concise */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <div className="flex items-center text-amber-500">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            </div>
            <span className="font-semibold text-slate-700">{product.rating || 4.8}</span>
            <span className="text-[11px] text-slate-400">({product.reviewsCount || 12})</span>
          </div>
        </div>

        {/* 5. Price & 6. Stock Status */}
        <div className="pt-3 mt-2 border-t border-slate-100 space-y-1">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-base sm:text-lg font-black text-slate-900">
              {formatPrice(price)}
            </span>
            {originalPrice && originalPrice > price && (
              <span className="text-xs text-slate-400 line-through">
                {formatPrice(originalPrice)}
              </span>
            )}
          </div>

          {/* 6. Stock Status (Clean unboxed indicator) */}
          <div className="text-[11px] font-medium">
            {isOutOfStock ? (
              <span className="text-slate-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 inline-block" />
                <span>{language === 'ar' ? 'غير متوفر حالياً' : 'Rupture de stock'}</span>
              </span>
            ) : (
              <span className="text-emerald-700 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                <span>{language === 'ar' ? 'متوفر بالمخزن' : 'En stock'}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 7. Single Primary Add to Cart Button (Bottom of card, 44px min-h) */}
      <div className="p-3 pt-0">
        <button
          type="button"
          disabled={isOutOfStock}
          onClick={handleAddToCart}
          className={`w-full min-h-[44px] flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition ${
            isOutOfStock
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              : 'bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white shadow-xs'
          }`}
          aria-label={isOutOfStock ? 'Indisponible' : `Ajouter ${name} au panier`}
        >
          <ShoppingCart className="w-4 h-4 flex-shrink-0" />
          <span>
            {isOutOfStock
              ? (language === 'ar' ? 'نفذت الكمية' : 'Indisponible')
              : (language === 'ar' ? 'أضف للسلة' : 'Ajouter au Panier')}
          </span>
        </button>
      </div>
    </div>
  );
};
