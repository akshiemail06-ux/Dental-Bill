import React, { useState } from 'react';
import AppLayout from '../components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  HelpCircle, 
  Printer, 
  MessageCircle, 
  Image as ImageIcon, 
  User, 
  Smartphone, 
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  Database,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

const troubleshootingTips = [
  {
    category: "Invoice & Printing",
    icon: <Printer className="text-blue-600" size={24} />,
    issues: [
      {
        q: "Qualifications or Registration Number not appearing on Bill?",
        a: "Ensure you have entered these details in the 'Settings' page under the 'Doctors' section. Make sure you mark the doctor as 'Main'. For existing bills, updates to your profile will automatically sync when you view the bill."
      },
      {
        q: "Logo or Signature appearing blurry or missing?",
        a: "This usually happens if the image was cleared from your browser cache. Re-upload your clinic logo or doctor's signature in 'Clinic Settings'. High-resolution PNGs work best."
      },
      {
        q: "How do I save the bill as a PDF?",
        a: "Click 'View / Print' on any bill. In the print dialog that opens, select 'Save as PDF' or 'Microsoft Print to PDF' in the destination dropdown. This is the best way to get a high-quality digital copy."
      }
    ]
  },
  {
    category: "Communication",
    icon: <MessageCircle className="text-green-600" size={24} />,
    issues: [
      {
        q: "WhatsApp reminder button does nothing?",
        a: "Check if your browser is blocking pop-ups. You should see a small icon in the address bar (top right) to 'Always allow pop-ups' from this site. Also, ensure the patient has a valid 10-digit mobile number."
      },
      {
        q: "WhatsApp says the number is invalid?",
        a: "Ensure you haven't included characters like +91 manually if the system already handles it. The system expects a 10-digit mobile number (e.g., 9876543210)."
      }
    ]
  },
  {
    category: "Data & Performance",
    icon: <Database className="text-purple-600" size={24} />,
    issues: [
      {
        q: "Dashboard stats look outdated?",
        a: "Stats are generated in real-time but can sometimes be cached. Click the 'Refresh' button on the dashboard header to force a fresh sync with the server."
      },
      {
        q: "Cannot find a specific bill?",
        a: "Go to 'Bill History' and use the Search bar. You can search by Patient Name or Bill Number. If you still can't find it, check if you were logged into the right clinic account."
      }
    ]
  },
  {
    category: "Speed & Connectivity",
    icon: <Activity className="text-red-600" size={24} />,
    issues: [
      {
        q: "App or Website taking too much time to open?",
        a: "If the site is taking time to open through a link, please refresh two or three times by swiping down (on mobile) or hitting the refresh button in your browser's address bar. This will force a reconnection and definitely open the site."
      }
    ]
  },
  {
    category: "Account & App",
    icon: <Smartphone className="text-orange-600" size={24} />,
    issues: [
      {
        q: "Logged out unexpectedly?",
        a: "For security, sessions expire after significant inactivity. Simply log back in with your credentials to resume your work. Your data is always saved."
      }
    ]
  }
];

export default function TroubleshootPage() {
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setOpenItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center justify-center p-3 bg-blue-50 text-blue-600 rounded-2xl mb-4">
              <HelpCircle size={32} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 font-heading">Self-Help & Troubleshooting</h1>
            <p className="text-gray-500 mt-2">Find solutions to common problems and learn how to get the most out of Instant Dental Bill.</p>
          </motion.div>
        </div>

        <div className="space-y-8 pb-20">
          {troubleshootingTips.map((category, catIdx) => (
            <motion.div
              key={catIdx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: catIdx * 0.1 }}
            >
              <Card className="border-none shadow-sm overflow-hidden rounded-3xl">
                <CardHeader className="bg-gray-50/50 border-b border-gray-100 flex flex-row items-center gap-4 py-4 px-6">
                  {category.icon}
                  <CardTitle className="text-lg font-bold text-gray-900">{category.category}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-gray-100">
                    {category.issues.map((issue, issueIdx) => {
                      const id = `item-${catIdx}-${issueIdx}`;
                      const isOpen = openItems.includes(id);
                      
                      return (
                        <div key={issueIdx} className="w-full">
                          <button
                            onClick={() => toggleItem(id)}
                            className="w-full text-left px-6 py-4 flex items-center justify-between group transition-colors hover:bg-gray-50/50"
                          >
                            <span className={cn(
                              "text-sm font-bold transition-colors",
                              isOpen ? "text-blue-600" : "text-gray-700 group-hover:text-gray-900"
                            )}>
                              {issue.q}
                            </span>
                            <ChevronDown 
                              size={18} 
                              className={cn(
                                "text-gray-400 transition-transform duration-200",
                                isOpen && "rotate-180 text-blue-600"
                              )} 
                            />
                          </button>
                          
                          <AnimatePresence>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                className="overflow-hidden"
                              >
                                <div className="px-6 pb-5 pt-1 text-sm text-gray-600 leading-relaxed">
                                  <div className="flex gap-3 bg-white/60 rounded-2xl p-4 border border-blue-50">
                                    <ChevronRight size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                                    <p>{issue.a}</p>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 bg-blue-600 rounded-3xl p-8 text-white relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-2xl font-bold mb-2">Still facing issues?</h3>
            <p className="text-blue-100 mb-6 max-w-lg">Our support team is here to help you get back to serving your patients. Reach out to us directly for professional assistance.</p>
            <div className="flex flex-wrap gap-4">
              <Button 
                variant="outline" 
                className="bg-white text-blue-600 px-6 py-3 h-auto rounded-xl font-bold text-sm hover:bg-blue-50 border-none shadow-lg shadow-blue-900/20"
                onClick={() => toast.info('Email support is coming soon! Please use WhatsApp for urgent queries.')}
              >
                Email Support (Coming Soon)
              </Button>
              <a 
                href="https://wa.me/917657888339?text=Hello%20Support,%20I%20have%20a%20query%20regarding%20Instant%20Dental%20Bill." 
                target="_blank" 
                rel="noopener noreferrer" 
                className="bg-green-500 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-green-600 transition-colors inline-flex items-center gap-2 shadow-lg shadow-blue-900/20"
              >
                <MessageCircle size={18} /> Chat on WhatsApp
              </a>
            </div>
          </div>
          <AlertTriangle className="absolute -bottom-6 -right-6 text-white/10" size={160} />
        </div>
      </div>
    </AppLayout>
  );
}
