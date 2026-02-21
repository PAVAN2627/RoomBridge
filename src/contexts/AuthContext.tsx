// Authentication Context
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { onAuthStateChange } from '@/lib/firebase/auth';
import { UserDocument } from '@/lib/firebase/types';
import { getUser } from '@/lib/firebase/users';

interface AuthContextType {
  user: User | null;
  userData: UserDocument | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserDocument | null>(null);
  const [loading, setLoading] = useState(true);

  console.log('AuthProvider rendering, loading:', loading, 'user:', user);

  useEffect(() => {
    console.log('AuthProvider: Setting up auth listener');
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser?.email || 'No user');
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          // Fetch user data from Firestore
          const firestoreUser = await getUser(firebaseUser.uid);
          console.log('Fetched user data:', firestoreUser);
          setUserData(firestoreUser);
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUserData(null);
        }
      } else {
        setUserData(null);
      }
      
      setLoading(false);
      console.log('Auth loading complete');
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    userData,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
