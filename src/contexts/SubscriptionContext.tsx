import React, { createContext, useContext, useEffect, useState, useMemo, ReactNode } from 'react';
import { doc, updateDoc, increment, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { Subscription, PlanType } from '../types';
import { differenceInDays } from 'date-fns';
import { toast } from 'sonner';

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
      // Ensure all required fields exist to prevent undefined in Firestore updates
      const sub = profile.subscription;
      const trialEndDate = sub.trialEndDate instanceof Timestamp 
        ? sub.trialEndDate.toDate() 
        : (sub.trialEndDate ? new Date(sub.trialEndDate as any) : null);

      setSubscription({
        planType: sub.planType || 'trial',
        billsUsed: sub.billsUsed || 0,
        billLimit: sub.billLimit || 'unlimited',
        trialStartDate: sub.trialStartDate || profile.createdAt || new Date(),
        trialEndDate: trialEndDate || (sub.planType === 'premium' ? new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
        updatedAt: sub.updatedAt || new Date(),
      } as Subscription);
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

  const { trialEndDate, isSubscriptionExpired, daysLeft } = useMemo(() => {
    const end = subscription?.trialEndDate 
      ? (subscription.trialEndDate instanceof Timestamp 
          ? subscription.trialEndDate.toDate() 
          : new Date(subscription.trialEndDate as any)) 
      : null;
    
    // All plans can expire if an end date is set
    const expired = end ? end < new Date() : false;
    const left = end ? Math.max(0, differenceInDays(end, new Date())) : 0;
    
    return { trialEndDate: end, isSubscriptionExpired: expired, daysLeft: left };
  }, [subscription]);

  const canCreateBill = useMemo(() => {
    if (isDemo) return true;
    if (!subscription) return true; 
    
    // Check for expiration regardless of plan type
    if (isSubscriptionExpired) return false;
    
    if (subscription.billLimit === 'unlimited') return true;
    
    return subscription.billsUsed < (subscription.billLimit as number);
  }, [subscription, isSubscriptionExpired, isDemo]);

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

    if (!planType) {
      console.error("upgradePlan called with invalid planType:", planType);
      toast.error("Invalid plan selection. Please try again.");
      return;
    }

    let billLimit: number | 'unlimited' = 'unlimited';
    let durationDays = 30; // Default to 30 days

    if (planType === 'basic') {
      billLimit = 300;
      durationDays = 30;
    } else if (planType === 'pro') {
      billLimit = 'unlimited';
      durationDays = 30;
    } else if (planType === 'premium') {
      billLimit = 'unlimited';
      durationDays = 365 * 3; // 3 Years for the 2999 plan
    }

    // Set expiry based on plan duration
    const newExpiryDate = new Date();
    if (planType === 'premium') {
      newExpiryDate.setFullYear(newExpiryDate.getFullYear() + 3);
      // Reset time to end of day
      newExpiryDate.setHours(23, 59, 59, 999);
    } else {
      newExpiryDate.setMonth(newExpiryDate.getMonth() + 1);
      newExpiryDate.setHours(23, 59, 59, 999);
    }

    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        'subscription.planType': planType,
        'subscription.billLimit': billLimit,
        'subscription.trialEndDate': Timestamp.fromDate(newExpiryDate),
        'subscription.updatedAt': serverTimestamp(),
        'subscription.purchasedAt': serverTimestamp()
      });
      toast.success(`Successfully activated ${planType.charAt(0).toUpperCase() + planType.slice(1)} plan!`, {
        description: planType === 'premium' ? 'Your 3-year infinite access is now active.' : 'Your subscription has been updated.'
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
      isTrialExpired: isSubscriptionExpired, // Keep name for compatibility or rename in interface
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
