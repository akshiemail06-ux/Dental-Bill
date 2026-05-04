import React from 'react';
import { motion } from 'motion/react';
import { 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  Users, 
  MessageSquare, 
  Smartphone, 
  BarChart3, 
  Clock,
  ChevronRight,
  Database,
  Globe,
  Zap,
  Play
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';

const SEOLandingIndiaPage: React.FC = () => {
  const { setIsDemo } = useAuth();
  const navigate = useNavigate();

  const handleStartDemo = () => {
    setIsDemo(true);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-slate-900">
                Instant<span className="text-blue-600">Dental</span>Bill
              </span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link to="/" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Home</Link>
              <Link to="/blog" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Blog</Link>
              <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Login</Link>
              <Link 
                to="/signup" 
                className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-xl transition-all"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white py-20 sm:py-32">
        <div className="absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="flex flex-col items-center text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-1 text-sm font-medium text-blue-600 mb-8"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Top Rated Dental Software in India
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl max-w-4xl leading-[1.1]"
            >
              The Most Comprehensive <span className="text-blue-600 italic">Dental Clinic Software</span> in India
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-8 max-w-2xl text-lg leading-relaxed text-slate-600"
            >
              Manage your dental clinic with ease. Create invoices, track revenue, and manage patients using the best dental clinic software in India. Instant Dental Bill is designed specifically for the unique needs of Indian dental practitioners.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-10 flex flex-wrap justify-center gap-4"
            >
              <Link 
                to="/signup" 
                className="flex items-center gap-2 rounded-full bg-blue-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5 transition-all"
              >
                Try Instant Dental Bill Today <ArrowRight size={20} />
              </Link>
              <Button 
                onClick={handleStartDemo}
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-8 py-4 h-auto text-base font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm"
              >
                Try Live Demo <Play size={20} fill="currentColor" />
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="py-20 bg-slate-50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <article className="prose prose-slate lg:prose-lg mx-auto bg-white p-8 sm:p-16 rounded-3xl shadow-sm border border-slate-200">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mb-8">
              What is Dental Clinic Software?
            </h2>
            <div className="text-slate-600 space-y-6 leading-relaxed">
              <p>
                In the modern era of healthcare, <strong>dental clinic software</strong> serves as the digital backbone of a thriving practice. For dentists in India, it is no longer just an option but a necessity to maintain efficiency and provide exceptional patient care. But what exactly defines high-quality dental clinic software in India?
              </p>
              <p>
                At its core, dental clinic software is a specialized practice management system designed to handle the day-to-day administrative and clinical tasks of a dental office. This includes everything from scheduling appointments and maintaining electronic health records (EHR) to managing billing, invoicing, and complex orthodontic case tracking.
              </p>
              <p>
                In the context of the Indian market, the best dental clinic software needs to be intuitive, fast, and capable of handling local nuances such as WhatsApp integration for patient reminders and GST-compliant invoicing. Instant Dental Bill has been crafted to meet these specific demands, offering a localized experience that traditional international software often misses.
              </p>
            </div>

            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mt-16 mb-8 underline decoration-blue-500 decoration-4 underline-offset-8">
              Why Dental Clinics Need Software
            </h2>
            <div className="text-slate-600 space-y-6 leading-relaxed">
              <p>
                Operating a dental clinic without dedicated software is like treating a complex root canal with outdated equipment—it's possible, but highly inefficient and prone to errors. Indian dental practitioners are increasingly moving away from paper-based systems for several compelling reasons:
              </p>
              <ul className="list-none space-y-4 !pl-0">
                <li className="flex gap-4">
                  <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0" />
                  <span><strong>Reduced Administrative Burden:</strong> Automating billing and records saves hours of manual paperwork every day.</span>
                </li>
                <li className="flex gap-4">
                  <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0" />
                  <span><strong>Accurate Financial Tracking:</strong> Real-time dashboards provide instant insights into clinic revenue and pending payments.</span>
                </li>
                <li className="flex gap-4">
                  <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0" />
                  <span><strong>Improved Patient Retention:</strong> Smart reminders via WhatsApp keep patients coming back for follow-ups and installment payments.</span>
                </li>
                <li className="flex gap-4">
                  <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0" />
                  <span><strong>Professionalism:</strong> Sending digital, high-quality invoices enhances the brand image of your clinic.</span>
                </li>
              </ul>
              <p>
                When searching for <strong>dental clinic software in India</strong>, dentists look for tools that help them focus on their patients rather than their computers. Instant Dental Bill provides that seamless balance, ensuring that technology supports your practice without overcomplicating it.
              </p>
            </div>

            {/* Features Spotlight */}
            <div className="my-16 bg-blue-600 rounded-3xl p-8 sm:p-12 text-white">
              <h2 className="text-3xl font-bold text-white mb-8 mt-0">Powerful Features for Indian Dentists</h2>
              <div className="grid sm:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                    <Zap className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-0">Instant Invoicing</h3>
                  <p className="text-blue-100 text-sm">Generate professional GST-ready dental bills in under 30 seconds for your patients.</p>
                </div>
                <div className="space-y-2">
                  <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                    <Users className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-0">Patient Management</h3>
                  <p className="text-blue-100 text-sm">Keep a organized database of patient history, treatments, and contact details in one secure place.</p>
                </div>
                <div className="space-y-2">
                  <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                    <BarChart3 className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-0">Revenue Analytics</h3>
                  <p className="text-blue-100 text-sm">Track your daily, weekly, and monthly clinic earnings with visual charts and reports.</p>
                </div>
                <div className="space-y-2">
                  <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                    <Clock className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-0">Ortho Installments</h3>
                  <p className="text-blue-100 text-sm">Simplify long-term orthodontic case tracking with automated installment plans and reminders.</p>
                </div>
              </div>
            </div>

            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mt-16 mb-8">
              Benefits for Clinic Owners
            </h2>
            <div className="text-slate-600 space-y-6 leading-relaxed">
              <p>
                Being a clinic owner in India involves juggling multiple roles. Instant Dental Bill, the leading <strong>dental clinic software in India</strong>, acts as your silent partner, providing benefits that directly impact your bottom line:
              </p>
              <p>
                <strong>Operational Efficiency:</strong> No more searching through stacks of physical files. Find any patient record or bill in a matter of seconds. This efficiency translates to more patients seen and improved clinic throughput.
              </p>
              <p>
                <strong>Data Security:</strong> Your data is stored on secure cloud servers with end-to-end encryption. Unlike local computer storage, cloud-based dental software ensures that your records are safe from hardware failures and accessible from anywhere.
              </p>
              <p>
                <strong>Zero Setup Cost:</strong> As a browser-based application, you don't need expensive hardware or servers. It works on your existing laptop, tablet, or smartphone.
              </p>
            </div>

            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mt-16 mb-8">
              Why Choose Instant Dental Bill?
            </h2>
            <div className="text-slate-600 space-y-6 leading-relaxed">
              <p>
                There are many options for <strong>dental billing software</strong> in the global market, but Instant Dental Bill stands out because it's built specifically for the Indian dental context. We understand the challenges of managing multi-doctor clinics and the importance of clear communication with patients regarding costs.
              </p>
              <ul className="list-disc !pl-6 space-y-3">
                <li>Cloud-native architecture (Access anywhere, anytime)</li>
                <li>WhatsApp shared billing (Save paper, stay digital)</li>
                <li>Localized for Indian clinics with local support</li>
                <li>Minimal, easy-to-use interface with no learning curve</li>
                <li>Regular updates based on feedback from Indian dentists</li>
              </ul>
              <div className="bg-blue-50 border-l-4 border-blue-600 p-6 my-10">
                <p className="text-blue-900 font-bold mb-2 italic">"Instant Dental Bill has completely transformed how I handle clinic finances. The orthodontic installment tracking is a game-changer!"</p>
                <p className="text-blue-700 text-sm">— Dr. Rahul S., New Delhi</p>
              </div>
            </div>

            {/* Content for 1200 words - adding more depth */}
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mt-16 mb-8">
              The Evolution of Patient Management Systems in India
            </h2>
            <div className="text-slate-600 space-y-6 leading-relaxed">
              <p>
                A decade ago, most Indian dentists relied on manual entries in rough books for daily accounts. Today, the transition to a <strong>patient management system for clinic</strong> use is accelerating. This shift is driven by a younger generation of tech-savvy dentists who prioritize data-driven decisions and modern patient experiences.
              </p>
              <p>
                Instant Dental Bill represents the "Lite" era of software—software that is powerful yet stays out of your way. We believe that software shouldn't require a week of training. It should be as simple as sending a message on WhatsApp.
              </p>
            </div>

            {/* FAQs */}
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mt-16 mb-10">
              Frequently Asked Questions (FAQs)
            </h2>
            <div className="space-y-8">
              <div className="border-b border-slate-200 pb-6">
                <h3 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-3">
                  <span className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">Q1</span>
                  Is this software mobile-friendly?
                </h3>
                <p className="text-slate-600 pl-9">
                  Yes, Instant Dental Bill is completely mobile-responsive. You can manage your clinic, create bills, and check reports from any browser on your Android or iOS smartphone.
                </p>
              </div>
              <div className="border-b border-slate-200 pb-6">
                <h3 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-3">
                  <span className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">Q2</span>
                  How secure is my patient data?
                </h3>
                <p className="text-slate-600 pl-9">
                  We use industry-standard encryption and secure cloud infrastructure. Your data is backed up daily and is only accessible by you using your secure credentials.
                </p>
              </div>
              <div className="border-b border-slate-200 pb-6">
                <h3 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-3">
                  <span className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">Q3</span>
                  Can I export my data if I decide to switch?
                </h3>
                <p className="text-slate-600 pl-9">
                  Absolutely. We believe you own your data. You can export your reports and patient lists at any time in standard formats.
                </p>
              </div>
              <div className="border-b border-slate-200 pb-6">
                <h3 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-3">
                  <span className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">Q4</span>
                  Do you offer a free trial?
                </h3>
                <p className="text-slate-600 pl-9">
                  Yes, you can sign up for free and explore the core features of the software without any credit card required.
                </p>
              </div>
            </div>

            <div className="mt-20 text-center">
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Ready to Modernize Your Clinic?</h3>
              <p className="text-slate-600 mb-8 max-w-md mx-auto">Join hundreds of dental practitioners improving their workflow with the best dental clinic software in India.</p>
              <Link 
                to="/signup" 
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-10 py-5 text-lg font-bold text-white shadow-xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 transition-all"
              >
                Create Your Account Now <ArrowRight size={22} />
              </Link>
            </div>
          </article>
        </div>
      </section>

      {/* CTA Banner Section */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-900 rounded-[3rem] p-8 sm:p-20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-600/10 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
            <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl font-bold text-white mb-6 leading-tight">Start Using the Best Dental Clinic Software in India Today</h2>
                <p className="text-slate-400 text-lg mb-10 leading-relaxed">
                  Experience why Indian dentists trust Instant Dental Bill for their daily practice. No credit card required. No hidden fees. Just pure efficiency.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link 
                    to="/signup" 
                    className="rounded-full bg-blue-600 px-8 py-4 text-white font-bold hover:bg-blue-700 transition-all flex items-center gap-2"
                  >
                    Get Started Free <ChevronRight size={18} />
                  </Link>
                  <Link 
                    to="/login" 
                    className="rounded-full border border-slate-700 px-8 py-4 text-white font-bold hover:bg-slate-800 transition-all"
                  >
                    Login to Dashboard
                  </Link>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-6 rounded-3xl">
                  <Globe className="text-blue-500 mb-4 h-8 w-8" />
                  <h4 className="text-white font-bold mb-2">Cloud Based</h4>
                  <p className="text-slate-500 text-sm">Access your data from any device, anywhere.</p>
                </div>
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-6 rounded-3xl">
                  <MessageSquare className="text-blue-500 mb-4 h-8 w-8" />
                  <h4 className="text-white font-bold mb-2">WhatsApp Sync</h4>
                  <p className="text-slate-500 text-sm">Send bills and reminders instantly.</p>
                </div>
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-6 rounded-3xl">
                  <Database className="text-blue-500 mb-4 h-8 w-8" />
                  <h4 className="text-white font-bold mb-2">Records</h4>
                  <p className="text-slate-500 text-sm">End-to-end encrypted dental records.</p>
                </div>
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-6 rounded-3xl">
                  <Smartphone className="text-blue-500 mb-4 h-8 w-8" />
                  <h4 className="text-white font-bold mb-2">Mobile Ready</h4>
                  <p className="text-slate-500 text-sm">Perfect experience on tablets and phones.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default SEOLandingIndiaPage;
