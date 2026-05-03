import React, { useEffect, useState, useMemo } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit, collectionGroup } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useClinic } from '../contexts/ClinicContext';
import { handleFirestoreError } from '../lib/error-handler';
import AppLayout from '../components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Search, 
  Filter, 
  Eye, 
  Download, 
  MoreHorizontal,
  Calendar as CalendarIcon,
  Trash2,
  Pencil,
  MessageCircle,
  Stethoscope
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Bill, OrthoVisit, OrthoPatient } from '../types';
import { format, isToday, startOfMonth, endOfMonth, isWithinInterval, subDays, addMonths } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { getWhatsAppUrl, ensureDate, cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Loader2 } from 'lucide-react';
import { deleteDoc, doc } from 'firebase/firestore';
import { toast } from 'sonner';

type UnifiedHistoryItem = (Bill & { source: 'bill' }) | (OrthoVisit & { source: 'ortho', patientName: string, patientId: string });

export default function BillsHistoryPage() {
  const { clinic } = useClinic();
  const { isDemo, user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [bills, setBills] = useState<Bill[]>([]);
  const [orthoVisits, setOrthoVisits] = useState<(OrthoVisit & { patientId: string })[]>([]);
  const [orthoPatients, setOrthoPatients] = useState<Record<string, OrthoPatient>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);

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
        }
      ];

      const sampleOrthoVisits: (OrthoVisit & { patientId: string })[] = [
        {
          id: 'demo-ortho-v1',
          clinicId: 'demo-clinic',
          ownerId: 'demo-user',
          patientId: 'demo-ortho-p1',
          visitDate: now,
          amountPaid: 2500,
          progressNote: 'Braces adjustment',
          nextAppointmentDate: addMonths(now, 1),
          createdAt: now
        }
      ];

      const sampleOrthoPatients: Record<string, OrthoPatient> = {
        'demo-ortho-p1': {
          id: 'demo-ortho-p1',
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
      };

      setBills(sampleBills);
      setOrthoVisits(sampleOrthoVisits);
      setOrthoPatients(sampleOrthoPatients);
      setLoading(false);
      return;
    }

    if (!clinic?.id) return;

    // Fetch Bills
    const billsQuery = query(
      collection(db, 'bills'),
      where('clinicId', '==', clinic?.id),
      orderBy('billDate', 'desc'),
      limit(100)
    );

    const unsubscribeBills = onSnapshot(billsQuery, (snapshot) => {
      const billsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        billDate: ensureDate(doc.data().billDate),
        createdAt: ensureDate(doc.data().createdAt)
      })) as Bill[];
      setBills(billsData);
    }, (error) => {
      handleFirestoreError(error, 'list', 'bills');
    });

    // Fetch Ortho Patients for Lookup
    const patientsQuery = query(
      collection(db, 'orthoPatients'),
      where('clinicId', '==', clinic?.id)
    );

    const unsubscribePatients = onSnapshot(patientsQuery, (snapshot) => {
      const patientsMap: Record<string, OrthoPatient> = {};
      snapshot.docs.forEach(doc => {
        patientsMap[doc.id] = { id: doc.id, ...doc.data() } as OrthoPatient;
      });
      setOrthoPatients(patientsMap);
    }, (error) => {
      handleFirestoreError(error, 'list', 'orthoPatients');
    });

    // Fetch Ortho Visits
    const visitsQuery = query(
      collectionGroup(db, 'visits'),
      where('clinicId', '==', clinic?.id),
      orderBy('visitDate', 'desc'),
      limit(100)
    );

    const unsubscribeVisits = onSnapshot(visitsQuery, (snapshot) => {
      const visitsData = snapshot.docs.map(doc => ({
        id: doc.id,
        patientId: doc.ref.parent.parent?.id,
        ...doc.data(),
        visitDate: ensureDate(doc.data().visitDate),
        createdAt: ensureDate(doc.data().createdAt)
      })) as (OrthoVisit & { patientId: string })[];
      setOrthoVisits(visitsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, 'list', 'orthoVisits');
      setLoading(false);
    });

    return () => {
      unsubscribeBills();
      unsubscribePatients();
      unsubscribeVisits();
    };
  }, [clinic?.id, user?.uid, isDemo]);

  // Combine and unified items
  const unifiedItems = useMemo(() => {
    const combined: UnifiedHistoryItem[] = [
      ...bills.map(b => ({ ...b, source: 'bill' as const })),
      ...orthoVisits.map(v => ({
        ...v,
        source: 'ortho' as const,
        patientName: orthoPatients[v.patientId]?.patientName || 'Unknown Patient',
        patientId: v.patientId
      }))
    ];

    // Sort by date descending
    return combined.sort((a, b) => {
      const dateA = a.source === 'bill' ? ensureDate(a.billDate) : ensureDate(a.visitDate);
      const dateB = b.source === 'bill' ? ensureDate(b.billDate) : ensureDate(b.visitDate);
      return dateB.getTime() - dateA.getTime();
    });
  }, [bills, orthoVisits, orthoPatients]);

  const [filteredItems, setFilteredItems] = useState<UnifiedHistoryItem[]>([]);

  useEffect(() => {
    let result = unifiedItems;
    
    // Apply URL params filters
    const statusParam = searchParams.get('status');
    const filterParam = searchParams.get('filter');

    if (statusParam) {
      if (statusParam === 'pending') {
        result = result.filter(item => {
          if (item.source === 'bill') {
            return item.paymentStatus === 'unpaid' || item.paymentStatus === 'partial';
          }
          return false; // Ortho visits are considered paid
        });
      } else {
        result = result.filter(item => {
          if (item.source === 'bill') return item.paymentStatus === statusParam;
          if (statusParam === 'paid') return true; // Ortho visits are always paid
          return false;
        });
      }
    }

    if (filterParam) {
      const now = new Date();
      if (filterParam === 'today') {
        result = result.filter(item => {
          const date = item.source === 'bill' ? item.billDate : item.visitDate;
          return isToday(date as Date);
        });
      } else if (filterParam === 'this-month') {
        const start = startOfMonth(now);
        const end = endOfMonth(now);
        result = result.filter(item => {
          const date = item.source === 'bill' ? item.billDate : item.visitDate;
          return isWithinInterval(date as Date, { start, end });
        });
      }
    }

    // Apply UI filters
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(item => {
        if (item.source === 'bill') {
          return item.patientName.toLowerCase().includes(lowerSearch) ||
                 item.billNumber.toLowerCase().includes(lowerSearch);
        } else {
          return item.patientName.toLowerCase().includes(lowerSearch) ||
                 'ortho'.includes(lowerSearch);
        }
      });
    }

    if (dateFilter) {
      const dateStr = format(dateFilter, 'yyyy-MM-dd');
      result = result.filter(item => {
        const date = item.source === 'bill' ? item.billDate : item.visitDate;
        return format(date as Date, 'yyyy-MM-dd') === dateStr;
      });
    }

    setFilteredItems(result);
  }, [searchTerm, dateFilter, unifiedItems, searchParams]);

  const handleDelete = async (id: string, source: 'bill' | 'ortho') => {
    if (isDemo) {
      toast.info('Items cannot be deleted in demo mode');
      return;
    }

    if (source === 'ortho') {
      toast.info('Ortho visits should be deleted from the patient detail page to maintain financial consistency');
      return;
    }

    if (confirm('Are you sure you want to delete this bill?')) {
      try {
        await deleteDoc(doc(db, 'bills', id));
        toast.success('Bill deleted successfully');
      } catch (error) {
        toast.error('Failed to delete bill');
      }
    }
  };

  const handleWhatsAppReminder = (bill: Bill) => {
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
      message = `Hello ${bill.patientName},\n\nThis is a friendly reminder from ${clinicName}.\n\nYour bill ${bill.billNumber} dated ${billDateStr} has an unpaid amount of ${currency}${bill.total.toLocaleString()}.\n\nPlease clear the payment at your convenience.\n\nView bill:\n${billLink}\n\nThank you.`;
    } else if (bill.paymentStatus === 'partial') {
      message = `Hello ${bill.patientName},\n\nThis is a friendly reminder from ${clinicName}.\n\nYour bill ${bill.billNumber} dated ${billDateStr} has a pending balance of ${currency}${amountDue.toLocaleString()}.\n\nPlease clear the remaining payment at your convenience.\n\nView bill:\n${billLink}\n\nThank you.`;
    }

    if (message) {
      window.open(getWhatsAppUrl(bill.patientPhone, message), '_blank');
      toast.success(`Opening WhatsApp for ${bill.patientName}`);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            <p className="text-gray-500 font-medium animate-pulse">Loading transaction history...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Transaction History</h1>
            <p className="text-gray-500">View and manage all bills and orthodontic payments</p>
          </div>
          <Link to="/bills/new">
            <Button className="bg-blue-600 hover:bg-blue-700">New Bill</Button>
          </Link>
        </div>

        <Card className="border-none shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <Input 
                  placeholder="Search patient or bill #" 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger className={cn(buttonVariants({ variant: 'outline' }), "gap-2")}>
                    <CalendarIcon size={16} />
                    {dateFilter ? format(dateFilter, 'PPP') : 'Filter by Date'}
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={dateFilter}
                      onSelect={setDateFilter}
                      initialFocus
                    />
                    {dateFilter && (
                      <div className="p-2 border-t">
                        <Button variant="ghost" size="sm" className="w-full" onClick={() => setDateFilter(undefined)}>
                          Clear Filter
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="font-bold">ID / Type</TableHead>
                    <TableHead className="font-bold">Patient</TableHead>
                    <TableHead className="font-bold">Date</TableHead>
                    <TableHead className="font-bold">Amount</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                    <TableHead className="text-right font-bold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.source === 'bill' ? (
                          item.billNumber
                        ) : (
                          <div className="flex items-center gap-1.5 text-blue-600">
                            <Stethoscope size={14} />
                            <span>Ortho Visit</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{item.patientName}</TableCell>
                      <TableCell>{format((item.source === 'bill' ? item.billDate : item.visitDate) as Date, 'MMM dd, yyyy')}</TableCell>
                      <TableCell className="font-bold">
                        {clinic?.currency}{ (item.source === 'bill' ? item.total : item.amountPaid).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {item.source === 'bill' ? (
                          <Badge variant={item.paymentStatus === 'paid' ? 'default' : 'outline'} className={
                            item.paymentStatus === 'paid' ? 'bg-green-100 text-green-700 hover:bg-green-100 border-none' : 'text-orange-600 border-orange-200'
                          }>
                            {item.paymentStatus}
                          </Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">
                            paid
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {item.source === 'bill' && (item.paymentStatus === 'unpaid' || item.paymentStatus === 'partial') && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => handleWhatsAppReminder(item)}
                              title="Send WhatsApp Reminder"
                            >
                              <MessageCircle size={16} />
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}>
                              <MoreHorizontal size={18} />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                className="flex items-center gap-2 cursor-pointer"
                                onClick={() => {
                                  if (item.source === 'bill') {
                                    navigate(`/bills/${item.id}`);
                                  } else {
                                    navigate(`/ortho/${item.patientId}`);
                                  }
                                }}
                              >
                                <Eye size={14} /> {item.source === 'bill' ? 'View / Print' : 'View Patient'}
                              </DropdownMenuItem>
                              
                              {item.source === 'bill' && (
                                <DropdownMenuItem 
                                  className="flex items-center gap-2 cursor-pointer"
                                  onClick={() => navigate(`/bills/${item.id}/edit`)}
                                >
                                  <Pencil size={14} /> Edit Bill
                                </DropdownMenuItem>
                              )}

                              {item.source === 'bill' && (item.paymentStatus === 'unpaid' || item.paymentStatus === 'partial') && (
                                <DropdownMenuItem 
                                  className="flex items-center gap-2 cursor-pointer text-green-600 focus:text-green-600"
                                  onClick={() => handleWhatsAppReminder(item)}
                                >
                                  <MessageCircle size={14} /> WhatsApp Reminder
                                </DropdownMenuItem>
                              )}
                              
                              <DropdownMenuItem 
                                className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600"
                                onClick={() => handleDelete(item.id, item.source)}
                              >
                                <Trash2 size={14} /> Delete {item.source === 'bill' ? 'Bill' : 'Visit'}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredItems.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-gray-500">
                        No transactions found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
