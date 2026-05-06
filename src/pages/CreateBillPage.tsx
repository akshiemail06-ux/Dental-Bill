import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, addDoc, updateDoc, doc, getDoc, serverTimestamp, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useClinic } from '../contexts/ClinicContext';
import { handleFirestoreError } from '../lib/error-handler';
import AppLayout from '../components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Loader2, Calculator, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { BillItem, Doctor, Bill } from '../types';
import { format } from 'date-fns';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { motion, AnimatePresence } from 'motion/react';
import { ensureDate } from '../lib/utils';

// Force re-transform to fix dynamic import fetch error
export default function CreateBillPage() {
  const { clinic } = useClinic();
  const { isDemo, user } = useAuth();
  const { canCreateBill, incrementBillCount, isTrialExpired } = useSubscription();
  const navigate = useNavigate();
  const { id: editBillId } = useParams();
  const isEditMode = !!editBillId;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [billNumber, setBillNumber] = useState('');
  const [showGuide, setShowGuide] = useState(false);
  const [pendingBills, setPendingBills] = useState<Bill[]>([]);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [receivingPayment, setReceivingPayment] = useState<Bill | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethodForUpdate, setPaymentMethodForUpdate] = useState('Cash');

  useEffect(() => {
    if (isDemo) {
      const hasSeenGuide = sessionStorage.getItem('hasSeenDemoGuide');
      if (!hasSeenGuide) {
        setShowGuide(true);
      }
    }
  }, [isDemo]);

  const closeGuide = () => {
    setShowGuide(false);
    sessionStorage.setItem('hasSeenDemoGuide', 'true');
  };

  const [patientInfo, setPatientInfo] = useState({
    name: '',
    phone: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [items, setItems] = useState<BillItem[]>([
    { id: Math.random().toString(36).substr(2, 9), name: '', description: '', quantity: 1, price: 0, total: 0 },
    { id: Math.random().toString(36).substr(2, 9), name: '', description: '', quantity: 1, price: 0, total: 0 }
  ]);

  const [discount, setDiscount] = useState<number>(0);
  const [gstEnabled, setGstEnabled] = useState(false);
  const [gstPercentage, setGstPercentage] = useState(18);
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'unpaid' | 'partial' | 'draft'>('paid');
  const [partialAmount, setPartialAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [notes, setNotes] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');

  const suggestions = ['Consultation', 'Root Canal Treatment', 'Dental Extraction', 'Teeth Cleaning', 'Dental Filling', 'Crown Placement', 'Dental Implant', 'Braces Adjustment', 'Teeth Whitening'];

  // Auto-generate bill number
  useEffect(() => {
    const fetchLastBill = async () => {
      if (!clinic?.id || isEditMode || isDemo) return;
      try {
        const q = query(
          collection(db, 'bills'),
          where('clinicId', '==', clinic.id),
          orderBy('createdAt', 'desc'),
          limit(1)
        );
        const snap = await getDocs(q);
        const year = new Date().getFullYear();
        if (!snap.empty) {
          const lastBill = snap.docs[0].data();
          const lastNumMatch = lastBill.billNumber.match(/-(\d+)$/);
          const lastNum = lastNumMatch ? parseInt(lastNumMatch[1]) : 1000;
          setBillNumber(`DB-${year}-${(lastNum + 1).toString().padStart(4, '0')}`);
        } else {
          setBillNumber(`DB-${year}-1001`);
        }
      } catch (err) {
        console.error("Error fetching last bill:", err);
      }
    };
    fetchLastBill();
  }, [clinic?.id, isEditMode, isDemo]);

  useEffect(() => {
    if (clinic?.doctors && clinic.doctors.length > 0) {
      const mainDoc = clinic.doctors.find(d => d.isMain) || clinic.doctors[0];
      if (mainDoc) {
        setSelectedDoctorId(mainDoc.id);
      }
    }
  }, [clinic]);

  useEffect(() => {
    const fetchBillForEdit = async () => {
      if (!editBillId || isDemo) return;
      
      setFetching(true);
      try {
        const billDoc = await getDoc(doc(db, 'bills', editBillId));
        if (billDoc.exists()) {
          const data = billDoc.data() as Bill;
          setPatientInfo({
            name: data.patientName,
            phone: data.patientPhone || '',
            date: format(ensureDate(data.billDate || data.createdAt), 'yyyy-MM-dd')
          });
          setItems(data.items);
          setDiscount(data.discount);
          setGstEnabled(data.gstEnabled || false);
          setGstPercentage(data.gstPercentage || 18);
          setPaymentStatus(data.paymentStatus);
          setPartialAmount(data.partialAmount || 0);
          setPaymentMethod(data.paymentMethod || 'Cash');
          setNotes(data.notes || '');
          setBillNumber(data.billNumber);
          if (data.doctor?.id) {
            setSelectedDoctorId(data.doctor.id);
          }
        } else {
          toast.error('Bill not found');
          navigate('/bills');
        }
      } catch (error) {
        console.error("Error fetching bill for edit:", error);
        toast.error('Failed to load bill data');
      } finally {
        setFetching(false);
      }
    };

    fetchBillForEdit();
  }, [editBillId, isDemo, navigate]);

  useEffect(() => {
    const searchPendingBills = async () => {
      if (!clinic?.id || !patientInfo.phone || patientInfo.phone.length < 10 || isDemo) {
        setPendingBills([]);
        return;
      }

      try {
        const q = query(
          collection(db, 'bills'),
          where('clinicId', '==', clinic.id),
          where('patientPhone', '==', patientInfo.phone),
          where('paymentStatus', 'in', ['unpaid', 'partial'])
        );
        const snap = await getDocs(q);
        const b = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bill));
        setPendingBills(b);
      } catch (error) {
        console.error("Error searching pending bills:", error);
      }
    };

    const timer = setTimeout(searchPendingBills, 500);
    return () => clearTimeout(timer);
  }, [patientInfo.phone, clinic?.id]);

  const handleAddPayment = (bill: Bill) => {
    setReceivingPayment(bill);
    setPaymentAmount(0);
    setShowPaymentDialog(true);
  };

  const submitPayment = async () => {
    if (!receivingPayment || paymentAmount <= 0) return;

    setLoading(true);
    const loadingToast = toast.loading('Updating payment...');

    try {
      const currentPaid = receivingPayment.paidAmount || (receivingPayment.paymentStatus === 'paid' ? receivingPayment.total : (receivingPayment.partialAmount || 0));
      const newPaid = currentPaid + paymentAmount;
      const due = receivingPayment.total - newPaid;
      
      let newStatus: 'paid' | 'unpaid' | 'partial' = 'unpaid';
      if (newPaid >= receivingPayment.total) {
        newStatus = 'paid';
      } else if (newPaid > 0) {
        newStatus = 'partial';
      }

      const updateData = {
        paidAmount: newPaid,
        dueAmount: Math.max(0, due),
        partialAmount: newPaid, // for compatibility
        paymentStatus: newStatus,
        paymentMethod: paymentMethodForUpdate,
        updatedAt: serverTimestamp(),
        lastPaymentDate: serverTimestamp()
      };

      await updateDoc(doc(db, 'bills', receivingPayment.id), updateData);
      toast.dismiss(loadingToast);
      toast.success('Payment updated successfully');
      setShowPaymentDialog(false);
      
      // Update local state
      setPendingBills(prev => prev.filter(b => b.id !== receivingPayment.id));
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error("Payment update error:", error);
      toast.error('Failed to update payment');
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    if (items.length >= 5) {
      return toast.error("Unable to add more treatment rows. Maximum 5 items are allowed in one invoice for proper print layout. Please create another bill for additional treatments.", {
        duration: 5000,
      });
    }
    setItems([...items, { id: Math.random().toString(36).substr(2, 9), name: '', description: '', quantity: 1, price: 0, total: 0 }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    } else {
      // If only one item, just clear it instead of removing
      setItems([{ id: Math.random().toString(36).substr(2, 9), name: '', description: '', quantity: 1, price: 0, total: 0 }]);
    }
  };

  const updateItem = (id: string, field: keyof BillItem, value: any) => {
    const newItems = items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'price' || field === 'quantity') {
          updatedItem.total = (updatedItem.price || 0) * (updatedItem.quantity || 0);
        }
        return updatedItem;
      }
      return item;
    });
    setItems(newItems);
  };

  const { subtotal, gstAmount, total } = React.useMemo(() => {
    const sub = items.reduce((sum, item) => sum + item.total, 0);
    const gst = gstEnabled ? Math.max(0, sub - discount) * (gstPercentage / 100) : 0;
    const tot = Math.max(0, sub - discount + gst);
    return { subtotal: sub, gstAmount: gst, total: tot };
  }, [items, discount, gstEnabled, gstPercentage]);

  const handleSubmit = async (e: React.FormEvent, isDraft = false) => {
    if (e) e.preventDefault();
    
    // Filter out completely empty items
    const filteredItems = items.filter(item => item.name.trim() !== '' || item.price > 0);

    if (isDemo) {
      const selectedDoctor = clinic?.doctors?.find(d => d.id === selectedDoctorId);
        const billData = {
          id: 'demo-new-bill',
          clinicId: 'demo-clinic',
          clinicName: clinic?.name || 'Smile Dental Care',
          clinicAddress: clinic?.address || '123, Health Enclave, Sector 15, New Delhi',
          clinicPhone: clinic?.phone || '9876543210',
          clinicEmail: clinic?.email || 'contact@smiledental.com',
          clinicGst: clinic?.gstNumber || '',
          patientName: patientInfo.name.trim(),
        patientPhone: patientInfo.phone.trim(),
        billDate: new Date(patientInfo.date),
        billNumber,
        items: filteredItems.map(item => ({
          ...item,
          name: item.name.trim(),
          description: (item.description || '').trim()
        })),
        discount,
        gstEnabled,
        gstPercentage,
        subtotal,
        gstAmount,
        total,
        notes: notes.trim(),
        paymentStatus: isDraft ? 'draft' : paymentStatus,
        partialAmount: paymentStatus === 'partial' ? partialAmount : 0,
        paymentMethod,
        doctor: selectedDoctor,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      sessionStorage.setItem('lastDemoBill', JSON.stringify(billData));
      toast.success(isDraft ? 'Demo draft saved (temporary)' : 'Demo bill generated');
      navigate('/bills/demo-new-bill', { state: { generated: true } });
      return;
    }

    if (!clinic?.id || loading) return;
    
    // Subscription check
    if (!canCreateBill && !isDraft) {
      toast.error(isTrialExpired ? 'Your free trial has ended. Please upgrade.' : 'Monthly bill limit reached. Please upgrade.');
      navigate('/membership');
      return;
    }

    // Validation
    if (!patientInfo.name.trim()) {
      return toast.error('Patient name is required');
    }

    if (!isDraft && filteredItems.length === 0) {
      return toast.error('Please add at least one treatment');
    }

    if (!isDraft && filteredItems.some(item => !item.name.trim() || item.price <= 0)) {
      return toast.error('Please ensure all treatments have a name and valid price');
    }

    setLoading(true);
    const loadingToast = toast.loading(isDraft ? 'Saving draft...' : 'Generating bill...');
    
      try {
        // Normalize doctor name: Ensure exactly one "DR. " prefix and uppercase
        const normalizeDoctorName = (name: string) => {
          if (!name) return '';
          let cleaned = name.trim().toUpperCase();
          // Remove all variations of DR prefix at the start
          while (cleaned.match(/^(DR\.?|DR)\s+/i)) {
            cleaned = cleaned.replace(/^(DR\.?|DR)\s+/i, '');
          }
          // Also handle cases with weird dots if they exist
          cleaned = cleaned.replace(/^\.+/g, ''); 
          return `DR. ${cleaned.trim()}`;
        };

        const selectedDoctor = clinic?.doctors?.find(d => d.id === selectedDoctorId);
        
        // Clean doctor data for Firestore (remove undefined and local-only assets)
        let doctorData = null;
        if (selectedDoctor) {
          doctorData = {
            id: selectedDoctor.id,
            name: normalizeDoctorName(selectedDoctor.name || ''),
            qualification: selectedDoctor.qualification || '',
            registrationNumber: (selectedDoctor.registrationNumber || selectedDoctor.regNumber || '').trim(),
            isMain: !!selectedDoctor.isMain
          };
        }
  
        const billData: any = {
          clinicId: clinic.id,
          clinicName: clinic.name || '',
          clinicAddress: clinic.address || '',
          clinicPhone: clinic.phone || '',
          clinicEmail: clinic.email || '',
          clinicGst: clinic.gstNumber || '',
          ownerId: clinic.ownerId || user?.uid || '', // Explicitly add ownerId for security rules
          patientName: patientInfo.name.trim(),
          patientPhone: (patientInfo.phone || '').trim(),
          billDate: patientInfo.date ? new Date(patientInfo.date) : new Date(),
          billNumber,
          items: filteredItems.map(item => ({
            id: item.id || '',
            name: item.name.trim(),
            description: (item.description || '').trim(),
            quantity: item.quantity || 0,
            price: item.price || 0,
            total: item.total || 0
          })),
          discount: discount || 0,
          gstEnabled: !!gstEnabled,
          gstPercentage: gstPercentage || 0,
          subtotal: subtotal || 0,
          gstAmount: gstAmount || 0,
          total: total || 0,
          paidAmount: paymentStatus === 'paid' ? total : (paymentStatus === 'partial' ? (partialAmount || 0) : 0),
          dueAmount: Math.max(0, paymentStatus === 'paid' ? 0 : (paymentStatus === 'partial' ? total - (partialAmount || 0) : total)),
          notes: (notes || '').trim(),
          paymentStatus: isDraft ? 'draft' : paymentStatus,
          partialAmount: paymentStatus === 'partial' ? (partialAmount || 0) : 0,
          paymentMethod: paymentMethod || 'Cash',
          doctor: doctorData,
          updatedAt: serverTimestamp()
        };

      if (isEditMode && editBillId) {
        console.log(`Updating bill ${editBillId} for owner ${billData.ownerId}...`);
        await updateDoc(doc(db, 'bills', editBillId), billData);
        console.log(`UPDATE SUCCESS: Bill ${editBillId} saved to server.`);
        toast.dismiss(loadingToast);
        toast.success('Bill updated successfully');
        navigate(`/bills/${editBillId}`, { state: { generated: true } });
      } else {
        billData.createdAt = serverTimestamp();
        console.log(`Creating NEW bill for owner ${billData.ownerId}...`);
        const docRef = await addDoc(collection(db, 'bills'), billData);
        console.log(`CREATE SUCCESS: New bill ${docRef.id} saved to server.`);
        
        // Increment subscription count
        if (!isDraft) {
          await incrementBillCount();
        }

        toast.dismiss(loadingToast);
        toast.success(isDraft ? 'Draft saved successfully' : 'Bill generated successfully');
        navigate(`/bills/${docRef.id}`, { state: { generated: true } });
      }
    } catch (error: any) {
      toast.dismiss(loadingToast);
      console.error('Error saving bill:', error);
      toast.error('Something went wrong while saving. Please try again.');
      handleFirestoreError(error, 'create', 'bills');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <AnimatePresence>
        {showPaymentDialog && receivingPayment && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6"
            >
              <div className="flex justify-between items-center border-b pb-4">
                <h3 className="text-xl font-bold text-gray-900">Add Payment</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowPaymentDialog(false)} className="rounded-full">
                  <Plus className="rotate-45" size={20} />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-gray-400 uppercase tracking-widest text-[10px] font-bold">Patient</p>
                  <p className="font-bold text-gray-900">{receivingPayment.patientName}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-gray-400 uppercase tracking-widest text-[10px] font-bold">Bill #</p>
                  <p className="font-bold text-gray-900">{receivingPayment.billNumber}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-400 uppercase tracking-widest text-[10px] font-bold">Total</p>
                  <p className="font-bold text-gray-900">{clinic?.currency}{receivingPayment.total.toLocaleString()}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-gray-400 uppercase tracking-widest text-[10px] font-bold">Paid</p>
                  <p className="font-bold text-green-600">
                    {clinic?.currency}{(receivingPayment.paidAmount || receivingPayment.partialAmount || 0).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex justify-between items-center">
                <p className="text-orange-900 font-bold uppercase tracking-widest text-xs">Remaining Due</p>
                <p className="text-xl font-black text-orange-600">
                  {clinic?.currency}{(receivingPayment.total - (receivingPayment.paidAmount || receivingPayment.partialAmount || 0)).toLocaleString()}
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Receive Payment ({clinic?.currency})</Label>
                  <Input 
                    type="number" 
                    className="h-12 rounded-xl text-lg font-bold border-blue-200 focus:ring-blue-500" 
                    placeholder="Enter amount"
                    value={paymentAmount || ''}
                    onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select value={paymentMethodForUpdate} onValueChange={setPaymentMethodForUpdate}>
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue>{paymentMethodForUpdate}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="UPI">UPI / QR Code</SelectItem>
                      <SelectItem value="Card">Credit/Debit Card</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowPaymentDialog(false)} className="flex-1 h-12 rounded-xl">Cancel</Button>
                <Button 
                  onClick={submitPayment} 
                  disabled={loading || paymentAmount <= 0}
                  className="flex-1 h-12 rounded-xl bg-green-600 hover:bg-green-700 shadow-lg shadow-green-100 font-bold"
                >
                  {loading ? <Loader2 className="animate-spin" /> : 'Confirm Payment'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {showGuide && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Plus size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Create your first bill in 10 seconds</h3>
              <p className="text-gray-500 mb-8 leading-relaxed">
                Just add patient details and treatments. Generate a bill instantly and see how reports update automatically.
              </p>
              <div className="flex flex-col gap-3">
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 h-12 rounded-xl font-bold"
                  onClick={closeGuide}
                >
                  Try Now
                </Button>
                <Button 
                  variant="ghost" 
                  className="h-12 rounded-xl text-gray-500"
                  onClick={closeGuide}
                >
                  Skip
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft size={24} />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            {isEditMode ? 'Edit Bill' : 'Create New Bill'}
          </h1>
        </div>

        {fetching ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            <p className="text-gray-500 font-medium">Loading bill data...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
          {/* Left Column: Patient & Items */}
          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence>
              {pendingBills.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Card className="border-2 border-orange-200 bg-orange-50/50 shadow-sm overflow-hidden">
                    <CardHeader className="bg-orange-100/50 py-3">
                      <div className="flex items-center gap-2 text-orange-700">
                        <Calculator size={18} />
                        <CardTitle className="text-sm font-bold uppercase tracking-wider">Pending Bill Found</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      {pendingBills.map(bill => (
                        <div key={bill.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-orange-100 last:border-0 pb-4 last:pb-0">
                          <div className="space-y-1">
                            <p className="font-bold text-gray-900">{bill.patientName}</p>
                            <p className="text-xs text-gray-500">{bill.billNumber} • {format(ensureDate(bill.createdAt), 'dd MMM yyyy')}</p>
                            <div className="flex gap-3 mt-1 underline-offset-4">
                              <p className="text-xs font-medium">Total: {clinic?.currency}{bill.total.toLocaleString()}</p>
                              <p className="text-xs font-bold text-green-600">Paid: {clinic?.currency}{(bill.paidAmount || bill.partialAmount || 0).toLocaleString()}</p>
                              <p className="text-xs font-black text-orange-600">Due: {clinic?.currency}{(bill.total - (bill.paidAmount || bill.partialAmount || 0)).toLocaleString()}</p>
                            </div>
                          </div>
                          <div className="flex gap-2 w-full sm:w-auto">
                            <Button size="sm" onClick={() => handleAddPayment(bill)} className="flex-1 sm:flex-none bg-orange-600 hover:bg-orange-700 h-9 px-4 rounded-lg font-bold">
                              Add Payment
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => navigate(`/bills/${bill.id}`)} className="flex-1 sm:flex-none h-9 px-4 rounded-lg border-orange-200 text-orange-700">
                              Open Bill
                            </Button>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {pendingBills.length > 0 && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center gap-2 text-blue-800 text-xs font-medium">
                <Plus className="bg-blue-600 text-white rounded-full p-0.5" size={14} />
                <span>Creating a new bill? Patient has a pending due of {clinic?.currency}{pendingBills.reduce((sum, b) => sum + (b.total - (b.paidAmount || b.partialAmount || 0)), 0).toLocaleString()}</span>
              </div>
            )}

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Patient Information</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="patientName">Patient Name</Label>
                  <Input 
                    id="patientName" 
                    placeholder="Full Name" 
                    value={patientInfo.name} 
                    onChange={(e) => setPatientInfo({...patientInfo, name: e.target.value})}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="patientPhone">Phone Number</Label>
                  <Input 
                    id="patientPhone" 
                    placeholder="+91 00000 00000" 
                    value={patientInfo.phone} 
                    onChange={(e) => setPatientInfo({...patientInfo, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billDate">Bill Date</Label>
                  <Input 
                    id="billDate" 
                    type="date" 
                    value={patientInfo.date} 
                    onChange={(e) => setPatientInfo({...patientInfo, date: e.target.value})}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Treatment Done By</Label>
                  <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
                    <SelectTrigger className="h-10 rounded-md">
                      <SelectValue>
                        {clinic?.doctors?.find(d => d.id === selectedDoctorId)?.name || "Select Doctor"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {clinic?.doctors?.map(doc => (
                        <SelectItem key={doc.id} value={doc.id}>
                          {doc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Treatments / Procedures</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item, index) => (
                  <div key={item.id} className="grid gap-4 sm:grid-cols-12 items-end border-b pb-4 last:border-0 last:pb-0">
                    <div className="sm:col-span-5 space-y-2">
                      <Label className="text-xs">Procedure Name</Label>
                      <div className="relative group">
                        <Input 
                          placeholder="e.g. Root Canal Treatment" 
                          value={item.name} 
                          onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                          className="pr-8 h-10 rounded-md"
                        />
                        <div className="absolute left-0 top-full mt-1 w-full bg-white border rounded-lg shadow-xl z-20 hidden group-focus-within:block max-h-40 overflow-y-auto">
                          {suggestions.filter(s => s.toLowerCase().includes(item.name.toLowerCase())).map(s => (
                            <button
                              key={s}
                              type="button"
                              className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 transition-colors"
                              onClick={() => updateItem(item.id, 'name', s)}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="sm:col-span-2 space-y-2">
                      <Label className="text-xs">Price ({clinic?.currency})</Label>
                      <Input 
                        type="number" 
                        min="0" 
                        value={item.price || ''} 
                        onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                        className="h-10 rounded-md"
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-2">
                      <Label className="text-xs">Qty</Label>
                      <Input 
                        type="number" 
                        min="1" 
                        value={item.quantity} 
                        onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                        className="h-10 rounded-md"
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-2">
                      <Label className="text-xs">Total</Label>
                      <div className="h-10 flex items-center px-3 bg-gray-50 rounded-md font-medium text-sm border border-gray-100">
                        {clinic?.currency}{item.total.toLocaleString()}
                      </div>
                    </div>
                    <div className="sm:col-span-1 flex justify-center sm:justify-end">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 h-10 w-10 sm:h-9 sm:w-9"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  </div>
                ))}

                <div className="flex justify-end pt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={addItem}
                    className="w-full sm:w-auto h-11 px-6 rounded-xl border-dashed border-2 text-gray-500 hover:text-blue-600 hover:border-blue-500 hover:bg-blue-50/50 transition-all font-semibold"
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add Treatment Item
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Additional Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <textarea 
                  className="w-full rounded-xl border border-gray-200 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  rows={3}
                  placeholder="Any special instructions or follow-up notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Summary & Payment */}
          <div className="space-y-6">
            <Card className="border-none shadow-sm bg-blue-600 text-white overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Calculator size={20} /> Bill Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm opacity-90">
                  <span>Subtotal</span>
                  <span>{clinic?.currency}{subtotal.toLocaleString()}</span>
                </div>
                
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-red-100 font-bold">
                    <span className="uppercase tracking-widest text-[10px]">Discount</span>
                    <span>-{clinic?.currency}{discount.toLocaleString()}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm opacity-90">GST</Label>
                      <Switch 
                        checked={gstEnabled} 
                        onCheckedChange={setGstEnabled}
                        className="data-[state=checked]:bg-white data-[state=unchecked]:bg-white/20"
                      />
                    </div>
                    {gstEnabled ? (
                      <div className="flex items-center gap-2 bg-white/10 rounded-lg px-2 py-1">
                        <input 
                          type="number" 
                          className="bg-transparent w-8 text-right text-xs font-bold focus:outline-none"
                          value={gstPercentage}
                          onChange={(e) => setGstPercentage(parseFloat(e.target.value) || 0)}
                        />
                        <span className="text-[10px]">%</span>
                      </div>
                    ) : (
                      <span className="text-xs opacity-50">Disabled</span>
                    )}
                  </div>
                  {gstEnabled && (
                    <div className="space-y-1 pl-2">
                      <div className="flex justify-between text-[11px] opacity-80">
                        <span>GST Amount</span>
                        <span>{clinic?.currency}{gstAmount.toLocaleString()}</span>
                      </div>
                      {clinic?.gstNumber && (
                        <div className="text-[10px] opacity-50 flex justify-between">
                          <span>Clinic GSTIN:</span>
                          <span className="font-mono">{clinic.gstNumber}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Separator className="bg-white/20" />
                
                <div className="flex justify-between items-center pt-2">
                  <span className="text-base font-bold uppercase tracking-wider opacity-90">Grand Total</span>
                  <span className="text-3xl font-black">{clinic?.currency}{total.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Payment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="discount">Discount Amount ({clinic?.currency})</Label>
                  <Input 
                    id="discount"
                    type="number"
                    placeholder="0"
                    className="h-11 rounded-xl"
                    value={discount || ''}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Payment Status</Label>
                  <Select value={paymentStatus} onValueChange={(val: any) => setPaymentStatus(val)}>
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue>
                        {paymentStatus === 'paid' ? 'Paid' : 
                         paymentStatus === 'unpaid' ? 'Unpaid' : 
                         paymentStatus === 'partial' ? 'Partial Payment' : 
                         paymentStatus === 'draft' ? 'Draft' : ''}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                      <SelectItem value="partial">Partial Payment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {paymentStatus === 'partial' && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <Label className="text-blue-600 font-bold">Amount Paid ({clinic?.currency})</Label>
                    <Input 
                      type="number" 
                      className="h-11 rounded-xl border-blue-200 focus:ring-blue-500"
                      value={partialAmount}
                      onChange={(e) => setPartialAmount(parseFloat(e.target.value) || 0)}
                    />
                    <div className="flex justify-between text-[11px] font-bold text-orange-600 px-1">
                      <span>Remaining Balance</span>
                      <span>{clinic?.currency}{(total - partialAmount).toLocaleString()}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue>{paymentMethod}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="UPI">UPI / QR Code</SelectItem>
                      <SelectItem value="Card">Credit/Debit Card</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 h-12 rounded-xl font-bold shadow-lg shadow-blue-100" type="submit" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isEditMode ? 'Update Bill' : 'Generate Bill')}
                </Button>
                {!isEditMode && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full h-12 rounded-xl font-bold border-gray-200 text-gray-500 hover:bg-gray-50"
                    onClick={(e) => handleSubmit(e as any, true)}
                    disabled={loading}
                  >
                    Save as Draft
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>
        </form>
      )}
      </div>
    </AppLayout>
  );
}
