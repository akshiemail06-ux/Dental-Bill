import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'motion/react';

interface TrialEndedModalProps {
  isOpen: boolean;
}

export default function TrialEndedModal({ isOpen }: TrialEndedModalProps) {
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white rounded-[32px] p-10 max-w-md w-full shadow-2xl text-center space-y-8 border border-red-50"
          >
            <div className="relative mx-auto">
              <div className="w-24 h-24 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto animate-pulse">
                <Lock size={48} strokeWidth={2.5} />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-white rounded-xl p-2 shadow-lg border border-red-100">
                <AlertCircle size={24} className="text-red-500" />
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-3xl font-black text-gray-900 tracking-tight leading-tight">Your free trial has ended</h3>
              <p className="text-gray-500 font-medium leading-relaxed">
                We hope you enjoyed using our dental billing software! To continue using the platform and keep your data active, please upgrade your plan.
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
              All your data is safe and secured
            </div>

            <div className="flex flex-col gap-3">
              <Button 
                onClick={() => navigate('/pricing')}
                className="bg-blue-600 hover:bg-blue-700 h-14 rounded-2xl font-black text-lg shadow-xl shadow-blue-100 transition-all hover:scale-[1.02] active:scale-95"
              >
                Upgrade to Continue <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => navigate('/membership')}
                className="h-12 rounded-xl text-gray-400 hover:text-gray-900 font-bold uppercase tracking-widest text-[10px]"
              >
                Learn More about Plans
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
