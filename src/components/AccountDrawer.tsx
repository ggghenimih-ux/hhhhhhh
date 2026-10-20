import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Globe2,
  LogIn,
  LogOut,
  Mail,
  MessageCircle,
  Package,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStoreCart, useStoreNotifications, useStoreRouting, useStoreSettings } from '../context/StoreSlices';
import { useDialogAccessibility } from '../hooks/useDialogAccessibility';
import { api } from '../services/api';
import { Language } from '../types';
import { whatsappLink } from '../lib/whatsapp';
import { getOrderTotal } from '../lib/orderTotals';

type CustomerOrder = {
  id: string;
  orderNumber: string;
  status?: string;
  grandTotal?: number;
  totalTND?: number;
  total?: number;
  items?: unknown[];
};

type AccountDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
};

const languageLabels: Record<Language, string> = {
  ar: 'العربية',
  fr: 'FR',
  en: 'EN',
};

const drawerCopy = {
  ar: {
    account: 'حسابي',
    welcome: 'مرحباً',
    closeMenu: 'إغلاق القائمة',
    close: 'إغلاق',
    verifying: 'جارٍ التحقق من الحساب…',
    myOrders: 'طلباتي',
    viewAccount: 'عرض الحساب',
    loadingOrders: 'جارٍ تحميل الطلبات…',
    noOrders: 'لا توجد طلبات بعد.',
    admin: 'فضاء الإدارة',
    logout: 'تسجيل الخروج',
    loginTitle: 'سجّل الدخول إلى حسابك',
    loginDescription: 'تابع طلباتك وأدر حسابك.',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    login: 'تسجيل الدخول',
    loggingIn: 'جارٍ تسجيل الدخول…',
    google: 'المتابعة باستخدام Google',
    createAccount: 'إنشاء حساب جديد',
    links: 'روابط الحساب',
    trackOrder: 'تتبع طلبي',
    language: 'اللغة',
    continueShopping: 'متابعة التسوق',
    loginFailed: 'تعذّر تسجيل الدخول.',
    googleFailed: 'تعذّر تسجيل الدخول باستخدام Google.',
    logoutSuccess: 'تم تسجيل الخروج.',
    logoutFailed: 'تعذّر تسجيل الخروج.',
  },
  fr: {
    account: 'Mon compte',
    welcome: 'Bienvenue',
    closeMenu: 'Fermer le compte',
    close: 'Fermer',
    verifying: 'Vérification du compte…',
    myOrders: 'Mes commandes',
    viewAccount: 'Voir le compte',
    loadingOrders: 'Chargement des commandes…',
    noOrders: 'Aucune commande pour le moment.',
    admin: 'Espace Administration',
    logout: 'Déconnexion',
    loginTitle: 'Connectez-vous à votre compte',
    loginDescription: 'Retrouvez vos commandes et votre compte.',
    email: 'E-mail',
    password: 'Mot de passe',
    login: 'Se connecter',
    loggingIn: 'Connexion…',
    google: 'Continuer avec Google',
    createAccount: 'Créer un compte',
    links: 'Liens du compte',
    trackOrder: 'Suivre ma commande',
    language: 'Langue',
    continueShopping: 'Continuer mes achats',
    loginFailed: 'Échec de connexion.',
    googleFailed: 'Échec de la connexion avec Google.',
    logoutSuccess: 'Déconnexion effectuée.',
    logoutFailed: 'Impossible de vous déconnecter.',
  },
  en: {
    account: 'My account',
    welcome: 'Welcome',
    closeMenu: 'Close account panel',
    close: 'Close',
    verifying: 'Checking your account…',
    myOrders: 'My orders',
    viewAccount: 'View account',
    loadingOrders: 'Loading orders…',
    noOrders: 'No orders yet.',
    admin: 'Administration',
    logout: 'Sign out',
    loginTitle: 'Sign in to your account',
    loginDescription: 'View your orders and manage your account.',
    email: 'Email',
    password: 'Password',
    login: 'Sign in',
    loggingIn: 'Signing in…',
    google: 'Continue with Google',
    createAccount: 'Create an account',
    links: 'Account links',
    trackOrder: 'Track my order',
    language: 'Language',
    continueShopping: 'Continue shopping',
    loginFailed: 'Sign-in failed.',
    googleFailed: 'Google sign-in failed.',
    logoutSuccess: 'You have signed out.',
    logoutFailed: 'Unable to sign out.',
  },
} as const;

export const AccountDrawer: React.FC<AccountDrawerProps> = ({ isOpen, onClose }) => {
  const { user, loading, login, loginWithGoogle, logout } = useAuth();
  const { language, setLanguage, settings, formatPrice } = useStoreSettings();
  const { navigateTo } = useStoreRouting();
  const { showToast } = useStoreNotifications();
  const copy = drawerCopy[language];
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState('');
  const dialogRef = useDialogAccessibility(isOpen, onClose);
  const direction = language === 'ar' ? 'rtl' : 'ltr';
  const displayName = user?.name || user?.firstName || user?.email || '';
  const whatsappNumber = settings.whatsappNumber || settings.whatsapp || settings.phone;
  const whatsappUrl = whatsappNumber ? whatsappLink(whatsappNumber) : '';

  useEffect(() => {
    if (!isOpen || !user) {
      setOrders([]);
      setOrdersError('');
      return;
    }

    let active = true;
    setIsLoadingOrders(true);
    setOrdersError('');
    api.orders.getMyOrders()
      .then((response) => {
        if (active) setOrders(response.data ?? []);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setOrdersError(error instanceof Error ? error.message : 'Impossible de charger vos commandes.');
      })
      .finally(() => {
        if (active) setIsLoadingOrders(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, user?.id]);

  if (!isOpen) return null;

  const openRoute = (route: 'register' | 'track-order' | 'profile' | 'admin-orders' | 'admin') => {
    onClose();
    navigateTo(route);
  };

  const handleEmailLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);
    try {
      const result = await login(email.trim(), password);
      if (!result.success) throw new Error(result.error || copy.loginFailed);
      showToast(`${copy.welcome}, ${result.user?.name || result.user?.email || email}!`, 'success');
      setPassword('');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : copy.loginFailed);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage('');
    setIsSubmitting(true);
    try {
      const result = await loginWithGoogle();
      if (!result.success) throw new Error(result.error || copy.googleFailed);
      showToast(`${copy.welcome}, ${result.user?.name || result.user?.email || ''}!`, 'success');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : copy.googleFailed);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      showToast(copy.logoutSuccess, 'info');
    } catch (error) {
      showToast(error instanceof Error ? error.message : copy.logoutFailed, 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-[70]">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-[#0F1B2D]/55 backdrop-blur-[2px]"
        aria-label={copy.closeMenu}
      />
      <aside
        ref={dialogRef}
        dir={direction}
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-drawer-title"
        tabIndex={-1}
        className="absolute inset-y-0 right-0 flex w-[min(100%,420px)] flex-col overflow-y-auto bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-[#E3E8F0] bg-[#0F1B2D] px-5 py-5 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-orange-400">
              <UserRound className="h-5 w-5" />
            </div>
            <div>
              <h2 id="account-drawer-title" className="text-base font-extrabold">
                {copy.account}
              </h2>
              <p className="text-xs text-white/65">
                {user ? displayName : 'Outils Réparation GSM'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
            aria-label={copy.close}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 p-5">
          {loading ? (
            <p role="status" className="rounded-xl bg-slate-50 p-4 text-sm text-[#5B6B82]">
              {copy.verifying}
            </p>
          ) : user ? (
            <>
              <div className="rounded-2xl border border-[#E3E8F0] bg-[#F3F5F9] p-4">
                <p className="font-bold text-[#0F1B2D]">{displayName}</p>
                <p className="mt-1 flex items-center gap-2 text-sm text-[#5B6B82]">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{user.email}</span>
                </p>
              </div>

              <section aria-labelledby="account-orders-heading">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h3 id="account-orders-heading" className="font-bold text-[#0F1B2D]">
                    {copy.myOrders}
                  </h3>
                  <button
                    type="button"
                    onClick={() => openRoute('profile')}
                    className="text-xs font-semibold text-orange-700 hover:underline"
                  >
                    {copy.viewAccount}
                  </button>
                </div>
                {isLoadingOrders ? (
                  <p role="status" className="text-sm text-[#5B6B82]">
                    {copy.loadingOrders}
                  </p>
                ) : ordersError ? (
                  <p role="alert" className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700">                                    {ordersError}</p>
                ) : orders.length ? (
                  <div className="space-y-2">
                    {orders.slice(0, 5).map((order) => (
                      <button
                        key={order.id}
                        type="button"
                        onClick={() => {
                          onClose();
                          navigateTo('track-order', { orderNumber: order.id });
                        }}
                        className="flex w-full items-center justify-between gap-3 rounded-xl border border-[#E3E8F0] p-3 text-left transition hover:border-orange-300 hover:bg-orange-50/50"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-bold text-[#0F1B2D]">
                            {order.orderNumber}
                          </span>
                          <span className="text-xs text-[#5B6B82]">{order.status || 'pending'}</span>
                        </span>
                        <span className="shrink-0 text-xs font-bold text-orange-700">
                          {formatPrice(getOrderTotal(order))}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-xl bg-[#F3F5F9] p-3 text-sm text-[#5B6B82]">
                    {copy.noOrders}
                  </p>
                )}
              </section>

              {user.role === 'ADMIN' && (
                <button
                  type="button"
                  onClick={() => openRoute('admin')}
                  className="flex w-full items-center gap-3 rounded-xl border border-[#E3E8F0] p-3 text-sm font-semibold text-[#0F1B2D] hover:bg-slate-50"
                >
                  <ShieldCheck className="h-4 w-4 text-orange-700" />
                  {copy.admin}
                </button>
              )}

              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 px-4 py-3 text-sm font-bold text-rose-700 transition hover:bg-rose-50"
              >
                <LogOut className="h-4 w-4" />
                {copy.logout}
              </button>
            </>
          ) : (
            <>
              <div>
                <h3 className="text-lg font-extrabold text-[#0F1B2D]">
                  {copy.loginTitle}
                </h3>
                <p className="mt-1 text-sm text-[#5B6B82]">
                  {copy.loginDescription}
                </p>
              </div>
              <form onSubmit={handleEmailLogin} className="space-y-3">
                <label className="block text-xs font-semibold text-[#0F1B2D]" htmlFor="account-email">
                  {copy.email}
                  <input
                    id="account-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[#E3E8F0] px-3 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    placeholder={language === 'ar' ? 'name@example.com' : language === 'en' ? 'name@example.com' : 'votre@email.com'}
                  />
                </label>
                <label className="block text-xs font-semibold text-[#0F1B2D]" htmlFor="account-password">
                  {copy.password}
                  <input
                    id="account-password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[#E3E8F0] px-3 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    placeholder="••••••••"
                  />
                </label>
                {errorMessage && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700">{errorMessage}</p>}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#D63F06] px-4 py-3 text-sm font-bold text-white transition hover:bg-orange-800 disabled:opacity-60"
                >
                  <LogIn className="h-4 w-4" />
                  {isSubmitting ? copy.loggingIn : copy.login}
                </button>
              </form>
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isSubmitting}
                className="w-full rounded-xl border border-[#E3E8F0] px-4 py-3 text-sm font-semibold text-[#0F1B2D] transition hover:bg-[#F3F5F9] disabled:opacity-60"
              >
                G&nbsp; · &nbsp;{copy.google}
              </button>
              <button
                type="button"
                onClick={() => openRoute('register')}
                className="w-full text-sm font-bold text-orange-700 hover:underline"
              >
                {copy.createAccount}
              </button>
            </>
          )}

          <nav aria-label={copy.links} className="space-y-1 border-t border-[#E3E8F0] pt-4">
            <button
              type="button"
              onClick={() => openRoute('track-order')}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-[#0F1B2D] hover:bg-[#F3F5F9]"
            >
              <Package className="h-4 w-4 text-orange-700" />
              {copy.trackOrder}
            </button>
            {user && (
              <button
                type="button"
                onClick={() => openRoute('profile')}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-[#0F1B2D] hover:bg-[#F3F5F9]"
              >
                <Package className="h-4 w-4 text-orange-700" />
                {copy.myOrders}
              </button>
            )}
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-[#0F1B2D] hover:bg-[#F3F5F9]"
              >
                <MessageCircle className="h-4 w-4 text-[#1FA855]" />
                WhatsApp
              </a>
            )}
          </nav>
        </div>

        <div className="border-t border-[#E3E8F0] bg-[#F3F5F9] p-5">
          <div className="mb-3 flex items-center gap-2 text-xs font-bold text-[#5B6B82]">
            <Globe2 className="h-4 w-4" />
            {copy.language}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(['ar', 'fr', 'en'] as const).map((option) => (
              <button
                key={option}
                type="button"
                lang={option}
                onClick={() => setLanguage(option)}
                aria-pressed={language === option}
                className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
                  language === option
                    ? 'bg-[#0F1B2D] text-white'
                    : 'bg-white text-[#5B6B82] hover:text-[#0F1B2D]'
                }`}
              >
                {languageLabels[option]}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="mt-4 flex items-center gap-2 text-xs font-semibold text-[#5B6B82] hover:text-[#0F1B2D]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {copy.continueShopping}
          </button>
        </div>
      </aside>
    </div>
  );
};
