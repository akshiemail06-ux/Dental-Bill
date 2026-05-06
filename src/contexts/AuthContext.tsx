import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile } from '../types';
import { handleFirestoreError } from '../lib/error-handler';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthReady: boolean;
  isDemo: boolean;
  setIsDemo: (val: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isDemo, setIsDemo] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('isDemo') === 'true';
    }
    return false;
  });

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setIsAuthReady(true);
      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
      } else {
        setIsDemo(false);
        sessionStorage.removeItem('isDemo');
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    console.log(`Setting up profile listener for UID: ${user.uid}`);
    const userDocRef = doc(db, 'users', user.uid);
    
    const unsubscribeProfile = onSnapshot(userDocRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log(`Profile loaded for UID: ${user.uid}, Clinic: ${data.clinicId || 'None yet'}`);
        setProfile({ uid: user.uid, ...data } as UserProfile);
        setLoading(false);
      } else {
        console.log("No profile found for user, creating one...");
        try {
          const now = new Date();
          const trialEndDate = new Date();
          trialEndDate.setDate(now.getDate() + 30);

          await setDoc(userDocRef, {
            email: user.email || 'no-email@provided.com',
            role: 'admin',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            subscription: {
              planType: 'trial',
              billsUsed: 0,
              billLimit: 'unlimited',
              trialStartDate: serverTimestamp(),
              trialEndDate: Timestamp.fromDate(trialEndDate),
              updatedAt: serverTimestamp()
            }
          }, { merge: true });
        } catch (err) {
          console.error("Auto-profile creation failed:", err);
          setProfile(null);
          setLoading(false);
        }
      }
    }, (error) => {
      // Only log if we are still authenticated as this user
      if (auth.currentUser?.uid === user.uid) {
        handleFirestoreError(error, 'get', `users/${user.uid}`);
      }
      setLoading(false);
    });

    return () => unsubscribeProfile();
  }, [user]);

  const handleSetIsDemo = (val: boolean) => {
    setIsDemo(val);
    if (val) {
      sessionStorage.setItem('isDemo', 'true');
    } else {
      sessionStorage.removeItem('isDemo');
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAuthReady, isDemo, setIsDemo: handleSetIsDemo }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
