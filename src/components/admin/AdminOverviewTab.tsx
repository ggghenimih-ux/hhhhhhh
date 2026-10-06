import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { AdminInvoiceModal } from './AdminInvoiceModal';
import {
  TrendingUp,
  ShoppingCart,
  Package,
  AlertTriangle,
  ArrowRight,
  Settings,
  Plus,
  Truck,
  CheckCircle2,
  Clock,
  Printer,
  ChevronRight,
} from 'lucide-react';

interface AdminOverviewTabProps {
  stats: {
    totalOrders: number;
    totalRevenue: number;
    totalProducts: number;
    lowStockProducts: number;
    recentOrders?: any[];
  };
  onNavigateTab: (tab: 'products' | 'orders' | 'categories' | 'settings' | 'media') => void;
  onRefreshData?: () => void;
}

export const AdminOverviewTab: React.FC<AdminOverviewTabProps> = ({
  stats,
  onNavigateTab,
  onRefreshData,
}) => {
  const { formatPrice, products, getLocalizedName } = useStore();
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

  // Products with low stock
  const lowStockList = products.filter((p) => (p.stock ?? 0) <= 5);

  return (
    <div className="space-y-8">
      {/* 4 Primary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Chiffre d’Affaires
            </span>
            <strong className="text-xl font-black text-slate-900">
              {formatPrice(stats.totalRevenue)}
            </strong>
          </div>
        </div>

        {/* Total Orders */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Commandes Totales
            </span>
            <strong className="text-xl font-black text-slate-900">{stats.totalOrders}</strong>
          </div>
        </div>

        {/* Active Products */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Produits en Ligne
            </span>
            <strong className="text-xl font-black text-slate-900">{stats.totalProducts}</strong>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Alerte Stock Faible
            </span>
            <strong className="text-xl font-black text-rose-600">{stats.lowStockProducts}</strong>
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => onNavigateTab('settings')}
          className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl text-start shadow-sm hover:scale-[1.01] transition space-y-2 group"
        >
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-orange-400">
            <Settings className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm">Paramètres du Magasin</h3>
          <p className="text-xs text-slate-400">
            Modifiez le nom, logo, téléphone, WhatsApp, tarifs de livraison et bannières.
          </p>
          <div className="text-xs font-bold text-orange-400 flex items-center gap-1 pt-1 group-hover:translate-x-1 transition-transform">
            <span>Configurer</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('products')}
          className="p-5 bg-white border border-slate-200 text-slate-800 rounded-3xl text-start shadow-xs hover:border-orange-500 hover:scale-[1.01] transition space-y-2 group"
        >
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
            <Plus className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-slate-900">Catalogue & Stocks</h3>
          <p className="text-xs text-slate-500">
            Ajoutez de nouveaux équipements GSM, ajustez les prix et gérez les ruptures.
          </p>
          <div className="text-xs font-bold text-orange-600 flex items-center gap-1 pt-1 group-hover:translate-x-1 transition-transform">
            <span>Gérer les produits</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('orders')}
          className="p-5 bg-white border border-slate-200 text-slate-800 rounded-3xl text-start shadow-xs hover:border-blue-500 hover:scale-[1.01] transition space-y-2 group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
            <Truck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-slate-900">Expéditions & Commandes</h3>
          <p className="text-xs text-slate-500">
            Validez les commandes, imprimez les bons de livraison et suivez les règlements.
          </p>
          <div className="text-xs font-bold text-blue-600 flex items-center gap-1 pt-1 group-hover:translate-x-1 transition-transform">
            <span>Voir les commandes</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </button>
      </div>

      {/* Low Stock Warning Section */}
      {lowStockList.length > 0 && (
        <div className="bg-rose-50/60 rounded-3xl border border-rose-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <h3 className="text-sm font-bold text-rose-950">
                Alerte Réapprovisionnement ({lowStockList.length} produit(s) en stock critique)
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('products')}
              className="text-xs font-bold text-rose-700 hover:underline"
            >
              Voir tout l'inventaire
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {lowStockList.slice(0, 6).map((prod) => (
              <div
                key={prod.id}
                className="bg-white p-3.5 rounded-2xl border border-rose-100 flex items-center justify-between shadow-2xs"
              >
                <div className="min-w-0 pr-2">
                  <span className="font-bold text-slate-900 block truncate">{getLocalizedName(prod)}</span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    SKU: {prod.sku || 'N/A'}
                  </span>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-lg font-mono font-bold text-xs flex-shrink-0 ${
                    (prod.stock ?? 0) <= 0
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {(prod.stock ?? 0) <= 0 ? 'Épuisé (0)' : `${prod.stock} restants`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Orders Overview */}
      {stats.recentOrders && stats.recentOrders.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-orange-600" />
              <span>Dernières Commandes Clients Reçues</span>
            </h3>
            <button
              onClick={() => onNavigateTab('orders')}
              className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
            >
              <span>Toutes les commandes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-start">
              <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 text-start">N° Commande</th>
                  <th className="py-3 px-4 text-start">Client</th>
                  <th className="py-3 px-4 text-start">Gouvernorat</th>
                  <th className="py-3 px-4 text-end">Montant Total</th>
                  <th className="py-3 px-4 text-center">Statut</th>
                  <th className="py-3 px-4 text-end">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.recentOrders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      #{order.orderNumber}
                    </td>
                    <td className="py-3 px-4">
                      <strong className="block font-semibold text-slate-800">{order.customerName}</strong>
                      <span className="text-[11px] text-slate-400 font-mono">+216 {order.customerPhone}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {order.governorate}
                    </td>
                    <td className="py-3 px-4 text-end font-mono font-bold text-slate-900">
                      {formatPrice(order.totalTND)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800">
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-end">
                      <button
                        onClick={() => setSelectedInvoice(order)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium"
                      >
                        <Printer className="w-3.5 h-3.5 text-orange-600" />
                        <span>Imprimer</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedInvoice && (
        <AdminInvoiceModal order={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
      )}
    </div>
  );
};
