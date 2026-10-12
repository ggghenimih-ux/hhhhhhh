import React from 'react';
import { useStoreNotifications } from '../context/StoreSlices';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const Toasts: React.FC = () => {
  const { toasts, removeToast } = useStoreNotifications();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center justify-between p-4 rounded-xl shadow-xl text-white transition-all transform animate-in slide-in-from-bottom duration-200 ${
            toast.type === 'success'
              ? 'bg-emerald-600 border border-emerald-500'
              : toast.type === 'error'
              ? 'bg-rose-600 border border-rose-500'
              : 'bg-slate-800 border border-slate-700'
          }`}
        >
          <div className="flex items-center gap-3">
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-white" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 flex-shrink-0 text-white" />}
            {toast.type === 'info' && <Info className="w-5 h-5 flex-shrink-0 text-white" />}
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            aria-label="Fermer la notification"
            className="p-1 rounded-lg hover:bg-white/20 transition text-white/80 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
