import React, { createContext, useContext, useEffect, useState, useMemo, ReactNode } from 'react';
import { doc, updateDoc, increment, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { Subscription, PlanType } from '../types';
import { differenceInDays } from 'date-fns';

interface SubscriptionContextType {
  subscription: Subscription | null;
  loading: boolean;
  isTrialExpired: boolean;
  daysLeft: number;
  canCreateBill: boolean;
  incrementBillCount: () => Promise<void>;
  upgradePlan: (planType: PlanType) => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { profile, user, isDemo } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemo) {
      setSubscription({
        planType: 'trial',
        billsUsed: 0,
        billLimit: 'unlimited',
        trialStartDate: new Date(),
        trialEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      });
      setLoading(false);
      return;
    }

    if (profile?.subscription) {
      setSubscription(profile.subscription);
      setLoading(false);
    } else if (profile) {
      // Handle cases where profile exists but subscription doesn't (legacy users)
      setSubscription({
        planType: 'trial',
        billsUsed: 0,
        billLimit: 'unlimited',
        trialStartDate: profile.createdAt instanceof Date ? profile.createdAt : ( (profile.createdAt as any)?.toDate?.() || new Date()),
        trialEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Fallback
        updatedAt: new Date()
      });
      setLoading(false);
    } else {
      setSubscription(null);
      setLoading(false);
    }
  }, [profile, isDemo]);

  const { trialEndDate, isTrialExpired, daysLeft } = useMemo(() => {
    const end = subscription?.trialEndDate 
      ? (subscription.trialEndDate instanceof Timestamp 
          ? subscription.trialEndDate.toDate() 
          : new Date(subscription.trialEndDate as any)) 
      : null;
    
    const expired = subscription?.planType === 'trial' && end ? end < new Date() : false;
    const left = end ? Math.max(0, differenceInDays(end, new Date())) : 0;
    
    return { trialEndDate: end, isTrialExpired: expired, daysLeft: left };
  }, [subscription]);

  const canCreateBill = useMemo(() => {
    if (isDemo) return true;
    if (!subscription) return true; 
    
    if (subscription.planType === 'trial') {
      return !isTrialExpired;
    }
    
    if (subscription.billLimit === 'unlimited') return true;
    
    return subscription.billsUsed < (subscription.billLimit as number);
  }, [subscription, isTrialExpired, isDemo]);

  const incrementBillCount = async () => {
    if (isDemo || !user || !subscription) return;

    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        'subscription.billsUsed': increment(1),
        'subscription.updatedAt': serverTimestamp()
      });
    } catch (err) {
      console.error("Error incrementing bill count:", err);
    }
  };

  const upgradePlan = async (planType: PlanType) => {
    if (isDemo || !user) return;

    let billLimit: number | 'unlimited' = 'unlimited';
    if (planType === 'basic') billLimit = 300;

    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        'subscription.planType': planType,
        'subscription.billLimit': billLimit,
        'subscription.updatedAt': serverTimestamp()
      });
    } catch (err) {
      console.error("Error upgrading plan:", err);
      throw err;
    }
  };

  return (
    <SubscriptionContext.Provider value={{ 
      subscription, 
      loading, 
      isTrialExpired, 
      daysLeft, 
      canCreateBill, 
      incrementBillCount,
      upgradePlan
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
