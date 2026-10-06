import React from 'react';
import { useStore } from '../context/StoreContext';
import {
  CheckCircle2,
  Printer,
  Download,
  Package,
  Phone,
  Truck,
  ArrowRight,
  X,
  FileText
} from 'lucide-react';
import { CONFIG } from '../../server/config';

export const OrderSuccessModal: React.FC = () => {
  const {
    t,
    language,
    formatPrice,
    lastPlacedOrder,
    setLastPlacedOrder,
    setIsTrackOrderModalOpen
  } = useStore();

  if (!lastPlacedOrder) return null;

  const order = lastPlacedOrder;

  const handlePrint = () => {
    window.print();
  };

  const handleOpenTracking = () => {
    setLastPlacedOrder(null);
    setIsTrackOrderModalOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[95vh] flex flex-col">
        {/* Top Success Banner */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-6 text-center relative">
          <button
            onClick={() => setLastPlacedOrder(null)}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 rounded-full bg-white text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-lg">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            {t.orderConfirmed}
          </h2>
          <p className="text-xs text-emerald-100 max-w-md mx-auto mt-1">
            {t.orderSuccessMessage}
          </p>
        </div>

        {/* Invoice Body (Printable Area) */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Order Details Header */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">{t.orderNumber}</span>
              <strong className="text-slate-900 font-mono">{order.orderNumber}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Date</span>
              <strong className="text-slate-900">{new Date(order.createdAt).toLocaleDateString()}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">{t.trackingNumber}</span>
              <strong className="text-orange-600 font-mono">{order.trackingNumber}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Transporteur</span>
              <strong className="text-slate-900">{order.carrierName}</strong>
            </div>
          </div>

          {/* Customer & Delivery address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-white rounded-xl border border-slate-200">
              <h4 className="font-bold text-slate-900 mb-2 uppercase text-[11px] text-orange-600">
                Destinataire & Contact
              </h4>
              <p className="font-semibold text-slate-800">{order.customerName}</p>
              <p className="text-slate-600">Tél : {order.customerPhone}</p>
              <p className="text-slate-600">{order.customerEmail}</p>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200">
              <h4 className="font-bold text-slate-900 mb-2 uppercase text-[11px] text-orange-600">
                Adresse de Livraison
              </h4>
              <p className="text-slate-800 font-medium">{order.address || order.shippingAddress?.street || 'Adresse client'}</p>
              <p className="text-slate-600">
                {order.delegation || order.shippingAddress?.city || ''} {order.governorate || order.shippingAddress?.governorate || 'Tunisie'}
              </p>
              <p className="text-slate-600">Transporteur : {order.carrierName || 'Aramex Express'}</p>
            </div>
          </div>

          {/* Itemized Table */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 mb-2">
              Articles commandés
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
              {order.items.map((item, idx) => (
                <div key={idx} className="p-3 flex items-center justify-between gap-3 bg-white">
                  <div className="flex items-center gap-2.5 truncate">
                    {item.image && item.image.trim() !== '' ? (
                      <img
                        src={item.image.trim()}
                        alt={item.name || item.productName}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                        className="w-10 h-10 rounded-lg object-cover border border-slate-100 flex-shrink-0"
                      />
                    ) : null}
                    <div className="truncate">
                      <div className="font-bold text-slate-900 truncate">{item.name || item.productName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        SKU: {item.sku || 'REF'} × {item.quantity}
                      </div>
                    </div>
                  </div>
                  <div className="font-bold text-slate-900 flex-shrink-0">
                    {formatPrice((item.priceTND ?? item.price ?? 0) * item.quantity)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Totals */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>{t.subtotal}</span>
              <span className="font-semibold text-slate-900">{formatPrice(order.subtotalTND ?? order.subtotal ?? 0)}</span>
            </div>
            {Boolean(order.discountAmount && order.discountAmount > 0) && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Remise Code Promo</span>
                <span>-{formatPrice(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>{t.shipping}</span>
              <span className="font-semibold text-slate-900">
                {(order.shippingTND ?? order.shippingCost ?? 0) === 0 ? t.free : formatPrice(order.shippingTND ?? order.shippingCost)}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline font-black text-slate-900">
              <span className="text-sm">{t.total} à payer</span>
              <span className="text-lg text-orange-600">{formatPrice(order.totalTND ?? order.totalPrice)}</span>
            </div>
          </div>

          {/* Hotline contact notice */}
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-center gap-3">
            <Phone className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <span className="font-bold">Besoin d'aide ou modification de commande ?</span>
              <p className="text-[11px] text-amber-800">
                Contactez notre magasin au <strong>+216 26 383 876</strong> (Mardi - Dimanche 08:00 - 16:00)
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>{t.printOrder}</span>
          </button>

          <button
            onClick={handleOpenTracking}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition shadow-md"
          >
            <Package className="w-4 h-4" />
            <span>Suivre l'acheminement du colis →</span>
          </button>
        </div>
      </div>
    </div>
  );
};
