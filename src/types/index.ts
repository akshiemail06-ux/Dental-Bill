import { Timestamp } from 'firebase/firestore';

export type PlanType = 'trial' | 'basic' | 'pro' | 'premium';

export interface Subscription {
  planType: PlanType;
  billsUsed: number;
  billLimit: number | 'unlimited';
  trialStartDate: Timestamp | Date;
  trialEndDate: Timestamp | Date;
  purchasedAt?: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export interface UserProfile {
  uid: string;
  email: string;
  clinicId?: string;
  role: 'admin' | 'staff';
  createdAt: Timestamp | Date;
  subscription?: Subscription;
}

export interface Doctor {
  id: string;
  name: string;
  qualification: string;
  registrationNumber?: string;
  regNumber?: string;
  isMain: boolean;
  signatureUrl?: string;
}

export interface Clinic {
  id: string;
  name: string;
  doctorName: string;
  doctorQualification?: string;
  doctorRegNumber?: string;
  address: string;
  phone: string;
  email: string;
  gstNumber?: string;
  logoUrl?: string;
  stampUrl?: string;
  signatureUrl?: string;
  currency: string;
  dailyRevenueNotification?: boolean;
  ownerId: string;
  doctors?: Doctor[];
  createdAt: Timestamp | Date;
  updatedAt?: Timestamp | Date;
}

export interface BillItem {
  id?: string;
  name: string;
  description?: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Bill {
  id: string;
  clinicId: string;
  clinicName?: string;
  clinicAddress?: string;
  clinicPhone?: string;
  clinicEmail?: string;
  clinicGst?: string;
  patientName: string;
  patientPhone?: string;
  billDate: Timestamp | Date;
  billNumber: string;
  items: BillItem[];
  discount: number;
  gstEnabled?: boolean;
  gstPercentage?: number;
  subtotal: number;
  gstAmount?: number;
  total: number;
  notes?: string;
  paymentStatus: 'paid' | 'unpaid' | 'partial' | 'draft';
  partialAmount?: number;
  paidAmount?: number;
  dueAmount?: number;
  paymentMethod?: string;
  doctorName?: string;
  doctor?: Doctor;
  ownerId: string;
  createdAt: Timestamp | Date;
  updatedAt?: Timestamp | Date;
  lastPaymentDate?: Timestamp | Date;
}

export interface OrthoVisit {
  id: string;
  clinicId: string;
  ownerId: string;
  visitDate: Timestamp | Date;
  amountPaid: number;
  progressNote: string;
  nextAppointmentDate: Timestamp | Date;
  remarks?: string;
  createdAt: Timestamp | Date;
}

export interface OrthoPatient {
  id: string;
  clinicId: string;
  ownerId: string;
  patientName: string;
  mobileNumber: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  startDate: Timestamp | Date;
  treatmentPlan: string;
  totalAmount: number;
  monthlyInstallment: number;
  amountPaid: number;
  remainingAmount: number;
  nextAppointmentDate: Timestamp | Date;
  notes?: string;
  status: 'active' | 'completed';
  lastVisitDate?: Timestamp | Date;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export type OperationType = 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}
