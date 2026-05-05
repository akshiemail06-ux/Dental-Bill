import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Zap, Clock, ShieldCheck, AlertCircle, ChevronRight, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress, ProgressTrack, ProgressIndicator } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { motion } from 'motion/react';
import AppLayout from '../components/AppLayout';
import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useAuth } from '../contexts/AuthContext';

export default function MembershipPage() {
  const navigate = useNavigate();
  const { subscription, daysLeft, isTrialExpired } = useSubscription();
  const { profile } = useAuth();

  const getPlanInfo = () => {
    switch (subscription?.planType) {
      case 'trial':
        return { name: 'Free Trial', icon: <Clock className="text-blue-500" />, color: 'bg-blue-500', textColor: 'text-blue-500' };
      case 'basic':
        return { name: 'Basic Plan', icon: <Zap className="text-orange-500" />, color: 'bg-orange-500', textColor: 'text-orange-500' };
      case 'pro':
        return { name: 'Pro Plan', icon: <Crown className="text-purple-500" />, color: 'bg-purple-500', textColor: 'text-purple-500' };
      case 'premium':
        return { name: 'Premium Plan', icon: <ShieldCheck className="text-green-500" />, color: 'bg-green-500', textColor: 'text-green-500' };
      default:
        return { name: 'No Plan', icon: <AlertCircle className="text-gray-500" />, color: 'bg-gray-500', textColor: 'text-gray-500' };
    }
  };

  const planInfo = getPlanInfo();
  const billsUsed = subscription?.billsUsed || 0;
  const billLimit = subscription?.billLimit === 'unlimited' ? Infinity : (subscription?.billLimit as number || 300);
  const usagePercentage = billLimit === Infinity ? 0 : Math.min(100, (billsUsed / billLimit) * 100);
  const trialPercentage = Math.min(100, (daysLeft / 30) * 100);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Your Membership</h1>
            <p className="text-gray-500 font-medium">Manage your plan and track your usage.</p>
          </div>
          <Button 
            onClick={() => navigate('/pricing')}
            className="bg-blue-600 hover:bg-blue-700 h-11 px-6 rounded-xl font-bold shadow-lg shadow-blue-100"
          >
            Change Plan <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2 border-none shadow-sm overflow-hidden bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                Current Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="flex items-center gap-6">
                <div className={`p-4 rounded-3xl ${planInfo.color} bg-opacity-10 text-4xl`}>
                  {planInfo.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-black text-gray-900">{planInfo.name}</h2>
                    {subscription?.planType === 'trial' && (
                      <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-blue-100 uppercase tracking-widest text-[10px] font-bold">
                        Limited Time
                      </Badge>
                    )}
                  </div>
                  <p className="text-gray-500 text-sm font-medium mt-1">
                    {subscription?.planType === 'trial' 
                      ? `Your free trial ends in ${daysLeft} days.` 
                      : subscription?.planType === 'premium' ? 'Infinite Edition • 3 Years Full Access' : 'Monthly Premium Subscription'}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3 pt-2">
                <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                  <p className="text-gray-400 font-medium tracking-widest uppercase text-[10px]">Valid Until</p>
                  <p className="text-xl font-black text-gray-900">
                    {subscription?.trialEndDate ? format(subscription.trialEndDate instanceof Timestamp ? subscription.trialEndDate.toDate() : new Date(subscription.trialEndDate as any), 'dd MMM, yyyy') : 'N/A'}
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                  <p className="text-gray-400 font-medium tracking-widest uppercase text-[10px]">Time Remaining</p>
                  <p className="text-xl font-black text-gray-900">
                    {daysLeft >= 365 
                      ? `${Math.floor(daysLeft / 365)}Y ${daysLeft % 365}D` 
                      : `${daysLeft} Days`}
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                  <p className="text-gray-400 font-medium tracking-widest uppercase text-[10px]">Bill Limit</p>
                  <p className="text-xl font-black text-gray-900">
                    {billLimit === Infinity ? 'Unlimited' : billLimit}
                  </p>
                </div>
              </div>

              {subscription?.planType === 'trial' && (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-gray-400 font-medium tracking-widest uppercase text-[10px]">Trial Progress</span>
                    <span className="text-blue-600">{daysLeft} days remaining</span>
                  </div>
                  <Progress value={trialPercentage} className="h-3 flex-col gap-0 border-none">
                    <ProgressTrack className="h-3 bg-blue-50">
                      <ProgressIndicator className="bg-blue-500 shadow-sm" />
                    </ProgressTrack>
                  </Progress>
                </div>
              )}

              <div className="p-5 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-between">
                <div>
                   <p className="text-blue-400 font-medium tracking-widest uppercase text-[10px]">Usage</p>
                   <p className="text-2xl font-black text-blue-900">{billsUsed} Bills Generated</p>
                </div>
                {billLimit !== Infinity && (
                  <div className="text-right">
                    <p className="text-blue-400 font-medium tracking-widest uppercase text-[10px]">Percentage</p>
                    <p className="text-xl font-black text-blue-900">{usagePercentage.toFixed(1)}%</p>
                  </div>
                )}
              </div>

              {/* Transaction History Placeholder */}
              <div className="pt-6 border-t border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                    <BarChart3 size={16} className="text-blue-600" />
                    Billing History
                  </h3>
                </div>
                <div className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100/50 text-gray-400 font-bold uppercase text-[10px]">
                        <tr>
                          <th className="px-6 py-3 text-left">Date</th>
                          <th className="px-6 py-3 text-left">Plan</th>
                          <th className="px-6 py-3 text-left">Amount</th>
                          <th className="px-6 py-3 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {subscription?.planType !== 'trial' ? (
                          <tr>
                            <td className="px-6 py-4 text-gray-600 font-medium font-mono">
                              {subscription?.updatedAt ? format(subscription.updatedAt instanceof Timestamp ? subscription.updatedAt.toDate() : new Date(subscription.updatedAt as any), 'dd MMM yyyy') : 'N/A'}
                            </td>
                            <td className="px-6 py-4 text-gray-900 font-bold uppercase">{subscription?.planType}</td>
                            <td className="px-6 py-4 text-gray-900 font-black">
                              {subscription?.planType === 'premium' ? '₹2999' : 
                               subscription?.planType === 'basic' ? '₹299' : '₹0'}
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase">Paid</span>
                            </td>
                          </tr>
                        ) : (
                          <tr>
                            <td colSpan={4} className="px-6 py-10 text-center text-gray-400 italic">
                              No billing history found. Upgrade to a paid plan to see invoices.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {subscription?.planType === 'basic' && (
                <div className="space-y-3 pt-2">
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-gray-400 font-medium tracking-widest uppercase text-[10px]">Usage Percentage</span>
                    <span className={usagePercentage > 90 ? 'text-red-500' : 'text-orange-500'}>{usagePercentage.toFixed(1)}%</span>
                  </div>
                  <Progress value={usagePercentage} className="h-3 flex-col gap-0 border-none">
                    <ProgressTrack className="h-3 bg-orange-50">
                      <ProgressIndicator className={usagePercentage > 90 ? 'bg-red-500' : 'bg-orange-500'} />
                    </ProgressTrack>
                  </Progress>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-gray-900 text-white flex flex-col justify-between">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Upgrade to Pro</CardTitle>
              <CardDescription className="text-gray-400">Unlock unlimited potential for your clinic.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4 text-sm font-medium">
                <li className="flex items-center gap-3">
                  <div className="bg-blue-600 rounded-full p-1"><Zap size={12} /></div>
                  Unlimited Bills
                </li>
                <li className="flex items-center gap-3">
                  <div className="bg-blue-600 rounded-full p-1"><BarChart3 size={12} /></div>
                  Advanced Analytics
                </li>
                <li className="flex items-center gap-3">
                  <div className="bg-blue-600 rounded-full p-1"><ShieldCheck size={12} /></div>
                  Custom Branding
                </li>
              </ul>
            </CardContent>
            <CardContent className="pt-0">
               <Button 
                onClick={() => navigate('/upgrade')}
                className="w-full bg-blue-600 hover:bg-blue-500 h-12 rounded-xl font-bold transition-all hover:scale-[1.02]"
              >
                Upgrade Now
              </Button>
            </CardContent>
          </Card>
        </div>

        {isTrialExpired && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 rounded-3xl bg-red-50 border-2 border-red-200 flex flex-col items-center text-center space-y-4"
          >
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center text-red-600">
              <AlertCircle size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-red-900 leading-tight">Your free trial has ended!</h3>
              <p className="text-red-700 font-medium max-w-md mx-auto mt-2">
                Please upgrade to one of our affordable plans to continue generating bills and managing your clinic efficiently.
              </p>
            </div>
            <Button 
              onClick={() => navigate('/pricing')}
              className="bg-red-600 hover:bg-red-700 h-12 px-10 rounded-xl font-bold shadow-xl shadow-red-200"
            >
              See Pricing
            </Button>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
