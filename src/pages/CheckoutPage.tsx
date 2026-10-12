import React, { useState } from 'react';
import {
  useStoreCart,
  useStoreNotifications,
  useStoreRouting,
  useStoreSettings,
} from '../context/StoreSlices';
import { CONFIG } from '../config/index';
import confetti from 'canvas-confetti';
import {
  Truck,
  ShieldCheck,
  MapPin,
  Phone,
  User,
  CheckCircle2,
  Banknote,
  Building,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  const { t, language, formatPrice } = useStoreSettings();
  const {
    cart,
    cartSubtotal,
    freeShippingThreshold,
    shippingFee,
    cartTotal,
    createOrder,
  } = useStoreCart();
  const { navigateTo } = useStoreRouting();
  const { showToast } = useStoreNotifications();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [governorate, setGovernorate] = useState('Tunis');
  const [delegation, setDelegation] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bank_transfer'>('cod');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const isFreeShipping = cartSubtotal >= freeShippingThreshold;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Phone validation
    const cleanPhone = customerPhone.replace(/[\s\-\(\)\.]/g, '').replace(/^\+216/, '');
    if (!/^[24579]\d{7}$/.test(cleanPhone)) {
      setErrorMessage('Numéro de téléphone tunisien invalide (8 chiffres commençant par 2, 4, 5, 7 ou 9).');
      showToast('Numéro de téléphone tunisien invalide.', 'error');
      return;
    }

    if (!customerName.trim() || !address.trim()) {
      setErrorMessage('Veuillez renseigner votre nom et votre adresse de livraison.');
      return;
    }

    if (cart.length === 0) {
      showToast('Votre panier est vide.', 'error');
      navigateTo('products');
      return;
    }

    try {
      setIsSubmitting(true);
      const order = await createOrder({
        customerName: customerName.trim(),
        customerPhone: cleanPhone,
        customerEmail: customerEmail.trim() || null,
        governorate,
        delegation: delegation.trim() || null,
        address: address.trim(),
        notes: notes.trim() || null,
        paymentMethod,
      });

      // Confetti celebration
      try {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      } catch {}

      showToast(t.orderConfirmed, 'success');
      navigateTo('order-success', { orderNumber: order.orderNumber });
    } catch (err: any) {
      const msg = err.message || 'Erreur lors de la création de la commande.';
      setErrorMessage(msg);
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
          <Truck className="w-6 h-6 text-orange-600" />
          <span>{t.checkoutTitle}</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Livraison rapide 24-48h par Aramex ou Express Colis sur les 24 gouvernorats de Tunisie
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          {/* 1. Contact Information */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-orange-600" />
              <span>1. Informations de Contact</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="checkout-name" className="text-xs font-semibold text-slate-700 block mb-1">
                  Nom et Prénom *
                </label>
                <input
                  id="checkout-name"
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ex: Mohamed Ben Mansour"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 outline-none focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="checkout-phone" className="text-xs font-semibold text-slate-700 block mb-1">
                  Téléphone Tunisien (8 chiffres) *
                </label>
                <input
                  id="checkout-phone"
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Ex: 26 383 876"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 outline-none focus:border-orange-500 font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="checkout-email" className="text-xs font-semibold text-slate-700 block mb-1">
                Adresse Email (optionnel pour facture pro-forma)
              </label>
              <input
                id="checkout-email"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="contact@exemple.tn"
                className="w-full text-xs p-3 rounded-xl border border-slate-200 outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* 2. Delivery Address in Tunisia */}
          <div className="space-y-4 pt-6 border-t border-slate-100">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-orange-600" />
              <span>2. Adresse de Livraison en Tunisie</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="checkout-governorate" className="text-xs font-semibold text-slate-700 block mb-1">
                  Gouvernorat (ولاية) *
                </label>
                <select
                  id="checkout-governorate"
                  value={governorate}
                  onChange={(e) => setGovernorate(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 outline-none focus:border-orange-500 bg-white"
                >
                  {CONFIG.store.governorates.map((gov) => (
                    <option key={gov.id} value={gov.nameFr}>
                      {gov.nameFr} ({gov.nameAr})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="checkout-delegation" className="text-xs font-semibold text-slate-700 block mb-1">
                  Mégadélégation / Ville
                </label>
                <input
                  id="checkout-delegation"
                  type="text"
                  value={delegation}
                  onChange={(e) => setDelegation(e.target.value)}
                  placeholder="Ex: Centre Ville, Menzeh, Ezzahra..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="checkout-address" className="text-xs font-semibold text-slate-700 block mb-1">
                Adresse Complète (Rue, Atelier, Immeuble, Étage) *
              </label>
              <input
                id="checkout-address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ex: Rue Ibn Khaldoun, Immeuble 12, Atelier GSM"
                className="w-full text-xs p-3 rounded-xl border border-slate-200 outline-none focus:border-orange-500"
                required
              />
            </div>

            <div>
              <label htmlFor="checkout-notes" className="text-xs font-semibold text-slate-700 block mb-1">
                Instructions particulières pour le livreur
              </label>
              <input
                id="checkout-notes"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Appeler 30 minutes avant le passage..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* 3. Payment Method */}
          <div className="space-y-3 pt-6 border-t border-slate-100">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Banknote className="w-4 h-4 text-orange-600" />
              <span>3. Mode de Paiement</span>
            </h2>

            <div className="space-y-2">
              <label
                onClick={() => setPaymentMethod('cod')}
                className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
                  paymentMethod === 'cod'
                    ? 'border-orange-600 bg-orange-50/40 ring-1 ring-orange-500'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  id="payment-cod"
                  type="radio"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                  className="mt-0.5 text-orange-600"
                />
                <div>
                  <strong className="text-xs text-slate-900 block">{t.payCod}</strong>
                  <span className="text-[11px] text-slate-500">
                    Payez en espèces en Dinars Tunisiens lors de la réception de votre colis.
                  </span>
                </div>
              </label>

              <label
                onClick={() => setPaymentMethod('bank_transfer')}
                className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
                  paymentMethod === 'bank_transfer'
                    ? 'border-orange-600 bg-orange-50/40 ring-1 ring-orange-500'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  id="payment-bank-transfer"
                  type="radio"
                  checked={paymentMethod === 'bank_transfer'}
                  onChange={() => setPaymentMethod('bank_transfer')}
                  className="mt-0.5 text-orange-600"
                />
                <div>
                  <strong className="text-xs text-slate-900 block">{t.payBank}</strong>
                  <span className="text-[11px] text-slate-500">
                    Virement bancaire BIAT ou mandat postal (RIB communiqué après validation).
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Summary (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5 h-fit">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100">
            Détails de la Facture
          </h2>

          <div className="space-y-3 max-h-60 overflow-y-auto pr-1 divide-y divide-slate-100">
            {cart.map((item, idx) => (
              <div key={idx} className="pt-2 flex justify-between text-xs">
                <div className="truncate pr-2">
                  <span className="font-bold text-orange-600">{item.quantity}x </span>
                  <span className="text-slate-800">{item.product.name as string}</span>
                </div>
                <strong className="text-slate-900 flex-shrink-0">
                  {formatPrice((item.product.priceTND || 0) * item.quantity)}
                </strong>
              </div>
            ))}
          </div>

          <div className="space-y-2 text-xs text-slate-600 pt-3 border-t border-slate-100">
            <div className="flex justify-between">
              <span>{t.subtotal}</span>
              <strong className="text-slate-900">{formatPrice(cartSubtotal)}</strong>
            </div>
            <div className="flex justify-between">
              <span>Frais de livraison</span>
              <strong className={isFreeShipping ? 'text-emerald-600' : 'text-slate-900'}>
                {isFreeShipping ? t.free : formatPrice(shippingFee)}
              </strong>
            </div>
            <div className="flex justify-between text-base font-black text-slate-900 pt-3 border-t border-slate-200">
              <span>{t.total} à payer</span>
              <span className="text-orange-600 text-lg">{formatPrice(cartTotal)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || cart.length === 0}
            className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs sm:text-sm transition shadow-xl shadow-orange-600/30 disabled:bg-slate-300"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>{isSubmitting ? 'Traitement en cours...' : 'Confirmer ma Commande'}</span>
          </button>

          <p className="text-[11px] text-slate-500 text-center leading-relaxed">
            En confirmant, vous recevrez un appel de notre service logistique pour planifier l’heure de livraison.
          </p>
        </div>
      </form>
    </div>
  );
};
