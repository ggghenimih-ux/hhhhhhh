import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { auth } from '../services/firebase';
import { api } from '../services/api';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from 'firebase/auth';

const getAuthErrorMessage = (error: unknown): string => {
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? String(error.code)
    : '';

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Adresse e-mail ou mot de passe incorrect.';
    case 'auth/email-already-in-use':
      return 'Cette adresse e-mail est déjà utilisée.';
    case 'auth/weak-password':
      return 'Le mot de passe doit contenir au moins 6 caractères.';
    case 'auth/unauthorized-domain':
      return 'Ce domaine n’est pas autorisé dans les paramètres Firebase.';
    case 'auth/popup-blocked':
      return 'La fenêtre Google a été bloquée. Autorisez les fenêtres pop-up puis réessayez.';
    case 'auth/network-request-failed':
      return 'Connexion impossible. Vérifiez votre connexion Internet et réessayez.';
    default:
      if (code.startsWith('auth/')) {
        return 'La connexion a échoué. Veuillez réessayer.';
      }
      return error instanceof Error
        ? error.message
        : 'Une erreur est survenue. Veuillez réessayer.';
  }
};

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  register: (email: string, password: string, name: string) => Promise<{
    success: boolean;
    user?: User;
    error?: string;
    requiresEmailVerification?: boolean;
    message?: string;
  }>;
  loginWithGoogle: () => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async (): Promise<User | null> => {
    const response = await api.auth.getMe();
    const refreshedUser = response.user || response.data || null;
    setUser(refreshedUser);
    return refreshedUser;
  }, []);

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const response = await api.auth.getMe();
        const authenticatedUser = response.user || response.data || null;
        if (isMounted) {
          setUser(authenticatedUser);
        }
      } catch (error) {
        if (isMounted) {
          setUser(null);
          console.error('Unable to restore the application session:', error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void restoreSession();
    return () => {
      isMounted = false;
    };
  }, []);

  // 1. تسجيل الدخول بـ Email / Password
  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; user?: User; error?: string }> => {
    try {
      setLoading(true);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (!userCredential.user.emailVerified) {
        await signOut(auth);
        return {
          success: false,
          error: 'Veuillez vérifier votre adresse e-mail depuis le message reçu avant de vous connecter.',
        };
      }

      await api.auth.firebase(await userCredential.user.getIdToken());
      const authenticatedUser = await refreshUser();
      if (!authenticatedUser) {
        throw new Error('La session n’a pas pu être créée. Veuillez réessayer.');
      }
      return { success: true, user: authenticatedUser };
    } catch (error) {
      return { success: false, error: getAuthErrorMessage(error) };
    } finally {
      setLoading(false);
    }
  };

  // 2. إنشاء حساب جديد بـ Email / Password
  const register = async (
    email: string, 
    password: string, 
    name: string
  ): Promise<{
    success: boolean;
    user?: User;
    error?: string;
    requiresEmailVerification?: boolean;
    message?: string;
  }> => {
    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name.trim() });
      await sendEmailVerification(userCredential.user);
      await signOut(auth);
      return {
        success: true,
        requiresEmailVerification: true,
        message: 'Un e-mail de vérification vous a été envoyé. Vérifiez votre adresse avant de vous connecter.',
      };
    } catch (error) {
      return { success: false, error: getAuthErrorMessage(error) };
    } finally {
      setLoading(false);
    }
  };

  // 3. تسجيل الدخول بـ Google
  const loginWithGoogle = async (): Promise<{ success: boolean; user?: User; error?: string }> => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      await api.auth.firebase(await result.user.getIdToken());
      const authenticatedUser = await refreshUser();
      if (!authenticatedUser) {
        throw new Error('La session n’a pas pu être créée. Veuillez réessayer.');
      }
      return { success: true, user: authenticatedUser };
    } catch (error) {
      const code = typeof error === 'object' && error !== null && 'code' in error
        ? String(error.code)
        : '';
      if (code === 'auth/popup-closed-by-user') {
        return { success: false };
      }
      return { success: false, error: getAuthErrorMessage(error) };
    } finally {
      setLoading(false);
    }
  };

  // 4. تسجيل الخروج
  const logout = async (): Promise<void> => {
  setLoading(true);

  try {
    // إنهاء جلسة Firebase مباشرة
    await signOut(auth);
  } catch (error) {
    console.error('Firebase sign-out failed:', error);
    throw error;
  } finally {
    // امسح حالة الواجهة حتى لو فشل أحد طلبات الخروج
    setUser(null);
    setLoading(false);
  }

  // إنهاء جلسة الخادم بشكل مستقل؛ فشله لا يعيد تسجيل المستخدم في Firebase
  try {
    await api.auth.logout();
  } catch (error) {
    console.warn('API logout failed:', error);
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
        register,
        loginWithGoogle,
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