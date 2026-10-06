import React from 'react';
import { useStore } from '../context/StoreContext';
import { AlertTriangle, Home, ShoppingBag } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const { navigateTo } = useStore();

  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
      <div className="w-16 h-16 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mx-auto">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-black text-slate-900">404</h1>
      <h2 className="text-lg font-bold text-slate-800">Page Introuvable</h2>
      <p className="text-xs text-slate-500">
        La page ou le produit que vous recherchez n'existe pas ou a été déplacé.
      </p>
      <div className="flex justify-center gap-3 pt-2">
        <button
          onClick={() => navigateTo('home')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 text-white font-bold text-xs"
        >
          <Home className="w-4 h-4" />
          <span>Accueil</span>
        </button>
        <button
          onClick={() => navigateTo('products')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Boutique</span>
        </button>
      </div>
    </div>
  );
};
