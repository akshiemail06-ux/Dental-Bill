import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  BarChart3, 
  ShieldCheck, 
  ArrowRight, 
  Play, 
  CheckCircle2, 
  Zap, 
  Lock, 
  UserCircle,
  MessageCircle,
  AlertCircle,
  Check,
  Target,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import Footer from '../components/Footer';
import PricingSection from '../components/PricingSection';
import { Logo } from '../components/Logo';
import { getWhatsAppUrl } from '../lib/utils';

export default function LandingPage() {
  const [showDemoDialog, setShowDemoDialog] = useState(false);
  const { setIsDemo } = useAuth();
  const navigate = useNavigate();

  const handleStartDemo = () => {
    setIsDemo(true);
    navigate('/dashboard');
  };

  const WHATSAPP_NUMBER = '8219793867';
  const WHATSAPP_MESSAGE = "Hi, I'm interested in the Dental Billing & Ortho Management app. I'd like to book a demo.";

  const handleWhatsAppDemo = () => {
    window.open(getWhatsAppUrl(WHATSAPP_NUMBER, WHATSAPP_MESSAGE), '_blank');
  };

  const scrollToPricing = (e: React.MouseEvent) => {
    e.preventDefault();
    const pricingSection = document.getElementById('pricing');
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white relative">
// Global Decorative Background
      <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-50/50 rounded-full blur-[120px] -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-indigo-50/40 rounded-full blur-[120px] translate-y-1/2"></div>
        <div className="absolute top-1/2 left-0 w-[300px] h-[300px] bg-cyan-50/30 rounded-full blur-[100px] -translate-x-1/2"></div>
        
        {/* Persistent Mesh Pattern */}
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#3b82f6 0.5px, transparent 0.5px)', backgroundSize: '32px 32px' }}></div>
      </div>
      {/* Demo Confirmation Dialog */}
      <AnimatePresence>
        {showDemoDialog && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Play size={32} fill="currentColor" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Try Live Demo</h3>
              <p className="text-gray-500 mb-8 leading-relaxed text-sm">
                Explore the platform with sample clinic data. No registration required.
              </p>
              <div className="flex flex-col gap-3">
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 h-12 rounded-xl font-bold"
                  onClick={handleStartDemo}
                >
                  Continue to Demo
                </Button>
                <Button 
                  variant="ghost" 
                  className="h-12 rounded-xl text-gray-500"
                  onClick={() => setShowDemoDialog(false)}
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/">
            <Logo />
          </Link>
          <div className="flex items-center gap-4">
            <a 
              href="#pricing" 
              onClick={scrollToPricing}
              className="text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors mr-2 hidden sm:block"
            >
              Pricing
            </a>
            <Link to="/login">
              <Button variant="ghost" className="text-sm font-medium">Login</Button>
            </Link>
            <Link to="/signup">
              <Button className="bg-blue-600 text-sm font-medium hover:bg-blue-700 rounded-lg">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-8 pb-16 lg:pt-12 lg:pb-24">
          <div className="absolute top-0 -z-10 h-full w-full pointer-events-none">
            <div className="absolute left-1/2 top-[-10%] h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-blue-100/20 blur-[130px]"></div>
            
            {/* Background Medical/Dental Decor */}
            <div className="absolute left-[10%] top-[20%] opacity-[0.08] animate-pulse">
              <Logo showText={false} iconClassName="h-24 w-24 rounded-full" />
            </div>
            <div className="absolute right-[15%] bottom-[10%] opacity-[0.05] animate-pulse delay-700">
              <Target size={100} className="text-blue-600 -rotate-12" />
            </div>
          </div>

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center relative">
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 }}
                className="absolute -top-12 left-1/2 -translate-x-40 text-blue-400 hidden lg:block"
              >
                <Sparkles size={48} fill="currentColor" />
              </motion.div>

              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-6xl"
              >
                Best Dental Billing Software In India <br className="hidden sm:block" /> For <span className="text-blue-600">Modern Dental Clinics</span>
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mx-auto mt-6 max-w-2xl text-lg text-gray-600"
              >
                Create professional dental invoices, manage patient records, track clinic revenue, and simplify orthodontic case management with smart reminders - all in one easy to use dental billing software in India.
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto bg-blue-600 px-8 h-14 text-base font-bold hover:bg-blue-700 shadow-xl shadow-blue-100 rounded-xl"
                  onClick={() => setShowDemoDialog(true)}
                >
                  Try Live Demo <Play className="ml-2" size={18} fill="currentColor" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="w-full sm:w-auto px-8 h-14 text-base font-bold border-gray-200 rounded-xl hover:bg-green-50 hover:text-green-700 hover:border-green-100 transition-all font-mono"
                  onClick={handleWhatsAppDemo}
                >
                  <MessageCircle size={18} className="mr-2" /> Book Demo on WhatsApp
                </Button>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-8 text-sm text-gray-400 font-medium italic"
              >
                "Currently onboarding early clinics. Try it and be part of building a better system for dental practices."
              </motion.p>
            </div>
          </div>
        </section>

        {/* Built for Dentists Trust Factor */}
        <section className="relative py-12 border-y border-gray-50 bg-white/50 backdrop-blur-sm shadow-inner">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(#2563eb10_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>
          <div className="mx-auto max-w-4xl px-4 text-center">
            <div className="inline-flex items-center gap-2 mb-4">
              <Logo showText={false} iconClassName="h-10 w-10 shadow-none" />
              <span className="font-bold text-gray-900 uppercase tracking-widest text-xs">Built For Dentists</span>
            </div>
            <p className="text-xl text-gray-700 font-medium leading-relaxed">
              "Designed Specifically For Dental Clinics And Orthodontic Case Management. Built To Simplify Daily Clinic Workflow."
            </p>
          </div>
        </section>

        {/* Problem vs Solution Section */}
        <section className="py-24 bg-white overflow-hidden">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-8">Stop Wasting Time On Manual Paperwork</h2>
                <div className="space-y-6">
                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-red-50/50 border border-red-50">
                    <div className="h-10 w-10 flex-shrink-0 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                      <AlertCircle size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1 leading-none pt-1">The Problem</h4>
                      <ul className="space-y-2 mt-3 text-sm text-gray-600">
                        <li className="flex items-center gap-2">• Manual tracking of patients</li>
                        <li className="flex items-center gap-2">• Missed follow-ups & reminders</li>
                        <li className="flex items-center gap-2">• Confusing payment records</li>
                        <li className="flex items-center gap-2">• Manual handwriting of invoices</li>
                        <li className="flex items-center gap-2">• No clear data on clinic growth</li>
                      </ul>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-green-50/50 border border-green-50">
                    <div className="h-10 w-10 flex-shrink-0 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                      <Check size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1 leading-none pt-1">The Solution</h4>
                      <ul className="space-y-2 mt-3 text-sm text-gray-600 font-medium">
                        <li className="flex items-center gap-2">✓ Organized patient management</li>
                        <li className="flex items-center gap-2">✓ Clear appointment tracking</li>
                        <li className="flex items-center gap-2">✓ Instant invoice generation with clinic branding</li>
                        <li className="flex items-center gap-2">✓ Stamp, logo, & signature one-time setup</li>
                        <li className="flex items-center gap-2">✓ Simple revenue overview</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="bg-white rounded-3xl p-3 shadow-2xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-blue-600/5 group-hover:bg-transparent transition-colors z-10"></div>
                  <img 
                    src="https://images.unsplash.com/photo-1598256989800-fe5f95da9787?q=80&w=2070&auto=format&fit=crop" 
                    alt="Vivid professional dental clinic"
                    className="rounded-[20px] shadow-inner w-full h-[450px] object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  
                  {/* Floating Dashboard Elements to simulate "Real Screenshot" */}
                  <div className="absolute left-6 top-6 z-20 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-white/50 w-48 hidden sm:block animate-bounce-slow">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Live Status</span>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 w-full bg-blue-100 rounded-full"></div>
                      <div className="h-2 w-4/5 bg-gray-100 rounded-full"></div>
                      <div className="pt-2 flex justify-between items-end">
                        <div className="h-6 w-12 bg-blue-600 rounded-md"></div>
                        <div className="h-4 w-4 rounded-full bg-blue-50"></div>
                      </div>
                    </div>
                  </div>

                  <div className="absolute right-6 bottom-6 z-20 bg-white/95 backdrop-blur-sm p-5 rounded-2xl shadow-2xl border border-white/50 w-64 hidden sm:block">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Revenue</span>
                      <BarChart3 size={14} className="text-blue-600" />
                    </div>
                    <div className="flex items-end gap-1 h-12">
                      <div className="w-full bg-blue-100 h-[40%] rounded-sm"></div>
                      <div className="w-full bg-blue-200 h-[60%] rounded-sm"></div>
                      <div className="w-full bg-blue-400 h-[30%] rounded-sm"></div>
                      <div className="w-full bg-blue-600 h-[90%] rounded-sm"></div>
                      <div className="w-full bg-blue-300 h-[50%] rounded-sm"></div>
                    </div>
                    <p className="mt-3 text-xs font-bold text-gray-900">+24% growth this month</p>
                  </div>
                </div>
                <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl p-6 shadow-xl border border-gray-100 hidden sm:block z-30">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                      <Zap size={24} />
                    </div>
                    <div>
                      <p className="text-xl font-black text-gray-900">0 Complexity</p>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Just features you need</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="relative bg-gray-50/50 py-24 border-y border-gray-100 overflow-hidden">
          <div className="absolute top-0 right-0 -z-10 translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-100/30 rounded-full blur-[80px]"></div>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Simply Powerful Features</h2>
              <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">Focused On What Matters Most For A Busy Dental Practice.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  title: "Instant Bills",
                  description: "Professional invoices created in under 30 seconds for your patients.",
                  icon: <FileText className="text-blue-600" size={24} />
                },
                {
                  title: "Ortho Tracker",
                  description: "Manage braces cases, stages, and monthly payment installments.",
                  icon: <Target className="text-blue-600" size={24} />
                },
                {
                  title: "Patient Files",
                  description: "Store clinic records securely and access them from any device.",
                  icon: <UserCircle className="text-blue-600" size={24} />
                },
                {
                  title: "Growth Reports",
                  description: "See your daily, monthly and annual revenue collection trends.",
                  icon: <BarChart3 className="text-blue-600" size={24} />
                }
              ].map((feature, idx) => (
                <div key={idx} className="rounded-3xl bg-white p-8 border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                  <div className="mb-6 inline-block rounded-2xl bg-blue-50 p-4 transition-transform group-hover:scale-110 group-hover:rotate-3">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed font-medium">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <PricingSection />

        {/* Security & Privacy */}
        <section className="py-24 bg-white">
          <div className="mx-auto max-w-5xl px-4">
            <div className="rounded-[40px] bg-slate-900 p-8 sm:p-16 relative overflow-hidden">
              <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-white/10 text-white text-xs font-bold mb-6">
                    <Lock size={14} /> SECURITY FIRST
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-4">Your Patient Data Is In Safe Hands</h2>
                  <p className="text-slate-400 text-lg leading-relaxed">
                    "Patient data is secure and private. Built using modern cloud infrastructure with secure access control."
                  </p>
                  <div className="mt-8 grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-white/80 text-sm font-medium">
                      <CheckCircle2 size={16} className="text-green-500" /> AES-256 Encryption
                    </div>
                    <div className="flex items-center gap-2 text-white/80 text-sm font-medium">
                      <CheckCircle2 size={16} className="text-green-500" /> Private Cloud Storage
                    </div>
                    <div className="flex items-center gap-2 text-white/80 text-sm font-medium">
                      <CheckCircle2 size={16} className="text-green-500" /> Secure Auth
                    </div>
                    <div className="flex items-center gap-2 text-white/80 text-sm font-medium">
                      <CheckCircle2 size={16} className="text-green-500" /> Regular Backups
                    </div>
                  </div>
                </div>
                <div className="flex justify-center relative">
                  <ShieldCheck size={200} className="text-white/5 absolute -right-20 bottom-0 pointer-events-none" />
                  <div className="h-48 w-48 rounded-full bg-blue-600/20 blur-3xl absolute animate-pulse"></div>
                  <Lock size={120} className="text-blue-500/30" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Founder Section */}
        <section className="py-24 bg-gray-50/50">
          <div className="mx-auto max-w-4xl px-4">
            <div className="flex flex-col md:flex-row items-center gap-12 bg-white p-8 sm:p-12 rounded-[40px] border border-gray-100 shadow-sm">
              <div className="relative flex-shrink-0">
                <div className="h-44 w-44 rounded-[40px] bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100/50 overflow-hidden shadow-sm transform -rotate-3 hover:rotate-0 transition-all duration-500 flex items-center justify-center">
                  <div className="p-6 rounded-full bg-white/80 shadow-inner">
                    <Logo showText={false} iconClassName="h-20 w-20 rounded-full shadow-none" />
                  </div>
                </div>
                <div className="absolute -bottom-3 -right-3 bg-white text-blue-600 p-3 rounded-2xl shadow-xl border border-blue-50">
                  <Zap size={24} fill="currentColor" />
                </div>
              </div>
              <div className="text-center md:text-left">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Designed by experience</h3>
                <p className="text-gray-600 text-lg italic leading-relaxed">
                  "Built by a dental professional who understands real clinic challenges and workflow."
                </p>
                <div className="mt-6 flex items-center justify-center md:justify-start gap-4">
                  <div className="h-px w-8 bg-blue-200"></div>
                  <span className="text-sm font-bold text-blue-600 uppercase tracking-widest">The Builder's Promise</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 relative overflow-hidden">
          <div className="mx-auto max-w-7xl px-4 text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Ready to upgrade your clinic?</h2>
            <p className="text-lg text-gray-600 mb-10 max-w-xl mx-auto">
              Onboarding early clinics today. Be part of building the simplest dental billing system.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/signup" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-blue-600 h-14 px-12 text-lg font-bold rounded-xl shadow-xl shadow-blue-100">
                  Join Early Access <ArrowRight className="ml-2" size={20} />
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="outline" 
                className="w-full sm:w-auto px-12 h-14 text-lg font-bold border-gray-200 rounded-xl hover:bg-gray-50"
                onClick={() => setShowDemoDialog(true)}
              >
                Try Demo
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
