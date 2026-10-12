import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, AlertCircle } from 'lucide-react';
import { ForgotPassword } from '../components/ForgotPassword';

export const LoginPage: React.FC = () => {
  const { login, loginWithGoogle } = useAuth();
  const { navigateTo, showToast } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      setIsLoading(true);
      const res = await login(email, password);
      if (!res.success || !res.user) {
        throw new Error(res.error || 'Email ou mot de passe incorrect.');
      }
      showToast(`Bienvenue, ${res.user.name} !`, 'success');
      if (res.user.role === 'ADMIN') {
          navigateTo('admin');
      } else {
        navigateTo('home');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Email ou mot de passe incorrect.');
      showToast(err.message || 'Échec de connexion', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    setErrorMsg('');
    try {
      setIsLoading(true);
      const result = await loginWithGoogle();
      if (!result.success || !result.user) {
        if (result.error) setErrorMsg(result.error);
        return;
      }

      showToast(`Bienvenue, ${result.user.name || result.user.email} !`, 'success');
      navigateTo(result.user.role === 'ADMIN' ? 'admin' : 'home');
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : 'Échec de la connexion avec Google.';
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
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            {showForgotPassword ? 'Mot de passe oublié' : 'Connexion Client & Atelier'}
          </h1>
          {!showForgotPassword && (
            <p className="text-xs text-slate-500">Accédez à vos commandes et avantages professionnels</p>
          )}
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {showForgotPassword ? (
          <ForgotPassword initialEmail={email} onBack={() => setShowForgotPassword(false)} />
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="login-email" className="text-xs font-semibold text-slate-700 block mb-1">
                  Adresse Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    id="login-email"
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
                <label htmlFor="login-password" className="text-xs font-semibold text-slate-700 block mb-1">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs pl-10 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-orange-500"
                    required
                  />
                </div>
              </div>

              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-xs font-semibold text-orange-600 hover:underline"
                >
                  Mot de passe oublié ?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs transition shadow-lg shadow-orange-600/30 disabled:bg-slate-300"
              >
                {isLoading ? 'Connexion en cours...' : 'Se Connecter'}
              </button>
            </form>

            <button
              type="button"
              onClick={handleGoogle}
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition disabled:opacity-50"
            >
              {isLoading ? 'Connexion en cours...' : 'Continuer avec Google'}
            </button>

            <div className="pt-4 border-t border-slate-100 text-center">
              <button
                onClick={() => navigateTo('register')}
                className="text-xs text-orange-600 font-semibold hover:underline"
              >
                Pas encore de compte ? Créer un compte atelier →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
