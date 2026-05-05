import React from 'react';
import { 
  CreditCard, 
  CheckCircle2, 
  Calendar, 
  BarChart3, 
  Zap, 
  ShieldCheck, 
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

export default function SubscriptionPage() {
  const { subscription, daysLeft, isTrialExpired } = useSubscription();
  const { isDemo } = useAuth();

  const getPlanName = (type: string) => {
    switch (type) {
      case 'trial': return 'Free Trial';
      case 'basic': return 'Basic Plan (₹299)';
      case 'pro': return 'Professional Plan';
      case 'premium': return 'Infinite Edition';
      default: return 'Free Plan';
    }
  };

  const expiryDate = subscription?.trialEndDate 
    ? (subscription.trialEndDate instanceof Timestamp 
        ? subscription.trialEndDate.toDate() 
        : new Date(subscription.trialEndDate as any)) 
    : null;

  const billsUsed = subscription?.billsUsed || 0;
  const billLimit = subscription?.billLimit === 'unlimited' ? Infinity : (subscription?.billLimit as number || 0);
  const usagePercentage = billLimit === Infinity ? 0 : Math.min(100, (billsUsed / billLimit) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CreditCard className="text-blue-600" />
            Plan & Billing
          </h1>
          <p className="text-gray-500">Manage your subscription and track your usage metrics.</p>
        </div>
        <Link to="/upgrade">
          <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
            <Zap size={16} />
            Upgrade Plan
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Current Plan Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm col-span-1 md:col-span-2"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 rounded-lg">
              <ShieldCheck className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Active Plan</p>
              <h2 className="text-xl font-bold text-gray-900">{getPlanName(subscription?.planType || 'trial')}</h2>
            </div>
            {isTrialExpired && (
                <span className="ml-auto px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                    Expired
                </span>
            )}
          </div>

          <div className="space-y-6">
            {/* Usage Metric */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 font-medium">Bills Generated</span>
                <span className="text-gray-900 font-bold">
                  {billsUsed} / {subscription?.billLimit === 'unlimited' ? '∞' : subscription?.billLimit}
                </span>
              </div>
              <Progress value={usagePercentage} className="h-2 bg-gray-100" />
              {subscription?.planType === 'basic' && (
                <p className="text-xs text-gray-500 italic">
                  * Basic plan includes up to 300 bills per lifetime.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
              <div className="space-y-1">
                <p className="text-xs text-gray-500 flex items-center gap-1">
                   <Calendar size={12} />
                   {subscription?.planType === 'trial' ? 'Trial Ends On' : 'Valid Until'}
                </p>
                <p className="text-sm font-bold text-gray-900">
                  {expiryDate ? format(expiryDate, 'dd MMM, yyyy') : 'Active'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <BarChart3 size={12} />
                  Time Remaining
                </p>
                <p className={`text-sm font-bold ${daysLeft < 5 ? 'text-red-600' : 'text-gray-900'}`}>
                  {daysLeft >= 365 
                    ? `${Math.floor(daysLeft / 365)} Years ${daysLeft % 365} Days` 
                    : `${daysLeft} Days`}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-xl text-white shadow-lg space-y-6"
        >
          <div className="space-y-2">
            <h3 className="text-lg font-bold opacity-90">Unlock Efficiency</h3>
            <p className="text-sm opacity-75">Upgrade to a Professional or Elite plan for unlimited bill generation and priority support.</p>
          </div>
          
          <ul className="space-y-3">
            {[
              'Unlimited Invoicing',
              'Advanced Analytics',
              'Priority WhatsApp Support',
              'Remove Watermarks'
            ].map((feature, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <CheckCircle2 size={16} className="text-blue-200" />
                {feature}
              </li>
            ))}
          </ul>

          <Link to="/upgrade" className="block">
            <Button variant="secondary" className="w-full font-bold text-blue-700 bg-white hover:bg-blue-50">
              View Plans
            </Button>
          </Link>
        </motion.div>
      </div>

      {/* Trial Alert Section if active */}
      {subscription?.planType === 'trial' && !isTrialExpired && (
        <div className="bg-amber-50 border border-amber-100 p-4 rounded-lg flex items-start gap-3">
          <AlertCircle className="text-amber-500 flex-shrink-0" size={20} />
          <div>
            <h4 className="text-sm font-bold text-amber-900 uppercase">Trial Period Active</h4>
            <p className="text-sm text-amber-800 opacity-80 mt-1">
              You are currently using the 30-day free trial. You have {daysLeft} days left to explore all premium features. 
              Upgrade now to avoid any interruption in service.
            </p>
          </div>
        </div>
      )}

      {/* Subscription Active Alert */}
      {subscription?.planType !== 'trial' && !isTrialExpired && (
        <div className="bg-green-50 border border-green-100 p-4 rounded-lg flex items-start gap-3">
          <CheckCircle2 className="text-green-500 flex-shrink-0" size={20} />
          <div>
            <h4 className="text-sm font-bold text-green-900 uppercase">Subscription Active</h4>
            <p className="text-sm text-green-800 opacity-80 mt-1 font-medium">
              Your {getPlanName(subscription?.planType || '')} is currently active and in good standing. 
              {subscription?.planType === 'premium' ? ' Enjoy 3 years of unlimited access!' : ' Enjoy your premium features!'}
            </p>
          </div>
        </div>
      )}

      {/* Basic Plan Limit Alert */}
      {subscription?.planType === 'basic' && billsUsed > 250 && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-lg flex items-start gap-3">
          <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
          <div>
            <h4 className="text-sm font-bold text-red-900">Bill Limit Reached Soon</h4>
            <p className="text-sm text-red-800 opacity-80 mt-1">
              You have used {billsUsed} of your 300 bill limit. Upgrade to a Pro plan for unlimited billing.
            </p>
          </div>
        </div>
      )}

      {/* Plan Comparison Shortcut */}
      <div className="pt-4 text-center">
        <p className="text-gray-500 text-sm">
          Need help with your subscription? <Link to="/troubleshoot" className="text-blue-600 hover:underline font-medium">Contact Support</Link>
        </p>
      </div>
    </div>
  );
}
