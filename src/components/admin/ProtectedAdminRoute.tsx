import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { ShieldAlert, RefreshCw, LogIn, ArrowLeft } from 'lucide-react';

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

export const ProtectedAdminRoute: React.FC<ProtectedAdminRouteProps> = ({ children }) => {
  const { user, loading, isAuthenticated, isAdmin, logout } = useAuth();
  const { navigateTo } = useStore();

  // 1. Loading state during auth verification
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 p-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center animate-spin">
          <RefreshCw className="w-6 h-6" />
        </div>
        <p className="text-xs font-semibold text-slate-500">
          Vérification des droits d'administration en cours...
        </p>
      </div>
    );
  }

  // 2. Unauthenticated: Redirect / prompt to Login
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-[65vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 shadow-sm text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto">
            <LogIn className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Connexion Administrateur Requise</h2>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Vous devez vous connecter avec un compte administrateur pour accéder à cette section.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => navigateTo('admin-login')}
              className="w-full py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md transition"
            >
              Se connecter à l'espace Admin
            </button>
            <button
              onClick={() => navigateTo('home')}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs transition flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Retour à la boutique</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. User logged in, but role is NOT ADMIN (Customer)
  if (!isAdmin || user.role !== 'ADMIN') {
    return (
      <div className="min-h-[65vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-3xl border border-rose-200 p-8 shadow-sm text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 uppercase tracking-wider mb-2 inline-block">
              Accès Refusé (403 Forbidden)
            </span>
            <h2 className="text-lg font-bold text-slate-900">Droits d'Accès Insuffisants</h2>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Votre compte actuel (<strong className="text-slate-800">{user.email}</strong>) possède le rôle{' '}
              <span className="font-mono font-bold text-rose-600">{user.role}</span>. Seuls les administrateurs
              sont autorisés à accéder aux réglages et à l'inventaire.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={async () => {
                await logout();
                navigateTo('admin-login');
              }}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition"
            >
              Changer de compte (Se connecter en tant qu'ADMIN)
            </button>
            <button
              onClick={() => navigateTo('home')}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs transition flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Retour à l'accueil</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Authorized Admin
  return <>{children}</>;
};
