import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { api } from '../services/api';
import { AdminOverviewTab } from '../components/admin/AdminOverviewTab';
import { AdminSettingsTab } from '../components/admin/AdminSettingsTab';
import { AdminProductsTab } from '../components/admin/AdminProductsTab';
import { AdminCategoriesTab } from '../components/admin/AdminCategoriesTab';
import { AdminOrdersTab } from '../components/admin/AdminOrdersTab';
import { AdminMediaTab } from '../components/admin/AdminMediaTab';
import { AdminUsersTab } from '../components/admin/AdminUsersTab';
import AdminOrderNotifier from '../components/AdminOrderNotifier';
import {
  ShieldCheck,
  LayoutDashboard,
  Settings,
  Package,
  FolderTree,
  ShoppingCart,
  Image as ImageIcon,
  RefreshCw,
  LogOut,
  ExternalLink,
  Users,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { currentRoute, routeParams, navigateTo } = useStore();

  type TabType = 'overview' | 'settings' | 'products' | 'categories' | 'orders' | 'users' | 'media';

  // Determine active tab from route
  const getInitialTab = (): TabType => {
    if (currentRoute === 'admin-settings') return 'settings';
    if (currentRoute === 'admin-products') return 'products';
    if (currentRoute === 'admin-categories') return 'categories';
    if (currentRoute === 'admin-orders') return 'orders';
    if (currentRoute === 'admin-users') return 'users';
    if (currentRoute === 'admin-media') return 'media';
    return 'overview';
  };

  const [activeTab, setActiveTab] = useState<TabType>(getInitialTab());
  const [stats, setStats] = useState<{
    totalOrders: number;
    totalRevenue: number;
    totalProducts: number;
    catalogProducts?: number;
    totalCategories?: number;
    deliveredOrders?: number;
    lowStockProducts: number;
    recentOrders?: any[];
  }>({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    catalogProducts: 0,
    totalCategories: 0,
    deliveredOrders: 0,
    lowStockProducts: 0,
    recentOrders: [],
  });

  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [pendingOrderCount, setPendingOrderCount] = useState(0);

  // Sync activeTab when currentRoute changes
  useEffect(() => {
    if (currentRoute === 'admin-settings') setActiveTab('settings');
    else if (currentRoute === 'admin-products') setActiveTab('products');
    else if (currentRoute === 'admin-categories') setActiveTab('categories');
    else if (currentRoute === 'admin-orders') setActiveTab('orders');
    else if (currentRoute === 'admin-users') setActiveTab('users');
    else if (currentRoute === 'admin-media') setActiveTab('media');
    else if (currentRoute === 'admin') setActiveTab('overview');
  }, [currentRoute]);

  const loadStats = async () => {
    try {
      setIsLoadingStats(true);
      const res = await api.orders.getAdminStats();
      if (res?.data) {
        setStats(res.data);
      }
    } catch (err: any) {
      console.warn('Failed to load stats:', err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      loadStats();
    }
  }, [user]);

  // Tab switch with URL sync
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    switch (tab) {
      case 'settings':
        navigateTo('admin-settings');
        break;
      case 'products':
        navigateTo('admin-products');
        break;
      case 'categories':
        navigateTo('admin-categories');
        break;
      case 'orders':
        navigateTo('admin-orders');
        break;
      case 'users':
        navigateTo('admin-users');
        break;
      case 'media':
        navigateTo('admin-media');
        break;
      case 'overview':
      default:
        navigateTo('admin');
        break;
    }
  };

  // Auth Guard
  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Accès Administrateur Restreint</h2>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Cette section de gestion est strictement réservée à l'équipe d'administration du magasin Outils Réparation GSM Tunisie.
          </p>
        </div>
        <button
          onClick={() => navigateTo('admin-login')}
          className="px-6 py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md transition"
        >
          Se connecter en tant qu'administrateur
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-orange-600 flex items-center justify-center text-white shadow-md flex-shrink-0">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                Panneau d'Administration CMS
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                BDD SQLite Connectée
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Gestion complète et synchronisée des réglages, produits, catégories et commandes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          <AdminOrderNotifier
            onOpenOrder={() => handleTabChange('orders')}
            onPendingChange={setPendingOrderCount}
          />

          <button
            onClick={() => navigateTo('home')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
            title="Aller sur la boutique"
          >
            <ExternalLink className="w-3.5 h-3.5 text-orange-400" />
            <span>Voir la boutique</span>
          </button>

          <button
            onClick={loadStats}
            disabled={isLoadingStats}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
            title="Actualiser les statistiques"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStats ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>

          <button
            onClick={async () => {
              await logout();
              navigateTo('home');
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 text-rose-300 text-xs font-bold transition"
            title="Déconnexion"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => handleTabChange('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition flex-shrink-0 ${
            activeTab === 'overview'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Vue d'Ensemble</span>
        </button>

        <button
          onClick={() => handleTabChange('settings')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition flex-shrink-0 ${
            activeTab === 'settings'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Paramètres du Magasin</span>
        </button>

        <button
          onClick={() => handleTabChange('products')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition flex-shrink-0 ${
            activeTab === 'products'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Produits ({stats.totalProducts})</span>
        </button>

        <button
          onClick={() => handleTabChange('categories')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition flex-shrink-0 ${
            activeTab === 'categories'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FolderTree className="w-4 h-4" />
          <span>Catégories</span>
        </button>

        <button
          onClick={() => handleTabChange('orders')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition flex-shrink-0 ${
            activeTab === 'orders'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Commandes</span>
          {pendingOrderCount > 0 && (
            <span className="min-w-5 rounded-full bg-rose-500 px-1.5 py-0.5 text-center text-[10px] text-white">
              {pendingOrderCount > 99 ? '99+' : pendingOrderCount}
            </span>
          )}
        </button>

        <button
          onClick={() => handleTabChange('users')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition flex-shrink-0 ${
            activeTab === 'users'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Utilisateurs</span>
        </button>

        <button
          onClick={() => handleTabChange('media')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition flex-shrink-0 ${
            activeTab === 'media'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Médiathèque</span>
        </button>
      </div>

      {/* Render Active Tab Component */}
      <div>
        {activeTab === 'overview' && (
          <AdminOverviewTab
            stats={stats}
            onNavigateTab={handleTabChange}
            onRefreshData={loadStats}
          />
        )}

        {activeTab === 'settings' && <AdminSettingsTab />}

        {activeTab === 'products' && (
          <AdminProductsTab
            onRefreshData={loadStats}
            initialProductId={routeParams.productId}
            initialProductAction={routeParams.productAction}
            onInitialActionHandled={() => navigateTo('admin-products')}
          />
        )}

        {activeTab === 'categories' && (
          <AdminCategoriesTab onRefreshData={loadStats} />
        )}

        {activeTab === 'orders' && (
          <AdminOrdersTab onRefreshData={loadStats} />
        )}

        {activeTab === 'users' && <AdminUsersTab />}

        {activeTab === 'media' && <AdminMediaTab />}
      </div>
    </div>
  );
};
