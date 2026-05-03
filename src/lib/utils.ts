import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatWhatsAppNumber(phone: string): string {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // If it's a 10-digit Indian number, prepend 91
  if (cleaned.length === 10) {
    return `91${cleaned}`;
  }
  
  return cleaned;
}

export function getWhatsAppUrl(phone: string, message: string): string {
  const formattedPhone = formatWhatsAppNumber(phone);
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
}

export function ensureDate(dateVal: any): Date {
  if (!dateVal) return new Date();
  if (dateVal instanceof Date) return dateVal;
  if (typeof dateVal.toDate === 'function') return dateVal.toDate();
  if (dateVal.seconds) return new Date(dateVal.seconds * 1000);
  const parsed = new Date(dateVal);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

export function getAuthErrorMessage(error: any): string {
  const code = error?.code || error?.message || '';
  const domain = window.location.hostname;
  
  if (code.includes('auth/unauthorized-domain')) {
    return `This domain (${domain}) is not authorized for Google Sign-in. Please add it to your Authorized Domains in the Firebase Console (Authentication > Settings > Authorized Domains).`;
  }
  if (code.includes('auth/invalid-email')) {
    return 'The email address is badly formatted. Please ensure there are no extra spaces.';
  }
  if (code.includes('auth/email-already-in-use')) {
    return 'This email is already in use by another account. Perhaps you signed up with Google?';
  }
  if (code.includes('auth/weak-password')) {
    return 'The password is too weak. Please use at least 6 characters.';
  }
  if (code.includes('auth/user-not-found') || code.includes('auth/wrong-password') || code.includes('auth/invalid-credential')) {
    return 'Invalid email or password. Please check your credentials.';
  }
  if (code.includes('auth/too-many-requests')) {
    return 'Too many failed attempts. Please try again later.';
  }
  if (code.includes('auth/network-request-failed')) {
    return 'A network error occurred. Please check your internet connection or disable ad-blockers/VPNs that might be blocking Firebase.';
  }
  if (code.includes('auth/popup-blocked')) {
    return 'The sign-in popup was blocked by your browser. Please allow popups for this site.';
  }
  if (code.includes('auth/cancelled-popup-request')) {
    return 'Sign-in was cancelled. Please try again.';
  }
  
  return error.message || 'An authentication error occurred. Please try again.';
}
