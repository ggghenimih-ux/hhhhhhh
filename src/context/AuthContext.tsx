import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

interface UserType {
  id: string;
  email: string;
  name?: string;
  firstName?: string;
  phone: string;
  role?: 'ADMIN' | 'TECHNICIEN' | 'CUSTOMER';
}

interface AuthContextType {
  user: UserType | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; user?: UserType; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; user?: UserType; error?: string }>;
  register: (email: string, password: string, name: string) => Promise<{
    success: boolean;
    user?: UserType;
    requiresEmailVerification?: boolean;
    message?: string;
    error?: string;
  }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (firebaseUser: FirebaseUser) => {
    let userData: UserType = {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      name: firebaseUser.displayName || 'User',
      phone: '',
      role: 'CUSTOMER'
    };

    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      const userSnapshot = await getDoc(userRef);

      if (userSnapshot.exists()) {
        const profile = userSnapshot.data();
        const role = ['ADMIN', 'TECHNICIEN', 'CUSTOMER'].includes(profile.role)
          ? profile.role
          : 'CUSTOMER';
        userData = {
          ...userData,
          name: profile.name || userData.name,
          firstName: profile.firstName,
          phone: profile.phone || '',
          role,
        };
      } else {
        await setDoc(userRef, {
          email: firebaseUser.email,
          name: firebaseUser.displayName || 'User',
          role: 'CUSTOMER',
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }

    return userData;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userData = await fetchUserData(firebaseUser);
        setUser(userData);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userData = await fetchUserData(userCredential.user);
      setUser(userData);
      return { success: true, user: userData };
    } catch (error: any) {
      return { success: false, error: error.message || 'Échec de connexion' };
    }
  };

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const userData = await fetchUserData(result.user);
      setUser(userData);
      return { success: true, user: userData };
    } catch (error: any) {
      return { success: false, error: error.message || 'Échec de la connexion avec Google.' };
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const credential = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      await updateProfile(credential.user, { displayName: name.trim() });
      const userRef = doc(db, 'users', credential.user.uid);
      await setDoc(userRef, {
        email: credential.user.email,
        name: name.trim(),
        role: 'CUSTOMER',
        createdAt: serverTimestamp(),
      });
      await sendEmailVerification(credential.user);
      await firebaseSignOut(auth);
      return {
        success: true,
        requiresEmailVerification: true,
        message: 'Vérifiez votre adresse e-mail avant de vous connecter.',
      };
    } catch (error: any) {
      return { success: false, error: error.message || 'Erreur lors de la création du compte.' };
    }
  };

  const logout = async () => {
    await firebaseSignOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: user !== null,
        isAdmin: user?.role === 'ADMIN',
        login,
        loginWithGoogle,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};