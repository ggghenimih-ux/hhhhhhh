import React, { lazy, Suspense } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { StoreProvider, useStore } from './context/StoreContext';
import { MainLayout } from './layouts/MainLayout';
import { HomePage } from './pages/HomePage';
import { ProtectedAdminRoute } from './components/admin/ProtectedAdminRoute';

const ProductsPage = lazy(() => import('./pages/ProductsPage').then((module) => ({ default: module.ProductsPage })));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage').then((module) => ({ default: module.ProductDetailPage })));
const CartPage = lazy(() => import('./pages/CartPage').then((module) => ({ default: module.CartPage })));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage').then((module) => ({ default: module.CheckoutPage })));
const OrderSuccessPage = lazy(() => import('./pages/OrderSuccessPage').then((module) => ({ default: module.OrderSuccessPage })));
const TrackOrderPage = lazy(() => import('./pages/TrackOrderPage').then((module) => ({ default: module.TrackOrderPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then((module) => ({ default: module.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((module) => ({ default: module.ProfilePage })));
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage').then((module) => ({ default: module.AdminLoginPage })));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage').then((module) => ({ default: module.AdminDashboardPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })));

const AppRouter: React.FC = () => {
  const { currentRoute } = useStore();

  switch (currentRoute) {
    case 'home':
      return <HomePage />;
    case 'products':
    case 'category':
    case 'search':
      return <ProductsPage />;
    case 'product-detail':
      return <ProductDetailPage />;
    case 'cart':
      return <CartPage />;
    case 'checkout':
      return <CheckoutPage />;
    case 'order-success':
      return <OrderSuccessPage />;
    case 'track-order':
      return <TrackOrderPage />;
    case 'login':
      return <LoginPage />;
    case 'register':
      return <RegisterPage />;
    case 'profile':
      return <ProfilePage />;
    case 'admin-login':
      return <AdminLoginPage />;
    case 'admin':
    case 'admin-products':
    case 'admin-categories':
    case 'admin-orders':
    case 'admin-users':
    case 'admin-media':
    case 'admin-settings':
      return (
        <ProtectedAdminRoute>
          <AdminDashboardPage />
        </ProtectedAdminRoute>
      );
    case 'not-found':
    default:
      return <NotFoundPage />;
  }
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <StoreProvider>
          <MainLayout>
            <Suspense
              fallback={
                <div className="min-h-[40vh] flex items-center justify-center" role="status" aria-live="polite">
                  <span className="text-sm font-semibold text-slate-600">Chargement…</span>
                </div>
              }
            >
              <AppRouter />
            </Suspense>
          </MainLayout>
        </StoreProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
