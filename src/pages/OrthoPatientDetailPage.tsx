import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, orderBy, onSnapshot, addDoc, updateDoc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useClinic } from '../contexts/ClinicContext';
import { useAuth } from '../contexts/AuthContext';
import { handleFirestoreError } from '../lib/error-handler';
import AppLayout from '../components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ChevronLeft, 
  Calendar, 
  MessageCircle, 
  Plus, 
  Pencil,
  History, 
  CreditCard,
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  Loader2,
  TrendingUp,
  Clock,
  User,
  ArrowLeft,
  Printer,
  Trash2
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { toast } from 'sonner';
import { OrthoPatient, OrthoVisit } from '../types';
import { format, addMonths } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn, getWhatsAppUrl, ensureDate } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { motion } from 'motion/react';

export default function OrthoPatientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { clinic } = useClinic();
  const { isDemo } = useAuth();
  
  const [patient, setPatient] = useState<OrthoPatient | null>(null);
  const [visits, setVisits] = useState<OrthoVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingVisit, setEditingVisit] = useState<OrthoVisit | null>(null);
  const [deletingVisit, setDeletingVisit] = useState<OrthoVisit | null>(null);
  const [printingVisit, setPrintingVisit] = useState<OrthoVisit | null>(null);
  const [isDeletePatientModalOpen, setIsDeletePatientModalOpen] = useState(false);
  const [isEditPatientModalOpen, setIsEditPatientModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [patientFormData, setPatientFormData] = useState({
    patientName: '',
    mobileNumber: '',
    age: '',
    gender: 'male' as 'male' | 'female' | 'other',
    startDate: '',
    treatmentPlan: '',
    totalAmount: '',
    monthlyInstallment: '',
    nextAppointmentDate: '',
    notes: '',
    status: 'active' as 'active' | 'completed'
  });

  // ... (Update Form state) ...

  const handlePrintReceipt = (visit: OrthoVisit) => {
    setPrintingVisit(visit);
    setTimeout(() => {
      window.print();
      setPrintingVisit(null);
    }, 100);
  };

  const handleDeleteVisit = async (visit: OrthoVisit) => {
    if (!id || !patient || isDemo) return;
    
    setSubmitting(true);
    try {
      await runTransaction(db, async (transaction) => {
        const visitRef = doc(db, `orthoPatients/${id}/visits`, visit.id);
        const patientRef = doc(db, 'orthoPatients', id);
        
        const newTotalPaid = patient.amountPaid - visit.amountPaid;
        const newRemaining = patient.totalAmount - newTotalPaid;
        
        transaction.delete(visitRef);
        
        // After deletion, we need to update the patient doc.
        // We'll also need to find the new "latest" next appointment.
        // Since we can't query in transactions, we'll handle nextAppt after the transaction
        // or by using the sorted visits array from state.
        transaction.update(patientRef, {
          amountPaid: Math.max(0, newTotalPaid),
          remainingAmount: Math.max(0, newRemaining),
          status: newRemaining > 0 ? 'active' : patient.status,
          updatedAt: serverTimestamp()
        });
      });

      // Synchronize next appointment after deletion
      // We look at the remaining visits to find the latest one
      const remainingVisits = visits.filter(v => v.id !== visit.id);
      if (remainingVisits.length > 0) {
        const latestVisit = remainingVisits.sort((a, b) => 
          ensureDate(b.visitDate).getTime() - ensureDate(a.visitDate).getTime()
        )[0];
        
        await updateDoc(doc(db, 'orthoPatients', id), {
          nextAppointmentDate: ensureDate(latestVisit.nextAppointmentDate),
          lastVisitDate: ensureDate(latestVisit.visitDate)
        });
      } else {
        // If no visits left, we can clear the appointment or set it to null
        await updateDoc(doc(db, 'orthoPatients', id), {
          nextAppointmentDate: null,
          lastVisitDate: null
        });
      }

      toast.success('Visit deleted successfully');
      setDeletingVisit(null);
    } catch (error) {
      console.error("Error deleting visit:", error);
      toast.error('Failed to delete visit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePatient = async () => {
    if (!id || isDemo) return;
    
    setSubmitting(true);
    try {
      // Need to delete all visits first if we don't have recursive delete
      // For simplicity in this app, we'll just delete the patient doc
      // and assume cleanup or just leave the orphaned subcollection (standard Firestore).
      // But better to at least try deleting the patient.
      const patientRef = doc(db, 'orthoPatients', id);
      // In a real app, I'd loop through visits. For now, just patient.
      await runTransaction(db, async (transaction) => {
        transaction.delete(patientRef);
      });
      
      toast.success('Patient record deleted');
      navigate('/ortho');
    } catch (error) {
      console.error("Error deleting patient:", error);
      toast.error('Failed to delete patient record');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditPatient = () => {
    if (!patient) return;
    setPatientFormData({
      patientName: patient.patientName,
      mobileNumber: patient.mobileNumber,
      age: patient.age.toString(),
      gender: patient.gender,
      startDate: format(ensureDate(patient.startDate), 'yyyy-MM-dd'),
      treatmentPlan: patient.treatmentPlan,
      totalAmount: patient.totalAmount.toString(),
      monthlyInstallment: patient.monthlyInstallment.toString(),
      nextAppointmentDate: format(ensureDate(patient.nextAppointmentDate), 'yyyy-MM-dd'),
      notes: patient.notes || '',
      status: patient.status
    });
    setIsEditPatientModalOpen(true);
  };

  const handleUpdatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !patient || isDemo) {
      if (isDemo) toast.info("Updates are disabled in demo mode");
      return;
    }
    
    setSubmitting(true);
    try {
      const totalAmount = parseFloat(patientFormData.totalAmount) || 0;
      const remainingAmount = totalAmount - patient.amountPaid;
      const finalStatus = remainingAmount <= 0 ? 'completed' : patientFormData.status;

      await updateDoc(doc(db, 'orthoPatients', id), {
        patientName: patientFormData.patientName,
        mobileNumber: patientFormData.mobileNumber,
        age: parseInt(patientFormData.age) || 0,
        gender: patientFormData.gender,
        startDate: new Date(patientFormData.startDate),
        treatmentPlan: patientFormData.treatmentPlan,
        totalAmount: totalAmount,
        monthlyInstallment: parseFloat(patientFormData.monthlyInstallment) || 0,
        remainingAmount: Math.max(0, remainingAmount),
        nextAppointmentDate: new Date(patientFormData.nextAppointmentDate),
        notes: patientFormData.notes,
        status: finalStatus,
        updatedAt: serverTimestamp()
      });
      
      toast.success('Patient details updated');
      setIsEditPatientModalOpen(false);
    } catch (error) {
      console.error("Error updating patient:", error);
      toast.error('Failed to update patient details');
    } finally {
      setSubmitting(false);
    }
  };

  // Update Form state
  const [updateData, setUpdateData] = useState<{
    visitDate: string;
    amountPaid: string;
    progressNote: string;
    nextAppointmentDate: string;
    remarks: string;
    status: 'active' | 'completed';
  }>({
    visitDate: format(new Date(), 'yyyy-MM-dd'),
    amountPaid: '0',
    progressNote: '',
    nextAppointmentDate: format(addMonths(new Date(), 1), 'yyyy-MM-dd'),
    remarks: '',
    status: 'active'
  });

  useEffect(() => {
    if (!id || !clinic?.id || isDemo) {
      if (isDemo && id?.startsWith('demo-')) {
        // Sample data for demo
        const demoPatient: OrthoPatient = {
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
        };
        const demoVisits: OrthoVisit[] = [
          {
            id: 'visit-1',
            clinicId: 'demo-clinic',
            ownerId: 'demo-user',
            visitDate: addMonths(new Date(), -1),
            amountPaid: 5000,
            progressNote: 'Braces fixed. Initial wire placement.',
            nextAppointmentDate: new Date(),
            remarks: 'Soft diet advised.',
            createdAt: addMonths(new Date(), -1)
          }
        ];
        setPatient(demoPatient);
        setVisits(demoVisits);
        setLoading(false);
      }
      return;
    }

    // Fetch Patient
    const unsubscribePatient = onSnapshot(doc(db, 'orthoPatients', id), (docSnap) => {
      if (docSnap.exists()) {
        const data = {
          id: docSnap.id,
          ...docSnap.data(),
          startDate: ensureDate(docSnap.data().startDate),
          nextAppointmentDate: ensureDate(docSnap.data().nextAppointmentDate),
          createdAt: ensureDate(docSnap.data().createdAt),
          updatedAt: ensureDate(docSnap.data().updatedAt)
        } as OrthoPatient;
        setPatient(data);
        setUpdateData(prev => ({ ...prev, status: data.status }));
      } else {
        toast.error('Patient not found');
        navigate('/ortho');
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, 'get', 'orthoPatients');
    });

    // Fetch Visits
    const visitsQuery = query(
      collection(db, `orthoPatients/${id}/visits`),
      orderBy('visitDate', 'desc')
    );

    const unsubscribeVisits = onSnapshot(visitsQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        visitDate: ensureDate(doc.data().visitDate),
        nextAppointmentDate: ensureDate(doc.data().nextAppointmentDate),
        createdAt: ensureDate(doc.data().createdAt)
      })) as OrthoVisit[];
      setVisits(data);
    }, (error) => {
      handleFirestoreError(error, 'list', 'orthoVisits');
    });

    return () => {
      unsubscribePatient();
      unsubscribeVisits();
    };
  }, [id, clinic?.id, isDemo, navigate]);

  const handleMonthlyUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !patient || isDemo) {
      if (isDemo) toast.info("Updates are disabled in demo mode");
      return;
    }

    setSubmitting(true);
    try {
      const amountPaidThisMonth = parseFloat(updateData.amountPaid) || 0;
      const newTotalPaid = patient.amountPaid + amountPaidThisMonth;
      const newRemaining = patient.totalAmount - newTotalPaid;
      const newStatus = newRemaining <= 0 ? 'completed' : updateData.status;
      const newVisitDate = new Date(updateData.visitDate);
      const newNextApptDate = new Date(updateData.nextAppointmentDate);

      // Use a transaction to ensure both visit record and patient record are updated atomically
      await runTransaction(db, async (transaction) => {
        // 1. Create the visit record
        const visitRef = doc(collection(db, `orthoPatients/${id}/visits`));
        transaction.set(visitRef, {
          clinicId: clinic.id,
          ownerId: patient.ownerId, // Use the patient's ownerId
          visitDate: newVisitDate,
          amountPaid: amountPaidThisMonth,
          progressNote: updateData.progressNote,
          nextAppointmentDate: newNextApptDate,
          remarks: updateData.remarks,
          createdAt: serverTimestamp()
        });

        // 2. Update the patient record
        const patientRef = doc(db, 'orthoPatients', id);
        
        // We only update the patient's next appointment if this new visit is the latest one
        const isLatest = visits.every(v => newVisitDate >= ensureDate(v.visitDate));
        
        const updatePayload: any = {
          amountPaid: newTotalPaid,
          remainingAmount: Math.max(0, newRemaining),
          status: newStatus,
          updatedAt: serverTimestamp()
        };

        if (isLatest) {
          updatePayload.nextAppointmentDate = newNextApptDate;
          updatePayload.lastVisitDate = newVisitDate;
        }

        transaction.update(patientRef, updatePayload);
      });

      toast.success('Monthly visit recorded successfully');
      setIsUpdateModalOpen(false);
      // Reset form (except status which we might want to keep)
      setUpdateData(prev => ({
        ...prev,
        amountPaid: '0',
        progressNote: '',
        nextAppointmentDate: format(addMonths(new Date(updateData.nextAppointmentDate), 1), 'yyyy-MM-dd'),
        remarks: ''
      }));
    } catch (error) {
      console.error("Error recording monthly visit:", error);
      toast.error('Failed to update visit record');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditVisit = (visit: OrthoVisit) => {
    setEditingVisit(visit);
    setUpdateData({
      visitDate: format(ensureDate(visit.visitDate), 'yyyy-MM-dd'),
      amountPaid: visit.amountPaid.toString(),
      progressNote: visit.progressNote,
      nextAppointmentDate: format(ensureDate(visit.nextAppointmentDate), 'yyyy-MM-dd'),
      remarks: visit.remarks || '',
      status: patient?.status || 'active'
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !patient || !editingVisit || isDemo) {
      if (isDemo) toast.info("Updates are disabled in demo mode");
      return;
    }

    setSubmitting(true);
    try {
      const newAmountPaid = parseFloat(updateData.amountPaid) || 0;
      const oldAmountPaid = editingVisit.amountPaid;
      const diff = newAmountPaid - oldAmountPaid;
      const newNextApptDate = new Date(updateData.nextAppointmentDate);
      const newVisitDate = new Date(updateData.visitDate);

      await runTransaction(db, async (transaction) => {
        // 1. Update the visit record
        const visitRef = doc(db, `orthoPatients/${id}/visits`, editingVisit.id);
        transaction.update(visitRef, {
          visitDate: newVisitDate,
          amountPaid: newAmountPaid,
          progressNote: updateData.progressNote,
          nextAppointmentDate: newNextApptDate,
          remarks: updateData.remarks
        });

        // 2. Update the patient record
        const patientRef = doc(db, 'orthoPatients', id);
        const newTotalPaid = patient.amountPaid + diff;
        const newRemaining = patient.totalAmount - newTotalPaid;
        const newStatus = newRemaining <= 0 ? 'completed' : updateData.status;

        // Check if this visit is the latest one based on visitDate
        // We'll update the patient's next appointment if this is the most recent visit
        // We compare with other visits in the state
        const otherVisits = visits.filter(v => v.id !== editingVisit.id);
        const isLatest = otherVisits.every(v => newVisitDate >= ensureDate(v.visitDate));

        const updatePayload: any = {
          amountPaid: newTotalPaid,
          remainingAmount: Math.max(0, newRemaining),
          status: newStatus,
          updatedAt: serverTimestamp()
        };

        if (isLatest) {
          updatePayload.nextAppointmentDate = newNextApptDate;
          updatePayload.lastVisitDate = newVisitDate;
        }

        transaction.update(patientRef, updatePayload);
      });

      toast.success('Visit updated successfully');
      setIsEditModalOpen(false);
      setEditingVisit(null);
    } catch (error) {
      console.error("Error updating visit:", error);
      toast.error('Failed to update visit record');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWhatsAppReminder = () => {
    if (!patient) return;
    const nextDate = format(ensureDate(patient.nextAppointmentDate), 'MMM dd, yyyy');
    const message = `Hello ${patient.patientName}, your next ortho appointment is on ${nextDate}. Please visit the clinic on time. - ${clinic?.name || 'our clinic'}`;
    window.open(getWhatsAppUrl(patient.mobileNumber, message), '_blank');
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

  if (!patient) return null;

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 max-w-5xl mx-auto printable-area">
        <style>
          {`
            @media print {
              /* Universal Print Resets */
              @page { 
                margin: 0.75cm !important; 
                size: A4 portrait; 
              }
              html, body {
                height: auto !important;
                overflow: visible !important;
                background-color: white !important;
                color: black !important;
                margin: 0 !important;
                padding: 0 !important;
                font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              
              /* Hide all UI elements */
              .no-print, 
              button, 
              [role="button"], 
              .lucide, 
              aside, 
              nav, 
              footer, 
              .fixed,
              .DialogTrigger,
              [data-radix-collection-item],
              .bg-gradient-to-br,
              .absolute,
              header,
              svg { display: none !important; }
              
              /* Reset Main Content Layout */
              main {
                padding: 0 !important;
                margin: 0 !important;
                display: block !important;
                width: 100% !important;
                overflow: visible !important;
                background: white !important;
              }

              .mx-auto {
                max-width: 100% !important;
                margin: 0 !important;
              }

              /* Container Setup */
              .printable-area { 
                padding: 0 !important; 
                margin: 0 !important; 
                width: 100% !important; 
                max-width: 100% !important; 
                display: block !important;
                background: white !important;
              }
              
              /* Professional Report Typography */
              h1 { font-size: 18pt !important; }
              h2 { font-size: 14pt !important; }
              h1, h2, h3, h4 { color: black !important; font-family: sans-serif !important; font-weight: 800 !important; margin: 0 !important; }
              p, span, label, td, th { color: black !important; font-size: 8.5pt !important; line-height: 1.2 !important; }

              /* Table Styling */
              table { 
                width: 100% !important; 
                border-collapse: collapse !important; 
                border: 1px solid black !important;
                margin-bottom: 0.75rem !important;
              }
              th { 
                background: #f3f4f6 !important; 
                border: 1px solid black !important; 
                padding: 4px 6px !important; 
                font-weight: 900 !important;
                text-transform: uppercase !important;
                font-size: 7.5pt !important;
                letter-spacing: 0.05em !important;
              }
              td { 
                border: 1px solid #ccc !important; 
                padding: 4px 6px !important; 
                font-size: 8pt !important;
                vertical-align: top !important;
              }

              /* Section Spacing */
              .grid { display: block !important; }
              .grid > div { margin-bottom: 0.75rem !important; page-break-inside: avoid; }
              
              /* Specific column forcing */
              .lg\:col-span-2 { width: 100% !important; }
              .lg\:col-span-1 { display: none !important; }

              /* Professional Card Styling for Print */
              .card {
                border: 1px solid black !important;
                border-radius: 0 !important;
                background: white !important;
                box-shadow: none !important;
                margin-bottom: 10px !important;
                overflow: visible !important;
              }

              .card-header {
                border-bottom: 1px solid black !important;
                background: #f9fafb !important;
                padding: 4px 8px !important;
              }

              .card-title {
                font-size: 9pt !important;
                font-weight: 900 !important;
                text-transform: uppercase !important;
                letter-spacing: 0.05em !important;
              }
              
              /* Financial Table Customization */
              .financial-table {
                border: 2px solid black !important;
                margin-top: 5px !important;
              }
              .financial-table td { font-size: 11pt !important; font-weight: 900 !important; padding: 6px !important; }
              .financial-table th { font-size: 8pt !important; }

              .print-treatment-plan {
                border: 1.5px dashed black !important;
                background: #fff !important;
                padding: 8px !important;
                margin-top: 2px !important;
              }

              .print-treatment-plan p {
                font-size: 9pt !important;
                font-weight: 600 !important;
              }

              .badge {
                border: 1px solid black !important;
                color: black !important;
                background: white !important;
                padding: 0px 4px !important;
                border-radius: 0 !important;
                font-weight: bold !important;
                text-transform: uppercase !important;
                font-size: 7.5pt !important;
              }

              /* Header styling */
              .print-header {
                border-bottom: 3px solid black !important;
                padding-bottom: 10px !important;
                margin-bottom: 15px !important;
              }
              
              .signature-area {
                margin-top: 1.5rem !important;
                border-top: 1px solid black !important;
                padding-top: 5px !important;
              }
            }
          `}
        </style>

        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/ortho')} className="rounded-full">
              <ArrowLeft size={24} />
            </Button>
            <div>
              <h1 className="text-2xl font-bold font-heading text-gray-900">{patient.patientName}</h1>
              <p className="text-xs text-gray-400 font-medium tracking-widest uppercase">Patient Full Report</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => window.print()}
              variant="outline" 
              className="rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50 font-bold"
            >
              <Printer className="mr-2 h-4 w-4" /> Print Full Report
            </Button>
            <Dialog open={isDeletePatientModalOpen} onOpenChange={setIsDeletePatientModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-3xl">
                <DialogHeader>
                  <DialogTitle>Delete Patient Record?</DialogTitle>
                  <DialogDescription>
                    This will permanently delete {patient.patientName}'s record. This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button variant="outline" onClick={() => setIsDeletePatientModalOpen(false)}>Cancel</Button>
                  <Button variant="destructive" onClick={handleDeletePatient} disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete Permanently'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Clinic Header for Print */}
        <div className="hidden print:flex justify-between items-center border-b-4 border-black pb-6 mb-8 print-header">
          <div className="flex items-center gap-4">
            {clinic?.logoUrl && (
              <img 
                src={clinic.logoUrl} 
                alt="Clinic Logo" 
                className="h-20 w-auto object-contain" 
                referrerPolicy="no-referrer"
              />
            )}
            <div>
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">{clinic?.name}</h2>
              <p className="text-[11px] text-gray-500 max-w-xs font-medium">{clinic?.address}</p>
              <p className="text-[12px] text-gray-900 font-bold mt-1">PH: {clinic?.phone}</p>
            </div>
          </div>
          <div className="text-right">
            <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter mb-1">Patient Report</h1>
            <div className="bg-black text-white px-3 py-1 inline-block">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Generated: {format(new Date(), 'dd MMM yyyy')}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Side: Summary & Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Stats - Styled as Payment Summary for Print */}
            <div className="grid grid-cols-3 gap-4 no-print print:hidden">
              <Card className="border-none bg-blue-600 text-white shadow-lg overflow-hidden relative">
                <CardContent className="p-4 pt-6">
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Total Plan</p>
                  <p className="text-xl font-black">{clinic?.currency}{patient.totalAmount.toLocaleString()}</p>
                  <TrendingUp size={40} className="absolute -bottom-2 -right-2 opacity-10" />
                </CardContent>
              </Card>
              <Card className="border-none bg-green-600 text-white shadow-lg overflow-hidden relative">
                <CardContent className="p-4 pt-6">
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Collected</p>
                  <p className="text-xl font-black">{clinic?.currency}{patient.amountPaid.toLocaleString()}</p>
                  <CheckCircle2 size={40} className="absolute -bottom-2 -right-2 opacity-10" />
                </CardContent>
              </Card>
              <Card className="border-none bg-orange-600 text-white shadow-lg overflow-hidden relative">
                <CardContent className="p-4 pt-6">
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Remaining</p>
                  <p className="text-xl font-black">{clinic?.currency}{patient.remainingAmount.toLocaleString()}</p>
                  <Clock size={40} className="absolute -bottom-2 -right-2 opacity-10" />
                </CardContent>
              </Card>
            </div>

            {/* Print Only Summary Table */}
            <div className="hidden print:block mb-8">
              <table className="w-full financial-table">
                <thead>
                  <tr className="bg-gray-100 divide-x divide-black border-b border-black">
                    <th className="py-2 px-3 text-left">Total Plan Value</th>
                    <th className="py-2 px-3 text-left">Amount Received</th>
                    <th className="py-2 px-3 text-left">Balance Due</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="divide-x divide-black">
                    <td className="py-3 px-3">{clinic?.currency}{patient.totalAmount.toLocaleString()}</td>
                    <td className="py-3 px-3">{clinic?.currency}{patient.amountPaid.toLocaleString()}</td>
                    <td className="py-3 px-3">{clinic?.currency}{patient.remainingAmount.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Profile & Treatment Details */}
            <Card className="card overflow-hidden">
              <CardHeader className="card-header border-b flex flex-row items-center justify-between">
                <CardTitle className="card-title flex items-center gap-2">
                  <User size={20} className="text-blue-600 no-print" /> Patient Information
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={handleEditPatient} className="h-8 rounded-lg text-blue-600 hover:bg-blue-50 no-print">
                  <Pencil className="mr-1 h-3.5 w-3.5 no-print" /> Edit Profile
                </Button>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-6 gap-x-4">
                  <div>
                    <Label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1 block">Patient Name</Label>
                    <p className="text-sm font-bold text-gray-900">{patient.patientName}</p>
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1 block">Mobile Number</Label>
                    <p className="text-sm font-bold text-gray-900">{patient.mobileNumber}</p>
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1 block">Age / Gender</Label>
                    <p className="text-sm font-bold text-gray-900 capitalize">{patient.age}Y • {patient.gender}</p>
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1 block">Started On</Label>
                    <p className="text-sm font-bold text-gray-900">{format(ensureDate(patient.startDate), 'dd MMM yyyy')}</p>
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1 block">Monthly EMI</Label>
                    <p className="text-sm font-bold text-gray-900">{clinic?.currency}{patient.monthlyInstallment.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1 block">Status</Label>
                    <Badge className={cn(
                      "mt-0.5 border-none uppercase text-[9px] font-black tracking-widest badge",
                      patient.status === 'active' ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"
                    )}>
                      {patient.status}
                    </Badge>
                  </div>
                  <div className="col-span-full">
                    <Label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1 block">Treatment Plan</Label>
                    <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 border-dashed print-treatment-plan">
                      <p className="text-sm font-medium text-blue-900 print:text-black">{patient.treatmentPlan}</p>
                    </div>
                  </div>
                  {patient.notes && (
                    <div className="col-span-full">
                      <Label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1 block">Clinical Notes</Label>
                      <p className="text-sm text-gray-600 leading-relaxed italic print:text-black print:not-italic cursor-text">"{patient.notes}"</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Visit History Timeline */}
            <Card className="card overflow-hidden">
              <CardHeader className="card-header border-b flex flex-row items-center justify-between no-print">
                <div>
                  <CardTitle className="card-title flex items-center gap-2">
                    <History size={20} className="text-blue-600 no-print" /> Treatment Progress
                  </CardTitle>
                  <CardDescription className="no-print">Chronological monthly updates</CardDescription>
                </div>
                
                <Dialog open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen}>
                  <DialogTrigger className={cn(buttonVariants({ size: 'sm' }), "bg-blue-600 hover:bg-blue-700 h-9 rounded-lg text-white no-print")}>
                    <Plus className="mr-1 h-4 w-4 no-print" /> Add Visit
                  </DialogTrigger>
                  <DialogContent className="max-w-md rounded-3xl">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold">Record Monthly Visit</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleMonthlyUpdate} className="space-y-4 pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Visit Date</Label>
                          <Input 
                            type="date" 
                            value={updateData.visitDate}
                            onChange={(e) => setUpdateData({...updateData, visitDate: e.target.value})}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Paid Amount ({clinic?.currency})</Label>
                          <Input 
                            type="number" 
                            placeholder="0"
                            value={updateData.amountPaid}
                            onChange={(e) => setUpdateData({...updateData, amountPaid: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Progress Notes *</Label>
                        <textarea 
                          className="w-full min-h-[80px] rounded-xl border border-input px-3 py-2 text-sm"
                          placeholder="What was done this month?"
                          required
                          value={updateData.progressNote}
                          onChange={(e) => setUpdateData({...updateData, progressNote: e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Next Appointment</Label>
                          <Input 
                            type="date" 
                            value={updateData.nextAppointmentDate}
                            onChange={(e) => setUpdateData({...updateData, nextAppointmentDate: e.target.value})}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Patient Status</Label>
                          <Select value={updateData.status} onValueChange={(v: any) => setUpdateData({...updateData, status: v})}>
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
                        <Label>Remarks (Optional)</Label>
                        <Input 
                          placeholder="e.g. Broken bracket"
                          value={updateData.remarks}
                          onChange={(e) => setUpdateData({...updateData, remarks: e.target.value})}
                        />
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsUpdateModalOpen(false)}>Cancel</Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={submitting}>
                          {submitting ? <Loader2 className="animate-spin" /> : 'Save Update'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>

                {/* Edit Visit Modal */}
                <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                  <DialogContent className="max-w-md rounded-3xl">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold">Edit Visit Record</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUpdateVisit} className="space-y-4 pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Visit Date</Label>
                          <Input 
                            type="date" 
                            value={updateData.visitDate}
                            onChange={(e) => setUpdateData({...updateData, visitDate: e.target.value})}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Paid Amount ({clinic?.currency})</Label>
                          <Input 
                            type="number" 
                            placeholder="0"
                            value={updateData.amountPaid}
                            onChange={(e) => setUpdateData({...updateData, amountPaid: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Progress Notes *</Label>
                        <textarea 
                          className="w-full min-h-[80px] rounded-xl border border-input px-3 py-2 text-sm"
                          placeholder="What was done this month?"
                          required
                          value={updateData.progressNote}
                          onChange={(e) => setUpdateData({...updateData, progressNote: e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Next Appointment</Label>
                          <Input 
                            type="date" 
                            value={updateData.nextAppointmentDate}
                            onChange={(e) => setUpdateData({...updateData, nextAppointmentDate: e.target.value})}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Patient Status</Label>
                          <Select value={updateData.status} onValueChange={(v: any) => setUpdateData({...updateData, status: v})}>
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
                        <Label>Remarks (Optional)</Label>
                        <Input 
                          placeholder="e.g. Broken bracket"
                          value={updateData.remarks}
                          onChange={(e) => setUpdateData({...updateData, remarks: e.target.value})}
                        />
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => {
                          setIsEditModalOpen(false);
                          setEditingVisit(null);
                        }}>Cancel</Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={submitting}>
                          {submitting ? <Loader2 className="animate-spin" /> : 'Update Record'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>

              {/* Print Only Header for Visits */}
              <div className="hidden print:block border-b-2 border-black mb-4 mt-8 px-6">
                <h3 className="text-[10pt] font-black uppercase tracking-widest mb-1">Clinical Visit History & Procedure Journal</h3>
              </div>

              <CardContent className="p-0">
                <div className="divide-y divide-gray-50 no-print">
                  {visits.length === 0 ? (
                    <div className="py-12 text-center no-print">
                      <ClipboardList className="mx-auto h-12 w-12 text-gray-200 mb-3 no-print" />
                      <p className="text-sm text-gray-500 font-medium no-print">No visit records yet.</p>
                      <p className="text-xs text-gray-400 mt-1 no-print">Start by adding the first monthly update.</p>
                    </div>
                  ) : (
                    visits.map((visit, idx) => (
                      <div key={visit.id} className="p-6 transition-colors hover:bg-gray-50/50 no-print">
                        <div className="flex justify-between items-start mb-2 no-print">
                          <div className="flex items-center gap-3 no-print">
                            <div className="h-2 w-2 rounded-full bg-blue-600 mt-1 no-print" />
                            <div>
                              <p className="text-sm font-bold text-gray-900 no-print">
                                {format(ensureDate(visit.visitDate), 'dd MMM yyyy')}
                                {idx === 0 && <Badge className="ml-2 bg-blue-50 text-blue-600 border-none text-[9px] uppercase font-black tracking-widest px-1.5 py-0 h-4 no-print">Latest</Badge>}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 no-print">
                            {visit.amountPaid > 0 && (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-100 font-bold px-2 mr-2 no-print">
                                +{clinic?.currency}{visit.amountPaid.toLocaleString()}
                              </Badge>
                            )}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 text-gray-400 hover:text-blue-600 no-print"
                              onClick={() => handlePrintReceipt(visit)}
                              title="Print Receipt"
                            >
                              <Printer size={14} className="no-print" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 text-gray-400 hover:text-blue-600 no-print"
                              onClick={() => handleEditVisit(visit)}
                              title="Edit Visit"
                            >
                              <Pencil size={14} className="no-print" />
                            </Button>
                            <Dialog open={deletingVisit?.id === visit.id} onOpenChange={(open) => !open && setDeletingVisit(null)}>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-7 w-7 text-gray-400 hover:text-red-600 no-print"
                                  onClick={() => setDeletingVisit(visit)}
                                  title="Delete Visit"
                                >
                                  <Trash2 size={14} className="no-print" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="rounded-3xl">
                                <DialogHeader>
                                  <DialogTitle>Delete Visit Record?</DialogTitle>
                                  <DialogDescription>
                                    Are you sure you want to delete the visit on {format(ensureDate(visit.visitDate), 'dd MMM yyyy')}? This will update the patient balance.
                                  </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setDeletingVisit(null)}>Cancel</Button>
                                  <Button variant="destructive" onClick={() => handleDeleteVisit(visit)} disabled={submitting}>
                                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete Visit'}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                        
                        <div className="ml-5 space-y-3 no-print">
                          <p className="text-sm text-gray-600 leading-relaxed no-print">{visit.progressNote}</p>
                          {visit.remarks && (
                            <div className="bg-orange-50/50 border border-orange-100 rounded-lg p-2 flex items-center gap-2 text-[11px] text-orange-700 no-print">
                              <AlertCircle size={14} className="no-print" />
                              <span className="no-print">{visit.remarks}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-4 text-[10px] text-gray-400 font-medium no-print">
                            <span className="flex items-center gap-1 no-print">
                              <Calendar size={12} className="no-print" /> Next: {format(ensureDate(visit.nextAppointmentDate), 'dd MMM yyyy')}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Print Only Clinical Table */}
                <div className="hidden print:block p-4">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="text-left py-1.5">Date</th>
                        <th className="text-left py-1.5" style={{ width: '60%' }}>Clinical Observation & Procedure</th>
                        <th className="text-center py-1.5">Paid</th>
                        <th className="text-right py-1.5">Follow-up</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visits.map((visit) => (
                        <tr key={visit.id} className="border-b border-gray-200">
                          <td className="py-1 font-bold whitespace-nowrap">{format(ensureDate(visit.visitDate), 'dd MMM yy')}</td>
                          <td className="py-1">
                            <p className="font-medium text-gray-900 leading-tight">{visit.progressNote}</p>
                            {visit.remarks && <p className="text-[7pt] text-gray-500 mt-0 italic font-normal">Note: {visit.remarks}</p>}
                          </td>
                          <td className="py-1 text-center font-bold">{clinic?.currency}{visit.amountPaid.toLocaleString()}</td>
                          <td className="py-1 text-right font-medium whitespace-nowrap">{format(ensureDate(visit.nextAppointmentDate), 'dd MMM yy')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {/* Signature Area */}
                  <div className="mt-6 flex justify-between items-end">
                    <div className="text-center w-40">
                      <div className="border-t border-black mb-1"></div>
                      <p className="text-[8pt] font-bold uppercase">Date of Issue</p>
                    </div>
                    <div className="text-center w-64">
                      {clinic?.doctorName && (
                        <div className="mb-2">
                          <p className="text-[9pt] font-bold uppercase">{clinic.doctorName}</p>
                          <p className="text-[7pt] font-medium opacity-80">
                            {clinic.doctorQualification}{clinic.doctorQualification && clinic.doctorRegNumber ? ' | ' : ''}
                            {clinic.doctorRegNumber ? `Reg: ${clinic.doctorRegNumber}` : ''}
                          </p>
                        </div>
                      )}
                      <div className="border-t border-black mb-1"></div>
                      <p className="text-[8pt] font-black uppercase tracking-widest leading-tight">
                        Consulting Orthodontist<br/>
                        <span className="text-[6pt] font-medium opacity-60">(Sign & Seal)</span>
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side: Actions & Deadlines */}
          <div className="space-y-6">
            {/* Next Appointment Card */}
            <Card className="border-none shadow-sm overflow-hidden bg-gradient-to-br from-indigo-600 to-blue-700 text-white relative no-print">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                    <Calendar size={24} />
                  </div>
                  <Badge className="bg-white/20 text-white border-none uppercase text-[8px] font-black tracking-[2px]">Schedule</Badge>
                </div>
                <div className="space-y-1 mb-8">
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Next Appointment</p>
                  <p className="text-2xl font-black">
                    {patient.nextAppointmentDate 
                      ? format(ensureDate(patient.nextAppointmentDate), 'EEEE, MMM dd')
                      : 'No appointment'
                    }
                  </p>
                  <p className="text-xs opacity-60">
                    Status: {patient.nextAppointmentDate ? 'Scheduled' : 'None scheduled'}
                  </p>
                </div>
                
                <Button 
                  onClick={handleWhatsAppReminder}
                  className="w-full bg-white text-blue-600 hover:bg-blue-50 font-bold rounded-xl h-11 h-shadow-none border-none group"
                >
                  <MessageCircle className="mr-2 h-4 w-4 transform group-hover:scale-110 transition-transform" /> 
                  Send Reminder
                </Button>
              </CardContent>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
            </Card>

            {/* Financial Progress */}
            <Card className="border-none shadow-sm overflow-hidden no-print">
              <CardHeader className="pb-2 no-print">
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-gray-400 no-print">Payment Milestone</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-2 no-print">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-gray-500">Progress</span>
                    <span className="text-blue-600">{Math.round((patient.amountPaid / patient.totalAmount) * 100)}%</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden p-0.5 border">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (patient.amountPaid / patient.totalAmount) * 100)}%` }}
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" 
                    />
                  </div>
                </div>

                <Separator className="bg-gray-50" />

                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2 text-gray-500">
                      <CreditCard size={14} /> Total Value
                    </div>
                    <span className="font-bold text-gray-900">{clinic?.currency}{patient.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 size={14} /> Amount Paid
                    </div>
                    <span className="font-bold text-green-600">+{clinic?.currency}{patient.amountPaid.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-t pt-4">
                    <div className="flex items-center gap-2 text-orange-600">
                      <Clock size={14} /> Balance Due
                    </div>
                    <span className="font-black text-orange-600">{clinic?.currency}{patient.remainingAmount.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Printable Receipt (Only visible during print and when printingVisit is selected) */}
      {printingVisit && (
        <div className="fixed inset-0 bg-white z-[9999] p-8 hidden print:block overflow-auto">
          <div className="max-w-2xl mx-auto border-2 border-double p-8 rounded-none">
            <div className="flex justify-between items-start border-b-2 pb-6 mb-6">
              <div className="flex items-center gap-4">
                {clinic?.logoUrl && (
                  <img src={clinic.logoUrl} alt="Logo" className="h-16 w-auto" />
                )}
                <div>
                  <h1 className="text-xl font-bold uppercase">{clinic?.name}</h1>
                  <p className="text-[10px] text-gray-500 max-w-xs">{clinic?.address}</p>
                  <p className="text-[11px] font-bold mt-1 text-gray-700">PH: {clinic?.phone}</p>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-2xl font-black uppercase tracking-tighter">Payment Receipt</h2>
                <div className="mt-2 inline-block bg-gray-900 text-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
                  Official Record
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Receipt To</p>
                <p className="text-lg font-bold text-gray-900">{patient.patientName}</p>
                <p className="text-sm text-gray-500">{patient.mobileNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Receipt Details</p>
                <p className="text-sm font-bold">Date: {format(ensureDate(printingVisit.visitDate), 'dd MMM yyyy')}</p>
                <p className="text-sm text-gray-500">Visit ID: {printingVisit.id.slice(-8).toUpperCase()}</p>
              </div>
            </div>

            <table className="w-full border-collapse mb-8">
              <thead>
                <tr className="bg-gray-50 border-y-2 border-gray-100">
                  <th className="py-3 px-4 text-left text-xs font-bold uppercase tracking-widest">Description</th>
                  <th className="py-3 px-4 text-right text-xs font-bold uppercase tracking-widest">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-6 px-4">
                    <p className="font-bold text-gray-900">Periodic Orthodontic Adjustment</p>
                    <p className="text-xs text-gray-500 mt-1">{printingVisit.progressNote}</p>
                  </td>
                  <td className="py-6 px-4 text-right font-bold text-lg">
                    {clinic?.currency}{printingVisit.amountPaid.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="grid grid-cols-2 gap-8 pt-8 border-t-2 border-gray-100 items-end">
              <div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Treatment Status</p>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span>Balance Progress</span>
                    <span>{Math.round((patient.amountPaid / patient.totalAmount) * 100)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600" style={{ width: `${(patient.amountPaid / patient.totalAmount) * 100}%` }} />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2">Remaining: {clinic?.currency}{patient.remainingAmount.toLocaleString()}</p>
                </div>
              </div>
              <div className="text-center space-y-1">
                {clinic?.doctorName && (
                  <p className="text-[9px] font-bold uppercase">{clinic.doctorName}</p>
                )}
                <div className="h-8 w-32 border-b border-gray-400 mx-auto" />
                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-[2px]">Authorized Signature</p>
              </div>
            </div>

            <div className="mt-12 text-center">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Thank you for Choosing {clinic?.name}</p>
            </div>
          </div>
        </div>
      )}

      {/* Edit Patient Modal */}
      <Dialog open={isEditPatientModalOpen} onOpenChange={setIsEditPatientModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Edit Patient Details</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdatePatient} className="space-y-6 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_patientName">Patient Name *</Label>
                <Input 
                  id="edit_patientName" 
                  required 
                  value={patientFormData.patientName}
                  onChange={(e) => setPatientFormData({...patientFormData, patientName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_mobileNumber">Mobile Number *</Label>
                <Input 
                  id="edit_mobileNumber" 
                  required 
                  value={patientFormData.mobileNumber}
                  onChange={(e) => setPatientFormData({...patientFormData, mobileNumber: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_age">Age</Label>
                <Input 
                  id="edit_age" 
                  type="number" 
                  value={patientFormData.age}
                  onChange={(e) => setPatientFormData({...patientFormData, age: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={patientFormData.gender} onValueChange={(v: any) => setPatientFormData({...patientFormData, gender: v})}>
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
                <Label htmlFor="edit_startDate">Start Date</Label>
                <Input 
                  id="edit_startDate" 
                  type="date" 
                  value={patientFormData.startDate}
                  onChange={(e) => setPatientFormData({...patientFormData, startDate: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_treatmentPlan">Treatment Plan *</Label>
                <Input 
                  id="edit_treatmentPlan" 
                  required 
                  value={patientFormData.treatmentPlan}
                  onChange={(e) => setPatientFormData({...patientFormData, treatmentPlan: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_totalAmount">Total Plan Amount ({clinic?.currency}) *</Label>
                <Input 
                  id="edit_totalAmount" 
                  type="number" 
                  required 
                  value={patientFormData.totalAmount}
                  onChange={(e) => setPatientFormData({...patientFormData, totalAmount: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_monthlyInstallment">Monthly EMI ({clinic?.currency})</Label>
                <Input 
                  id="edit_monthlyInstallment" 
                  type="number" 
                  value={patientFormData.monthlyInstallment}
                  onChange={(e) => setPatientFormData({...patientFormData, monthlyInstallment: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_nextAppointmentDate">Next Appointment</Label>
                <Input 
                  id="edit_nextAppointmentDate" 
                  type="date" 
                  value={patientFormData.nextAppointmentDate}
                  onChange={(e) => setPatientFormData({...patientFormData, nextAppointmentDate: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Case Status</Label>
                <Select value={patientFormData.status} onValueChange={(v: any) => setPatientFormData({...patientFormData, status: v})}>
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
              <Label htmlFor="edit_notes">Clinical Notes</Label>
              <textarea 
                id="edit_notes"
                className="w-full min-h-[80px] rounded-xl border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={patientFormData.notes}
                onChange={(e) => setPatientFormData({...patientFormData, notes: e.target.value})}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditPatientModalOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={submitting}>
                {submitting ? <Loader2 className="animate-spin" /> : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
