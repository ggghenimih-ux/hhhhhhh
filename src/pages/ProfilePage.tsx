import React from 'react';
import { useStore } from '../context/StoreContext';
import { User, Phone, Mail, ShieldCheck, LogOut, Package, ArrowRight } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, logout, navigateTo } = useStore();

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Veuillez vous connecter pour voir votre profil.</h2>
        <button
          onClick={() => navigateTo('login')}
          className="px-5 py-2.5 rounded-xl bg-orange-600 text-white font-bold text-xs"
        >
          Se connecter
        </button>
      </div>
    );
  }

  const displayName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Client GSM';

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-orange-600 text-white flex items-center justify-center font-bold text-2xl">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{displayName}</h1>
              {user.role === 'ADMIN' && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-700">
                  ADMIN
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">{user.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
            <Phone className="w-5 h-5 text-orange-600" />
            <div>
              <span className="text-slate-400 block text-[10px]">Téléphone</span>
              <strong className="text-slate-900 font-mono">{user.phone}</strong>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
            <Mail className="w-5 h-5 text-orange-600" />
            <div>
              <span className="text-slate-400 block text-[10px]">Email</span>
              <strong className="text-slate-900">{user.email}</strong>
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-slate-100">
          {user.role === 'ADMIN' && (
            <button
              onClick={() => navigateTo('admin')}
              className="w-full flex items-center justify-between p-4 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 rounded-2xl transition font-bold text-xs"
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <span>Ouvrir le Tableau de Bord Administrateur</span>
              </div>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => navigateTo('track-order')}
            className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 rounded-2xl transition font-bold text-xs"
          >
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-orange-600" />
              <span>Suivre mes commandes en cours</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 p-3 text-rose-600 hover:bg-rose-50 rounded-2xl border border-rose-200 transition font-bold text-xs"
          >
            <LogOut className="w-4 h-4" />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>
    </div>
  );
};
