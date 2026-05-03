import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, CreditCard, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { motion } from 'motion/react';
import AppLayout from '../components/AppLayout';
import { useSubscription } from '../contexts/SubscriptionContext';
import { PlanType } from '../types';
import { toast } from 'sonner';

const plans = [
  { id: 'basic', name: 'Basic Plan', price: '₹299', period: '/mo', limit: '300 bills' },
  { id: 'pro', name: 'Pro Plan', price: '₹799', period: '/mo', limit: 'Unlimited' },
  { id: 'premium', name: 'Premium Plan', price: '₹2999', period: '', limit: 'Lifetime' }
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

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto py-12 px-4 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Upgrade Your Account</h1>
          <p className="text-gray-500 font-medium italic">Simulate your plan selection below. Demo environment powered.</p>
        </div>

        <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-gray-50 border-b p-8">
            <CardTitle className="text-lg font-bold uppercase tracking-widest text-gray-400">Select Professional Plan</CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <RadioGroup value={selectedPlan} onValueChange={(v) => setSelectedPlan(v as PlanType)} className="grid gap-4">
              {plans.map((plan) => (
                <div key={plan.id} className="relative">
                  <RadioGroupItem value={plan.id} id={plan.id} className="peer sr-only" />
                  <Label
                    htmlFor={plan.id}
                    className="flex items-center justify-between p-6 rounded-2xl border-2 border-gray-100 cursor-pointer transition-all peer-data-[state=checked]:border-blue-600 peer-data-[state=checked]:bg-blue-50/50 hover:bg-gray-50 bg-white"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${selectedPlan === plan.id ? 'border-blue-600 bg-blue-600' : 'border-gray-200'}`}>
                        {selectedPlan === plan.id && <Check className="text-white h-4 w-4" />}
                      </div>
                      <div className="space-y-1">
                        <p className="font-black text-gray-900 tracking-tight">{plan.name}</p>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{plan.limit} access</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-gray-900">{plan.price}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">{plan.period}</p>
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>

            <div className="bg-orange-50 rounded-2xl p-4 flex gap-4 text-orange-800 text-sm border border-orange-100">
              <AlertCircle className="flex-shrink-0 mt-0.5" size={18} />
              <p className="font-medium leading-relaxed">
                <span className="font-bold">Note:</span> Real payments are disabled. Clicking upgrade will instantly update your status for demonstration purposes.
              </p>
            </div>
          </CardContent>
          <CardFooter className="p-8 pt-0">
            <Button 
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full h-14 bg-blue-600 hover:bg-blue-700 rounded-2xl font-black text-lg shadow-xl shadow-blue-200 transition-all hover:scale-[1.01] active:scale-95"
            >
              {loading ? <Loader2 className="animate-spin mr-2" /> : <CreditCard className="mr-2" size={20} />}
              Confirm Upgrade
            </Button>
          </CardFooter>
        </Card>

        <div className="flex justify-center">
          <Button variant="ghost" onClick={() => navigate('/membership')} className="text-gray-400 hover:text-gray-900 rounded-xl font-bold uppercase tracking-widest text-[10px]">
            Back to Membership
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
