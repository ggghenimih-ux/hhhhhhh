import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { StoreProvider, useStore } from './context/StoreContext';
import { MainLayout } from './layouts/MainLayout';
import { HomePage } from './pages/HomePage';
import { ProductsPage } from './pages/ProductsPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderSuccessPage } from './pages/OrderSuccessPage';
import { TrackOrderPage } from './pages/TrackOrderPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { ProtectedAdminRoute } from './components/admin/ProtectedAdminRoute';
import { NotFoundPage } from './pages/NotFoundPage';

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
    <AuthProvider>
      <StoreProvider>
        <MainLayout>
          <AppRouter />
        </MainLayout>
      </StoreProvider>
    </AuthProvider>
  );
}
