import React from 'react';
import {
  useStoreCart,
  useStoreProducts,
  useStoreRouting,
  useStoreSettings,
} from '../context/StoreSlices';
import { getSafeImageUrl, handleImageError } from '../utils/image';
import { useDialogAccessibility } from '../hooks/useDialogAccessibility';
import {
  X,
  ShoppingCart,
  Trash2,
  Minus,
  Plus,
  ArrowRight,
  Truck,
  ShieldCheck
} from 'lucide-react';

export const CartDrawer: React.FC = () => {
  const { t, language, formatPrice } = useStoreSettings();
  const { getLocalizedName, getProductPrice } = useStoreProducts();
  const {
    cart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartSubtotal,
    freeShippingThreshold,
    shippingFee,
    cartTotal,
    isCartDrawerOpen,
    setIsCartDrawerOpen,
  } = useStoreCart();
  const { navigateTo } = useStoreRouting();

  const dialogRef = useDialogAccessibility(isCartDrawerOpen, () => setIsCartDrawerOpen(false));

  if (!isCartDrawerOpen) return null;

  // Shipping calculation
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - cartSubtotal);
  const isFreeShipping = cartSubtotal >= freeShippingThreshold;
  const shippingCost = shippingFee;
  const finalTotal = cartTotal;

  const handleProceedToCheckout = () => {
    setIsCartDrawerOpen(false);
    navigateTo('checkout');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartDrawerOpen(false)}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
      />

      {/* Slide-over panel */}
      <div className="absolute inset-y-0 end-0 max-w-full flex ps-10">
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={t.cartTitle}
          tabIndex={-1}
          className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between border-s border-slate-200"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-white">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold tracking-tight">
                  {t.cartTitle} ({cart.reduce((s, i) => s + i.quantity, 0)})
                </h2>
                <span className="text-[11px] text-slate-400">
                  Outils Réparation GSM Tunisie
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsCartDrawerOpen(false)}
              aria-label={language === 'ar' ? 'إغلاق السلة' : 'Fermer le panier'}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Bar */}
          <div className="p-3 bg-orange-50 border-b border-orange-200/80">
            <div className="flex items-center justify-between text-xs font-bold text-orange-950 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-orange-600" />
                {isFreeShipping ? (
                  <span className="text-emerald-700">{t.freeShippingReached}</span>
                ) : (
                  <span>
                    Plus que <strong className="text-orange-600">{formatPrice(remainingForFreeShipping)}</strong> pour la livraison gratuite !
                  </span>
                )}
              </span>
            </div>
            <div className="w-full h-2 bg-orange-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-300"
                style={{
                  width: `${Math.min(100, (cartSubtotal / freeShippingThreshold) * 100)}%`
                }}
              />
            </div>
          </div>

          {/* Cart Item List */}
          <div className="p-4 sm:p-5 overflow-y-auto flex-1 divide-y divide-slate-100">
            {cart.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 mb-1">
                  {t.cartEmpty}
                </h3>
                <p className="text-xs text-slate-500 mb-6 max-w-xs mx-auto">
                  Découvrez nos stations de soudage, microscopes et outils de diagnostic professionnel.
                </p>
                <button
                  onClick={() => setIsCartDrawerOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md transition"
                >
                  {t.startShopping}
                </button>
              </div>
            ) : (
              cart.map((item, idx) => {
                const itemPrice = getProductPrice(item.product) + (item.selectedVariant?.priceAdjustment || 0);
                const name = getLocalizedName(item.product);

                return (
                  <div key={`${item.product.id}-${item.selectedVariant?.id || idx}`} className="py-3.5 flex gap-3">
                    <img
                      src={getSafeImageUrl(item.product.images?.[0] || item.product.image)}
                      alt={name}
                      loading="lazy"
                      width={64}
                      height={64}
                      onError={(e) => handleImageError(e)}
                      className="w-16 h-16 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                          {name}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.product.id, item.selectedVariant?.id)}
                          aria-label={`${language === 'ar' ? 'إزالة' : 'Supprimer'} ${name} ${language === 'ar' ? 'من السلة' : 'du panier'}`}
                          className="text-slate-400 hover:text-rose-500 p-0.5"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {item.selectedVariant && (
                        <div className="text-[10px] text-orange-600 font-semibold mt-0.5">
                          {item.selectedVariant.value}
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-2">
                        {/* Quantity controller */}
                        <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.selectedVariant?.id)}
                            aria-label={`${language === 'ar' ? 'إنقاص كمية' : 'Diminuer la quantité de'} ${name}`}
                            className="p-1 hover:bg-white text-slate-600 rounded-l-lg"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-xs font-bold text-slate-800 min-w-[20px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.selectedVariant?.id)}
                            aria-label={`${language === 'ar' ? 'زيادة كمية' : 'Augmenter la quantité de'} ${name}`}
                            className="p-1 hover:bg-white text-slate-600 rounded-r-lg"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <span className="text-xs font-black text-slate-900">
                            {formatPrice(itemPrice * item.quantity)}
                          </span>
                          {item.quantity > 1 && (
                            <span className="block text-[10px] text-slate-400">
                              {formatPrice(itemPrice)} / u
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer & Checkout Summary */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50">
              {/* Price details */}
              <div className="space-y-1.5 text-xs text-slate-600 mb-4">
                <div className="flex justify-between">
                  <span>{t.subtotal}</span>
                  <span className="font-semibold text-slate-900">{formatPrice(cartSubtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t.shipping}</span>
                  <span className={`font-semibold ${isFreeShipping ? 'text-emerald-600 font-bold' : 'text-slate-900'}`}>
                    {isFreeShipping ? t.free : formatPrice(shippingCost)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                  <span>{t.total}</span>
                  <span className="text-orange-600 text-base">{formatPrice(finalTotal)}</span>
                </div>
              </div>

              {/* Checkout CTA */}
              <button
                onClick={handleProceedToCheckout}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-600/30 transition transform hover:-translate-y-0.5 cursor-pointer"
              >
                <span>{t.checkout}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Paiement sécurisé ou espèces à la livraison</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
