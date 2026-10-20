import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

export const ProtectedAdminRoute: React.FC<ProtectedAdminRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[60vh] p-8" role="status" aria-live="polite">
        <span className="sr-only">Vérification des droits d'administration…</span>
      </div>
    );
  }

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
