import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy, collectionGroup } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useClinic } from '../contexts/ClinicContext';
import { useAuth } from '../contexts/AuthContext';
import { handleFirestoreError } from '../lib/error-handler';
import AppLayout from '../components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  CreditCard, 
  Clock, 
  Calendar as CalendarIcon,
  Download,
  Filter,
  PieChart as PieChartIcon,
  Activity,
  ChevronDown,
  Stethoscope,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bill, OrthoVisit, OrthoPatient } from '../types';
import { 
  format, 
  startOfDay, 
  endOfDay, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  startOfYear, 
  endOfYear, 
  isWithinInterval, 
  subDays,
  addMonths,
  eachDayOfInterval,
  isSameDay
} from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn, ensureDate } from '@/lib/utils';
import { normalizeTreatmentName } from '../lib/treatment-utils';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

const COLORS = ['#2563eb', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function ReportsPage() {
  const { clinic } = useClinic();
  const { isDemo, user } = useAuth();
  const [bills, setBills] = useState<Bill[]>([]);
  const [orthoVisits, setOrthoVisits] = useState<OrthoVisit[]>([]);
  const [orthoPatients, setOrthoPatients] = useState<OrthoPatient[]>([]);
  const [loading, setLoading] = useState(true);
  
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<string>((now.getMonth() + 1).toString());
  const [selectedYear, setSelectedYear] = useState<string>(now.getFullYear().toString());
  const [customRange, setCustomRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: startOfMonth(now),
    to: endOfMonth(now)
  });

  const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
    { value: 'custom', label: 'Custom Range' },
  ];

  // Generate dynamic years based on current year and available bills
  const availableYears = React.useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = new Set<number>();
    years.add(currentYear);
    
    bills.forEach(bill => {
      if (bill.billDate) {
        years.add((bill.billDate as Date).getFullYear());
      }
    });

    orthoVisits.forEach(visit => {
      if (visit.visitDate) {
        years.add((visit.visitDate as Date).getFullYear());
      }
    });
    
    return Array.from(years).sort((a, b) => b - a);
  }, [bills, orthoVisits]);

  useEffect(() => {
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
          paymentMethod: 'UPI',
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
          billDate: subDays(now, 2),
          items: [{ name: 'Dental Implant', quantity: 1, price: 25000, total: 25000 }],
          subtotal: 25000,
          discount: 2000,
          total: 23000,
          paymentStatus: 'partial',
          partialAmount: 15000,
          paymentMethod: 'Card',
          clinicId: 'demo-clinic',
          doctorName: 'Akshit Bhardwaj',
          ownerId: 'demo-user',
          createdAt: subDays(now, 2),
          updatedAt: subDays(now, 2)
        },
        {
          id: 'demo-bill-3',
          billNumber: 'BILL-2026-003',
          patientName: 'Vikram Singh',
          patientPhone: '8877665544',
          billDate: subDays(now, 5),
          items: [{ name: 'Scaling & Polishing', quantity: 1, price: 1500, total: 1500 }],
          subtotal: 1500,
          discount: 0,
          total: 1500,
          paymentStatus: 'paid',
          paymentMethod: 'Cash',
          clinicId: 'demo-clinic',
          doctorName: 'Priya Sharma',
          ownerId: 'demo-user',
          createdAt: subDays(now, 5),
          updatedAt: subDays(now, 5)
        },
        {
          id: 'demo-bill-4',
          billNumber: 'BILL-2026-004',
          patientName: 'Sonia Verma',
          patientPhone: '7766554433',
          billDate: subDays(now, 10),
          items: [{ name: 'Teeth Whitening', quantity: 1, price: 8000, total: 8000 }],
          subtotal: 8000,
          discount: 1000,
          total: 7000,
          paymentStatus: 'unpaid',
          paymentMethod: 'UPI',
          clinicId: 'demo-clinic',
          doctorName: 'Akshit Bhardwaj',
          ownerId: 'demo-user',
          createdAt: subDays(now, 10),
          updatedAt: subDays(now, 10)
        }
      ];
      setBills(sampleBills);

      const sampleOrthoVisits: (OrthoVisit & { patientId: string })[] = [
        {
          id: 'demo-visit-1',
          clinicId: 'demo-clinic',
          ownerId: 'demo-user',
          patientId: 'demo-ortho-1',
          visitDate: now,
          amountPaid: 2500,
          progressNote: 'Braces adjustment',
          nextAppointmentDate: addMonths(now, 1),
          createdAt: now
        },
        {
          id: 'demo-visit-2',
          clinicId: 'demo-clinic',
          ownerId: 'demo-user',
          patientId: 'demo-ortho-1',
          visitDate: subDays(now, 3),
          amountPaid: 2500,
          progressNote: 'Wire change',
          nextAppointmentDate: addMonths(now, 1),
          createdAt: subDays(now, 3)
        }
      ];
      setOrthoVisits(sampleOrthoVisits);

      const sampleOrthoPatients: OrthoPatient[] = [
        {
          id: 'demo-ortho-1',
          clinicId: 'demo-clinic',
          ownerId: 'demo-user',
          patientName: 'Karan Mehra',
          mobileNumber: '9988776655',
          age: 24,
          gender: 'male',
          startDate: subDays(now, 30),
          treatmentPlan: 'Metal Braces',
          totalAmount: 35000,
          monthlyInstallment: 2500,
          amountPaid: 15000,
          remainingAmount: 20000,
          nextAppointmentDate: addMonths(now, 1),
          status: 'active',
          createdAt: subDays(now, 30),
          updatedAt: now
        }
      ];
      setOrthoPatients(sampleOrthoPatients);

      setLoading(false);
      return;
    }

    if (!clinic?.id) return;

    // Fetch Bills
    const billsQuery = query(
      collection(db, 'bills'),
      where('clinicId', '==', clinic?.id),
      orderBy('billDate', 'desc')
    );

    const unsubscribeBills = onSnapshot(billsQuery, (snapshot) => {
      const billsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        billDate: ensureDate(doc.data().billDate)
      })) as Bill[];
      setBills(billsData);
    }, (error) => {
      handleFirestoreError(error, 'list', 'bills');
    });

    // Fetch Ortho Visits
    const visitsQuery = query(
      collectionGroup(db, 'visits'),
      where('clinicId', '==', clinic?.id),
      orderBy('visitDate', 'desc')
    );

    const unsubscribeVisits = onSnapshot(visitsQuery, (snapshot) => {
      const visitsData = snapshot.docs.map(doc => ({
        id: doc.id,
        patientId: doc.ref.parent.parent?.id, // Extract parent patient ID
        ...doc.data(),
        visitDate: ensureDate(doc.data().visitDate),
        nextAppointmentDate: ensureDate(doc.data().nextAppointmentDate),
        createdAt: ensureDate(doc.data().createdAt)
      })) as (OrthoVisit & { patientId: string })[];
      setOrthoVisits(visitsData);
    }, (error) => {
      // If index is missing, we might need to handle it or just log it
      handleFirestoreError(error, 'list', 'orthoVisits');
    });

    // Fetch Ortho Patients for patient count and pending balance
    const patientsQuery = query(
      collection(db, 'orthoPatients'),
      where('clinicId', '==', clinic?.id)
    );

    const unsubscribePatients = onSnapshot(patientsQuery, (snapshot) => {
      const patientsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startDate: ensureDate(doc.data().startDate),
        nextAppointmentDate: ensureDate(doc.data().nextAppointmentDate),
        createdAt: ensureDate(doc.data().createdAt),
        updatedAt: ensureDate(doc.data().updatedAt)
      })) as OrthoPatient[];
      setOrthoPatients(patientsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, 'list', 'orthoPatients');
      setLoading(false);
    });

    return () => {
      unsubscribeBills();
      unsubscribeVisits();
      unsubscribePatients();
    };
  }, [clinic?.id, user?.uid]);

  // Filter bills based on selected month and year
  const filteredBills = bills.filter(bill => {
    const billDate = bill.billDate as Date;
    
    if (selectedMonth === 'custom') {
      if (!customRange.from || !customRange.to) return true;
      return isWithinInterval(billDate, { 
        start: startOfDay(customRange.from), 
        end: endOfDay(customRange.to) 
      });
    }

    const billMonth = billDate.getMonth() + 1;
    const billYear = billDate.getFullYear();
    
    const yearMatch = billYear.toString() === selectedYear;
    const monthMatch = billMonth.toString() === selectedMonth;
    
    return yearMatch && monthMatch;
  });

  // Filter ortho visits based on selected month and year
  const filteredOrthoVisits = orthoVisits.filter(visit => {
    const visitDate = visit.visitDate as Date;
    
    if (selectedMonth === 'custom') {
      if (!customRange.from || !customRange.to) return true;
      return isWithinInterval(visitDate, { 
        start: startOfDay(customRange.from), 
        end: endOfDay(customRange.to) 
      });
    }

    const visitMonth = visitDate.getMonth() + 1;
    const visitYear = visitDate.getFullYear();
    
    const yearMatch = visitYear.toString() === selectedYear;
    const monthMatch = visitMonth.toString() === selectedMonth;
    
    return yearMatch && monthMatch;
  });

  // Calculations
  const orthoRevenue = filteredOrthoVisits.reduce((sum, visit) => sum + visit.amountPaid, 0);
  const totalRevenue = filteredBills.reduce((sum, bill) => sum + bill.total, 0) + orthoRevenue;
  const totalBills = filteredBills.length + filteredOrthoVisits.length;
  
  // Combine bills and ortho patients for unique patient count of those SEEN in this period
  const patientCount = new Set([
    ...filteredBills.map(b => (b.patientName + b.patientPhone).toLowerCase().trim()),
    ...filteredOrthoVisits.map(v => (v as any).patientId).filter(Boolean)
  ]).size;
  
  const paidAmount = filteredBills
    .filter(b => b.paymentStatus === 'paid')
    .reduce((sum, b) => sum + b.total, 0) + orthoRevenue; // Ortho visits are considered paid
  
  const partialAmount = filteredBills
    .filter(b => b.paymentStatus === 'partial')
    .reduce((sum, b) => sum + (b.partialAmount || 0), 0);
  
  const unpaidAmount = filteredBills
    .filter(b => b.paymentStatus === 'unpaid')
    .reduce((sum, b) => sum + b.total, 0) + 
    filteredBills
    .filter(b => b.paymentStatus === 'partial')
    .reduce((sum, b) => sum + (b.total - (b.partialAmount || 0)), 0) +
    orthoPatients.reduce((sum, p) => sum + p.remainingAmount, 0);

  // Payment Method Breakdown
  const paymentMethods = filteredBills.reduce((acc: any, bill) => {
    const method = bill.paymentMethod || 'Other';
    acc[method] = (acc[method] || 0) + 1;
    return acc;
  }, {});

  // Add Ortho payments - mostly cash/UPI as default if not specified
  if (filteredOrthoVisits.length > 0) {
    paymentMethods['Ortho Payments'] = (paymentMethods['Ortho Payments'] || 0) + filteredOrthoVisits.length;
  }

  const paymentMethodData = Object.keys(paymentMethods).map(name => ({
    name,
    value: paymentMethods[name]
  }));

  // Treatment Breakdown
  const treatmentStats = filteredBills.reduce((acc: any, bill) => {
    bill.items.forEach(item => {
      const normalized = normalizeTreatmentName(item.name);
      if (!acc[normalized]) {
        acc[normalized] = { name: normalized, count: 0, revenue: 0 };
      }
      acc[normalized].count += 1;
      acc[normalized].revenue += item.total;
    });
    return acc;
  }, {});

  // Add Ortho as a category
  if (orthoRevenue > 0) {
    treatmentStats['Orthodontics'] = {
      name: 'Orthodontics',
      count: filteredOrthoVisits.length,
      revenue: orthoRevenue
    };
  }

  const treatmentData = Object.values(treatmentStats)
    .sort((a: any, b: any) => b.revenue - a.revenue) as any[];

  // Revenue Trend Data
  const getTrendData = () => {
    const year = parseInt(selectedYear);
    
    if (selectedMonth === 'custom') {
      if (!customRange.from || !customRange.to) return [];
      const days = eachDayOfInterval({ start: customRange.from, end: customRange.to });
      // Limit to 60 days for trend chart to avoid clutter
      if (days.length > 60) {
        // Group by month if range is long
        return []; 
      }
      return days.map(day => {
        const dayBills = filteredBills.filter(b => isSameDay(ensureDate(b.billDate), day));
        const dayOrtho = filteredOrthoVisits.filter(v => isSameDay(ensureDate(v.visitDate), day));
        
        return {
          name: format(day, 'dd MMM'),
          revenue: dayBills.reduce((sum, b) => sum + b.total, 0) + dayOrtho.reduce((sum, v) => sum + v.amountPaid, 0)
        };
      });
    }

    // Monthly view: group by day
    const monthStr = selectedMonth === 'custom' ? (now.getMonth() + 1).toString() : selectedMonth;
    const month = parseInt(monthStr) - 1;
    const start = startOfMonth(new Date(year, month, 1));
    const end = endOfMonth(new Date(year, month, 1));
    const days = eachDayOfInterval({ start, end });
    
    return days.map(day => {
      const dayBills = filteredBills.filter(b => isSameDay(ensureDate(b.billDate), day));
      const dayOrtho = filteredOrthoVisits.filter(v => isSameDay(ensureDate(v.visitDate), day));
      
      return {
        name: format(day, 'dd MMM'),
        revenue: dayBills.reduce((sum, b) => sum + b.total, 0) + dayOrtho.reduce((sum, v) => sum + v.amountPaid, 0)
      };
    });
  };

  const trendData = getTrendData();

  const stats = [
    { title: 'Total Revenue', value: `${clinic?.currency}${totalRevenue.toLocaleString()}`, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Transactions', value: totalBills.toString(), icon: CreditCard, color: 'text-purple-600', bg: 'bg-purple-50' },
    { title: 'Patients', value: patientCount.toString(), icon: Users, color: 'text-green-600', bg: 'bg-green-50' },
    { title: 'Pending', value: `${clinic?.currency}${unpaidAmount.toLocaleString()}`, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  if (loading) {
    return (
      <AppLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <p className="text-gray-500 font-medium animate-pulse">Analyzing clinic data...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-8 pb-12">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 font-heading">Clinic Reports</h1>
            <p className="text-gray-500">Detailed insights into your practice performance</p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-full sm:w-[150px] h-11 rounded-xl border-gray-200 bg-white shadow-sm">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                  {months.map(m => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedMonth !== 'custom' && (
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-full sm:w-[120px] h-11 rounded-xl border-gray-200 bg-white shadow-sm">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                    {availableYears.map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {selectedMonth === 'custom' && (
                <div className="flex items-center gap-2">
                  <Input 
                    type="date" 
                    className="h-11 rounded-xl border-gray-200 bg-white shadow-sm w-full sm:w-auto"
                    value={customRange.from ? format(customRange.from, 'yyyy-MM-dd') : ''}
                    onChange={(e) => setCustomRange(prev => ({ ...prev, from: e.target.value ? new Date(e.target.value) : undefined }))}
                  />
                  <span className="text-gray-400">to</span>
                  <Input 
                    type="date" 
                    className="h-11 rounded-xl border-gray-200 bg-white shadow-sm w-full sm:w-auto"
                    value={customRange.to ? format(customRange.to, 'yyyy-MM-dd') : ''}
                    onChange={(e) => setCustomRange(prev => ({ ...prev, to: e.target.value ? new Date(e.target.value) : undefined }))}
                  />
                </div>
              )}
            </div>

            <Button variant="outline" className="h-11 px-4 rounded-xl border-gray-200 bg-white shadow-sm transition-all hover:bg-gray-50 w-full sm:w-auto" onClick={() => window.print()}>
              <Download size={18} className="mr-2 text-gray-500" />
              Export
            </Button>
          </div>
        </div>

        {/* Report Period Display */}
        <div className="flex items-center gap-2 text-sm font-medium text-gray-500 bg-gray-50 w-fit px-4 py-2 rounded-full border border-gray-100">
          <CalendarIcon size={14} className="text-blue-600" />
          <span>Report Period:</span>
          <span className="text-gray-900 font-bold">
            {selectedMonth === 'custom' 
              ? `${customRange.from ? format(customRange.from, 'MMM dd, yyyy') : '...'} - ${customRange.to ? format(customRange.to, 'MMM dd, yyyy') : '...'}`
              : `${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`}
          </span>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <Card key={idx} className="border-none shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={`${stat.bg} ${stat.color} rounded-2xl p-3`}>
                      <Icon size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                      <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Revenue Trend */}
          <Card className="lg:col-span-2 border-none shadow-sm overflow-hidden">
            <CardHeader className="border-b border-gray-50 pb-4">
              <CardTitle className="text-lg font-bold text-gray-900 font-heading">Revenue Trend</CardTitle>
              <CardDescription>Income over the selected period</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px] pt-6">
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#64748b' }} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#64748b' }}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#2563eb" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-gray-400">
                  Select a wider range to see trends
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="border-b border-gray-50 pb-4">
              <CardTitle className="text-lg font-bold text-gray-900 font-heading">Payment Methods</CardTitle>
              <CardDescription>Breakdown by channel</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px] pt-6">
              {paymentMethodData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentMethodData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {paymentMethodData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-gray-400">
                  No payment data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Treatment Report */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="border-b border-gray-50 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-gray-900 font-heading flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-blue-600" /> Treatment Performance
                </CardTitle>
                <CardDescription>Revenue and volume by procedure</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Treatment Name</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Cases</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Revenue</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {treatmentData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-bold text-gray-900">{item.name}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-none font-bold">
                          {item.count}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900">
                        {clinic?.currency}{item.revenue.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <span className="text-xs font-bold text-gray-400">
                            {Math.round((item.revenue / totalRevenue) * 100)}%
                          </span>
                          <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-600 rounded-full" 
                              style={{ width: `${(item.revenue / totalRevenue) * 100}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {treatmentData.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                        No treatment data found for this period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Payment Breakdown Details */}
        <div className="grid gap-6 sm:grid-cols-3">
          <Card className="border-none shadow-sm bg-green-600 text-white">
            <CardContent className="p-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-80 mb-1">Total Collected</p>
              <h3 className="text-3xl font-black">{clinic?.currency}{(paidAmount + partialAmount).toLocaleString()}</h3>
              <div className="mt-4 pt-4 border-t border-white/10 flex justify-between text-[10px] font-bold uppercase tracking-widest opacity-70">
                <span>Fully Paid: {clinic?.currency}{paidAmount.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-orange-500 text-white">
            <CardContent className="p-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-80 mb-1">Total Pending</p>
              <h3 className="text-3xl font-black">{clinic?.currency}{unpaidAmount.toLocaleString()}</h3>
              <div className="mt-4 pt-4 border-t border-white/10 flex justify-between text-[10px] font-bold uppercase tracking-widest opacity-70">
                <span>Includes partial balances</span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-gray-900 text-white">
            <CardContent className="p-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-80 mb-1">Total Billed</p>
              <h3 className="text-3xl font-black">{clinic?.currency}{totalRevenue.toLocaleString()}</h3>
              <div className="mt-4 pt-4 border-t border-white/10 flex justify-between text-[10px] font-bold uppercase tracking-widest opacity-70">
                <span>Gross Value</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
