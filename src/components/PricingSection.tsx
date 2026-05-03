import React from 'react';
import { Check, Zap, Star, ShieldCheck, Sparkle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

const PricingSection = () => {
  const plans = [
    {
      name: "Basic",
      price: "₹299",
      period: "/month",
      limit: "300 Bills per month",
      humor: "Less than a single patient consultation 😄",
      features: [
        "Professional Bill Generation",
        "Ortho Case Management",
        "Revenue Analytics",
        "Clinic Branding",
        "Reports & History",
      ],
      cta: "Login Now to Explore",
      color: "blue",
      highlight: false
    },
    {
      name: "Pro",
      price: "₹799",
      period: "/month",
      limit: "Unlimited bill generation",
      humor: "Less than a full mouth scaling 😄",
      features: [
        "Unlimited everything",
        "Priority Support",
        "All features included",
        "Advanced Analytics",
        "Team Management",
      ],
      cta: "Login Now to Explore",
      color: "blue",
      highlight: true,
      badge: "Best Value"
    },
    {
      name: "Growth Offer",
      price: "₹2999",
      period: " (3 Years Access)",
      limit: "Unlimited access for 3 years",
      humor: "Less than a single RCT 😄",
      features: [
        "Unlimited bill generation",
        "3 Years of data safety",
        "Priority Onboarding",
        "Limited Time Offer",
        "Free Feature Updates",
      ],
      cta: "Login Now to Explore",
      color: "purple",
      highlight: false,
      badge: "Limited Time"
    }
  ];

  return (
    <section id="pricing" className="py-24 bg-white relative overflow-hidden">
      {/* Decorative patterns */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none -z-10 opacity-[0.03]">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600 rounded-full blur-[100px]"></div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-4"
          >
            <ShieldCheck size={14} /> TRANSPARENT PRICING
          </motion.div>
          <h2 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">Simple, Transparent Pricing</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Start free. Upgrade when you're ready. No hidden charges. Built specifically for dental clinics.
          </p>
        </div>

        {/* 30 Days Free Trial Highlight */}
        <div className="flex justify-center mb-12">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative group"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex flex-col sm:flex-row items-center gap-4 bg-white px-8 py-4 rounded-2xl border border-blue-100 shadow-sm">
              <div className="flex -space-x-2">
                 <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white ring-2 ring-white">
                  <Sparkle size={20} fill="currentColor" />
                </div>
              </div>
              <div className="text-center sm:text-left">
                <p className="text-sm font-bold text-gray-900">
                  🎉 30 Days Free Trial — Unlimited Access
                </p>
                <p className="text-xs text-gray-500 font-medium">New users get full access to all features. No limits. No commitment.</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className={`relative flex flex-col p-8 rounded-[40px] border transition-all duration-300 ${
                plan.highlight 
                  ? 'border-blue-200 shadow-2xl shadow-blue-100 scale-105 z-10 bg-white' 
                  : 'border-gray-100 shadow-sm bg-white hover:border-blue-100 hover:shadow-md'
              }`}
            >
              {plan.badge && (
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 rounded-full text-xs font-bold text-white shadow-lg ${
                  plan.color === 'blue' ? 'bg-blue-600' : 'bg-purple-600'
                }`}>
                  {plan.badge}
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-gray-900 tracking-tight">{plan.price}</span>
                  <span className="text-sm font-bold text-gray-400">{plan.period}</span>
                </div>
                <p className="mt-4 text-sm font-bold text-blue-600 bg-blue-50/50 py-1.5 px-3 rounded-lg inline-block">
                  {plan.limit}
                </p>
              </div>

              <div className="space-y-4 mb-8 flex-grow">
                {plan.features.map((feature, fIdx) => (
                  <div key={fIdx} className="flex items-center gap-3">
                    <div className={`flex-shrink-0 h-5 w-5 rounded-full flex items-center justify-center ${
                      plan.highlight ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      <Check size={12} />
                    </div>
                    <span className="text-sm text-gray-600 font-medium">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="mt-auto">
                <p className="text-xs text-gray-400 font-bold mb-6 italic text-center">
                  "{plan.humor}"
                </p>
                <Link to="/login" className="block w-full">
                  <Button 
                    className={`w-full h-14 rounded-2xl font-bold text-base shadow-lg transition-all ${
                      plan.highlight 
                        ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-100' 
                        : 'bg-white text-gray-900 border-2 border-gray-100 hover:border-blue-100 hover:bg-blue-50/50 shadow-none'
                    }`}
                  >
                    {plan.cta} <Zap className="ml-2" size={18} fill="currentColor" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA Below Pricing */}
        <div className="mt-20 text-center">
           <Link to="/login">
            <Button size="lg" variant="link" className="text-blue-600 font-bold hover:no-underline group">
              Try everything yourself before choosing a plan <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-widest">
              <ShieldCheck size={16} className="text-green-500" /> No hidden fees
            </div>
            <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-widest">
              <ShieldCheck size={16} className="text-green-500" /> No forced subscriptions
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const ArrowRight = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="18" 
    height="18" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
  </svg>
);

export default PricingSection;
