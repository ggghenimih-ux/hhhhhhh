import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { api } from '../services/api';

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch current user from session / token
  const refreshUser = useCallback(async (): Promise<User | null> => {
    try {
      const res = await api.auth.getMe();
      const currentUser = res?.user || res?.data || null;
      if (currentUser && currentUser.id) {
        const mappedUser: User = {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          phone: currentUser.phone || '',
          role: currentUser.role as 'CUSTOMER' | 'ADMIN',
          isAdmin: currentUser.role === 'ADMIN',
        };
        setUser(mappedUser);
        return mappedUser;
      } else {
        setUser(null);
        return null;
      }
    } catch (err) {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Login handler
  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; user?: User; error?: string }> => {
    try {
      setLoading(true);
      const res = await api.auth.login({ email, password });
      const loggedUser = res?.user || res?.data;

      if (!loggedUser || !loggedUser.id) {
        throw new Error(res?.message || 'Identifiants incorrects.');
      }

      const mappedUser: User = {
        id: loggedUser.id,
        name: loggedUser.name,
        email: loggedUser.email,
        phone: loggedUser.phone || '',
        role: loggedUser.role as 'CUSTOMER' | 'ADMIN',
        isAdmin: loggedUser.role === 'ADMIN',
      };

      setUser(mappedUser);
      return { success: true, user: mappedUser };
    } catch (err: any) {
      const msg = err.message || 'Email ou mot de passe incorrect.';
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  // Logout handler
  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      await api.auth.logout();
    } catch (err) {
      console.warn('Logout error:', err);
    } finally {
      setUser(null);
      setLoading(false);
    }
  };

  const isAuthenticated = Boolean(user);
  const isAdmin = Boolean(user && user.role === 'ADMIN');

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        isAdmin,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
