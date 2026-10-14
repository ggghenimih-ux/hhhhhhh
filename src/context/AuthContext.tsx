import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { collection, query, where, getDocs, setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

interface UserType {
  id: string;
  email: string | null;
  name?: string;
  role?: string;
}

interface AuthContextType {
  user: UserType | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; user?: UserType; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; user?: UserType; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (firebaseUser: any) => {
    let userData: UserType = {
      id: firebaseUser.uid,
      email: firebaseUser.email,
      name: firebaseUser.displayName || 'User',
      role: 'client'
    };

    try {
      // البحث عن المستخدم في مجموعة users باستخدام البريد الإلكتروني لضمان المطابقة
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', firebaseUser.email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        userData = { ...userData, id: userDoc.id, ...userDoc.data() };
      } else {
        // إذا لم يكن موجوداً، نقوم بإنشائه تلقائياً بدور client
        const newUserRef = doc(db, 'users', firebaseUser.uid);
        await setDoc(newUserRef, {
          email: firebaseUser.email,
          name: firebaseUser.displayName || 'User',
          role: 'client',
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

  const logout = async () => {
    await firebaseSignOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, logout }}>
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