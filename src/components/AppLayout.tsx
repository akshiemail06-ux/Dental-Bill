import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { 
  LayoutDashboard, 
  PlusCircle, 
  History, 
  Settings, 
  LogOut, 
  Stethoscope,
  Menu,
  X,
  Download,
  Activity,
  BookOpen,
  HelpCircle,
  Plus,
  UserPlus,
  FilePlus,
  Calendar
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useClinic } from '../contexts/ClinicContext';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { usePWA } from '../contexts/PWAContext';
import { Crown, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import DemoBanner from './DemoBanner';
import DemoWelcomePopup from './DemoWelcomePopup';
import TrialEndedModal from './TrialEndedModal';
import { MissingAssetsAlert } from './MissingAssetsAlert';
import { Logo } from './Logo';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { clinic } = useClinic();
  const { user, isDemo, setIsDemo } = useAuth();
  const { subscription, isTrialExpired } = useSubscription();
  const { isInstallable, installApp } = usePWA();
  const ADMIN_EMAIL = "akshiemail06@gmail.com";


  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'New Bill', path: '/bills/new', icon: PlusCircle },
    { name: 'Ortho Patients', path: '/ortho', icon: Stethoscope },
    { name: 'Bill History', path: '/bills', icon: History },
    { name: 'Reports', path: '/reports', icon: Activity },
    { name: 'Settings', path: '/settings', icon: Settings },
    { name: 'Troubleshoot', path: '/troubleshoot', icon: HelpCircle },
  ];

  // Add Blog Admin for the specific admin user
  if (user?.email === ADMIN_EMAIL) {
    navItems.push({ name: 'Blog Admin', path: '/admin/blog', icon: BookOpen });
  }

  const handleLogout = async () => {
    const confirmMessage = isDemo ? 'Exit demo mode?' : 'Are you sure you want to logout?';
    if (confirm(confirmMessage)) {
      try {
        if (isDemo) {
          setIsDemo(false);
        } else {
          await signOut(auth);
        }
        toast.success(isDemo ? 'Demo mode exited' : 'Logged out successfully');
        navigate('/login');
      } catch (error) {
        toast.error('Failed to logout');
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen min-h-[100dvh] bg-gray-50 overflow-x-hidden">
      <DemoBanner />
      <DemoWelcomePopup />
      <TrialEndedModal isOpen={isTrialExpired} />
      <MissingAssetsAlert />
      <div className="flex flex-grow">
        {/* Mobile Sidebar Toggle */}
      <button 
        className="fixed top-4 right-4 z-50 rounded-full bg-blue-600 p-3 text-white shadow-lg md:hidden print:hidden"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 transform bg-white border-r transition-transform duration-200 ease-in-out md:relative md:translate-x-0 no-print",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-full flex-col">
          {/* Logo replacement or just Name */}
          <div className="flex items-center gap-3 px-6 py-8">
            <Link to="/">
              <Logo />
            </Link>
          </div>

          {/* Clinic Info */}
          <div className="px-6 mb-4">
            <div className="rounded-xl bg-blue-50 p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-medium text-blue-600 uppercase tracking-wider">Clinic</p>
                {subscription?.planType && (
                  <Link to="/membership">
                    <Badge className={cn(
                      "text-[9px] px-1.5 py-0.5 border-none cursor-pointer hover:opacity-80 transition-opacity",
                      subscription.planType === 'trial' ? "bg-blue-600 text-white" :
                      subscription.planType === 'basic' ? "bg-orange-600 text-white" :
                      subscription.planType === 'pro' ? "bg-purple-600 text-white" :
                      "bg-green-600 text-white"
                    )}>
                      {subscription.planType.toUpperCase()}
                    </Badge>
                  </Link>
                )}
              </div>
              <p className="mt-1 font-bold text-gray-900 truncate">{clinic?.name || 'Setting up...'}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>

          {subscription?.planType === 'trial' && (
            <div className="px-6 mb-6">
              <Button 
                onClick={() => navigate('/pricing')}
                className="w-full bg-gray-900 hover:bg-black text-white rounded-xl h-10 text-xs font-bold shadow-lg shadow-gray-200"
              >
                <Crown className="mr-2 h-3 w-3 text-yellow-400" /> Upgrade Plan
              </Button>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-grow space-y-1 px-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link 
                  key={item.name} 
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-blue-600 text-white" 
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  <Icon size={18} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Install App & Logout */}
          <div className="p-4 border-t space-y-2">
            {isInstallable && (
              <Button 
                variant="outline" 
                className="w-full justify-start gap-3 border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                onClick={installApp}
              >
                <Download size={18} />
                Install App
              </Button>
            )}
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-3 text-gray-600 hover:text-red-600 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut size={18} />
              {isDemo ? 'Exit Demo' : 'Logout'}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow overflow-auto p-4 md:p-8 flex flex-col relative">
        <div className="mx-auto max-w-6xl flex-grow w-full">
          {children}
        </div>
        
        {/* Minimal App Footer */}
        <footer className="mt-12 pt-8 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] text-gray-400 font-medium pb-4 no-print">
          <p>© 2026 Instant Dental Bill</p>
          <div className="flex items-center gap-6">
            <Link to="/privacy" className="hover:text-blue-600 transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-blue-600 transition-colors">Terms & Conditions</Link>
            <Link to="/disclaimer" className="hover:text-blue-600 transition-colors">Disclaimer</Link>
          </div>
        </footer>
      </main>

    </div>
    {/* Floating Action Button (FAB) */}
    {!location.pathname.startsWith('/bills/') && !location.pathname.startsWith('/ortho/') && (
        <div className="fixed bottom-8 right-6 z-[9999] print:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger className={cn(buttonVariants({ size: 'icon' }), "h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all hover:scale-110 active:scale-95 group text-white border-2 border-white/20")}>
              <Plus className="h-6 w-6 group-data-[state=open]:rotate-45 transition-transform duration-200" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="w-56 mb-4 rounded-2xl p-2 bg-white/95 backdrop-blur-sm border-blue-50 shadow-2xl z-[10000]">
              <DropdownMenuItem 
                onClick={() => navigate('/bills/new')}
                className="flex items-center gap-3 rounded-xl px-3 py-3 cursor-pointer hover:bg-blue-50 focus:bg-blue-50 text-gray-700 transition-colors"
              >
                <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <FilePlus size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm">New Bill</span>
                  <span className="text-[10px] text-gray-400">Regular patient billing</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => navigate('/ortho?new=true')}
                className="flex items-center gap-3 rounded-xl px-3 py-3 cursor-pointer hover:bg-purple-50 focus:bg-purple-50 text-gray-700 transition-colors"
              >
                <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                  <UserPlus size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm">Ortho Patient</span>
                  <span className="text-[10px] text-gray-400">Add braces case patient</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
  </div>
  );
}
