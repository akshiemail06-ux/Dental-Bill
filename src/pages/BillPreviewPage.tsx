import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useClinic } from '../contexts/ClinicContext';
import { useAuth } from '../contexts/AuthContext';
import { handleFirestoreError } from '../lib/error-handler';
import AppLayout from '../components/AppLayout';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Printer, 
  Download, 
  ChevronLeft, 
  Trash2, 
  Edit, 
  Mail,
  CheckCircle2,
  Clock,
  AlertCircle,
  Stethoscope,
  Loader2,
  Phone,
  Settings,
  Share2,
  MessageSquare,
  MoreVertical,
  Copy,
  FileText
} from 'lucide-react';
import { Bill } from '../types';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { cn, ensureDate } from '@/lib/utils';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { motion } from 'motion/react';
import { Laptop, AlertTriangle } from 'lucide-react';

import { getLocalAsset } from '../lib/localStore';

export default function BillPreviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { clinic: ownerClinic } = useClinic();
  const { user, isDemo } = useAuth();
  const [bill, setBill] = useState<Bill | null>(null);
  const [publicClinic, setPublicClinic] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [localAssetMap, setLocalAssetMap] = useState<Record<string, string>>({});
  const componentRef = useRef<HTMLDivElement>(null);

  // Function to resolve local assets if they are on this device
  const resolveLocalAssets = async (clinicData: any) => {
    if (!clinicData) return;
    const assetsToLoad = [];
    if (clinicData.logoUrl?.startsWith('local-asset:')) assetsToLoad.push(clinicData.logoUrl);
    if (clinicData.stampUrl?.startsWith('local-asset:')) assetsToLoad.push(clinicData.stampUrl);
    if (clinicData.doctors) {
      clinicData.doctors.forEach((d: any) => {
        if (d.signatureUrl?.startsWith('local-asset:')) assetsToLoad.push(d.signatureUrl);
      });
    }

    const newMap = { ...localAssetMap };
    let changed = false;
    for (const key of assetsToLoad) {
      if (!newMap[key]) {
        const idbKey = key.replace('local-asset:', '');
        const data = await getLocalAsset(idbKey);
        if (data) {
          newMap[key] = data;
          changed = true;
        }
      }
    }
    if (changed) setLocalAssetMap(newMap);
  };

  // If viewing own bill, use clinic from context, else use fetched public clinic
  const billIsForUser = bill && user && bill.ownerId === user.uid;
  const isClinicOwner = bill && ownerClinic && bill.clinicId === ownerClinic.id && ownerClinic.ownerId === user?.uid;
  const isOwner = isDemo || billIsForUser || isClinicOwner;

  let baseClinic = (billIsForUser && ownerClinic) ? ownerClinic : publicClinic;

  // Resolve local URLs in the current view data
  const clinic = baseClinic ? {
    ...baseClinic,
    logoUrl: baseClinic.logoUrl?.startsWith('local-asset:') 
      ? (localAssetMap[baseClinic.logoUrl] || '') 
      : baseClinic.logoUrl,
    stampUrl: baseClinic.stampUrl?.startsWith('local-asset:') 
      ? (localAssetMap[baseClinic.stampUrl] || '') 
      : baseClinic.stampUrl,
    doctors: baseClinic.doctors?.map((doc: any) => ({
      ...doc,
      signatureUrl: doc.signatureUrl?.startsWith('local-asset:')
        ? (localAssetMap[doc.signatureUrl] || '')
        : doc.signatureUrl
    }))
  } : null;

  const [showStamp, setShowStamp] = useState(true);
  const [showSignature, setShowSignature] = useState(true);
  const [showMobileAlert, setShowMobileAlert] = useState(false);

  useEffect(() => {
    // Check if on mobile and if just generated
    const isMobile = window.innerWidth < 768;
    const isGenerated = location.state?.generated;
    
    if (isMobile && isGenerated) {
      setShowMobileAlert(true);
      // Clean up state so it doesn't show again on manual refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Trigger local asset resolution when public clinic is loaded
  useEffect(() => {
    if (publicClinic) {
      resolveLocalAssets(publicClinic);
    }
  }, [publicClinic?.id, publicClinic?.logoUrl, publicClinic?.stampUrl]);

  // Derive consolidated doctor info
  const clinicMainDoctor = clinic?.doctors?.find(d => d.isMain) || clinic?.doctors?.[0];
  const drName = bill?.doctor?.name || clinicMainDoctor?.name || clinic?.doctorName || bill?.doctorName || '';
  const drQual = bill?.doctor?.qualification || clinicMainDoctor?.qualification || clinic?.doctorQualification || '';
  const drReg = bill?.doctor?.registrationNumber || bill?.doctor?.regNumber || 
                clinicMainDoctor?.registrationNumber || clinicMainDoctor?.regNumber || 
                clinic?.doctorRegNumber || clinic?.doctorRegistration || '';

  // Get the specific signature for the doctor on this bill
  const billDoctorId = bill?.doctor?.id;
  const billDoctor = clinic?.doctors?.find(d => d.id === billDoctorId) || clinicMainDoctor;
  const drSignature = billDoctor?.signatureUrl;

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);

      if (id.startsWith('demo-')) {
        if (id === 'demo-new-bill') {
          const savedBill = sessionStorage.getItem('lastDemoBill');
          if (savedBill) {
            const parsedBill = JSON.parse(savedBill);
            parsedBill.billDate = new Date(parsedBill.billDate);
            setBill(parsedBill);
            setLoading(false);
            return;
          }
        }

        const now = new Date();
        const sampleBills: Record<string, Bill> = {
          'demo-bill-1': {
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
          'demo-bill-2': {
            id: 'demo-bill-2',
            billNumber: 'BILL-2026-002',
            patientName: 'Anjali Gupta',
            patientPhone: '9911223344',
            billDate: now,
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
            createdAt: now,
            updatedAt: now
          }
        };

        if (sampleBills[id]) {
          setBill(sampleBills[id]);
          // Set sample public clinic info for demo mode
          setPublicClinic({
            name: 'Smile Dental Care',
            doctorName: 'Akshit Bhardwaj',
            doctorQualification: 'BDS, MDS (Orthodontics)',
            doctorRegNumber: 'HN-12345-D',
            address: '123, Health Enclave, Sector 15, New Delhi',
            phone: '9876543210',
            email: 'contact@smiledental.com',
            currency: '₹',
            logoUrl: '/logo.svg',
            stampUrl: 'https://picsum.photos/seed/dental-stamp/200/100',
            signatureUrl: 'https://picsum.photos/seed/dental-sig/200/80',
          });
        }
        setLoading(false);
        return;
      }

      try {
        const docSnap = await getDoc(doc(db, 'bills', id));
        if (docSnap.exists()) {
          const data = docSnap.data();
          const billData = { 
            id: docSnap.id, 
            ...data, 
            billDate: ensureDate(data.billDate),
            createdAt: ensureDate(data.createdAt),
            updatedAt: ensureDate(data.updatedAt),
            lastPaymentDate: data.lastPaymentDate ? ensureDate(data.lastPaymentDate) : undefined
          } as Bill;
          setBill(billData);

          // Always fetch clinic info for the specific bill to handle public links
          const clinicSnap = await getDoc(doc(db, 'clinics', billData.clinicId));
          if (clinicSnap.exists()) {
            setPublicClinic({ id: clinicSnap.id, ...clinicSnap.data() });
          }
        } else {
          toast.error('Bill not found');
          if (user) navigate('/bills');
        }
      } catch (error) {
        handleFirestoreError(error, 'get', `bills/${id}`);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate, isDemo, user]);

  const handlePrint = () => {
    toast.info('Opening print dialog...');
    window.print();
  };

  const handleShareWhatsApp = () => {
    if (!bill) return;
    
    if (!bill.patientPhone || bill.patientPhone.trim() === '') {
      toast.error('Patient phone number is missing');
      return;
    }

    // Clean number: remove all non-digits
    let cleanNumber = bill.patientPhone.replace(/\D/g, '');
    
    // Convert to international format (assuming 10-digit numbers are Indian for ₹)
    if (cleanNumber.length === 10) {
      cleanNumber = '91' + cleanNumber;
    } else if (cleanNumber.length < 10) {
      toast.error('Invalid phone number. Please provide a valid 10-digit number.');
      return;
    }

    const billLink = window.location.href;
    const amount = bill.total.toLocaleString();
    
    // Exact professional format requested
    const message = `Hello ${bill.patientName},

Your bill (${bill.billNumber}) from ${clinic?.name} for ₹${amount} is ready.

View it here:
${billLink}`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  const handleDelete = async () => {
    if (!id || loading) return;

    if (isDemo) {
      toast.info('Bills cannot be deleted in demo mode. Login to manage your actual clinic data.');
      return;
    }

    if (confirm('Are you sure you want to delete this bill? This action cannot be undone.')) {
      setLoading(true);
      const loadingToast = toast.loading('Deleting bill...');
      try {
        await deleteDoc(doc(db, 'bills', id));
        toast.dismiss(loadingToast);
        toast.success('Bill deleted successfully');
        navigate('/bills');
      } catch (error: any) {
        toast.dismiss(loadingToast);
        console.error('Delete error:', error);
        toast.error('Failed to delete bill. Please try again.');
        handleFirestoreError(error, 'delete', `bills/${id}`);
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="flex flex-col items-center">
            <h2 className="text-xl font-bold text-gray-900 font-heading">Loading Bill</h2>
            <div className="flex items-center gap-2 text-gray-500 mt-1">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <p className="text-sm font-medium">Fetching details securely...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-rose-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Bill Not Found</h2>
          <p className="text-gray-500 mb-6 font-medium">This bill link may be invalid or has been deleted.</p>
          <Button onClick={() => navigate('/')} className="bg-blue-600">
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  const PageContent = (
    <>
    <div className="flex flex-col gap-6 pb-12 font-sans">
      <style>
        {`
          @media print {
            @page {
              size: A4;
              margin: 0 !important;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              height: 100% !important;
              overflow: hidden !important;
              background-color: white !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .no-print, [data-sonner-toaster], .sonner, footer, header, nav, .sidebar {
              display: none !important;
            }
            .invoice-container {
              width: 210mm !important;
              height: 297mm !important;
              margin: 0 !important;
              padding: 0 !important;
              box-shadow: none !important;
              background-color: white !important;
              position: absolute !important;
              top: 0 !important;
              left: 0 !important;
            }
            .invoice {
              width: 100% !important;
              height: 100% !important;
              padding: 10mm 15mm !important;
              margin: 0 !important;
              box-shadow: none !important;
              border: none !important;
              border-radius: 0 !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: flex-start !important;
              overflow: hidden !important;
              break-inside: avoid !important;
            }
            .invoice-content-wrapper {
              display: flex !important;
              flex-direction: column !important;
              gap: 4mm !important;
            }
            .treatment-table-container {
              flex-grow: 0 !important;
              margin-bottom: 2mm !important;
            }
            .summary-and-footer-wrapper {
              margin-top: 4mm !important;
            }
            .invoice * {
              break-inside: avoid !important;
            }
            table {
              width: 100% !important;
              table-layout: fixed !important;
            }
            tr {
              break-inside: avoid !important;
              page-break-inside: avoid !important;
            }
          }

          @keyframes shine {
            0% { transform: translateX(-100%) skew(-25deg); }
            100% { transform: translateX(300%) skew(-25deg); }
          }
          .shine-effect {
            position: relative;
            overflow: hidden !important;
          }
          .shine-effect::after {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 50%;
            height: 100%;
            background: linear-gradient(
              to right,
              rgba(255, 255, 255, 0) 0%,
              rgba(255, 255, 255, 0.6) 50%,
              rgba(255, 255, 255, 0) 100%
            );
            transform: skew(-25deg);
            pointer-events: none;
          }
          .shine-effect:hover::after {
            animation: shine 0.8s ease-in-out;
          }
        `}
      </style>
      
      {/* Actions Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100 no-print sticky top-0 z-40">
        <div className="flex items-center gap-4 text-left">
          {isOwner && (
            <Button variant="ghost" size="icon" onClick={() => navigate('/bills')} className="rounded-full hover:bg-gray-100">
              <ChevronLeft size={20} />
            </Button>
          )}
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900 font-heading">{bill.billNumber}</h1>
            <p className="text-xs text-gray-500 font-medium">Patient: {bill.patientName}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <motion.div
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 12 }}
            className="relative"
          >
            <Button 
              variant="default" 
              size="lg" 
              onClick={handlePrint} 
              className="h-11 px-8 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 text-white border-none rounded-xl font-black text-sm uppercase tracking-wider shadow-lg shadow-blue-200 hover:shadow-2xl hover:shadow-blue-300 transition-all gap-3 group shine-effect"
            >
              <Printer className="h-5 w-5 text-blue-100 group-hover:text-white transition-all group-hover:rotate-12 duration-300 group-hover:scale-110" /> 
              Print / Save
            </Button>
            {/* Subtle glow pulse for CTA visibility */}
            <motion.div 
              animate={{ opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -inset-0.5 bg-blue-400 rounded-xl blur opacity-20 group-hover:opacity-40 -z-10"
            />
          </motion.div>
          
          {isOwner && (
            <Button variant="outline" size="sm" onClick={handleShareWhatsApp} className="h-9 px-4 border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700 rounded-lg font-bold">
              <MessageSquare className="mr-2 h-4 w-4" /> WhatsApp
            </Button>
          )}

          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), "h-9 w-9 rounded-lg hover:bg-gray-100")}>
                <MoreVertical size={18} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl border-gray-100 shadow-xl">
                <DropdownMenuItem onClick={() => navigate(`/bills/${id}/edit`)} className="gap-2 py-2.5 cursor-pointer">
                  <Edit size={16} className="text-gray-500" /> Edit Bill
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="gap-2 py-2.5 cursor-pointer text-red-600 focus:text-red-600">
                  <Trash2 size={16} /> Delete Bill
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Bill Preview Area */}
        <div className={cn(
          "flex justify-start lg:justify-center overflow-x-auto pb-8 scrollbar-hide print:block print:p-0 print:overflow-visible",
          isOwner ? "lg:col-span-9" : "lg:col-span-12"
        )}>
          <div 
            className="flex flex-col bg-white text-gray-900 font-sans relative invoice shadow-2xl print:shadow-none print:m-0 print:w-full print:max-w-none rounded-none invoice-container" 
            ref={componentRef}
            style={{ width: '210mm', minHeight: '297mm', padding: '10mm 15mm 15mm 15mm' }}
          >
            {/* Background Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
               {clinic?.logoUrl && (
                 <img 
                    src={clinic.logoUrl} 
                    alt="Watermark" 
                    className="w-[350px] aspect-square object-contain opacity-[0.03] filter grayscale mix-blend-multiply" 
                    crossOrigin="anonymous"
                 />
               )}
            </div>

            <div className="flex flex-col relative z-10 invoice-content-wrapper">
              {/* Header: Logo and Clinic Details */}
              <div className="flex justify-between items-center mb-4">
                {/* Left: Clinic Branding */}
                <div className="flex gap-4 items-center">
                  {clinic?.logoUrl && (
                    <img src={clinic.logoUrl} alt="Logo" className="h-16 w-auto object-contain" referrerPolicy="no-referrer" crossOrigin="anonymous" />
                  )}
                  <div className="flex flex-col justify-center">
                    <h2 className="text-xl font-semibold text-slate-900 uppercase tracking-tight leading-none mb-1.5">{clinic?.name || bill?.clinicName || 'Clinic Name'}</h2>
                    <div className="text-[9px] font-medium text-slate-500 uppercase tracking-widest space-y-0.5 opacity-70">
                      <p className="max-w-[280px] leading-relaxed">{clinic?.address || bill?.clinicAddress}</p>
                      <div className="flex flex-col space-y-0.5">
                        <div className="flex items-center gap-1">
                          <Phone size={8} className="text-slate-400" />
                          <span>{clinic?.phone || bill?.clinicPhone}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Mail size={8} className="text-slate-400" />
                          <span className="lowercase tracking-normal">{clinic?.email || bill?.clinicEmail}</span>
                        </div>
                        {(bill.gstEnabled && (clinic?.gstNumber || bill?.clinicGst)) && (
                          <div className="flex items-center gap-1 pt-0.5 opacity-60">
                            <span className="text-slate-400 text-[7px] font-black uppercase tracking-widest">GSTIN</span>
                            <span className="text-slate-900 border-b border-slate-100 font-bold tracking-widest">{clinic?.gstNumber || bill?.clinicGst}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Invoice Meta */}
                <div className="text-right">
                  <h1 className="text-3xl font-bold tracking-[-0.02em] text-slate-900 uppercase mb-4 leading-none">Invoice</h1>
                  <div className="space-y-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                    <div className="flex justify-end gap-3 items-center">
                      <span className="opacity-60">Invoice No</span>
                      <span className="text-slate-900 font-bold">{bill.billNumber}</span>
                    </div>
                    <div className="flex justify-end gap-3 items-center">
                      <span className="opacity-60">Date</span>
                      <span className="text-slate-900 font-bold">{format(ensureDate(bill.billDate), 'dd MMM yyyy')}</span>
                    </div>
                    <div className="pt-2">
                       <div className={cn(
                        "inline-block px-3 py-1 rounded-[4px] text-[8px] font-black uppercase tracking-[0.1em] border shadow-sm",
                        bill.paymentStatus === 'paid' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                        bill.paymentStatus === 'partial' ? "bg-amber-50 text-amber-600 border-amber-100" :
                        "bg-rose-50 text-rose-600 border-rose-100"
                      )}>
                        {bill.paymentStatus}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Minimalist Medical Divider */}
              <div className="w-full h-px bg-slate-100 mb-6" />

              {/* Information Grid: Patient and Doctor */}
              <div className="grid grid-cols-2 gap-8 mb-4 px-2">
                <div className="space-y-3">
                  <h3 className="text-[8px] font-black text-blue-900 uppercase tracking-[0.4em]">Patient Billing Detail</h3>
                  <div className="space-y-0.5">
                    <p className="text-lg font-semibold text-slate-900 uppercase tracking-tight leading-none">{bill.patientName}</p>
                    {bill.patientPhone && (
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest opacity-60">+91 {bill.patientPhone}</p>
                    )}
                  </div>
                </div>
                <div className="text-right space-y-3">
                  <h3 className="text-[8px] font-black text-blue-900 uppercase tracking-[0.4em]">Treatment Done By</h3>
                    <div className="flex flex-col items-end space-y-1">
                      <p className="text-lg font-semibold text-slate-900 uppercase tracking-tight leading-none">
                        {drName.toLowerCase().startsWith('dr') ? drName : `Dr. ${drName}`}
                      </p>
                      {(drQual || drReg) && (
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none">
                          {drQual}{drQual && drReg ? ' | ' : ''}{drReg ? `Reg No: ${drReg}` : ''}
                        </p>
                      )}
                    </div>
                </div>
              </div>

              {/* Treatment Table */}
              <div className="px-1 treatment-table-container">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-900 font-sans">
                      <th className="pb-3 text-left text-[10px] font-black text-slate-300 uppercase tracking-[0.15em] w-12 px-3">#</th>
                      <th className="pb-3 text-left text-[10px] font-black text-slate-300 uppercase tracking-[0.15em] px-3">Treatment Description</th>
                      <th className="pb-3 text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.15em] w-20 px-3">Qty</th>
                      <th className="pb-3 text-right text-[10px] font-black text-slate-300 uppercase tracking-[0.15em] w-28 px-3">Rate</th>
                      <th className="pb-3 text-right text-[10px] font-black text-slate-300 uppercase tracking-[0.15em] w-28 px-3 text-slate-900">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50/50">
                    {bill.items.map((item, idx) => (
                      <tr key={idx} className="print:break-inside-avoid print:page-break-inside-avoid">
                        <td className="py-2 px-3 text-[10px] text-slate-200 font-black">{(idx + 1).toString().padStart(2, '0')}</td>
                        <td className="py-2 px-3">
                          <p className="font-semibold text-slate-700 text-xs tracking-tight uppercase leading-tight">{item.name}</p>
                          {item.description && <p className="text-[9px] text-slate-400 mt-0.5 italic">{item.description}</p>}
                        </td>
                        <td className="py-2 px-3 text-center text-slate-400 font-bold text-xs">{item.quantity || 1}</td>
                        <td className="py-2 px-3 text-right text-slate-400 font-medium text-xs">{clinic?.currency || '₹'}{item.price.toLocaleString()}</td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900 text-sm tracking-tight">{clinic?.currency || '₹'}{item.total.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary and Footer Section */}
              <div className="summary-and-footer-wrapper flex flex-col">
                {/* Summary Section */}
                <div className="mt-2 flex justify-end print:break-inside-avoid px-4">
                <div className="w-full max-w-[300px] space-y-1.5">
                  {/* Subtle Separator Line above Gross Value */}
                  <div className="w-full h-px bg-slate-950/20 mb-1.5" />
                  
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] px-5 opacity-60">
                    <span>Gross Value</span>
                    <span className="text-slate-400 font-black tracking-tighter">{clinic?.currency || '₹'}{bill.subtotal.toLocaleString()}</span>
                  </div>
                  
                  {bill.discount > 0 && (
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] px-5 opacity-60">
                      <span>Discount</span>
                      <span className="text-rose-400 font-black tracking-tighter">-{clinic?.currency || '₹'}{bill.discount.toLocaleString()}</span>
                    </div>
                  )}

                  {bill.gstEnabled && bill.gstAmount && (
                    <div className="flex justify-between items-center text-[11px] font-bold text-slate-300 uppercase tracking-[0.2em] px-6 opacity-60">
                      <span>GST ({bill.gstPercentage}%)</span>
                      <span className="text-slate-400 font-black tracking-tighter">+{clinic?.currency || '₹'}{bill.gstAmount.toLocaleString()}</span>
                    </div>
                  )}
                  
                  <div className="bg-slate-900 text-white p-3 rounded-lg flex justify-between items-center shadow-md relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-12 h-12 bg-white/5 rounded-full -mr-6 -mt-6" />
                    <div className="space-y-0.5 z-10">
                      <p className="text-[8px] font-black uppercase tracking-[0.4em] text-blue-400/80">Total Payable</p>
                      <p className="text-xl font-bold tracking-tighter">{clinic?.currency || '₹'}{bill.total.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-[0.15em] px-6 pt-0.5">
                    <span className="text-slate-300 opacity-70">Net Received</span>
                    <span className="text-emerald-600 font-bold text-base tracking-tighter">{clinic?.currency || '₹'}{(bill.paidAmount || bill.partialAmount || 0).toLocaleString()}</span>
                  </div>

                  {(bill.total - (bill.paidAmount || bill.partialAmount || 0)) > 0 && (
                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-[0.15em] px-6">
                      <span className="text-slate-300 opacity-70">Balance Unpaid</span>
                      <span className="text-rose-600 font-bold text-base tracking-tighter">{clinic?.currency || '₹'}{(bill.total - (bill.paidAmount || bill.partialAmount || 0)).toLocaleString()}</span>
                    </div>
                  )}

                  {bill.notes && (
                    <div className="pt-2 px-4">
                      <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em] mb-0.5 leading-none opacity-40">Important Notes</p>
                      <p className="text-[9px] font-medium text-slate-600 leading-relaxed italic border-l-2 border-slate-100 pl-4">{bill.notes}</p>
                    </div>
                  )}
                </div>
              </div>

                {/* Professional Footer */}
                <div className="pt-4 flex flex-col space-y-4">
                <div className="flex justify-between items-end print:break-inside-avoid px-2">
                  {/* Stamp Area */}
                  <div className="flex flex-col items-center w-48 space-y-0.5">
                    <div className="h-20 w-20 flex items-center justify-center relative border border-dashed border-slate-100 bg-slate-50/5 rounded-full">
                      {showStamp && clinic?.stampUrl ? (
                        <img src={clinic.stampUrl} alt="Seal" className="h-[80%] w-[80%] object-contain mix-blend-multiply opacity-50 filter grayscale transition-all hover:opacity-100 hover:grayscale-0" referrerPolicy="no-referrer" crossOrigin="anonymous" />
                      ) : (
                        <div className="text-[6px] text-slate-200 font-black uppercase tracking-widest text-center px-4 leading-relaxed">
                          Authorized<br/>Clinic Seal
                        </div>
                      )}
                    </div>
                    <p className="text-[7px] font-black text-slate-300 uppercase tracking-[0.1px] leading-none text-center truncate w-full px-2">{clinic?.name || bill?.clinicName || 'Clinic Name'}</p>
                  </div>

                  {/* Signature Area */}
                  <div className="flex flex-col items-end w-64">
                    <div className="h-12 w-full flex items-center justify-end mb-1 px-2">
                      {showSignature && drSignature && (
                        <img src={drSignature} alt="Signature" className="h-full w-auto object-contain mix-blend-multiply opacity-70" referrerPolicy="no-referrer" crossOrigin="anonymous" />
                      )}
                    </div>
                    <div className="w-full border-t border-slate-900/60 pt-2 text-right space-y-0.5 px-1">
                      <p className="text-[11px] font-bold text-slate-800 uppercase tracking-tight leading-none">
                        {drName.toLowerCase().startsWith('dr') ? drName : `Dr. ${drName}`}
                      </p>
                      <div className="space-y-0.5">
                        {(drQual || drReg) && (
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                            {drQual}{drQual && drReg ? ' | ' : ''}{drReg ? `Reg No: ${drReg}` : ''}
                          </p>
                        )}
                        <p className="text-[7px] font-black text-blue-900 uppercase tracking-[0.2em] pt-0.5">Authorized Signatory</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Professional Footer Message */}
                <div className="text-center mt-4 pt-3 border-t border-slate-100/60 print:mt-4">
                   <p className="text-[10px] font-medium text-slate-600 tracking-[0.05em] leading-relaxed">
                    Thank you for visiting <span className="font-semibold">{clinic?.name || bill?.clinicName || 'our clinic'}</span>. Wishing you a healthy smile always.
                   </p>
                </div>

                {/* Brand Footnote */}
                <div className="text-center mt-1 opacity-[0.15]">
                  <p className="text-[6px] font-black uppercase tracking-[0.3em] text-slate-900">Powered by Instant Dental Bill</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

        {/* Sidebar Controls (Hidden for public view) */}
        {isOwner && (
          <div className="lg:col-span-3 space-y-6 no-print">
            <Card className="border-none shadow-sm bg-white sticky top-6">
              <CardContent className="p-6 space-y-6">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Settings className="h-4 w-4 text-blue-600" /> Bill Customization
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-gray-900">Show Stamp</p>
                    <p className="text-[10px] text-gray-500">Include clinic seal</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={showStamp} 
                    onChange={(e) => setShowStamp(e.target.checked)}
                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer"
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-gray-900">Show Signature</p>
                    <p className="text-[10px] text-gray-500">Include doctor's sign</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={showSignature} 
                    onChange={(e) => setShowSignature(e.target.checked)}
                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer"
                  />
                </div>
              </div>

              <Separator className="bg-gray-100" />

              <div className="space-y-3">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Quick Actions</p>
                <Button variant="outline" className="w-full justify-start gap-3 h-10 text-sm font-medium border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition-all" onClick={() => toast.info('Email feature coming soon!')}>
                  <Mail size={16} /> Email to Patient
                </Button>
              </div>

              <div className="pt-4 space-y-4">
                <div className="rounded-xl bg-gray-900 p-5 text-white shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={cn(
                      "rounded-full p-2",
                      bill.paymentStatus === 'paid' ? "bg-green-500/20 text-green-400" : "bg-orange-500/20 text-orange-400"
                    )}>
                      {bill.paymentStatus === 'paid' ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Payment Status</p>
                      <p className="font-bold capitalize text-sm">{bill.paymentStatus}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Total Bill</p>
                      <p className="text-2xl font-black tracking-tight">{clinic?.currency}{bill.total.toLocaleString()}</p>
                    </div>
                    <div className="flex justify-between border-t border-white/10 pt-2">
                      <div>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Paid</p>
                        <p className="text-sm font-bold text-green-400">{clinic?.currency}{(bill.paidAmount || bill.partialAmount || 0).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Due</p>
                        <p className="text-sm font-bold text-orange-400">{clinic?.currency}{(bill.total - (bill.paidAmount || bill.partialAmount || 0)).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-3">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Audit Dates</p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500">Created:</span>
                      <span className="font-bold">{format(ensureDate(bill.createdAt), 'dd MMM yyyy, hh:mm a')}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500">Updated:</span>
                      <span className="font-bold">{format(ensureDate(bill.updatedAt), 'dd MMM yyyy, hh:mm a')}</span>
                    </div>
                    {bill.lastPaymentDate && (
                      <div className="flex justify-between items-center text-xs text-green-600">
                        <span className="font-medium">Payment:</span>
                        <span className="font-bold">{format(ensureDate(bill.lastPaymentDate), 'dd MMM yyyy, hh:mm a')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>

    {/* Mobile Preview Alert */}
    <Dialog open={showMobileAlert} onOpenChange={setShowMobileAlert}>
      <DialogContent className="max-w-[90vw] rounded-2xl p-6 sm:max-w-md">
        <DialogHeader className="space-y-3 text-center sm:text-left">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 sm:mx-0">
            <Laptop className="h-6 w-6 text-blue-600" />
          </div>
          <DialogTitle className="text-xl font-bold">Best viewed on Desktop</DialogTitle>
          <DialogDescription className="text-gray-500 leading-relaxed pt-2">
            Bill preview will looks best in desktop, pls hit print button to see actual bill.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="pt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button 
            className="bg-blue-600 hover:bg-blue-700 font-bold rounded-xl h-11" 
            onClick={() => setShowMobileAlert(false)}
          >
            Understand
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );

  if (isOwner) {
    return <AppLayout>{PageContent}</AppLayout>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-30 px-4 h-16 flex items-center shadow-sm no-print">
        <div className="mx-auto max-w-6xl w-full flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg text-white">
              <Stethoscope size={20} />
            </div>
            <span className="font-bold text-gray-900 tracking-tight">Instant Dental Bill</span>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Powered by Instant Dental Bill</p>
          </div>
        </div>
      </header>
      <main className="p-4 md:p-8 flex-grow">
        <div className="mx-auto max-w-6xl w-full">
          {PageContent}
        </div>
      </main>
      <footer className="py-8 bg-white border-t text-center no-print">
        <p className="text-xs text-gray-400">© 2026 Instant Dental Bill. All rights reserved.</p>
      </footer>
    </div>
  );
}
