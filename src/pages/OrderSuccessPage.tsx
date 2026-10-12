import React, { useEffect, useState } from 'react';
import { useStore } from '../context/StoreContext';
import { api } from '../services/api';
import { Order } from '../types';
import {
  CheckCircle2,
  Printer,
  Package,
  Phone,
  ArrowRight,
  FileText,
  MapPin,
} from 'lucide-react';

export const OrderSuccessPage: React.FC = () => {
  const { t, formatPrice, lastPlacedOrder, routeParams, navigateTo, settings } = useStore();
  const [order, setOrder] = useState<Order | null>(lastPlacedOrder);
  const [isLoading, setIsLoading] = useState(!lastPlacedOrder);

  useEffect(() => {
    if (!lastPlacedOrder && routeParams.orderNumber) {
      setIsLoading(true);
      api.orders
        .getByNumber(routeParams.orderNumber)
        .then((res) => {
          if (res?.data) setOrder(res.data);
        })
        .catch(() => {})
        .finally(() => setIsLoading(false));
    }
  }, [lastPlacedOrder, routeParams.orderNumber]);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center text-xs text-slate-500">
        Chargement des détails de la commande...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Aucune commande récente trouvée.</h2>
        <button
          onClick={() => navigateTo('home')}
          className="px-5 py-2.5 rounded-xl bg-orange-600 text-white font-bold text-xs"
        >
          Retour à l'accueil
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Top Banner */}
      <div className="bg-emerald-600 text-white p-6 sm:p-8 rounded-3xl text-center space-y-2 shadow-lg">
        <div className="w-14 h-14 bg-white text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2 shadow-md">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h1 className="text-xl sm:text-2xl font-black">{t.orderConfirmed}</h1>
        <p className="text-xs text-emerald-100 max-w-md mx-auto">
          {t.orderSuccessMessage}
        </p>
      </div>

      {/* Invoice Receipt Body */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">{t.orderNumber}</span>
            <strong className="text-base sm:text-lg font-mono text-slate-900">{order.orderNumber}</strong>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Date</span>
            <strong className="text-xs text-slate-900">
              {new Date(order.createdAt).toLocaleDateString()}
            </strong>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Statut</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              {order.status}
            </span>
          </div>
        </div>

        {/* Customer & Address */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
            <span className="text-[10px] uppercase font-bold text-orange-600 block">Destinataire</span>
            <strong className="text-slate-900 block">{order.customerName}</strong>
            <span className="text-slate-600 block">Tél : {order.customerPhone}</span>
            {order.customerEmail && <span className="text-slate-600 block">{order.customerEmail}</span>}
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
            <span className="text-[10px] uppercase font-bold text-orange-600 block">Adresse de Livraison</span>
            <span className="text-slate-800 font-medium block">{order.address}</span>
            <span className="text-slate-600 block">Gouvernorat : {order.governorate}</span>
            {order.delegation && <span className="text-slate-600 block">Délégation : {order.delegation}</span>}
          </div>
        </div>

        {/* Items Table */}
        <div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
            Articles de la commande
          </h3>
          <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 text-xs">
            {order.items.map((item, idx) => (
              <div key={idx} className="p-3.5 flex justify-between items-center bg-white">
                <div>
                  <div className="font-bold text-slate-900">{item.productName || item.name}</div>
                  <div className="text-[11px] text-slate-400">
                    Quantité : {item.quantity} × {formatPrice(item.priceTND || item.price)}
                  </div>
                </div>
                <strong className="text-slate-900">
                  {formatPrice(item.totalTND || (item.priceTND || 0) * item.quantity)}
                </strong>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5 text-xs text-slate-600">
          <div className="flex justify-between">
            <span>{t.subtotal}</span>
            <strong className="text-slate-900">{formatPrice(order.subtotalTND ?? order.subtotal)}</strong>
          </div>
          <div className="flex justify-between">
            <span>Frais de livraison</span>
            <strong className="text-slate-900">
              {(order.shippingTND ?? order.shippingCost) === 0
                ? t.free
                : formatPrice(order.shippingTND ?? order.shippingCost)}
            </strong>
          </div>
          {order.discountAmount ? (
            <div className="flex justify-between text-emerald-700">
              <span>Réduction {order.couponCode ? `(${order.couponCode})` : ''}</span>
              <strong>-{formatPrice(order.discountAmount)}</strong>
            </div>
          ) : null}
          <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
            <span>{t.total} à régler</span>
            <span className="text-orange-600">{formatPrice(order.totalTND ?? order.totalPrice)}</span>
          </div>
        </div>

        {/* Hotline notice */}
        <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 flex items-center gap-3">
          <Phone className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div>
            <strong>Support commercial & logistique :</strong>
            <p className="text-[11px] text-amber-800">
              Pour toute question, contactez notre équipe au <strong>{settings.phone}</strong> (Mardi - Dimanche 08:00 - 16:00).
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition"
          >
            <Printer className="w-4 h-4" />
            <span>{t.printOrder}</span>
          </button>

          <button
            onClick={() => navigateTo('track-order', { orderNumber: order.orderNumber })}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition shadow-md"
          >
            <Package className="w-4 h-4" />
            <span>Suivre l'acheminement de la commande →</span>
          </button>
        </div>
      </div>
    </div>
  );
};
