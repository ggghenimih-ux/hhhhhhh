import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { getSafeImageUrl, handleImageError } from '../utils/image';
import { MAX_ORDER_QUANTITY } from '../utils/stock';
import {
  ShoppingCart,
  Trash2,
  Minus,
  Plus,
  ArrowRight,
  Truck,
  CheckCircle2,
  Tag,
  ShieldCheck,
  ShoppingBag,
} from 'lucide-react';

export const CartPage: React.FC = () => {
  const {
    t,
    language,
    formatPrice,
    cart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartSubtotal,
    freeShippingThreshold,
    shippingFee,
    cartTotal,
    couponCode,
    setCouponCode,
    discountRate,
    navigateTo,
    getLocalizedName,
    getProductPrice,
    showToast,
  } = useStore();

  const [coupon, setCoupon] = useState('');
  const discountAmount = Math.round(cartSubtotal * discountRate * 1000) / 1000;

  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - cartSubtotal);
  const isFreeShipping = cartSubtotal >= freeShippingThreshold;
  const finalTotal = cartTotal;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (coupon.trim()) {
      setCouponCode(coupon);
      setCoupon('');
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">{t.cartEmpty}</h2>
        <p className="text-xs text-slate-500 mb-6 max-w-sm mx-auto">
          Votre panier d'outillage est vide. Parcourez nos stations de soudage, microscopes et pièces détachées.
        </p>
        <button
          onClick={() => navigateTo('products')}
          className="px-6 py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs transition shadow-md"
        >
          {t.startShopping}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
          <ShoppingCart className="w-6 h-6 text-orange-600" />
          <span>{t.cartTitle} ({cart.reduce((s, i) => s + i.quantity, 0)} articles)</span>
        </h1>
        <button
          onClick={clearCart}
          className="text-xs text-slate-500 hover:text-rose-600 transition"
        >
          Vider le panier
        </button>
      </div>

      {/* Free Shipping Progress */}
      <div className="p-4 bg-orange-50 rounded-2xl border border-orange-200">
        <div className="flex items-center justify-between text-xs font-bold text-orange-950 mb-2">
          <span className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-orange-600" />
            {isFreeShipping ? (
              <span className="text-emerald-700">{t.freeShippingReached}</span>
            ) : (
              <span>
                Plus que <strong>{formatPrice(remainingForFreeShipping)}</strong> pour bénéficier de la livraison GRATUITE partout en Tunisie !
              </span>
            )}
          </span>
        </div>
        <div className="w-full h-2.5 bg-orange-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-300"
            style={{
              width: `${Math.min(100, (cartSubtotal / freeShippingThreshold) * 100)}%`,
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Cart Items Table (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm divide-y divide-slate-100">
          {cart.map((item, idx) => {
            const price = getProductPrice(item.product) + (item.selectedVariant?.priceAdjustment || 0);
            const name = getLocalizedName(item.product);
            const img = getSafeImageUrl(item.product.images?.[0] || item.product.image);

            return (
              <div key={idx} className="py-4 flex items-center gap-4">
                <img
                  src={img}
                  alt={name}
                  loading="lazy"
                  width={80}
                  height={80}
                  onError={(e) => handleImageError(e)}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-slate-200 flex-shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <h3
                    onClick={() => navigateTo('product-detail', { productSlug: item.product.slug })}
                    className="text-xs sm:text-sm font-bold text-slate-900 truncate hover:text-orange-600 cursor-pointer"
                  >
                    {name}
                  </h3>
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                    {item.product.category}
                  </div>
                  <div className="text-xs font-black text-orange-600 mt-1">
                    {formatPrice(price)}
                  </div>
                </div>

                {/* Quantity */}
                <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-1">
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.selectedVariant?.id)}
                    aria-label={`Diminuer la quantité de ${name}`}
                    className="p-1.5 hover:bg-white text-slate-600 transition"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-3 text-xs font-bold text-slate-900 min-w-[24px] text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.selectedVariant?.id)}
                    aria-label={`Augmenter la quantité de ${name}`}
                    className="p-1.5 hover:bg-white text-slate-600 transition"
                    disabled={item.quantity >= MAX_ORDER_QUANTITY}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Total Item Price */}
                <div className="text-right min-w-[70px]">
                  <strong className="text-xs sm:text-sm font-black text-slate-900 block">
                    {formatPrice(price * item.quantity)}
                  </strong>
                  <button
                    onClick={() => removeFromCart(item.product.id, item.selectedVariant?.id)}
                    aria-label={`Supprimer ${name} du panier`}
                    className="text-slate-400 hover:text-rose-600 text-xs mt-1"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4 ml-auto" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Summary & Order CTA (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5 h-fit">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100">
            Résumé de la Commande
          </h2>

          {/* Coupon */}
          <form onSubmit={handleApplyCoupon} className="flex gap-2">
            <label htmlFor="cart-page-coupon" className="sr-only">Code promo</label>
            <input
              id="cart-page-coupon"
              type="text"
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              placeholder="Code promo (ex: GSM10)"
              className="flex-1 text-xs px-3 py-2.5 rounded-xl border border-slate-200 outline-none uppercase font-mono"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition"
            >
              Appliquer
            </button>
          </form>

          {discountAmount > 0 && (
            <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-700 text-xs flex justify-between items-center">
              <span>Remise Promo (10%)</span>
              <strong>-{formatPrice(discountAmount)}</strong>
            </div>
          )}

          <div className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
            <div className="flex justify-between">
              <span>{t.subtotal}</span>
              <strong className="text-slate-900">{formatPrice(cartSubtotal)}</strong>
            </div>
            <div className="flex justify-between">
              <span>{t.shipping}</span>
              <strong className={isFreeShipping ? 'text-emerald-600' : 'text-slate-900'}>
                {isFreeShipping ? t.free : formatPrice(shippingFee)}
              </strong>
            </div>
            <div className="flex justify-between text-base font-black text-slate-900 pt-3 border-t border-slate-200">
              <span>{t.total}</span>
              <span className="text-orange-600">{formatPrice(finalTotal)}</span>
            </div>
          </div>

          <button
            onClick={() => navigateTo('checkout')}
            className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs sm:text-sm transition shadow-lg shadow-orange-600/30"
          >
            <span>Passer à la caisse</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="text-[11px] text-slate-500 text-center flex items-center justify-center gap-1.5 pt-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Paiement 100% sécurisé ou en espèces à la livraison</span>
          </div>
        </div>
      </div>
    </div>
  );
};
