// Authentication Context
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChange } from '@/lib/firebase/auth';
import { UserDocument } from '@/lib/firebase/types';
import { getUser } from '@/lib/firebase/users';
import { db } from '@/lib/firebase';
interface AuthContextType {
  user: User | null;
  userData: UserDocument | null;
  loading: boolean;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  refreshUserData: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const userSnapshotUnsub = useRef<(() => void) | null>(null);

  const refreshUserData = async () => {
    if (!user) return;
    try {
      const fresh = await getUser(user.uid);
      setUserData(fresh);
    } catch (e) {
      console.error('refreshUserData error:', e);
    }
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChange((firebaseUser) => {
      setUser(firebaseUser);

      // Tear down any previous user snapshot listener
      if (userSnapshotUnsub.current) {
        userSnapshotUnsub.current();
        userSnapshotUnsub.current = null;
      }

      if (firebaseUser) {
        // Real-time listener on the user document — auto-updates userData on any change
        const userRef = doc(db, 'users', firebaseUser.uid);
        const unsub = onSnapshot(
          userRef,
          (snap) => {
            if (snap.exists()) {
              setUserData({ user_id: snap.id, ...snap.data() } as UserDocument);
            } else {
              setUserData(null);
            }
            setLoading(false);
          },
          (error) => {
            console.error('User snapshot error:', error);
            setLoading(false);
          }
        );
        userSnapshotUnsub.current = unsub;
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (userSnapshotUnsub.current) userSnapshotUnsub.current();
    };
  }, []);

  const value = {
    user,
    userData,
    loading,
    refreshUserData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
