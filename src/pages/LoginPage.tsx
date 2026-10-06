import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { api } from '../services/api';
import { Lock, Mail, ShieldCheck, ArrowRight, AlertCircle, UserCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { setUser, navigateTo, showToast } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      setIsLoading(true);
      const res = await api.auth.login({ email, password });
      if (res?.data) {
        setUser({
          ...res.data,
          isAdmin: res.data.role === 'ADMIN',
        });
        showToast(`Bienvenue, ${res.data.name} !`, 'success');
        if (res.data.role === 'ADMIN') {
          navigateTo('admin');
        } else {
          navigateTo('home');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Email ou mot de passe incorrect.');
      showToast(err.message || 'Échec de connexion', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-orange-600 text-white flex items-center justify-center mx-auto mb-3 shadow-md">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">Connexion Client & Atelier</h1>
          <p className="text-xs text-slate-500">Accédez à vos commandes et avantages professionnels</p>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Adresse Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                className="w-full text-xs pl-10 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-orange-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Mot de passe</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs pl-10 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-orange-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs transition shadow-lg shadow-orange-600/30 disabled:bg-slate-300"
          >
            {isLoading ? 'Connexion en cours...' : 'Se Connecter'}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 text-center">
          <button
            onClick={() => navigateTo('register')}
            className="text-xs text-orange-600 font-semibold hover:underline"
          >
            Pas encore de compte ? Créer un compte atelier →
          </button>
        </div>
      </div>
    </div>
  );
};
