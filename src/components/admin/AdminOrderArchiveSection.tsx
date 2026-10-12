import React, { useState } from 'react';
import { Archive, CalendarDays, Download, RotateCcw, Search, X } from 'lucide-react';
import { api } from '../../services/api';
import { useStore } from '../../context/StoreContext';

interface ArchiveSelection {
  token: string;
  count: number;
  fromDate: string;
  toDate: string;
}

interface ArchivedOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  totalTND: number;
  createdAt: string;
  archivedAt: string;
}

interface AdminOrderArchiveSectionProps {
  onArchiveChange?: () => void;
}

const toDateInput = (date: Date) => date.toISOString().slice(0, 10);

const getOlderThanRange = (years: number) => {
  const cutoff = new Date();
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - years);
  cutoff.setUTCDate(cutoff.getUTCDate() - 1);
  return {
    fromDate: '0001-01-01',
    toDate: toDateInput(cutoff),
  };
};

export const AdminOrderArchiveSection: React.FC<AdminOrderArchiveSectionProps> = ({ onArchiveChange }) => {
  const { showToast } = useStore();
  const initialRange = getOlderThanRange(1);
  const [fromDate, setFromDate] = useState(initialRange.fromDate);
  const [toDate, setToDate] = useState(initialRange.toDate);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [selection, setSelection] = useState<ArchiveSelection | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [archivedOrders, setArchivedOrders] = useState<ArchivedOrder[]>([]);
  const [isLoadingArchived, setIsLoadingArchived] = useState(false);

  const updateRange = (nextFromDate: string, nextToDate: string) => {
    setFromDate(nextFromDate);
    setToDate(nextToDate);
    setPreviewCount(null);
    setSelection(null);
  };

  const preview = async () => {
    try {
      setIsPreviewLoading(true);
      setSelection(null);
      const result = await api.orders.previewArchive(fromDate, toDate);
      setPreviewCount(result.count ?? 0);
      setSelection(null);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Impossible de compter les commandes.', 'error');
      setPreviewCount(null);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const exportSelection = async () => {
    try {
      setIsExporting(true);
      setSelection(null);
      const result = await api.orders.exportArchive(fromDate, toDate);
      const { data, token } = result;
      const exportDocument = {
        exportedAt: new Date().toISOString(),
        fromDate: data.fromDate,
        toDate: data.toDate,
        count: data.count,
        orders: data.data,
      };
      const blob = new Blob([JSON.stringify(exportDocument, null, 2)], {
        type: 'application/json;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `orders-${fromDate}-to-${toDate}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);

      if (data.count > 0 && token) {
        setSelection({ token, count: data.count, fromDate, toDate });
        showToast(`Export de ${data.count} commande(s) téléchargé.`, 'success');
      } else {
        setSelection(null);
        showToast('Aucune commande à exporter pour cette période.', 'info');
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'L’export des commandes a échoué.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const loadArchived = async () => {
    try {
      setIsLoadingArchived(true);
      const result = await api.orders.getArchived({ page: 1, limit: 100 });
      setArchivedOrders(result.data || []);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Impossible de charger les commandes archivées.', 'error');
    } finally {
      setIsLoadingArchived(false);
    }
  };

  const toggleArchived = () => {
    const nextValue = !showArchived;
    setShowArchived(nextValue);
    if (nextValue) void loadArchived();
  };

  const restoreOrder = async (order: ArchivedOrder) => {
    try {
      await api.orders.restoreArchived(order.id);
      setArchivedOrders((current) => current.filter((item) => item.id !== order.id));
      showToast(`Commande #${order.orderNumber} restaurée.`, 'success');
      onArchiveChange?.();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'La restauration de la commande a échoué.', 'error');
    }
  };

  const archiveSelection = async () => {
    if (!selection) return;
    try {
      setIsArchiving(true);
      const result = await api.orders.archiveExported(selection.token, selection.count);
      showToast(result.message || `${selection.count} commande(s) archivée(s).`, 'success');
      setSelection(null);
      setIsConfirmOpen(false);
      setPreviewCount(null);
      onArchiveChange?.();
      if (showArchived) await loadArchived();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'L’archivage a échoué.', 'error');
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
            <Archive className="h-5 w-5 text-orange-600" />
            Archivage et export des commandes
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            Exportez d’abord la sélection JSON. L’archivage est réversible et conserve les lignes
            de commande et leur historique. Les exports sont valables 30 minutes.
          </p>
        </div>
        <button
          type="button"
          onClick={toggleArchived}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
        >
          <Search className="h-4 w-4" />
          {showArchived ? 'Masquer les archives' : 'Voir les archives'}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            const range = getOlderThanRange(1);
            updateRange(range.fromDate, range.toDate);
          }}
          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-50"
        >
          Plus d’un an
        </button>
        <button
          type="button"
          onClick={() => {
            const range = getOlderThanRange(2);
            updateRange(range.fromDate, range.toDate);
          }}
          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-50"
        >
          Plus de deux ans
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label className="space-y-1 text-xs font-semibold text-slate-700">
          Du
          <span className="relative block">
            <CalendarDays className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="date"
              value={fromDate}
              max={toDate}
              onChange={(event) => updateRange(event.target.value, toDate)}
              className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-xs"
            />
          </span>
        </label>
        <label className="space-y-1 text-xs font-semibold text-slate-700">
          Au
          <span className="relative block">
            <CalendarDays className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="date"
              value={toDate}
              min={fromDate}
              max={toDateInput(new Date())}
              onChange={(event) => updateRange(fromDate, event.target.value)}
              className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-xs"
            />
          </span>
        </label>
        <button
          type="button"
          onClick={() => void preview()}
          disabled={!fromDate || !toDate || isPreviewLoading}
          className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {isPreviewLoading ? 'Calcul…' : 'Compter les commandes'}
        </button>
      </div>

      {previewCount !== null && (
        <div className="flex flex-col gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-orange-950">
            <strong>{previewCount}</strong> commande(s), du <strong>{fromDate}</strong> au <strong>{toDate}</strong>.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void exportSelection()}
              disabled={previewCount === 0 || isExporting}
              className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-orange-700 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {isExporting ? 'Export…' : 'Télécharger l’export JSON'}
            </button>
            {selection && (
              <button
                type="button"
                onClick={() => setIsConfirmOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-rose-300 bg-white px-4 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-50"
              >
                <Archive className="h-4 w-4" />
                Archiver les {selection.count} commandes exportées
              </button>
            )}
          </div>
        </div>
      )}

      {showArchived && (
        <div className="space-y-2 border-t border-slate-100 pt-4">
          <h4 className="text-sm font-bold text-slate-800">Commandes archivées</h4>
          {isLoadingArchived ? (
            <p className="py-5 text-center text-xs text-slate-500">Chargement des archives…</p>
          ) : archivedOrders.length === 0 ? (
            <p className="py-5 text-center text-xs text-slate-500">Aucune commande archivée.</p>
          ) : (
            <div className="space-y-2">
              {archivedOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="text-xs">
                    <strong className="text-slate-900">#{order.orderNumber}</strong>
                    <span className="mx-2 text-slate-500">{order.customerName}</span>
                    <span className="text-slate-500">
                      Commande du {new Date(order.createdAt).toLocaleDateString('fr-FR')} · Archivée le {new Date(order.archivedAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => void restoreOrder(order)}
                    className="inline-flex items-center gap-1.5 self-start rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 sm:self-auto"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Restaurer
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {isConfirmOpen && selection && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="archive-confirm-title"
            className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3">
              <h4 id="archive-confirm-title" className="text-base font-bold text-slate-900">
                Confirmer l’archivage
              </h4>
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm leading-relaxed text-slate-600">
              Archiver <strong>{selection.count}</strong> commande(s) du <strong>{selection.fromDate}</strong> au <strong>{selection.toDate}</strong> ?
              Les enregistrements restent conservés et pourront être restaurés.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                disabled={isArchiving}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => void archiveSelection()}
                disabled={isArchiving}
                className="rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {isArchiving ? 'Archivage…' : 'Confirmer l’archivage'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
