import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'motion/react';
import AppLayout from '../components/AppLayout';

const plans = [
  {
    name: 'BASIC PLAN',
    price: '₹299',
    period: '/month',
    tagline: 'Less than a single patient consultation 😉',
    note: 'Perfect for small clinics',
    features: [
      '300 bill generation per month',
      'Patient management',
      'Daily revenue reports',
      'Mobile & Desktop access',
      'Secure Cloud storage'
    ],
    cta: 'Choose Plan',
    highlight: false
  },
  {
    name: 'PRO PLAN',
    price: '₹799',
    period: '/month',
    tagline: 'Less than a full mouth scaling 😄',
    badge: 'Most Popular',
    features: [
      'Unlimited bill generation',
      'Advanced analytics',
      'Multiple doctor support',
      'Priority support',
      'All Basic features included'
    ],
    cta: 'Choose Plan',
    highlight: true
  },
  {
    name: 'PREMIUM PLAN',
    price: '₹2999',
    period: '',
    tagline: 'Less than a single RCT price 😎',
    badge: 'Best Value 🔥',
    features: [
      'Long-term access',
      'Unlimited bill generation',
      'Custom branding',
      'Full features unlocked',
      'All Pro features included'
    ],
    cta: 'Choose Plan',
    highlight: false
  }
];

export default function PricingPage() {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl"
          >
            Simple, Transparent Pricing
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-2xl mx-auto text-xl text-gray-500"
          >
            Invest in your clinic's growth with our funny yet serious plans.
          </motion.p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`relative h-full flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border-2 ${plan.highlight ? 'border-blue-600 ring-4 ring-blue-50' : 'border-gray-100'}`}>
                {plan.badge && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <Badge className="bg-blue-600 text-white px-4 py-1 rounded-full text-xs font-bold border-none shadow-lg">
                      {plan.badge}
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-sm font-bold text-gray-500 uppercase tracking-widest">
                    {plan.name}
                  </CardTitle>
                  <div className="mt-4 flex flex-col items-center">
                    <span className="text-5xl font-black text-gray-900">{plan.price}</span>
                    <span className="text-gray-400 text-sm">{plan.period}</span>
                  </div>
                  <p className="mt-4 text-blue-600 font-medium italic">
                    {plan.tagline}
                  </p>
                </CardHeader>

                <CardContent className="flex-1 pt-6">
                  <ul className="space-y-4">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600 text-sm font-medium">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  {plan.note && (
                    <div className="mt-6 flex items-center gap-2 text-xs text-gray-400 bg-gray-50 p-3 rounded-lg">
                      <Info size={14} />
                      {plan.note}
                    </div>
                  )}
                </CardContent>

                <CardFooter className="pt-6">
                  <Button 
                    onClick={() => navigate('/upgrade')}
                    className={`w-full h-12 rounded-xl font-bold text-base transition-all ${plan.highlight ? 'bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-200' : 'bg-gray-900 hover:bg-black text-white'}`}
                  >
                    {plan.cta}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-6 py-3 rounded-2xl border border-blue-100 font-bold">
            <Info size={20} className="text-blue-500" />
            Plans are currently for demo. 30 days free unlimited trial for all users.
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
