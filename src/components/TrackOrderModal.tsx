import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import {
  X,
  PackageSearch,
  CheckCircle2,
  Clock,
  Truck,
  PackageCheck,
  AlertCircle,
  MapPin,
  Phone
} from 'lucide-react';
import { Order } from '../types';

export const TrackOrderModal: React.FC = () => {
  const {
    t,
    language,
    formatPrice,
    orders,
    isTrackOrderModalOpen,
    setIsTrackOrderModalOpen
  } = useStore();

  const [searchKey, setSearchKey] = useState('');
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(orders[0] || null);
  const [searched, setSearched] = useState(false);

  if (!isTrackOrderModalOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearched(true);
    const key = searchKey.trim().toLowerCase();
    if (!key) return;

    const found = orders.find((o: Order) =>
      o.orderNumber.toLowerCase().includes(key) ||
      (o.trackingNumber && o.trackingNumber.toLowerCase().includes(key)) ||
      o.customerPhone.includes(key)
    );

    setTrackedOrder(found || null);
  };

  const getStepStatus = (step: number, orderStatus?: string) => {
    const norm = (orderStatus || 'pending').toLowerCase();
    const statusMap: Record<string, number> = {
      pending: 0,
      confirmed: 1,
      processing: 2,
      shipped: 3,
      delivered: 4,
      cancelled: -1
    };

    const currentStep = statusMap[norm] ?? 1;
    if (norm === 'cancelled') return 'cancelled';
    if (currentStep > step) return 'completed';
    if (currentStep === step) return 'current';
    return 'upcoming';
  };

  const currentStatus = (trackedOrder?.status || trackedOrder?.orderStatus || 'pending').toLowerCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-white">
              <PackageSearch className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">
                {t.trackOrder}
              </h3>
              <p className="text-xs text-slate-400">
                Suivi en temps réel de votre colis par Aramex ou Rapid-Poste
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsTrackOrderModalOpen(false)}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchKey}
              onChange={(e) => setSearchKey(e.target.value)}
              placeholder="Ex: GSM-TN-2024-1082 ou N° Téléphone..."
              className="flex-1 px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs text-slate-900"
            />
            <button
              type="submit"
              className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold px-5 py-3 rounded-xl transition"
            >
              {t.trackButton}
            </button>
          </form>

          {/* Quick Demo Buttons */}
          <div className="flex items-center gap-2 text-[11px] text-slate-500 flex-wrap">
            <span>Exemples rapides :</span>
            {(orders || []).slice(0, 2).map((o: Order) => (
              <button
                key={o.id}
                type="button"
                onClick={() => {
                  setSearchKey(o.orderNumber);
                  setTrackedOrder(o);
                  setSearched(true);
                }}
                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-orange-100 hover:text-orange-700 transition font-mono"
              >
                {o.orderNumber}
              </button>
            ))}
          </div>

          {/* Result view */}
          {trackedOrder ? (
            <div className="space-y-6">
              {/* Order Info Card */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Numéro de Commande</span>
                    <strong className="text-slate-900 font-mono text-sm">{trackedOrder.orderNumber}</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px]">N° de Suivi Transporteur</span>
                    <strong className="text-orange-600 font-mono text-sm">
                      {trackedOrder.trackingNumber || 'En cours d’attribution'}
                    </strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Destinataire</span>
                    <strong className="text-slate-800">{trackedOrder.customerName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Gouvernorat</span>
                    <strong className="text-slate-800">
                      {trackedOrder.governorate || trackedOrder.shippingAddress?.governorate || 'Tunisie'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Montant Total</span>
                    <strong className="text-orange-600 font-bold">
                      {formatPrice(trackedOrder.totalTND ?? trackedOrder.totalPrice)}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Progress Steps Timeline */}
              <div className="py-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-6">
                  {t.orderStatus}
                </h4>

                <div className="relative flex items-center justify-between">
                  {/* Background progress track */}
                  <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-slate-200 z-0" />

                  {/* Step 1: Confirmed */}
                  <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-900 mt-2">Confirmé</span>
                    <span className="text-[9px] text-slate-400">Validé</span>
                  </div>

                  {/* Step 2: Processing */}
                  <div className="relative z-10 flex flex-col items-center text-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md transition ${
                      ['processing', 'shipped', 'delivered'].includes(currentStatus)
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-400'
                    }`}>
                      <Clock className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-900 mt-2">Préparation</span>
                    <span className="text-[9px] text-slate-400">Entrepôt GSM</span>
                  </div>

                  {/* Step 3: Shipped */}
                  <div className="relative z-10 flex flex-col items-center text-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md transition ${
                      ['shipped', 'delivered'].includes(currentStatus)
                        ? 'bg-orange-600 text-white ring-4 ring-orange-100'
                        : 'bg-slate-200 text-slate-400'
                    }`}>
                      <Truck className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-900 mt-2">Expédié</span>
                    <span className="text-[9px] text-slate-400">Aramex Express</span>
                  </div>

                  {/* Step 4: Delivered */}
                  <div className="relative z-10 flex flex-col items-center text-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md transition ${
                      currentStatus === 'delivered'
                        ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                        : 'bg-slate-200 text-slate-400'
                    }`}>
                      <PackageCheck className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-900 mt-2">Livré</span>
                    <span className="text-[9px] text-slate-400">Terminé</span>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Articles dans le colis ({trackedOrder.items.length})
                </h4>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {trackedOrder.items.map((item, idx) => (
                    <div key={idx} className="p-3 bg-white flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-800">{item.name || item.productName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">Quantité : {item.quantity}</div>
                      </div>
                      <div className="font-bold text-orange-600">
                        {formatPrice((item.priceTND ?? item.price ?? 0) * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : searched ? (
            <div className="text-center py-10 space-y-3">
              <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">Aucune commande trouvée</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Veuillez vérifier votre numéro de commande ou le numéro de téléphone utilisé lors de votre achat.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
