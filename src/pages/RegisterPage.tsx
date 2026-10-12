import React, { useState } from 'react';
import { AlertCircle, ArrowRight, Lock, Mail, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';

const RegisterPage: React.FC = () => {
  const { register, loginWithGoogle } = useAuth();
  const { navigateTo, showToast } = useStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      setIsLoading(true);
      const result = await register(email, password, name);
      if (result.success && result.requiresEmailVerification) {
        const message = result.message || 'Vérifiez votre adresse e-mail avant de vous connecter.';
        setSuccessMsg(message);
        showToast(message, 'success');
        return;
      }
      if (!result.success || !result.user) {
        throw new Error(result.error || 'Erreur lors de la création du compte.');
      }

      showToast(`Bienvenue, ${result.user.name} !`, 'success');
      navigateTo('home');
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : 'Erreur lors de la création du compte.';
      setErrorMsg(message);
      showToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    try {
      setIsLoading(true);
      const result = await loginWithGoogle();
      if (!result.success || !result.user) {
        if (result.error) {
          setErrorMsg(result.error);
          showToast(result.error, 'error');
        }
        return;
      }

      showToast(`Bienvenue, ${result.user.name} !`, 'success');
      navigateTo(result.user.role === 'ADMIN' ? 'admin' : 'home');
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : 'Erreur de connexion avec Google.';
      setErrorMsg(message);
      showToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-orange-600 text-white flex items-center justify-center mx-auto mb-3 shadow-md">
            <UserPlus className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">Créer un compte atelier</h1>
          <p className="text-xs text-slate-500">Inscrivez-vous pour suivre vos commandes</p>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="register-name" className="text-xs font-semibold text-slate-700 block mb-1">Nom complet</label>
            <div className="relative">
              <UserPlus className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                id="register-name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Votre nom"
                className="w-full text-xs pl-10 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-orange-500"
                autoComplete="name"
                minLength={2}
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="register-email" className="text-xs font-semibold text-slate-700 block mb-1">Adresse Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                id="register-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="votre@email.com"
                className="w-full text-xs pl-10 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-orange-500"
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="register-password" className="text-xs font-semibold text-slate-700 block mb-1">Mot de passe</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                id="register-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Au moins 6 caractères"
                className="w-full text-xs pl-10 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-orange-500"
                autoComplete="new-password"
                minLength={6}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs transition shadow-lg shadow-orange-600/30 disabled:bg-slate-300"
          >
            {isLoading ? 'Création du compte...' : 'Créer mon compte'}
            {!isLoading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="relative flex items-center">
          <div className="flex-grow border-t border-slate-200" />
          <span className="px-3 text-xs text-slate-400">ou</span>
          <div className="flex-grow border-t border-slate-200" />
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition disabled:opacity-60"
        >
          <span className="font-black text-base text-blue-600" aria-hidden="true">G</span>
          {isLoading ? 'Connexion en cours...' : 'Continuer avec Google'}
        </button>

        <div className="pt-4 border-t border-slate-100 text-center">
          <button
            type="button"
            onClick={() => navigateTo('login')}
            className="text-xs text-orange-600 font-semibold hover:underline"
          >
            Déjà inscrit ? Se connecter
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
