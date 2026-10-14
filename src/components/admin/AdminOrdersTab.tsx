import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { api } from '../../services/api';
import { AdminInvoiceModal } from './AdminInvoiceModal';
import { AdminOrderArchiveSection } from './AdminOrderArchiveSection';
import { useDialogAccessibility } from '../../hooks/useDialogAccessibility';
import {
  ShoppingCart,
  Search,
  Printer,
  RefreshCw,
  Phone,
  MessageCircle,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  DollarSign,
  ChevronDown,
  Edit2,
  Trash2,
  X,
} from 'lucide-react';

interface AdminOrdersTabProps {
  onRefreshData?: () => void;
}

export const AdminOrdersTab: React.FC<AdminOrdersTabProps> = ({ onRefreshData }) => {
  const { formatPrice, showToast } = useStore();

  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Invoice Print Modal
  const [invoiceOrder, setInvoiceOrder] = useState<any | null>(null);
  const [editingOrder, setEditingOrder] = useState<any | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<any | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [orderForm, setOrderForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    governorate: '',
    delegation: '',
    address: '',
    notes: '',
  });
  const editDialogRef = useDialogAccessibility(Boolean(editingOrder), () => setEditingOrder(null));
  const deleteDialogRef = useDialogAccessibility(Boolean(orderToDelete), () => setOrderToDelete(null));

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const res = await api.orders.getAdminOrders({ limit: 100 });
      if (res?.data && Array.isArray(res.data)) {
        setOrders(res.data);
      }
    } catch (err: any) {
      showToast(err.message || 'Erreur lors du chargement des commandes.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Update Status handler
  const handleUpdateStatus = async (orderId: string, newStatus: string, newPaymentStatus?: string) => {
    try {
      await api.orders.updateStatus(orderId, newStatus, newPaymentStatus);
      showToast(`Statut commande mis à jour : ${newStatus}`, 'success');
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: newStatus,
                ...(newPaymentStatus && { paymentStatus: newPaymentStatus }),
              }
            : o
        )
      );
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      showToast(err.message || 'Erreur mise à jour statut.', 'error');
    }
  };

  const openOrderEdit = (order: any) => {
    setOrderForm({
      customerName: order.customerName || '',
      customerPhone: order.customerPhone || '',
      customerEmail: order.customerEmail || '',
      governorate: order.governorate || '',
      delegation: order.delegation || '',
      address: order.address || '',
      notes: order.notes || '',
    });
    setEditingOrder(order);
  };

  const handleSaveOrder = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingOrder || isSavingOrder) return;
    try {
      setIsSavingOrder(true);
      const response = await api.orders.update(editingOrder.id, {
        ...orderForm,
        customerEmail: orderForm.customerEmail.trim() || null,
        delegation: orderForm.delegation.trim() || null,
        notes: orderForm.notes.trim() || null,
      });
      if (!response?.data) throw new Error(response?.message || 'Le serveur n’a pas renvoyé la commande modifiée.');
      setOrders((current) => current.map((order) => order.id === editingOrder.id
        ? { ...order, ...response.data }
        : order));
      setEditingOrder(null);
      showToast('Commande mise à jour avec succès.', 'success');
      onRefreshData?.();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Impossible de modifier cette commande.', 'error');
    } finally {
      setIsSavingOrder(false);
    }
  };

  const handleDeleteOrder = async (order: any) => {
    if (deletingOrderId) return;
    try {
      setDeletingOrderId(order.id);
      const response = await api.orders.delete(order.id);
      if (!response?.success) throw new Error(response?.message || 'La suppression de la commande a échoué.');
      setOrders((current) => current.filter((item) => item.id !== order.id));
      setOrderToDelete(null);
      showToast('Commande masquée; son historique est conservé.', 'success');
      onRefreshData?.();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Impossible de supprimer cette commande.', 'error');
    } finally {
      setDeletingOrderId(null);
    }
  };

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = o.orderNumber?.toLowerCase().includes(q);
      const matchName = o.customerName?.toLowerCase().includes(q);
      const matchPhone = o.customerPhone?.includes(q);
      const matchGov = o.governorate?.toLowerCase().includes(q);
      if (!matchNum && !matchName && !matchPhone && !matchGov) return false;
    }
    return true;
  });

  // Quick stats
  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;
  const deliveredCount = orders.filter((o) => o.status === 'DELIVERED').length;
  const totalRevenue = orders
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + (o.totalTND || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Order KPIs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-orange-600" />
            <span>Gestion des Commandes & Facturation ({orders.length})</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Suivi des livraisons, paiements contre remboursement et impression des bons de livraison.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="flex items-center gap-1.5 self-start sm:self-auto px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Actualiser</span>
        </button>
      </div>

      {/* Mini KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">
              Commandes en Attente
            </span>
            <strong className="text-lg font-black text-amber-950">{pendingCount}</strong>
          </div>
        </div>

        <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider block">
              Livrées avec Succès
            </span>
            <strong className="text-lg font-black text-emerald-950">{deliveredCount}</strong>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center font-bold">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Recettes Encaissées
            </span>
            <strong className="text-lg font-black text-slate-900">{formatPrice(totalRevenue)}</strong>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-4 rounded-2xl border border-slate-200 text-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par n° commande, nom client, tél..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 bg-white"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-2.5 px-3 rounded-xl border border-slate-300 bg-white font-medium"
          >
            <option value="all">Tous les statuts ({orders.length})</option>
            <option value="PENDING">🟡 En attente de confirmation</option>
            <option value="CONFIRMED">🔵 Confirmée par téléphone</option>
            <option value="PROCESSING">🟣 En préparation au dépôt</option>
            <option value="SHIPPED">🚚 En cours de livraison (Aramex)</option>
            <option value="DELIVERED">🟢 Livrée & Encaissée</option>
            <option value="CANCELLED">🔴 Annulée / Retour</option>
          </select>
        </div>
      </div>

      {/* Orders List / Table */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="bg-white p-12 text-center text-xs text-slate-500 space-y-2 rounded-3xl border border-slate-200">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-orange-600" />
            <p>Chargement des commandes...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white p-12 text-center text-slate-500 space-y-2 rounded-3xl border border-slate-200">
            <ShoppingCart className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">Aucune commande trouvée</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const cleanPhone = (order.customerPhone || '').replace(/[\s\-\(\)\+]/g, '');
            const isDelivered = order.status === 'DELIVERED';
            const isPending = order.status === 'PENDING';
            const isCancelled = order.status === 'CANCELLED';

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4 hover:border-slate-300 transition"
              >
                {/* Order Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono font-bold text-sm text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                      #{order.orderNumber}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Print Invoice Button */}
                    <button
                      type="button"
                      onClick={() => setInvoiceOrder(order)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-2xs"
                    >
                      <Printer className="w-3.5 h-3.5 text-orange-600" />
                      <span>Bon de Livraison</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openOrderEdit(order)}
                      aria-label={`Modifier la commande ${order.orderNumber}`}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      <span>Modifier</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderToDelete(order)}
                      disabled={deletingOrderId === order.id}
                      aria-label={`Supprimer la commande ${order.orderNumber}`}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Supprimer</span>
                    </button>
                  </div>
                </div>

                {/* Customer Details & Contact Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* Client Info */}
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Destinataire
                    </span>
                    <strong className="text-sm text-slate-900 block">{order.customerName}</strong>
                    <div className="flex items-center gap-2 mt-1">
                      <a
                        href={`tel:+216${cleanPhone}`}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-orange-50 text-orange-700 font-mono font-bold hover:bg-orange-100 transition"
                      >
                        <Phone className="w-3 h-3" />
                        <span>+216 {order.customerPhone}</span>
                      </a>
                      <a
                        href={`https://wa.me/216${cleanPhone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold hover:bg-emerald-100 transition"
                      >
                        <MessageCircle className="w-3 h-3" />
                        <span>WhatsApp</span>
                      </a>
                    </div>
                  </div>

                  {/* Delivery Address */}
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Lieu de Livraison
                    </span>
                    <span className="font-semibold text-slate-800 block">
                      {order.governorate} {order.delegation ? `· ${order.delegation}` : ''}
                    </span>
                    <p className="text-slate-500 mt-0.5 leading-relaxed">{order.address}</p>
                    {order.notes && (
                      <p className="text-[11px] text-amber-700 mt-1 italic">
                        Note: "{order.notes}"
                      </p>
                    )}
                  </div>

                  {/* Order Status & Payment Updates */}
                  <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700">Statut de Livraison :</span>
                      <select
                        value={order.status}
                        onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                        className={`text-xs font-bold py-1 px-2.5 rounded-lg border cursor-pointer ${
                          isDelivered
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : isCancelled
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : isPending
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-blue-100 text-blue-800 border-blue-300'
                        }`}
                      >
                        <option value="PENDING">En attente (PENDING)</option>
                        <option value="CONFIRMED">Confirmée (CONFIRMED)</option>
                        <option value="PROCESSING">En préparation (PROCESSING)</option>
                        <option value="SHIPPED">En cours de livraison (SHIPPED)</option>
                        <option value="DELIVERED">Livrée & Encaissée (DELIVERED)</option>
                        <option value="CANCELLED">Annulée (CANCELLED)</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/80">
                      <span className="text-slate-500">Paiement :</span>
                      <select
                        value={order.paymentStatus || 'pending'}
                        onChange={(e) => handleUpdateStatus(order.id, order.status, e.target.value)}
                        className="text-[11px] font-bold py-0.5 px-2 rounded border border-slate-300 bg-white"
                      >
                        <option value="pending">🟡 En attente de paiement</option>
                        <option value="paid">🟢 Payé / Encaissé</option>
                        <option value="failed">🔴 Échoué</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Items preview & Total */}
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <span className="text-slate-500 font-medium">Articles commandés :</span>
                    <div className="flex items-center gap-2 flex-wrap">
                      {(order.items || []).map((item: any, i: number) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-[11px] font-medium"
                        >
                          {item.quantity}x {item.productName || 'Article GSM'} ({formatPrice(item.priceTND || item.price)})
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="text-end font-mono">
                    <span className="text-[11px] text-slate-400 block">
                      Livraison: {order.shippingTND === 0 ? 'Gratuite' : formatPrice(order.shippingTND)}
                    </span>
                    <strong className="text-sm sm:text-base font-black text-orange-600">
                      Total: {formatPrice(order.totalTND)}
                    </strong>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <AdminOrderArchiveSection
        onArchiveChange={() => {
          void fetchOrders();
          onRefreshData?.();
        }}
      />

      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4">
          <section
            ref={editDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-order-title"
            tabIndex={-1}
            className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
          >
            <header className="flex items-center justify-between bg-slate-900 p-5 text-white">
              <h3 id="edit-order-title" className="text-sm font-bold">
                Modifier la commande #{editingOrder.orderNumber}
              </h3>
              <button type="button" onClick={() => setEditingOrder(null)} aria-label="Fermer">
                <X className="h-5 w-5" />
              </button>
            </header>
            <form onSubmit={handleSaveOrder} className="grid gap-4 p-5 text-xs sm:grid-cols-2">
              <label className="space-y-1 font-semibold text-slate-700">
                Nom du client
                <input required minLength={2} maxLength={100} value={orderForm.customerName}
                  onChange={(event) => setOrderForm({ ...orderForm, customerName: event.target.value })}
                  className="w-full rounded-lg border border-slate-300 p-2.5" />
              </label>
              <label className="space-y-1 font-semibold text-slate-700">
                Téléphone
                <input required value={orderForm.customerPhone}
                  onChange={(event) => setOrderForm({ ...orderForm, customerPhone: event.target.value })}
                  className="w-full rounded-lg border border-slate-300 p-2.5" />
              </label>
              <label className="space-y-1 font-semibold text-slate-700">
                E-mail
                <input type="email" value={orderForm.customerEmail}
                  onChange={(event) => setOrderForm({ ...orderForm, customerEmail: event.target.value })}
                  className="w-full rounded-lg border border-slate-300 p-2.5" />
              </label>
              <label className="space-y-1 font-semibold text-slate-700">
                Gouvernorat
                <input required minLength={2} maxLength={60} value={orderForm.governorate}
                  onChange={(event) => setOrderForm({ ...orderForm, governorate: event.target.value })}
                  className="w-full rounded-lg border border-slate-300 p-2.5" />
              </label>
              <label className="space-y-1 font-semibold text-slate-700">
                Délégation
                <input maxLength={100} value={orderForm.delegation}
                  onChange={(event) => setOrderForm({ ...orderForm, delegation: event.target.value })}
                  className="w-full rounded-lg border border-slate-300 p-2.5" />
              </label>
              <label className="space-y-1 font-semibold text-slate-700 sm:col-span-2">
                Adresse
                <input required minLength={5} maxLength={500} value={orderForm.address}
                  onChange={(event) => setOrderForm({ ...orderForm, address: event.target.value })}
                  className="w-full rounded-lg border border-slate-300 p-2.5" />
              </label>
              <label className="space-y-1 font-semibold text-slate-700 sm:col-span-2">
                Notes
                <textarea maxLength={1000} value={orderForm.notes}
                  onChange={(event) => setOrderForm({ ...orderForm, notes: event.target.value })}
                  className="w-full rounded-lg border border-slate-300 p-2.5" rows={3} />
              </label>
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 sm:col-span-2">
                <button type="button" onClick={() => setEditingOrder(null)} disabled={isSavingOrder}
                  className="rounded-lg border border-slate-300 px-4 py-2 font-bold text-slate-600 disabled:opacity-50">
                  Annuler
                </button>
                <button type="submit" disabled={isSavingOrder}
                  className="rounded-lg bg-orange-600 px-4 py-2 font-bold text-white disabled:opacity-50">
                  {isSavingOrder ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {orderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <section
            ref={deleteDialogRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-order-title"
            tabIndex={-1}
            className="w-full max-w-md space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 shrink-0 text-rose-600" />
              <div>
                <h3 id="delete-order-title" className="font-bold text-slate-900">Supprimer la commande ?</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  La commande #{orderToDelete.orderNumber} et ses lignes seront supprimées définitivement.
                  Cette action ne peut pas être annulée.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setOrderToDelete(null)} disabled={deletingOrderId !== null}
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 disabled:opacity-50">
                Annuler
              </button>
              <button type="button" onClick={() => void handleDeleteOrder(orderToDelete)}
                disabled={deletingOrderId !== null}
                className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
                {deletingOrderId === orderToDelete.id ? 'Suppression…' : 'Confirmer la suppression'}
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Printable Invoice Modal */}
      {invoiceOrder && (
        <AdminInvoiceModal order={invoiceOrder} onClose={() => setInvoiceOrder(null)} />
      )}
    </div>
  );
};
