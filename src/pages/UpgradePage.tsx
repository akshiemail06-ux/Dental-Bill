import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, CreditCard, Loader2, Sparkles, AlertCircle, Sparkle } from 'lucide-react';
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
    name: 'Basic Plan', 
    price: '₹299', 
    period: '/mo', 
    limit: '300 bills',
    features: [
      'All Premium Features included',
      '300 bill generation per month',
      'Ortho Case Management',
      'Patient Records & History',
      'Mobile & Desktop access',
      'Secure Cloud storage'
    ]
  },
  { 
    id: 'pro', 
    name: 'Professional', 
    price: '₹799', 
    period: '/mo', 
    limit: 'Unlimited',
    features: [
      'Everything in Basic Plan',
      'Unlimited Bill Generation',
      'Full System Support',
      'Priority Help Desk',
      'Interactive Analytics',
      'Early access to new features'
    ]
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
      'Priority Help Desk',
      'Lifetime Data Security',
      'No Monthly Hassles'
    ]
  }
];

export default function UpgradePage() {
  const navigate = useNavigate();
  const { upgradePlan, subscription } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>((subscription?.planType as PlanType) || 'pro');
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    if (selectedPlan === subscription?.planType) {
      toast.error('You are already on this plan');
      return;
    }

    setLoading(true);
    const it = toast.loading('Processing upgrade...');
    try {
      await upgradePlan(selectedPlan);
      toast.dismiss(it);
      toast.success(`Successfully upgraded to ${selectedPlan.toUpperCase()}!`, {
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

  const selectedPlanData = plans.find(p => p.id === selectedPlan);

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto py-12 px-4 space-y-8">
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Upgrade Your Practice</h1>
          <p className="text-gray-500 font-medium italic">Simulate your plan selection below. Demo environment powered.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2">
            <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
              <CardHeader className="bg-gray-50 border-b p-8">
                <CardTitle className="text-lg font-bold uppercase tracking-widest text-gray-400">Select Billing Plan</CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <RadioGroup value={selectedPlan} onValueChange={(v) => setSelectedPlan(v as PlanType)} className="grid gap-4">
                  {plans.map((plan) => (
                    <div key={plan.id} className="relative">
                      <RadioGroupItem value={plan.id} id={plan.id} className="peer sr-only" />
                      <Label
                        htmlFor={plan.id}
                        className={cn(
                          "flex items-center justify-between p-6 rounded-2xl border-2 cursor-pointer transition-all bg-white",
                          selectedPlan === plan.id 
                            ? "border-blue-600 bg-blue-50/50" 
                            : "border-gray-100 hover:border-blue-200 hover:bg-gray-50"
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                            selectedPlan === plan.id ? "border-blue-600 bg-blue-600" : "border-gray-200"
                          )}>
                            {selectedPlan === plan.id && <Check className="text-white h-4 w-4" />}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-black text-gray-900 tracking-tight">{plan.name}</p>
                              {plan.id === 'premium' && (
                                <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">3 YEARS ACCESS</span>
                              )}
                               {plan.id === 'pro' && (
                                <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">MOST POPULAR</span>
                              )}
                               {plan.id === 'basic' && (
                                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">BEST FOR SMALL CLINIC</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{plan.limit} bill generations</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black text-gray-900">{plan.price}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">{plan.period ? 'per month' : 'one-time'}</p>
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>

                <div className="bg-orange-50 rounded-2xl p-4 flex gap-4 text-orange-800 text-sm border border-orange-100 mt-6">
                  <AlertCircle className="flex-shrink-0 mt-0.5" size={18} />
                  <p className="font-medium leading-relaxed italic">
                    <span className="font-bold">Note:</span> Real payments are disabled. Clicking upgrade will instantly update your status for demonstration purposes.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className={cn(
              "border-none shadow-2xl rounded-3xl overflow-hidden transition-all duration-500",
              selectedPlan === 'premium' ? "bg-purple-600 text-white" : "bg-blue-600 text-white"
            )}>
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-xl font-black flex items-center gap-2">
                  <Sparkle className={selectedPlan === 'premium' ? "text-yellow-400" : "text-blue-300"} size={24} />
                  Included Features
                </CardTitle>
                <p className="text-sm opacity-80 font-medium">Everything you get with {selectedPlan} plan</p>
              </CardHeader>
              <CardContent className="p-8 pt-4 space-y-4">
                <ul className="space-y-3">
                  {selectedPlanData?.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="mt-1 bg-white/20 p-0.5 rounded-full flex-shrink-0">
                        <Check size={14} className="text-white" />
                      </div>
                      <span className="text-sm font-semibold opacity-95">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-8 border-t border-white/10 mt-6">
                  <Button 
                    onClick={handleUpgrade}
                    disabled={loading || subscription?.planType === selectedPlan}
                    className="w-full h-14 bg-white text-blue-600 hover:bg-white/90 rounded-2xl font-black text-lg shadow-xl shadow-black/10 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : 'Activate Now'}
                  </Button>
                  <p className="text-[10px] text-center mt-4 opacity-60 font-bold uppercase tracking-widest">
                    Zero Monthly Fee • Cancel Anytime
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="text-center">
              <Button variant="ghost" onClick={() => navigate('/membership')} className="text-gray-400 hover:text-gray-900 rounded-xl font-bold uppercase tracking-widest text-[10px]">
                Back to Membership
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
