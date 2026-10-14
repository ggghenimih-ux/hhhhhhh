import React, { useState, useEffect } from 'react';
import { useStoreRouting, useStoreSettings } from '../context/StoreSlices';
import { api } from '../services/api';
import {
  PackageSearch,
  CheckCircle2,
  Clock,
  Truck,
  PackageCheck,
  AlertCircle,
  MapPin,
  Phone,
  Search,
} from 'lucide-react';

export const TrackOrderPage: React.FC = () => {
  const { t, formatPrice, settings } = useStoreSettings();
  const { routeParams } = useStoreRouting();
  const [searchNumber, setSearchNumber] = useState(routeParams.orderNumber || '');
  const [order, setOrder] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadByTrackingToken = async (token: string) => {
    try {
      setIsLoading(true);
      setErrorMsg('');
      setSearched(true);
      const result = await api.orders.getById(token);
      if (result?.data) {
        setOrder(result.data);
        setSearchNumber(result.data.orderNumber);
      } else {
        setOrder(null);
        setErrorMsg('Aucune commande trouvée avec ce lien de suivi.');
      }
    } catch (error) {
      setOrder(null);
      setErrorMsg(error instanceof Error ? error.message : 'Impossible de charger cette commande.');
    } finally {
      setIsLoading(false);
    }
  };

  const performSearch = async (num: string) => {
    if (!num.trim()) return;
    try {
      setIsLoading(true);
      setErrorMsg('');
      setSearched(true);
      const res = await api.orders.getByNumber(num.trim());
      if (res?.data) {
        setOrder(res.data);
      } else {
        setOrder(null);
        setErrorMsg('Aucune commande trouvée avec ce numéro.');
      }
    } catch (err: any) {
      setOrder(null);
      setErrorMsg(err.message || 'Numéro de commande introuvable.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (routeParams.orderNumber) {
      void loadByTrackingToken(routeParams.orderNumber);
    }
  }, [routeParams.orderNumber]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchNumber);
  };

  const getStepStatus = (stepName: string) => {
    if (!order) return 'upcoming';
    const statusOrder = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
    const currentIdx = statusOrder.indexOf(order.status);
    const targetIdx = statusOrder.indexOf(stepName);

    if (order.status === 'CANCELLED') return 'cancelled';
    if (currentIdx > targetIdx) return 'completed';
    if (currentIdx === targetIdx) return 'current';
    return 'upcoming';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
          <PackageSearch className="w-6 h-6 text-orange-600" />
          <span>{t.trackOrderTitle}</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Suivez l’état d'avancement de votre commande de matériel GSM en temps réel en Tunisie
        </p>
      </div>

      {/* Search Input Box */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
          <input
            id="track-order-number"
            type="text"
            aria-label={t.trackOrderTitle}
            value={searchNumber}
            onChange={(e) => setSearchNumber(e.target.value)}
            placeholder="Exemple : GSM-TN-2024-1082"
            className="w-full text-xs pl-11 pr-4 py-3 rounded-2xl border border-slate-200 outline-none focus:border-orange-500 font-mono"
            required
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-2xl transition shadow-md disabled:bg-slate-300"
        >
          {isLoading ? 'Recherche...' : t.trackButton}
        </button>
      </form>

      {/* Results View */}
      {order && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">{t.orderNumber}</span>
              <strong className="text-lg font-mono text-slate-900">{order.orderNumber}</strong>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Date</span>
              <span className="text-xs text-slate-700 font-semibold">
                {new Date(order.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Statut Actuel</span>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-orange-100 text-orange-800">
                {order.status}
              </span>
            </div>
          </div>

          {/* Timeline */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-6">
              Étapes d'acheminement du colis
            </h3>

            <div className="relative flex items-center justify-between">
              <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-slate-100 z-0" />

              {/* Step 1: Confirmed */}
              <div className="relative z-10 flex flex-col items-center text-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md ${
                    getStepStatus('CONFIRMED') === 'completed' || getStepStatus('CONFIRMED') === 'current'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <strong className="text-xs text-slate-900 mt-2">Confirmé</strong>
                <span className="text-[10px] text-slate-400">Validé</span>
              </div>

              {/* Step 2: Processing */}
              <div className="relative z-10 flex flex-col items-center text-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md ${
                    getStepStatus('PROCESSING') === 'completed' || getStepStatus('PROCESSING') === 'current'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  <Clock className="w-5 h-5" />
                </div>
                <strong className="text-xs text-slate-900 mt-2">Préparation</strong>
                <span className="text-[10px] text-slate-400">Atelier GSM</span>
              </div>

              {/* Step 3: Shipped */}
              <div className="relative z-10 flex flex-col items-center text-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md ${
                    getStepStatus('SHIPPED') === 'completed' || getStepStatus('SHIPPED') === 'current'
                      ? 'bg-orange-600 text-white ring-4 ring-orange-100'
                      : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  <Truck className="w-5 h-5" />
                </div>
                <strong className="text-xs text-slate-900 mt-2">Expédié</strong>
                <span className="text-[10px] text-slate-400">En route (Aramex)</span>
              </div>

              {/* Step 4: Delivered */}
              <div className="relative z-10 flex flex-col items-center text-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md ${
                    getStepStatus('DELIVERED') === 'completed' || getStepStatus('DELIVERED') === 'current'
                      ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                      : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  <PackageCheck className="w-5 h-5" />
                </div>
                <strong className="text-xs text-slate-900 mt-2">Livré</strong>
                <span className="text-[10px] text-slate-400">Reçu en atelier</span>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-orange-600 block mb-1">Destinataire</span>
              <strong className="text-slate-900 block">{order.customerName}</strong>
              <span className="text-slate-600 block">{order.address}, {order.governorate}</span>
              <span className="text-slate-600 font-mono block">Tél : {order.customerPhone}</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-orange-600 block mb-1">Paiement & Montant</span>
              <div className="flex justify-between">
                <span>Total commande :</span>
                <strong className="text-orange-600">{formatPrice(order.totalTND)}</strong>
              </div>
              <div className="flex justify-between mt-1">
                <span>Mode de paiement :</span>
                <span className="uppercase font-semibold">{order.paymentMethod}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {errorMsg && searched && !order && (
        <div className="p-8 bg-white rounded-3xl border border-rose-200 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900">{errorMsg}</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Vérifiez l’orthographe du numéro de commande ou appelez notre service client au {settings.phone}.
          </p>
        </div>
      )}
    </div>
  );
};
