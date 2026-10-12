import React from 'react';
import { useStore } from '../../context/StoreContext';
import { X, Printer, CheckCircle2 } from 'lucide-react';
import { useDialogAccessibility } from '../../hooks/useDialogAccessibility';

interface AdminInvoiceModalProps {
  order: any | null;
  onClose: () => void;
}

export const AdminInvoiceModal: React.FC<AdminInvoiceModalProps> = ({ order, onClose }) => {
  const { settings, formatPrice } = useStore();
  const dialogRef = useDialogAccessibility(Boolean(order), onClose);

  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const storeName = settings?.storeName || 'Outils Réparation GSM Tunisie';
  const storePhone = settings.phone;
  const storeEmail = settings?.email || 'contact@reparation-gsm.tn';
  const storeAddress = settings?.address || 'Tunis,tunis';
  const logoUrl = settings?.logoUrl?.trim() || '/logo.jpg';

  const items = Array.isArray(order.items) ? order.items : [];
  const orderDate = new Date(order.createdAt).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 print:p-0 print:bg-white print:static">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Facture ${order.orderNumber}`}
        tabIndex={-1}
        className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:rounded-none"
      >
        {/* Modal Controls (Hidden in Print) */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-orange-400" />
            <h2 className="text-sm font-bold">Bon de Livraison / Facture #{order.orderNumber}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs transition shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer le document</span>
            </button>
            <button
              onClick={onClose}
              aria-label="Fermer la facture"
              className="p-2 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Sheet */}
        <div className="p-6 sm:p-10 overflow-y-auto print:p-6 print:overflow-visible space-y-6 text-slate-800 print:text-black">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-200">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl overflow-hidden border border-slate-200 bg-white p-1 flex-shrink-0">
                <img
                  src={logoUrl}
                  alt={storeName}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    if (e.currentTarget.src !== '/logo.jpg') {
                      e.currentTarget.src = '/logo.jpg';
                    }
                  }}
                />
              </div>
              <div>
                <h1 className="text-lg font-black text-slate-900 tracking-tight">{storeName}</h1>
                <p className="text-xs text-slate-500">{storeAddress}</p>
                <p className="text-xs text-slate-500 font-mono">Tél: {storePhone} · {storeEmail}</p>
              </div>
            </div>

            <div className="text-start sm:text-end">
              <span className="inline-block px-3 py-1 rounded-lg bg-orange-50 text-orange-800 border border-orange-200 text-xs font-black uppercase tracking-wider mb-1">
                Bon de Livraison
              </span>
              <p className="text-sm font-bold text-slate-900 font-mono">N° {order.orderNumber}</p>
              <p className="text-xs text-slate-500">Date: {orderDate}</p>
            </div>
          </div>

          {/* Client & Shipping Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <div>
              <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider block mb-1">
                Destinataire (Client)
              </span>
              <h3 className="text-sm font-bold text-slate-900">{order.customerName}</h3>
              <p className="text-xs font-mono font-semibold text-orange-700 mt-0.5">
                📞 +216 {order.customerPhone}
              </p>
              {order.customerEmail && (
                <p className="text-xs text-slate-600">{order.customerEmail}</p>
              )}
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider block mb-1">
                Adresse de Livraison
              </span>
              <p className="text-xs font-semibold text-slate-800">
                {order.governorate} {order.delegation ? `· ${order.delegation}` : ''}
              </p>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{order.address}</p>
              {order.notes && (
                <p className="text-[11px] text-amber-700 bg-amber-50 p-1.5 rounded mt-1.5 border border-amber-200">
                  Note: {order.notes}
                </p>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead>
                <tr className="border-b-2 border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 text-start">Désignation Produit</th>
                  <th className="py-2.5 text-center">Qté</th>
                  <th className="py-2.5 text-end">Prix Unitaire</th>
                  <th className="py-2.5 text-end">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-3 font-medium text-slate-800 pr-2">
                      {item.productName || item.product?.name || 'Produit GSM'}
                    </td>
                    <td className="py-3 text-center font-bold text-slate-900">
                      {item.quantity}
                    </td>
                    <td className="py-3 text-end font-mono text-slate-600">
                      {formatPrice(item.priceTND || item.price)}
                    </td>
                    <td className="py-3 text-end font-mono font-bold text-slate-900">
                      {formatPrice((item.priceTND || item.price || 0) * (item.quantity || 1))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Summary */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="text-xs text-slate-600 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Mode de règlement : Paiement à la livraison (Espèces)</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Veuillez vérifier le contenu du colis en présence du livreur avant règlement.
              </p>
            </div>

            <div className="w-full sm:w-64 space-y-1.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Sous-total HT :</span>
                <span className="font-mono">{formatPrice(order.subtotalTND)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Frais de livraison :</span>
                <span className="font-mono">
                  {order.shippingTND === 0 ? 'Gratuite' : formatPrice(order.shippingTND)}
                </span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-slate-200 font-black text-sm text-slate-900">
                <span>Net à payer (TND) :</span>
                <span className="text-orange-600 font-mono">{formatPrice(order.totalTND)}</span>
              </div>
            </div>
          </div>

          {/* Signatures & Footer Notice */}
          <div className="pt-8 border-t border-dashed border-slate-300 grid grid-cols-2 gap-8 text-center text-xs text-slate-500">
            <div className="h-20 flex flex-col justify-between">
              <span className="font-bold text-slate-700">Cachet & Signature Expéditeur</span>
              <span className="text-[10px] text-slate-400">Outils Réparation GSM Tunisie</span>
            </div>
            <div className="h-20 flex flex-col justify-between">
              <span className="font-bold text-slate-700">Signature du Client / Livreur</span>
              <span className="text-[10px] text-slate-400">Reçu conforme et non endommagé</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
