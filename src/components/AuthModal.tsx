import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import {
  X,
  User,
  Lock,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { DEMO_USER } from '../data/mockData';

export const AuthModal: React.FC = () => {
  const {
    t,
    language,
    user,
    setUser,
    isAuthModalOpen,
    setIsAuthModalOpen,
    setIsAdminModalOpen,
    showToast
  } = useStore();

  const [isRegister, setIsRegister] = useState(false);
  const [emailOrPhone, setEmailOrPhone] = useState('26 383 876');
  const [password, setPassword] = useState('gsm2024');
  const [name, setName] = useState('');

  if (!isAuthModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegister) {
      setUser({
        id: 'usr-' + Date.now(),
        firstName: name || 'Technicien',
        lastName: 'GSM',
        email: emailOrPhone.includes('@') ? emailOrPhone : `${emailOrPhone}@client.tn`,
        phone: emailOrPhone,
        addresses: [],
        isAdmin: false,
        createdAt: new Date().toISOString()
      });
      showToast('Compte créé avec succès !', 'success');
    } else {
      setUser(DEMO_USER);
      showToast('Connexion réussie !', 'success');
    }
    setIsAuthModalOpen(false);
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthModalOpen(false);
    showToast('Déconnexion réussie.', 'info');
  };

  const handleQuickAdminLogin = () => {
    setUser(DEMO_USER);
    setIsAuthModalOpen(false);
    setIsAdminModalOpen(true);
    showToast('Connecté en tant qu’administrateur GSM.', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col">
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center text-white">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">
                {user ? `Profil : ${user.firstName}` : isRegister ? 'Créer un Compte Client' : 'Connexion Espace Client'}
              </h3>
              <span className="text-[11px] text-slate-400">
                Outils Réparation GSM Tunisie
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {user ? (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Nom complet</span>
                  <strong className="text-slate-900">{user.firstName} {user.lastName}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Téléphone</span>
                  <strong className="text-slate-900 font-mono">{user.phone}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Statut</span>
                  <span className="font-bold text-orange-600">
                    {user.isAdmin ? 'Administrateur Boutique' : 'Client Technicien'}
                  </span>
                </div>
              </div>

              {user.isAdmin && (
                <button
                  onClick={() => {
                    setIsAuthModalOpen(false);
                    setIsAdminModalOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-md"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Accéder au Tableau de Bord Admin</span>
                </button>
              )}

              <button
                onClick={handleLogout}
                className="w-full py-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition"
              >
                Se déconnecter
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Nom ou Nom de votre Atelier *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Anis Ben Salah (GSM Lab)"
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 outline-none focus:border-orange-500"
                    required
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Téléphone Tunisien ou Email *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={emailOrPhone}
                    onChange={(e) => setEmailOrPhone(e.target.value)}
                    placeholder="Ex: 26 383 876"
                    className="w-full text-xs pl-9 pr-3 py-3 rounded-xl border border-slate-200 outline-none focus:border-orange-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Mot de passe *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs pl-9 pr-3 py-3 rounded-xl border border-slate-200 outline-none focus:border-orange-500 font-mono"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition shadow-lg shadow-orange-600/30"
              >
                {isRegister ? 'Créer mon compte' : 'Se connecter'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsRegister(!isRegister)}
                  className="text-xs text-orange-600 font-semibold hover:underline"
                >
                  {isRegister ? 'Déjà un compte ? Se connecter' : 'Nouveau client ? Créer un compte'}
                </button>
              </div>

              {/* Quick Admin Test Login */}
              <div className="pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleQuickAdminLogin}
                  className="w-full py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Tester en mode Démo Administrateur</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
