import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import {
  X,
  ShieldCheck,
  Truck,
  CheckCircle2,
  Banknote,
  CreditCard,
  Building,
  MapPin,
  Phone,
  User,
  Mail,
  FileText,
  AlertCircle
} from 'lucide-react';
import { CONFIG } from '../../server/config';
import confetti from 'canvas-confetti';
import { PaymentMethod } from '../types';

export const CheckoutModal: React.FC = () => {
  const {
    t,
    language,
    formatPrice,
    getLocalizedName,
    getProductPrice,
    cart,
    cartSubtotal,
    freeShippingThreshold,
    couponCode,
    discountRate,
    isCheckoutModalOpen,
    setIsCheckoutModalOpen,
    createOrder,
    setLastPlacedOrder,
    showToast
  } = useStore();

  // Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [secondaryPhone, setSecondaryPhone] = useState('');
  const [email, setEmail] = useState('');
  const [selectedGov, setSelectedGov] = useState('tunis');
  const [city, setCity] = useState('');
  const [street, setStreet] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [notes, setNotes] = useState('');

  // Shipping & Payment Methods
  const [deliveryType, setDeliveryType] = useState<'express' | 'pickup'>('express');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isCheckoutModalOpen) return null;

  const currentGov = CONFIG.SHIPPING.governorates.find(g => g.id === selectedGov);
  const isFreeShipping = cartSubtotal >= freeShippingThreshold;
  const shippingFee = deliveryType === 'pickup'
    ? 0
    : isFreeShipping
    ? 0
    : (currentGov?.fee || CONFIG.SHIPPING.standardRate);

  const discountAmount = Math.round(cartSubtotal * discountRate);
  const finalTotal = Math.max(0, cartSubtotal - discountAmount + shippingFee);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !phone.trim() || !street.trim()) {
      showToast('Veuillez remplir votre nom, téléphone et adresse.', 'error');
      return;
    }

    if (cart.length === 0) {
      showToast('Votre panier est vide.', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const order = await createOrder({
        customerName: `${firstName} ${lastName}`.trim(),
        customerEmail: email || 'client@gsm.tn',
        customerPhone: phone,
        paymentMethod,
        shippingAddress: {
          firstName,
          lastName,
          phone,
          secondaryPhone,
          governorate: currentGov?.nameFr || selectedGov,
          city: city || currentGov?.nameFr || 'Tunis',
          street,
          postalCode: postalCode || '1000'
        },
        notes: `${deliveryType === 'pickup' ? '[RETRAIT MAGASIN TUNIS] ' : ''}${notes}`.trim()
      });

      // Confetti celebration
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch (err) {
        // Safe fallback
      }

      setIsCheckoutModalOpen(false);
      showToast(t.orderConfirmed, 'success');
    } catch (err) {
      showToast('Erreur lors de la validation. Veuillez réessayer.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center text-white">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold tracking-tight">
                {t.checkoutTitle}
              </h2>
              <span className="text-[11px] text-slate-400">
                Livraison rapide partout en Tunisie & Paiement à la réception
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsCheckoutModalOpen(false)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmitOrder} className="p-5 sm:p-7 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Shipping & Contact Details (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* 1. Contact Information */}
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-orange-600" />
                  <span>1. {t.contactInfo}</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      {t.firstName} *
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Ex: Mohamed"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none focus:border-orange-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      {t.lastName} *
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Ex: Ben Mansour"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none focus:border-orange-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      {t.phone} *
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ex: 26 383 876"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none focus:border-orange-500 font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      {t.altPhone}
                    </label>
                    <input
                      type="tel"
                      value={secondaryPhone}
                      onChange={(e) => setSecondaryPhone(e.target.value)}
                      placeholder="Optionnel"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none focus:border-orange-500 font-mono"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    {t.email} (Pour confirmation et facture)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@exemple.tn"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* 2. Delivery Address in Tunisia */}
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-orange-600" />
                  <span>2. {t.shippingAddress}</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      {t.governorate} (ولاية) *
                    </label>
                    <select
                      value={selectedGov}
                      onChange={(e) => setSelectedGov(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none focus:border-orange-500 bg-white"
                    >
                      {CONFIG.SHIPPING.governorates.map(gov => (
                        <option key={gov.id} value={gov.id}>
                          {gov.nameFr} ({gov.nameAr}) - {gov.fee.toFixed(3)} DT
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      {t.city} (Délégation / Cité) *
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Ex: Centre Ville, Ennasr, Menzeh..."
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none focus:border-orange-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      {t.street} *
                    </label>
                    <input
                      type="text"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="Rue, N° de porte, Nom de l'atelier..."
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none focus:border-orange-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      {t.postalCode}
                    </label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="Ex: 1000"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none focus:border-orange-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    {t.deliveryNotes}
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Instructions particulières pour le livreur (ex: appeler 30min avant)..."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* 3. Shipping Method */}
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-orange-600" />
                  <span>3. {t.shippingMethod}</span>
                </h3>
                <div className="space-y-2">
                  <label
                    onClick={() => setDeliveryType('express')}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                      deliveryType === 'express'
                        ? 'border-orange-500 bg-orange-50/40 ring-1 ring-orange-500'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        checked={deliveryType === 'express'}
                        onChange={() => setDeliveryType('express')}
                        className="text-orange-600"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          {t.shippingExpress}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Livraison à domicile par Aramex ou Express Colis
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-900">
                      {isFreeShipping ? t.free : formatPrice(currentGov?.fee || 7.0)}
                    </span>
                  </label>

                  <label
                    onClick={() => setDeliveryType('pickup')}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                      deliveryType === 'pickup'
                        ? 'border-orange-500 bg-orange-50/40 ring-1 ring-orange-500'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        checked={deliveryType === 'pickup'}
                        onChange={() => setDeliveryType('pickup')}
                        className="text-orange-600"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          {t.shippingPickup}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Tunis,tunis (Mardi-Dimanche 08h-16h)
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-600">
                      GRATUIT
                    </span>
                  </label>
                </div>
              </div>

              {/* 4. Payment Method */}
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-orange-600" />
                  <span>4. {t.paymentMethod}</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* COD */}
                  <label
                    onClick={() => setPaymentMethod('cod')}
                    className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-2.5 ${
                      paymentMethod === 'cod'
                        ? 'border-orange-500 bg-orange-50/40 ring-1 ring-orange-500'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      className="mt-0.5 text-orange-600"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900">{t.payCod}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Payez en dinars au coursier lors de la livraison
                      </div>
                    </div>
                  </label>

                  {/* Tunisian Card */}
                  <label
                    onClick={() => setPaymentMethod('credit_card')}
                    className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-2.5 ${
                      paymentMethod === 'credit_card'
                        ? 'border-orange-500 bg-orange-50/40 ring-1 ring-orange-500'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      checked={paymentMethod === 'credit_card'}
                      onChange={() => setPaymentMethod('credit_card')}
                      className="mt-0.5 text-orange-600"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900">{t.payCard}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Paiement sécurisé via ClicToPay / GIM-TEL
                      </div>
                    </div>
                  </label>

                  {/* Bank Transfer */}
                  <label
                    onClick={() => setPaymentMethod('bank_transfer')}
                    className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-2.5 ${
                      paymentMethod === 'bank_transfer'
                        ? 'border-orange-500 bg-orange-50/40 ring-1 ring-orange-500'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      checked={paymentMethod === 'bank_transfer'}
                      onChange={() => setPaymentMethod('bank_transfer')}
                      className="mt-0.5 text-orange-600"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900">{t.payBank}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Virement BIAT ou mandat postal
                      </div>
                    </div>
                  </label>

                  {/* Stripe */}
                  <label
                    onClick={() => setPaymentMethod('stripe')}
                    className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-2.5 ${
                      paymentMethod === 'stripe'
                        ? 'border-orange-500 bg-orange-50/40 ring-1 ring-orange-500'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      checked={paymentMethod === 'stripe'}
                      onChange={() => setPaymentMethod('stripe')}
                      className="mt-0.5 text-orange-600"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900">{t.payStripe}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Cartes internationales Visa / MasterCard
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Right: Order Summary (5 cols) */}
            <div className="lg:col-span-5 bg-slate-50 rounded-2xl p-5 border border-slate-200 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-200">
                  Récapitulatif de Commande ({cart.length} articles)
                </h3>

                {/* Items preview */}
                <div className="space-y-3 max-h-56 overflow-y-auto pr-1 divide-y divide-slate-200">
                  {cart.map((item, i) => {
                    const price = getProductPrice(item.product) + (item.selectedVariant?.priceAdjustment || 0);
                    return (
                      <div key={i} className="pt-2 flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-bold text-orange-600 text-xs">{item.quantity}x</span>
                          <span className="text-slate-800 truncate font-medium">
                            {getLocalizedName(item.product)}
                          </span>
                        </div>
                        <span className="font-bold text-slate-900 flex-shrink-0">
                          {formatPrice(price * item.quantity)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Price Breakdown */}
                <div className="mt-5 pt-4 border-t border-slate-200 space-y-2 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>{t.subtotal}</span>
                    <span className="font-semibold text-slate-900">{formatPrice(cartSubtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Remise code promo</span>
                      <span>-{formatPrice(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Frais d'expédition ({selectedGov})</span>
                    <span className={`font-semibold ${shippingFee === 0 ? 'text-emerald-600 font-bold' : 'text-slate-900'}`}>
                      {shippingFee === 0 ? t.free : formatPrice(shippingFee)}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                    <span className="text-sm font-black text-slate-900">{t.total} TTC</span>
                    <span className="text-xl font-black text-orange-600">
                      {formatPrice(finalTotal)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-white rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Facture Pro-Forma avec TVA incluse</span>
                  </div>
                  <p>Confirmation immédiate par SMS et appel téléphonique de notre service logistique.</p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="mt-6">
                <button
                  type="submit"
                  disabled={isSubmitting || cart.length === 0}
                  className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl text-sm font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-xl shadow-orange-600/30 transition transform hover:-translate-y-0.5 cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{isSubmitting ? t.orderProcessing : t.confirmOrder}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
