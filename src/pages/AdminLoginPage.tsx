import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import {
  ShieldCheck,
  Lock,
  Mail,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';

export const AdminLoginPage: React.FC = () => {
  const { login, user, isAdmin, loading } = useAuth();
  const { navigateTo, showToast, settings } = useStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already logged in as ADMIN, redirect to /admin immediately
  useEffect(() => {
    if (!loading && user && user.role === 'ADMIN') {
      navigateTo('admin');
    }
  }, [user, loading, navigateTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Veuillez renseigner votre email et mot de passe.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await login(email.trim(), password);

      if (!res.success) {
        // Specific error messages
        const err = res.error || '';
        if (err.includes('401') || err.toLowerCase().includes('incorrect') || err.toLowerCase().includes('mot de passe')) {
          setErrorMessage('بيانات الدخول غير صحيحة (Email ou mot de passe incorrect).');
        } else if (err.toLowerCase().includes('introuvable') || err.toLowerCase().includes('existe pas')) {
          setErrorMessage('الحساب غير موجود (Compte introuvable).');
        } else if (err.includes('500') || err.includes('503') || err.toLowerCase().includes('serveur')) {
          setErrorMessage('الخادم غير متاح حالياً (Serveur indisponible).');
        } else {
          setErrorMessage(err || 'بيانات الدخول غير صحيحة.');
        }
        return;
      }

      if (res.user && res.user.role !== 'ADMIN') {
        setErrorMessage('ليس لديك صلاحية المدير (Ce compte n’a pas les privilèges ADMIN).');
        showToast('Accès refusé : compte non administrateur.', 'error');
        return;
      }

      showToast('Connexion réussie ! Bienvenue dans l’administration.', 'success');
      navigateTo('admin');
    } catch (err: any) {
      setErrorMessage('الخادم غير متاح حالياً (Erreur de communication avec le serveur).');
    } finally {
      setIsSubmitting(false);
    }
  };

  const storeName = settings?.storeName || 'Outils Réparation GSM Tunisie';

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12 bg-slate-50/50">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-sm space-y-6">
        {/* Brand / Title */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-orange-600 text-white flex items-center justify-center mx-auto shadow-md">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Espace Administrateur
          </h1>
          <p className="text-xs text-slate-500">
            Connexion sécurisée pour la gestion de {storeName}
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
            <span className="font-semibold leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Adresse Email *</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemple.com"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-semibold"
                required
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Mot de passe *</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-mono"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold transition shadow-md flex items-center justify-center gap-2 disabled:bg-slate-400 disabled:cursor-not-allowed mt-2"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Vérification des identifiants...</span>
              </>
            ) : (
              <>
                <span>Se connecter au panneau Admin</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-2 text-center border-t border-slate-100">
          <button
            type="button"
            onClick={() => navigateTo('home')}
            className="text-xs text-slate-500 hover:text-slate-900 font-semibold inline-flex items-center gap-1.5 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Retour à la boutique</span>
          </button>
        </div>
      </div>
    </div>
  );
};
