import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { Sparkles, ArrowRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function DemoWelcomePopup() {
  const { isDemo, setIsDemo } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Show popup after a short delay when entering demo mode
    if (isDemo) {
      const hasSeenPopup = sessionStorage.getItem('hasSeenDemoWelcome');
      if (!hasSeenPopup) {
        const timer = setTimeout(() => {
          setIsOpen(true);
          sessionStorage.setItem('hasSeenDemoWelcome', 'true');
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [isDemo]);

  const handleLogin = () => {
    setIsDemo(false);
    navigate('/login');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
        <div className="relative">
          {/* Decorative Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-700 opacity-10" />
          
          <div className="relative p-8 flex flex-col items-center text-center">
            {/* Icon */}
            <motion.div 
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", damping: 12, stiffness: 200 }}
              className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-blue-200 mb-6"
            >
              <Sparkles size={40} />
            </motion.div>

            <DialogHeader className="space-y-3">
              <DialogTitle className="text-2xl font-bold text-gray-900 font-heading">
                Welcome to the Demo!
              </DialogTitle>
              <DialogDescription className="text-gray-600 text-base leading-relaxed">
                This is a <span className="font-bold text-blue-600">representation</span> of the platform using sample data. 
                Experience how easy it is to manage your clinic and generate bills.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-8 w-full space-y-4">
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-sm text-blue-700 font-medium">
                Login to explore real features, save your data, and enjoy a smooth, personalized experience.
              </div>

              <div className="flex flex-col gap-3">
                <Button 
                  onClick={handleLogin}
                  className="w-full bg-blue-600 hover:bg-blue-700 h-12 rounded-xl text-base font-bold shadow-lg shadow-blue-200 group"
                >
                  Login to Explore Real Features
                  <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                
                <Button 
                  variant="ghost" 
                  onClick={() => setIsOpen(false)}
                  className="w-full h-12 rounded-xl text-gray-500 font-medium hover:bg-gray-100"
                >
                  Continue with Demo
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
