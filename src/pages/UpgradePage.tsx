import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, CreditCard, Loader2, Sparkles, AlertCircle, Sparkle, ArrowLeft, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { motion } from 'motion/react';
import AppLayout from '../components/AppLayout';
import { useSubscription } from '../contexts/SubscriptionContext';
import { PlanType } from '../types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const plans = [
  { 
    id: 'basic', 
    name: 'Starter Plan', 
    price: '₹299', 
    period: '/mo', 
    limit: '300 Total',
    features: [
      'Standard PDF Layout',
      '300 bill generations',
      'Ortho Case Management',
      'Patient Records & History',
      'Secure Cloud storage'
    ],
    color: 'blue'
  },
  { 
    id: 'pro', 
    name: 'Professional', 
    price: '₹799', 
    period: '/mo', 
    limit: 'Unlimited',
    features: [
      'Everything in Basic',
      'Unlimited Bill Generation',
      'Priority Help Desk',
      'Interactive Analytics',
      'Multi-device Sync'
    ],
    color: 'indigo'
  },
  { 
    id: 'premium', 
    name: 'Infinite Edition', 
    price: '₹2999', 
    period: ' / 3 Yrs', 
    limit: '3 Years',
    features: [
      'Everything in Professional',
      '3 Years Full Access',
      'Infinite Bill Generation',
      'Bulk Data Export',
      'Early access to AI InSights'
    ],
    color: 'amber'
  }
];

export default function UpgradePage() {
  const navigate = useNavigate();
  const { upgradePlan, subscription } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(() => {
    if (subscription?.planType && ['basic', 'pro', 'premium'].includes(subscription.planType)) {
      return subscription.planType as PlanType;
    }
    return 'pro';
  });
  const [loading, setLoading] = useState(false);

  const selectedPlanData = plans.find(p => p.id === selectedPlan);

  // Sync selectedPlan if subscription loads and current is pro (default)
  React.useEffect(() => {
    if (subscription?.planType && subscription.planType !== 'trial' && subscription.planType !== selectedPlan) {
      setSelectedPlan(subscription.planType as PlanType);
    }
  }, [subscription, selectedPlan]);

  const handleUpgrade = async () => {
    if (!selectedPlan) {
      toast.error('Please select a plan first');
      return;
    }

    if (selectedPlan === subscription?.planType) {
      toast.error('You are already on this plan');
      return;
    }

    setLoading(true);
    const it = toast.loading('Processing upgrade...');
    try {
      await upgradePlan(selectedPlan);
      toast.dismiss(it);
      toast.success(`Successfully activated ${selectedPlan.toUpperCase()}!`, {
        icon: <Sparkles className="text-yellow-500" />,
        duration: 5000
      });
      navigate('/membership');
    } catch (error) {
      toast.dismiss(it);
      toast.error('Upgrade failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto py-12 px-4 space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-gray-900 tracking-tight uppercase">Elevate Your Practice</h1>
            <p className="text-gray-500 font-medium tracking-tight">Scale your clinic with precision and unlimited potential.</p>
          </div>
          <Button variant="ghost" onClick={() => navigate(-1)} className="text-gray-400 font-bold hover:text-gray-900">
            <ArrowLeft className="mr-2" size={16} /> Back
          </Button>
        </div>

        <div className="grid gap-4">
          <RadioGroup value={selectedPlan} onValueChange={(v) => setSelectedPlan(v as PlanType)}>
            <div className="grid gap-3">
              {plans.map((plan) => (
                <div key={plan.id} className="relative group">
                   {plan.id === 'premium' && (
                    <div className="absolute -top-2 -right-1 z-10">
                       <span className="bg-amber-500 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-amber-200 ring-2 ring-white">Best Value</span>
                    </div>
                  )}
                  <RadioGroupItem value={plan.id} id={plan.id} className="peer sr-only" />
                  <Label
                    htmlFor={plan.id}
                    className={cn(
                      "flex flex-col md:flex-row md:items-center justify-between p-6 rounded-3xl border-2 cursor-pointer transition-all bg-white relative overflow-hidden",
                      selectedPlan === plan.id 
                        ? plan.color === 'blue' ? "border-blue-500 bg-blue-50/30 shadow-xl shadow-blue-100" :
                          plan.color === 'indigo' ? "border-indigo-500 bg-indigo-50/30 shadow-xl shadow-indigo-100" :
                          "border-amber-500 bg-amber-50/30 shadow-xl shadow-amber-100"
                        : "border-gray-100 hover:border-gray-200"
                    )}
                  >
                    <div className="flex items-center gap-5">
                      <div className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                        selectedPlan === plan.id 
                          ? plan.color === 'blue' ? "border-blue-500 bg-blue-500 shadow-inner" :
                            plan.color === 'indigo' ? "border-indigo-500 bg-indigo-500 shadow-inner" :
                            "border-amber-500 bg-amber-500 shadow-inner"
                          : "border-gray-200"
                      )}>
                        {selectedPlan === plan.id && <Check className="text-white h-4 w-4" strokeWidth={4} />}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-3">
                          <p className="text-xl font-black text-gray-900 tracking-tight uppercase leading-none">{plan.name}</p>
                          {plan.id === 'pro' && (
                            <span className="text-[9px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md font-black uppercase tracking-widest leading-none">Most popular</span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">{plan.limit} Bill generations</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 md:mt-0 flex items-center gap-6 justify-between md:justify-end">
                      <div className="hidden lg:flex gap-2">
                        {plan.features.slice(0, 3).map((f, i) => (
                           <div key={i} className="px-2 py-1 bg-white/50 border border-gray-100 rounded-lg flex items-center gap-1">
                              <Check size={8} className="text-green-500" />
                              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter truncate max-w-[80px]">{f}</span>
                           </div>
                        ))}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-gray-900 leading-none">{plan.price}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">{plan.period.replace('/', '').trim()}</p>
                      </div>
                    </div>
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>

        {/* Selected Plan Summary Footer */}
        <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="bg-gray-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden"
        >
          {/* Subtle Decorative Gradient */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500 rounded-full blur-[140px] opacity-20 -mr-40 -mt-40"></div>
          
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
             <div className="space-y-6 text-center lg:text-left">
                <div className="space-y-2">
                  <p className="text-blue-400 font-black tracking-[0.4em] uppercase text-[10px]">Your Selection</p>
                  <h2 className="text-3xl font-black uppercase tracking-tight leading-none">
                    {selectedPlanData?.name}
                  </h2>
                </div>
                
                <div className="grid grid-cols-2 gap-x-8 gap-y-3 max-w-sm">
                   {selectedPlanData?.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Check size={14} className="text-blue-500" strokeWidth={3} />
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter whitespace-nowrap">{feature}</span>
                      </div>
                   ))}
                </div>
             </div>

             <div className="flex flex-col items-center lg:items-end gap-5 min-w-[240px]">
                <div className="text-center lg:text-right">
                   <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Final Amount</p>
                   <p className="text-5xl font-black text-white tracking-tighter leading-none">
                      {selectedPlanData?.price}
                   </p>
                   <p className="text-[10px] text-blue-500 font-black uppercase mt-1">Simulated Checkout • Real Keys Pending</p>
                </div>
                
                <Button 
                   onClick={handleUpgrade}
                   disabled={loading || selectedPlan === subscription?.planType}
                   className="w-full h-16 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest shadow-xl shadow-blue-900/40 text-xl transition-all active:scale-95 group relative overflow-hidden"
                >
                   <span className="relative z-10 flex items-center justify-center gap-2">
                      {loading ? (
                        <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>Activate Plan <CreditCard className="ml-2 group-hover:translate-x-1 transition-transform" size={20} /></>
                      )}
                   </span>
                </Button>
                
                <div className="flex items-center gap-4 text-gray-500 text-[10px] font-black uppercase tracking-widest">
                   <span className="flex items-center gap-1"><Shield size={12} className="text-blue-500" /> SSL SECURE</span>
                   <span className="flex items-center gap-1"><Zap size={12} className="text-blue-500" /> INSTANT UPGRADE</span>
                </div>
             </div>
          </div>
        </motion.div>

        <div className="text-center space-y-4">
           <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.25em] px-10 max-w-2xl mx-auto leading-relaxed">
              Payments are simulated in this demo. Credits will be applied immediately to your workspace. 
              Future updates will include Razorpay & Stripe integration for real transactions.
           </p>
           <Button variant="ghost" onClick={() => navigate('/membership')} className="text-gray-400 hover:text-gray-900 font-black uppercase tracking-widest text-[9px]">
             Back to Membership Dashboard
           </Button>
        </div>
      </div>
    </AppLayout>
  );
}
