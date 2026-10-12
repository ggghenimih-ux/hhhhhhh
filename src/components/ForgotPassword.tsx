import React, { FormEvent, useState } from 'react';
import { AlertCircle, ArrowLeft, Mail } from 'lucide-react';
import { sendPasswordResetEmail } from '../services/firebase';

interface ForgotPasswordProps {
  initialEmail: string;
  onBack: () => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ initialEmail, onBack }) => {
  const [email, setEmail] = useState(initialEmail);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await sendPasswordResetEmail(email);
      setIsSubmitted(true);
    } catch {
      setError('Impossible d’envoyer le lien pour le moment. Veuillez réessayer plus tard.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-base font-bold text-slate-900">Réinitialiser votre mot de passe</h2>
        <p className="mt-1 text-xs text-slate-500">
          Saisissez votre adresse email pour recevoir un lien de réinitialisation.
        </p>
      </div>

      {error && (
        <div role="alert" className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isSubmitted ? (
        <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center text-xs text-emerald-700">
          Si un compte est associé à cette adresse, vous recevrez un lien de réinitialisation.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="reset-email" className="mb-1 block text-xs font-semibold text-slate-700">
              Adresse Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <input
                id="reset-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="votre@email.com"
                className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-xs outline-none focus:border-orange-500"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-orange-600 py-3.5 text-xs font-bold text-white shadow-lg shadow-orange-600/30 transition hover:bg-orange-700 disabled:bg-slate-300"
          >
            {isLoading ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
          </button>
        </form>
      )}

      <button
        type="button"
        onClick={onBack}
        className="flex w-full items-center justify-center gap-2 py-2 text-xs font-semibold text-slate-600 hover:text-orange-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour à la connexion
      </button>
    </div>
  );
};
