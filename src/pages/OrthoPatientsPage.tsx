import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useClinic } from '../contexts/ClinicContext';
import { useAuth } from '../contexts/AuthContext';
import { handleFirestoreError } from '../lib/error-handler';
import AppLayout from '../components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Search, 
  MessageCircle, 
  FileText, 
  Calendar, 
  UserPlus, 
  Loader2, 
  Filter,
  Users,
  TrendingUp,
  Clock,
  ChevronRight,
  User,
  Activity
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { toast } from 'sonner';
import { OrthoPatient } from '../types';
import { format, addMonths, addDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn, getWhatsAppUrl, ensureDate } from '@/lib/utils';
import { useLocation, useNavigate } from 'react-router-dom';

export default function OrthoPatientsPage() {
  const { clinic } = useClinic();
  const { user, isDemo } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [patients, setPatients] = useState<OrthoPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'upcoming'>('active');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    patientName: '',
    mobileNumber: '',
    age: '',
    gender: 'male' as const,
    startDate: format(new Date(), 'yyyy-MM-dd'),
    treatmentPlan: '',
    totalAmount: '',
    monthlyInstallment: '',
    amountPaid: '0',
    nextAppointmentDate: format(addMonths(new Date(), 1), 'yyyy-MM-dd'),
    notes: '',
    status: 'active' as const
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('new') === 'true') {
      setIsAddModalOpen(true);
    }
  }, [location.search]);

  useEffect(() => {
    if (!clinic?.id || isDemo) {
      if (isDemo) {
        // Sample data for demo
        const demoPatients: OrthoPatient[] = [
          {
            id: 'demo-1',
            clinicId: 'demo-clinic',
            ownerId: 'demo-user',
            patientName: 'Karan Mehra',
            mobileNumber: '9988776655',
            age: 24,
            gender: 'male',
            startDate: new Date(),
            treatmentPlan: 'Metal Braces - Grade II Malocclusion',
            totalAmount: 35000,
            monthlyInstallment: 2500,
            amountPaid: 15000,
            remainingAmount: 20000,
            nextAppointmentDate: addMonths(new Date(), 1),
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'demo-2',
            clinicId: 'demo-clinic',
            ownerId: 'demo-user',
            patientName: 'Sneha Rao',
            mobileNumber: '9911223344',
            age: 19,
            gender: 'female',
            startDate: addMonths(new Date(), -3),
            treatmentPlan: 'Ceramic Braces - Space Closure',
            totalAmount: 45000,
            monthlyInstallment: 3000,
            amountPaid: 45000,
            remainingAmount: 0,
            nextAppointmentDate: addMonths(new Date(), 1),
            status: 'completed',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];
        setPatients(demoPatients);
        setLoading(false);
      }
      return;
    }

    const patientsQuery = query(
      collection(db, 'orthoPatients'),
      where('clinicId', '==', clinic.id),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(patientsQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startDate: ensureDate(doc.data().startDate),
        nextAppointmentDate: ensureDate(doc.data().nextAppointmentDate),
        createdAt: ensureDate(doc.data().createdAt),
        updatedAt: ensureDate(doc.data().updatedAt)
      })) as OrthoPatient[];
      setPatients(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, 'list', 'orthoPatients');
      setLoading(false);
    });

    return unsubscribe;
  }, [clinic?.id, isDemo]);

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinic?.id || isDemo) {
      if (isDemo) toast.info("Adding patients is disabled in demo mode");
      return;
    }

    setSubmitting(true);
    try {
      const total = parseFloat(formData.totalAmount);
      const paid = parseFloat(formData.amountPaid);
      const remaining = total - paid;
      const initialStatus = remaining <= 0 ? 'completed' : formData.status;

      const patientData = {
        clinicId: clinic.id,
        ownerId: user?.uid,
        patientName: formData.patientName,
        mobileNumber: formData.mobileNumber,
        age: parseInt(formData.age) || 0,
        gender: formData.gender,
        startDate: new Date(formData.startDate),
        treatmentPlan: formData.treatmentPlan,
        totalAmount: total,
        monthlyInstallment: parseFloat(formData.monthlyInstallment) || 0,
        amountPaid: paid,
        remainingAmount: remaining,
        nextAppointmentDate: new Date(formData.nextAppointmentDate),
        notes: formData.notes,
        status: initialStatus,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const patientRef = await addDoc(collection(db, 'orthoPatients'), patientData);
      
      // If initial payment was made, record it as a visit too so it shows in reports/revenue
      if (paid > 0) {
        await addDoc(collection(db, `orthoPatients/${patientRef.id}/visits`), {
          clinicId: clinic.id,
          ownerId: user?.uid,
          visitDate: new Date(formData.startDate),
          amountPaid: paid,
          progressNote: 'Initial payment and treatment start',
          nextAppointmentDate: new Date(formData.nextAppointmentDate),
          remarks: 'Automated record from patient creation',
          createdAt: serverTimestamp()
        });
      }

      toast.success('Ortho patient added successfully');
      setIsAddModalOpen(false);
      // Reset form
      setFormData({
        patientName: '',
        mobileNumber: '',
        age: '',
        gender: 'male',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        treatmentPlan: '',
        totalAmount: '',
        monthlyInstallment: '',
        amountPaid: '0',
        nextAppointmentDate: format(addMonths(new Date(), 1), 'yyyy-MM-dd'),
        notes: '',
        status: 'active'
      });
    } catch (error) {
      console.error("Error adding ortho patient:", error);
      handleFirestoreError(error, 'write', 'orthoPatients');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWhatsAppReminder = (patient: OrthoPatient, isUpcoming = false) => {
    const nextDate = format(ensureDate(patient.nextAppointmentDate), 'MMM dd, yyyy');
    const message = isUpcoming 
      ? `Reminder: Hello ${patient.patientName}, you have an appointment scheduled for ${nextDate}. Looking forward to seeing you! - ${clinic?.name || 'our clinic'}`
      : `Hello ${patient.patientName}, your next ortho appointment is on ${nextDate}. Please visit the clinic on time. - ${clinic?.name || 'our clinic'}`;
    window.open(getWhatsAppUrl(patient.mobileNumber, message), '_blank');
  };

  const filteredPatients = patients.filter(p => {
    const matchesSearch = p.patientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         p.mobileNumber.includes(searchQuery);
    
    if (statusFilter === 'upcoming') {
      if (p.status !== 'active') return false;
      const nextDate = ensureDate(p.nextAppointmentDate);
      const today = startOfDay(new Date());
      const threeDaysFromNow = endOfDay(addDays(today, 3));
      return matchesSearch && isWithinInterval(nextDate, { start: today, end: threeDaysFromNow });
    }

    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: patients.length,
    active: patients.filter(p => p.status === 'active').length,
    revenue: patients.reduce((sum, p) => sum + p.amountPaid, 0),
    pending: patients.reduce((sum, p) => sum + p.remainingAmount, 0)
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Ortho Patients</h1>
            <p className="text-gray-500">Manage braces cases and monthly updates</p>
          </div>
          
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger className={cn(buttonVariants({ variant: 'default' }), "bg-blue-600 hover:bg-blue-700 h-11 px-6 rounded-xl shadow-lg shadow-blue-100")}>
              <UserPlus className="mr-2 h-5 w-5" /> New Ortho Patient
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">Add New Ortho Patient</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddPatient} className="space-y-6 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="patientName">Patient Name *</Label>
                    <Input 
                      id="patientName" 
                      required 
                      value={formData.patientName}
                      onChange={(e) => setFormData({...formData, patientName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mobileNumber">Mobile Number *</Label>
                    <Input 
                      id="mobileNumber" 
                      required 
                      value={formData.mobileNumber}
                      onChange={(e) => setFormData({...formData, mobileNumber: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input 
                      id="age" 
                      type="number" 
                      value={formData.age}
                      onChange={(e) => setFormData({...formData, age: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Select value={formData.gender} onValueChange={(v: any) => setFormData({...formData, gender: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input 
                      id="startDate" 
                      type="date" 
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="treatmentPlan">Treatment Plan *</Label>
                    <Input 
                      id="treatmentPlan" 
                      required 
                      placeholder="e.g. Metal Braces"
                      value={formData.treatmentPlan}
                      onChange={(e) => setFormData({...formData, treatmentPlan: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="totalAmount">Total Treatment Amount ({clinic?.currency}) *</Label>
                    <Input 
                      id="totalAmount" 
                      type="number" 
                      required 
                      value={formData.totalAmount}
                      onChange={(e) => setFormData({...formData, totalAmount: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="monthlyInstallment">Monthly Installment ({clinic?.currency})</Label>
                    <Input 
                      id="monthlyInstallment" 
                      type="number" 
                      value={formData.monthlyInstallment}
                      onChange={(e) => setFormData({...formData, monthlyInstallment: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amountPaid">Initial Amount Paid ({clinic?.currency})</Label>
                    <Input 
                      id="amountPaid" 
                      type="number" 
                      value={formData.amountPaid}
                      onChange={(e) => setFormData({...formData, amountPaid: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nextAppointmentDate">Next Appointment</Label>
                    <Input 
                      id="nextAppointmentDate" 
                      type="date" 
                      value={formData.nextAppointmentDate}
                      onChange={(e) => setFormData({...formData, nextAppointmentDate: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Patient Status</Label>
                    <Select value={formData.status} onValueChange={(v: any) => setFormData({...formData, status: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Clinical Notes</Label>
                  <textarea 
                    id="notes"
                    className="w-full min-h-[100px] rounded-xl border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={submitting}>
                    {submitting ? <Loader2 className="animate-spin" /> : 'Save Patient'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-none shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Users size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Total Ortho</p>
                  <p className="text-xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                  <Activity size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Active Cases</p>
                  <p className="text-xl font-bold">{stats.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Collection</p>
                  <p className="text-xl font-bold">{clinic?.currency}{stats.revenue.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Pending Due</p>
                  <p className="text-xl font-bold">{clinic?.currency}{stats.pending.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and List */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <Input 
                placeholder="Search patient or mobile..." 
                className="pl-10 h-11 rounded-xl bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter size={18} className="text-gray-400" />
              <div className="flex bg-white rounded-xl border p-1 w-full sm:w-auto">
                {(['all', 'active', 'completed', 'upcoming'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setStatusFilter(filter)}
                    className={cn(
                      "px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                      statusFilter === filter 
                        ? "bg-blue-600 text-white shadow-sm" 
                        : "text-gray-500 hover:text-gray-700"
                    )}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 text-xs font-bold text-gray-400 uppercase tracking-widest border-b">
                  <th className="px-6 py-4">Patient</th>
                  <th className="px-6 py-4">Next Visit</th>
                  <th className="px-6 py-4">Financials</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-gray-400 font-medium">
                      No ortho patients found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredPatients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-gray-50/50 transition-colors group cursor-pointer" onClick={() => navigate(`/ortho/${patient.id}`)}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                            {patient.patientName[0]}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{patient.patientName}</p>
                            <p className="text-xs text-gray-500">{patient.mobileNumber}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm font-medium">
                          <Calendar size={14} className="text-gray-400" />
                          {format(ensureDate(patient.nextAppointmentDate), 'dd MMM yyyy')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-gray-900">Paid: {clinic?.currency}{patient.amountPaid.toLocaleString()}</p>
                          <div className="h-1 w-24 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-green-500" 
                              style={{ width: `${Math.min(100, (patient.amountPaid / patient.totalAmount) * 100)}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-gray-400">Due: {clinic?.currency}{patient.remainingAmount.toLocaleString()}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "px-2 py-0.5 rounded-lg border-none uppercase text-[10px] font-bold tracking-wider",
                            patient.status === 'active' ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-600"
                          )}
                        >
                          {patient.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleWhatsAppReminder(patient, statusFilter === 'upcoming');
                            }}
                            className="h-9 w-9 text-green-600 hover:bg-green-50 rounded-xl"
                            title="Send WhatsApp Reminder"
                          >
                            <MessageCircle size={18} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-9 w-9 text-blue-600 hover:bg-blue-50 rounded-xl"
                            title="View Patient Record"
                          >
                            <FileText size={18} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
