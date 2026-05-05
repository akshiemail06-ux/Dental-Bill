import React, { useEffect, useState, useMemo } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit, addDoc, doc, getDoc, updateDoc, serverTimestamp, getDocs, collectionGroup } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useClinic } from '../contexts/ClinicContext';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { handleFirestoreError } from '../lib/error-handler';
import AppLayout from '../components/AppLayout';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  CreditCard, 
  Clock, 
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  ChevronRight,
  DollarSign,
  Stethoscope,
  Calendar,
  Loader2,
  MessageCircle,
  Building2,
  Wallet, // Added Wallet icon
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Link, useNavigate } from 'react-router-dom';
import { Bill, OrthoPatient, OrthoVisit } from '../types';
import { format, startOfMonth, endOfMonth, isToday, isWithinInterval, subMonths } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn, getWhatsAppUrl, ensureDate } from '@/lib/utils';
import { normalizeTreatmentName } from '../lib/treatment-utils';
import { toast } from 'sonner';

export default function DashboardPage() {
  const { clinic } = useClinic();
  const { isDemo, user, profile, loading: authLoading, isAuthReady } = useAuth();
  const navigate = useNavigate();
  const [bills, setBills] = useState<Bill[]>([]);
  const [orthoPatients, setOrthoPatients] = useState<OrthoPatient[]>([]);
  const [orthoVisits, setOrthoVisits] = useState<OrthoVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAutoSettingUp, setIsAutoSettingUp] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('clinic_setup_banner_dismissed') === 'true';
    }
    return false;
  });

  // Auto-onboarding logic for new users
  useEffect(() => {
    const setupClinic = async () => {
      // Requirements for auto-setup:
      // 1. Not in demo mode
      // 2. Auth is fully ready and profile is loaded
      // 3. User is logged in
      // 4. profile.clinicId is missing
      // 5. Not already in the middle of a setup
      if (!isDemo && isAuthReady && !authLoading && user && !profile?.clinicId && !isAutoSettingUp) {
        setIsAutoSettingUp(true);
        try {
          // SECONDARY CHECK: Use getDoc directly for Efficiency and Permission safety
          const freshUserSnap = await getDoc(doc(db, 'users', user.uid));
          if (freshUserSnap.exists()) {
            const freshData = freshUserSnap.data();
            if (freshData.clinicId) {
              console.log("Secondary check found existing clinicId, avoiding duplicate setup:", freshData.clinicId);
              return;
            }
          }

          console.log("Checking for orphaned clinics before creation...");
          // CRITICAL: First check if a clinic document already exists for this owner
          // but isn't linked to the user profile yet (prevents orphans)
          const clinicsQuery = query(
            collection(db, 'clinics'),
            where('ownerId', '==', user.uid),
            orderBy('updatedAt', 'desc'), // Get the most recently modified one if multiple exist
            limit(1)
          );
          
          const existingSnap = await getDocs(clinicsQuery);
          let targetClinicId = '';

          if (!existingSnap.empty) {
            // Found an existing clinic for this user! Just link it.
            targetClinicId = existingSnap.docs[0].id;
            console.log("Found existing clinic document. Linking to user profile:", targetClinicId);
          } else {
            // Truly a new user with no clinic doc
            console.log("No clinic found in cloud. Creating initial document...");
            const clinicRef = await addDoc(collection(db, 'clinics'), {
              name: 'MY DENTAL CLINIC',
              doctorName: 'DR. NEW DOCTOR',
              address: '',
              phone: '',
              email: user.email || '',
              gstNumber: '',
              currency: '₹',
              ownerId: user.uid,
              doctors: [
                {
                  id: Math.random().toString(36).substr(2, 9),
                  name: 'DR. NEW DOCTOR',
                  qualification: '',
                  registrationNumber: '',
                  isMain: true
                }
              ],
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
            targetClinicId = clinicRef.id;
          }
          
          // Final check: Only link if profile still doesn't have one 
          // (extremely narrow race condition guard)
          if (targetClinicId) {
            console.log("Updating user profile with clinic link:", targetClinicId);
            await updateDoc(doc(db, 'users', user.uid), {
              clinicId: targetClinicId,
              updatedAt: serverTimestamp()
            });
            toast.success('Your dental portal is ready!');
          }
        } catch (error) {
          console.error("Auto-setup error:", error);
        } finally {
          setIsAutoSettingUp(false);
        }
      }
    };
    setupClinic();
  }, [user, profile?.clinicId, isAuthReady, authLoading, isDemo, isAutoSettingUp]);

  const fetchBills = () => {
    if (isDemo) {
      const now = new Date();
      const sampleBills: Bill[] = [
        {
          id: 'demo-bill-1',
          billNumber: 'BILL-2026-001',
          patientName: 'Rahul Sharma',
          patientPhone: '9988776655',
          billDate: now,
          items: [{ name: 'Root Canal Treatment (RCT)', quantity: 1, price: 5000, total: 5000 }],
          subtotal: 5000,
          discount: 500,
          total: 4500,
          paymentStatus: 'paid',
          clinicId: 'demo-clinic',
          doctorName: 'Akshit Bhardwaj',
          ownerId: 'demo-user',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 'demo-bill-2',
          billNumber: 'BILL-2026-002',
          patientName: 'Anjali Gupta',
          patientPhone: '9911223344',
          billDate: subMonths(now, 1),
          items: [{ name: 'Dental Implant', quantity: 1, price: 25000, total: 25000 }],
          subtotal: 25000,
          discount: 2000,
          total: 23000,
          paymentStatus: 'partial',
          partialAmount: 15000,
          clinicId: 'demo-clinic',
          doctorName: 'Akshit Bhardwaj',
          ownerId: 'demo-user',
          createdAt: subMonths(now, 1),
          updatedAt: subMonths(now, 1)
        },
        {
          id: 'demo-bill-3',
          billNumber: 'BILL-2026-003',
          patientName: 'Vikram Singh',
          patientPhone: '8877665544',
          billDate: subMonths(now, 2),
          items: [{ name: 'Scaling & Polishing', quantity: 1, price: 1500, total: 1500 }],
          subtotal: 1500,
          discount: 0,
          total: 1500,
          paymentStatus: 'paid',
          clinicId: 'demo-clinic',
          doctorName: 'Priya Sharma',
          ownerId: 'demo-user',
          createdAt: subMonths(now, 2),
          updatedAt: subMonths(now, 2)
        },
        {
          id: 'demo-bill-4',
          billNumber: 'BILL-2026-004',
          patientName: 'Sonia Verma',
          patientPhone: '7766554433',
          billDate: subMonths(now, 3),
          items: [{ name: 'Teeth Whitening', quantity: 1, price: 8000, total: 8000 }],
          subtotal: 8000,
          discount: 1000,
          total: 7000,
          paymentStatus: 'unpaid',
          clinicId: 'demo-clinic',
          doctorName: 'Akshit Bhardwaj',
          ownerId: 'demo-user',
          createdAt: subMonths(now, 3),
          updatedAt: subMonths(now, 3)
        }
      ];

      // Add newly generated demo bill if exists
      const savedBill = sessionStorage.getItem('lastDemoBill');
      if (savedBill) {
        const parsedBill = JSON.parse(savedBill);
        parsedBill.billDate = new Date(parsedBill.billDate);
        sampleBills.unshift(parsedBill);
      }

      setBills(sampleBills);
      setLoading(false);
      return;
    }

    if (!clinic?.id) {
      setLoading(false);
      return;
    }

    const billsQuery = query(
      collection(db, 'bills'),
      where('clinicId', '==', clinic?.id),
      orderBy('billDate', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(billsQuery, (snapshot) => {
      const billsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        billDate: ensureDate(doc.data().billDate)
      })) as Bill[];
      setBills(billsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, 'list', 'bills');
      setLoading(false);
    });

    return unsubscribe;
  };

  const fetchOrthoData = () => {
    if (isDemo) {
      setOrthoPatients([]);
      setOrthoVisits([]);
      return () => {};
    }

    if (!clinic?.id) return () => {};

    // Fetch Ortho Patients for balance tracking
    const pQuery = query(
      collection(db, 'orthoPatients'),
      where('clinicId', '==', clinic.id)
    );

    const unsubscribePatients = onSnapshot(pQuery, (snap) => {
      const p = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as OrthoPatient));
      setOrthoPatients(p);
    }, (error) => {
      handleFirestoreError(error, 'list', 'orthoPatients');
    });

    // Fetch All Ortho Visits for revenue tracking
    // Note: This requires a Collection Group index in Firestore
    const vQuery = query(
      collectionGroup(db, 'visits'),
      where('clinicId', '==', clinic.id)
    );

    const unsubscribeVisits = onSnapshot(vQuery, (snap) => {
      const v = snap.docs.map(doc => ({ 
        id: doc.id, 
        patientId: doc.ref.parent.parent?.id,
        ...doc.data(),
        visitDate: ensureDate(doc.data().visitDate)
      } as any as OrthoVisit));
      setOrthoVisits(v);
    }, (error) => {
      // If collection group index is missing, we gracefully fail for revenue integration
      // but still show the dashboard. This avoids breaking the app for new users.
      console.warn("Ortho Visits Collection Group Index might be missing. Ortho revenue won't reflect on main dashboard yet.", error);
    });

    return () => {
      unsubscribePatients();
      unsubscribeVisits?.();
    };
  };

  useEffect(() => {
    const unsubBills = fetchBills();
    const unsubOrtho = fetchOrthoData();
    return () => {
      unsubBills?.();
      unsubOrtho?.();
    };
  }, [clinic?.id, user?.uid, isDemo]);

  const handleWhatsAppReminder = (e: React.MouseEvent, bill: Bill) => {
    e.stopPropagation(); // Don't navigate to the bill preview

    if (!bill.patientPhone) {
      toast.error('Customer phone number is required to send WhatsApp reminder');
      return;
    }

    const cleaned = bill.patientPhone.replace(/\D/g, '');
    if (cleaned.length < 10) {
      toast.error('Patient phone number appears to be invalid');
      return;
    }

    const billDateStr = format(bill.billDate as Date, 'MMM dd, yyyy');
    const billLink = `${window.location.origin}/bills/${bill.id}`;
    const amountDue = bill.dueAmount || (bill.total - (bill.paidAmount || 0));
    const clinicName = clinic?.name || 'our clinic';
    const currency = clinic?.currency || '₹';

    let message = '';

    if (bill.paymentStatus === 'unpaid') {
      message = `Hello ${bill.patientName},

This is a friendly reminder from ${clinicName}.

Your bill ${bill.billNumber} dated ${billDateStr} has an unpaid amount of ${currency}${bill.total.toLocaleString()}.

Please clear the payment at your convenience.

View bill:
${billLink}

Thank you.`;
    } else if (bill.paymentStatus === 'partial') {
      message = `Hello ${bill.patientName},

This is a friendly reminder from ${clinicName}.

Your bill ${bill.billNumber} dated ${billDateStr} has a pending balance of ${currency}${amountDue.toLocaleString()}.

Please clear the remaining payment at your convenience.

View bill:
${billLink}

Thank you.`;
    }

    if (message) {
      window.open(getWhatsAppUrl(bill.patientPhone, message), '_blank');
      toast.success(`Opening WhatsApp for ${bill.patientName}`);
    }
  };

  // Calculations
  const now = new Date();
  const todayBills = bills.filter(bill => isToday(bill.billDate as Date));
  const thisMonthBills = bills.filter(bill => isWithinInterval(bill.billDate as Date, { 
    start: startOfMonth(now), 
    end: endOfMonth(now) 
  }));

  const todayOrthoVisits = orthoVisits.filter(v => isToday(ensureDate(v.visitDate)));
  const thisMonthOrthoVisits = orthoVisits.filter(v => isWithinInterval(ensureDate(v.visitDate), {
    start: startOfMonth(now),
    end: endOfMonth(now)
  }));

  // Today's Revenue (Total value generated today: Bills total + Ortho today's payments)
  const todayRevenue = todayBills.reduce((sum, bill) => sum + bill.total, 0) + 
                       todayOrthoVisits.reduce((sum, v) => sum + v.amountPaid, 0);

  // Today's Collection (Actual money received today)
  const todayCollection = todayBills.reduce((sum, bill) => {
    if (bill.paymentStatus === 'paid') return sum + bill.total;
    if (bill.paymentStatus === 'partial') return sum + (bill.partialAmount || 0);
    return sum;
  }, 0) + todayOrthoVisits.reduce((sum, v) => sum + v.amountPaid, 0);

  const thisMonthRevenue = thisMonthBills.reduce((sum, bill) => sum + bill.total, 0) +
                           thisMonthOrthoVisits.reduce((sum, v) => sum + v.amountPaid, 0);
  
  const pendingBills = bills.filter(bill => bill.paymentStatus === 'unpaid' || bill.paymentStatus === 'partial');
  const totalPending = pendingBills.reduce((sum, bill) => {
    if (bill.paymentStatus === 'unpaid') return sum + bill.total;
    return sum + (bill.total - (bill.partialAmount || 0));
  }, 0) + orthoPatients.reduce((sum, p) => sum + p.remainingAmount, 0);

  // Treatment Stats for Widget
  const treatmentStats = bills.reduce((acc: any, bill) => {
    bill.items.forEach(item => {
      const normalized = normalizeTreatmentName(item.name);
      if (!acc[normalized]) {
        acc[normalized] = { name: normalized, count: 0, revenue: 0 };
      }
      acc[normalized].count += item.quantity || 1;
      acc[normalized].revenue += item.total;
    });
    return acc;
  }, {});

  // Add Ortho to treatment stats
  if (orthoVisits.length > 0) {
    const orthoRevenueTotal = orthoVisits.reduce((sum, v) => sum + v.amountPaid, 0);
    treatmentStats['Orthodontics'] = {
      name: 'Orthodontics',
      count: orthoVisits.length,
      revenue: orthoRevenueTotal
    };
  }

  const topTreatments = Object.values(treatmentStats)
    .sort((a: any, b: any) => b.count - a.count)
    .slice(0, 5) as any[];

  // Chart Data (Last 6 months)
  const chartData = Array.from({ length: 6 }).map((_, i) => {
    const date = subMonths(new Date(), 5 - i);
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    const monthBills = bills.filter(bill => isWithinInterval(bill.billDate as Date, { start: monthStart, end: monthEnd }));
    const monthOrthoVisits = orthoVisits.filter(v => isWithinInterval(ensureDate(v.visitDate), { start: monthStart, end: monthEnd }));
    
    return {
      name: format(date, 'MMM'),
      revenue: monthBills.reduce((sum, bill) => sum + bill.total, 0) + 
                monthOrthoVisits.reduce((sum, v) => sum + v.amountPaid, 0),
      collected: monthBills.reduce((sum, bill) => {
        if (bill.paymentStatus === 'paid') return sum + bill.total;
        if (bill.paymentStatus === 'partial') return sum + (bill.partialAmount || 0);
        return sum;
      }, 0) + monthOrthoVisits.reduce((sum, v) => sum + v.amountPaid, 0),
    };
  });

  // Combine and unified items for recent activity
  const unifiedRecentItems = useMemo(() => {
    const combined = [
      ...bills.map(b => ({ ...b, source: 'bill' as const })),
      ...orthoVisits.map(v => ({
        ...v,
        source: 'ortho' as const,
        patientName: orthoPatients.find(p => p.id === (v as any).patientId)?.patientName || 'Ortho Patient',
        patientId: (v as any).patientId
      }))
    ];

    return combined.sort((a, b) => {
      const dateA = a.source === 'bill' ? ensureDate(a.billDate) : ensureDate(a.visitDate);
      const dateB = b.source === 'bill' ? ensureDate(b.billDate) : ensureDate(b.visitDate);
      return dateB.getTime() - dateA.getTime();
    }).slice(0, 5);
  }, [bills, orthoVisits, orthoPatients]);

  const stats = [
    { 
      title: "Today's Bills", 
      value: (todayBills.length + todayOrthoVisits.length).toString(), 
      icon: CreditCard, 
      color: 'text-green-600', 
      bg: 'bg-green-50', 
      description: 'Total bills & ortho visits today',
      link: '/bills?filter=today'
    },
    { 
      title: "Today's Revenue", 
      value: `${clinic?.currency || '₹'}${todayRevenue.toLocaleString()}`, 
      icon: TrendingUp, 
      color: 'text-blue-600', 
      bg: 'bg-blue-50', 
      description: 'Total value generated today',
      link: '/bills?filter=today'
    },
    { 
      title: "This Month", 
      value: `${clinic?.currency || '₹'}${thisMonthRevenue.toLocaleString()}`, 
      icon: Calendar, 
      color: 'text-purple-600', 
      bg: 'bg-purple-50', 
      description: 'Revenue for current month',
      link: '/bills?filter=this-month'
    },
    { 
      title: "Pending / Due", 
      value: `${clinic?.currency || '₹'}${totalPending.toLocaleString()}`, 
      icon: Clock, 
      color: 'text-orange-600', 
      bg: 'bg-orange-50', 
      description: 'Outstanding balance (Bills + Ortho)',
      link: '/bills?status=pending'
    }
  ];

  const { subscription, daysLeft } = useSubscription();
  const billsUsed = subscription?.billsUsed || 0;
  const billLimit = subscription?.billLimit === 'unlimited' ? Infinity : (subscription?.billLimit as number || 0);
  const usagePercentage = billLimit === Infinity ? 0 : Math.min(100, (billsUsed / billLimit) * 100);

  // Logic to hide banner if clinic is already setup
  const isClinicSetupComplete = clinic && (
    clinic.name !== 'MY DENTAL CLINIC' && 
    clinic.address?.trim() !== ''
  );

  const showSetupBanner = !isDemo && !isClinicSetupComplete && !isBannerDismissed;

  const dismissBanner = () => {
    setIsBannerDismissed(true);
    localStorage.setItem('clinic_setup_banner_dismissed', 'true');
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <p className="text-gray-500 font-medium animate-pulse">Preparing your dashboard...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 font-heading">Dashboard</h1>
            <p className="text-gray-500">Generate Dental Bills in 10 Seconds</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/bills/new">
              <Button className="bg-blue-600 hover:bg-blue-700 h-11 px-6 rounded-xl shadow-lg shadow-blue-200 transition-all hover:scale-[1.02] active:scale-[0.98]">
                <Plus className="mr-2 h-5 w-5" /> Create New Bill
              </Button>
            </Link>
          </div>
        </div>

        {/* Clinic Setup Reminder */}
        {showSetupBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl shadow-blue-200 relative overflow-hidden group"
          >
            <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
              <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm group-hover:scale-110 transition-transform">
                <Building2 size={32} />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl font-bold">One-Time Clinic Setup</h3>
                <p className="text-blue-100 text-sm mt-1">
                  Welcome! Please complete your clinic settings (Name, Address, Logo, Signature)
                  to ensure your invoices look professional.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link to="/settings">
                  <Button className="bg-white text-blue-600 hover:bg-blue-50 font-bold px-6 h-11 rounded-xl shadow-lg border-none">
                    Configure Now
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  onClick={dismissBanner}
                  className="text-white hover:bg-white/10 h-11 px-4 rounded-xl font-medium"
                >
                  Later
                </Button>
              </div>
            </div>
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16 blur-2xl pointer-events-none" />
          </motion.div>
        )}

        {bills.length === 0 && !isDemo && clinic?.name !== 'MY DENTAL CLINIC' && (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-sm">
            <div className="bg-blue-600 text-white p-4 rounded-2xl shadow-lg shadow-blue-200">
              <Activity size={32} />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-lg font-bold text-blue-900">Welcome to your real account!</h3>
              <p className="text-blue-700 text-sm mt-1">
                You are now logged in with <strong>{user?.email}</strong>. 
                Start creating your actual clinic bills now!
              </p>
            </div>
            <Link to="/bills/new">
              <Button className="bg-blue-600 hover:bg-blue-700 whitespace-nowrap">
                Create First Bill
              </Button>
            </Link>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <Card 
                key={idx} 
                className="border-none shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.98]"
                onClick={() => navigate(stat.link)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`${stat.bg} ${stat.color} rounded-2xl p-3`}>
                      <Icon size={24} />
                    </div>
                    <ArrowUpRight size={16} className="text-gray-300" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                    <h3 className="mt-1 text-2xl font-bold text-gray-900">{stat.value}</h3>
                    <p className="text-[11px] text-gray-400 mt-1">{stat.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts & Widgets Section */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Subscription Usage Widget */}
          {subscription?.planType && (subscription.planType === 'trial' || subscription.planType === 'basic') && (
             <Card className="lg:col-span-3 border-none shadow-sm bg-white overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                        <Zap size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {subscription.planType === 'trial' ? 'Free Trial usage' : 'Plan Usage'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {subscription.planType === 'trial' 
                            ? `You have ${daysLeft} days remaining in your trial.` 
                            : `You have used ${billsUsed} of your ${billLimit} bill limit.`}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex-1 w-full max-w-md space-y-2">
                       <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                          <span>Usage</span>
                          <span>{billsUsed} / {billLimit === Infinity ? '∞' : billLimit} Bills</span>
                       </div>
                       <Progress value={usagePercentage} className="h-2 bg-gray-100" />
                    </div>

                    <Link to="/subscription">
                      <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50 font-bold">
                        Manage Plan
                      </Button>
                    </Link>
                  </div>
                </CardContent>
             </Card>
          )}

          <Card className="lg:col-span-2 border-none shadow-sm overflow-hidden">
            <CardHeader className="border-b border-gray-50 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-gray-900 font-heading">Revenue Analytics</CardTitle>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-blue-600" />
                    <span className="text-gray-500">Total</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-gray-500">Collected</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="h-[350px] pt-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '16px', 
                      border: 'none', 
                      boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                      padding: '12px'
                    }}
                    cursor={{ fill: '#f8fafc', radius: 8 }}
                  />
                  <Bar dataKey="revenue" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={32} />
                  <Bar dataKey="collected" fill="#22c55e" radius={[6, 6, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Treatments Widget */}
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="border-b border-gray-50 pb-4">
              <CardTitle className="text-lg font-bold text-gray-900 font-heading flex items-center gap-2">
                <Stethoscope size={20} className="text-blue-600" /> Top Treatments
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                {topTreatments.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{item.name}</p>
                        <p className="text-[11px] text-gray-400 font-medium">{item.count} cases performed</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-gray-900">{clinic?.currency}{item.revenue.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
                {topTreatments.length === 0 && (
                  <div className="py-12 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-50 text-gray-300 mb-3">
                      <Activity size={24} />
                    </div>
                    <p className="text-sm text-gray-400">No treatment data yet.</p>
                  </div>
                )}
              </div>
              {topTreatments.length > 0 && (
                <Link to="/reports" className="block mt-8 text-center text-xs font-bold text-blue-600 hover:underline uppercase tracking-widest">
                  View Full Report
                </Link>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Bills */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="border-b border-gray-50 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold text-gray-900 font-heading">Recent Bills</CardTitle>
              <Link to="/bills" className="text-xs font-bold text-blue-600 hover:underline uppercase tracking-widest">
                View All
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Description / Patient</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Date</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Amount</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Status / Type</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {bills.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <div className="rounded-full bg-gray-50 p-3 text-gray-300">
                            <CreditCard size={24} />
                          </div>
                          <p className="text-sm text-gray-500 font-medium">No bills generated yet.</p>
                          <Link to="/bills/new">
                            <Button variant="link" className="text-blue-600 font-bold">Create your first bill</Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )}
                  {unifiedRecentItems.map((item) => (
                    <tr 
                      key={item.id} 
                      className="hover:bg-gray-50/50 transition-colors cursor-pointer" 
                      onClick={() => {
                        if (item.source === 'bill') {
                          navigate(`/bills/${item.id}`);
                        } else {
                          navigate(`/ortho/${(item as any).patientId}`);
                        }
                      }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-0.5">
                          <p className="text-sm font-bold text-gray-900">{item.patientName}</p>
                          <div className="flex items-center gap-1 text-[11px] text-gray-400">
                            {item.source === 'bill' ? (
                              <span>{item.billNumber}</span>
                            ) : (
                              <div className="flex items-center gap-1 font-medium text-blue-500">
                                <Stethoscope size={10} />
                                <span>Orthodontic Visit</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600">
                          {format((item.source === 'bill' ? item.billDate : item.visitDate) as Date, 'MMM dd, yyyy')}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-gray-900">
                          {clinic?.currency}{(item.source === 'bill' ? item.total : item.amountPaid).toLocaleString()}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        {item.source === 'bill' ? (
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-[10px] font-bold uppercase tracking-wider px-2 py-0 border-none",
                              item.paymentStatus === 'paid' ? "bg-green-50 text-green-600" : 
                              item.paymentStatus === 'partial' ? "bg-orange-50 text-orange-600" :
                              item.paymentStatus === 'draft' ? "bg-gray-100 text-gray-500" :
                              "bg-red-50 text-red-600"
                            )}
                          >
                            {item.paymentStatus}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider px-2 py-0 border-none bg-green-50 text-green-600">
                            paid
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {item.source === 'bill' && (item.paymentStatus === 'unpaid' || item.paymentStatus === 'partial') && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={(e) => handleWhatsAppReminder(e, item as Bill)}
                              title="Send WhatsApp Reminder"
                            >
                              <MessageCircle size={16} />
                            </Button>
                          )}
                          <ChevronRight size={16} className="text-gray-300 inline" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
