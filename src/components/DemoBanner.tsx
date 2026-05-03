import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Info, ArrowRight, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '../contexts/AuthContext';

export default function DemoBanner() {
  const { isDemo, setIsDemo } = useAuth();
  const navigate = useNavigate();

  if (!isDemo) return null;

  const handleExitToLogin = () => {
    setIsDemo(false);
    navigate('/login');
  };

  const handleExitToHome = () => {
    setIsDemo(false);
    navigate('/');
  };

  return (
    <div className="bg-blue-600 text-white py-2 px-4 sticky top-0 z-[60] shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <div className="bg-white/20 rounded-full p-1">
            <Info size={14} />
          </div>
          <span>Demo Mode – Exploring with sample data</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost"
            size="sm" 
            className="text-white hover:bg-white/10 h-8 px-3 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5"
            onClick={handleExitToHome}
          >
            <LogOut size={14} /> Exit Demo
          </Button>
          
          <Button 
            size="sm" 
            className="bg-white text-blue-600 hover:bg-blue-50 h-8 px-4 rounded-lg font-bold text-xs shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            onClick={handleExitToLogin}
          >
            Login to Manage your clinic <ArrowRight size={14} className="ml-1.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
