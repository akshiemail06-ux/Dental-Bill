import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useClinic } from '../contexts/ClinicContext';
import { useAuth } from '../contexts/AuthContext';
import { handleFirestoreError } from '../lib/error-handler';
import AppLayout from '../components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Save, Upload, Trash2, Building2, User, MapPin, Phone, Mail, Hash, Crop, Plus, Star, GraduationCap, Award, Stethoscope, Sparkles, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import ImageCropper from '../components/ImageCropper';
import { makeBackgroundTransparent } from '../lib/imageUtils';
import { uploadClinicAsset, deleteClinicAsset } from '../lib/storage';
import { getLocalAsset } from '../lib/localStore';
import { Doctor, Clinic } from '../types';
import { useSearchParams } from 'react-router-dom';

export default function SettingsPage() {
  const { clinic, rawClinic, refreshLocalAssets } = useClinic();
  const { isDemo, user } = useAuth();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'profile');
  const [formData, setFormData] = useState({
    name: '',
    doctorName: '',
    address: '',
    phone: '',
    email: '',
    gstNumber: '',
    currency: '₹',
    logoUrl: '',
    stampUrl: ''
  });

  const [doctors, setDoctors] = useState<Doctor[]>([]);

  // Cropper state
  const [cropperOpen, setCropperOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [currentField, setCurrentField] = useState<string | null>(null);
  const [currentDoctorId, setCurrentDoctorId] = useState<string | null>(null);
  const [cropperTitle, setCropperTitle] = useState('');
  const [cropperAspect, setCropperAspect] = useState(1);

  const formatDoctorName = (name: string) => {
    const trimmed = name.trim();
    if (trimmed === '') return '';
    if (trimmed.toLowerCase().startsWith('dr.') || trimmed.toLowerCase().startsWith('dr ')) {
      return trimmed;
    }
    return `Dr. ${trimmed}`;
  };

  useEffect(() => {
    if (clinic) {
      setFormData({
        name: clinic.name || '',
        doctorName: clinic.doctorName || '',
        address: clinic.address || '',
        phone: clinic.phone || '',
        email: clinic.email || '',
        gstNumber: clinic.gstNumber || '',
        currency: clinic.currency || '₹',
        logoUrl: clinic.logoUrl || '',
        stampUrl: clinic.stampUrl || ''
      });
      setDoctors(clinic.doctors || []);
    }
  }, [clinic]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, field: string, doctorId: string | null = null) => {
    if (isDemo) {
      toast.info('Assets cannot be changed in demo mode. Login to manage your actual clinic.');
      return;
    }
    const file = e.target.files?.[0];
    if (file) {
      // Validation: Type check
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        return toast.error('Unsupported file type. Please upload PNG or JPG/JPEG images.');
      }

      // Validation: Size check (Limit to 5MB for local storage performance)
      if (file.size > 5 * 1024 * 1024) {
        return toast.error('File is too large. Please use a file under 5MB.');
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setCurrentImage(reader.result as string);
        setCurrentField(field);
        setCurrentDoctorId(doctorId);
        
        // Configure cropper based on field
        if (field === 'logoUrl') {
          setCropperTitle('Crop Clinic Logo');
          setCropperAspect(1);
        } else if (field === 'stampUrl') {
          setCropperTitle('Crop Clinic Stamp');
          setCropperAspect(1);
        } else if (field === 'signatureUrl') {
          setCropperTitle('Crop Doctor Signature');
          setCropperAspect(2); // Signatures are usually wider
        }
        
        setCropperOpen(true);
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  const onCropComplete = async (croppedImage: string) => {
    if (!currentField || !clinic?.id) return;

    setLoading(true);
    const mainToastId = toast.loading('Processing image...');

    try {
      let finalImage = croppedImage;
      const type = currentField === 'logoUrl' ? 'logo' : currentField === 'stampUrl' ? 'stamp' : 'signature';
      
      // If it's a signature or stamp, make the background transparent
      if (type === 'signature' || type === 'stamp') {
        toast.message('Processing transparency...', { id: mainToastId });
        finalImage = await makeBackgroundTransparent(croppedImage);
      }

      // Step 1: Save locally for instant UI update
      toast.message(`Saving ${type} locally...`, { id: mainToastId });
      
      const { uploadClinicAsset } = await import('../lib/storage');
      const compressedImage = await uploadClinicAsset(clinic.id, finalImage, type, currentDoctorId);

      // Step 2: UI update (state) using the COMPRESSED image to ensure we're under limits
      if (type === 'signature' && currentDoctorId) {
        setDoctors(doctors.map(d => d.id === currentDoctorId ? { ...d, signatureUrl: compressedImage } : d));
      } else {
        setFormData({ ...formData, [currentField]: compressedImage });
      }

      // Step 3: Update Firestore with the COMPRESSED IMAGE DATA
      // This ensures other devices (like patients viewing bills) can see the assets
      if (type === 'signature' && currentDoctorId) {
        const updatedDoctors = doctors.map(d => {
          const isTarget = d.id === currentDoctorId;
          return {
            id: d.id,
            name: d.name || '',
            qualification: d.qualification || '',
            registrationNumber: (d.registrationNumber || (d as any).regNumber || '').trim(),
            isMain: !!d.isMain,
            signatureUrl: isTarget ? compressedImage : (d.signatureUrl || '')
          };
        });

        await updateDoc(doc(db, 'clinics', clinic.id), {
          doctors: updatedDoctors,
          updatedAt: serverTimestamp()
        });
      } else {
        await updateDoc(doc(db, 'clinics', clinic.id), {
          [currentField]: compressedImage,
          updatedAt: serverTimestamp()
        });
      }

      setCropperOpen(false);
      setLoading(false);
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} saved and synced!`, { id: mainToastId });

      if (refreshLocalAssets) {
        await refreshLocalAssets();
      }
    } catch (error) {
      console.error('Asset process failed:', error);
      toast.error('Failed to process image', { id: mainToastId });
    } finally {
      setLoading(false);
      setCropperOpen(false);
      setCurrentImage(null);
      setCurrentField(null);
      setCurrentDoctorId(null);
    }
  };

  const handleRemoveAsset = async (field: string, doctorId: string | null = null) => {
    if (isDemo) {
      toast.info('Assets cannot be removed in demo mode.');
      return;
    }
    if (!clinic?.id) return;

    const urlToDelete = field === 'signatureUrl' && doctorId 
      ? doctors.find(d => d.id === doctorId)?.signatureUrl 
      : (formData as any)[field];
    
    if (urlToDelete) {
      await deleteClinicAsset(urlToDelete);
    }
    
    if (field === 'signatureUrl' && doctorId) {
      const updatedDoctors = doctors.map(d => {
        const isTarget = d.id === doctorId;
        return {
          id: d.id,
          name: d.name || '',
          qualification: d.qualification || '',
          registrationNumber: (d.registrationNumber || d.regNumber || '').trim(),
          isMain: !!d.isMain,
          signatureUrl: isTarget ? '' : (d.signatureUrl || '')
        };
      });

      // Final sanitization to strip base64 from other doctors
      const sanitizedDoctors = updatedDoctors.map(d => {
        const cleanDoc = { ...d };
        if (cleanDoc.signatureUrl && cleanDoc.signatureUrl.startsWith('data:image')) {
          const originalDoc = clinic.doctors?.find((orig: any) => orig.id === d.id);
          if (originalDoc && originalDoc.signatureUrl && originalDoc.signatureUrl.startsWith('local-asset:')) {
            cleanDoc.signatureUrl = originalDoc.signatureUrl;
          } else {
            cleanDoc.signatureUrl = '';
          }
        }
        return cleanDoc;
      });

      setDoctors(updatedDoctors);
      await updateDoc(doc(db, 'clinics', clinic.id), {
        doctors: sanitizedDoctors,
        updatedAt: serverTimestamp()
      });
    } else {
      setFormData({ ...formData, [field]: '' });
      await updateDoc(doc(db, 'clinics', clinic.id), {
        [field]: '',
        updatedAt: serverTimestamp()
      });
    }
    
    await refreshLocalAssets();
    toast.success('Asset removed from this device');
  };

  const handleAddDoctor = () => {
    const newDoctor: Doctor = {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      qualification: '',
      registrationNumber: '',
      isMain: doctors.length === 0
    };
    setDoctors([...doctors, newDoctor]);
  };

  const handleUpdateDoctor = (id: string, field: keyof Doctor, value: any) => {
    setDoctors(doctors.map(doc => {
      if (doc.id === id) {
        let finalValue = value;
        if (field === 'name') {
          // We'll format on blur or submit, but let's keep it simple for now
        }
        return { ...doc, [field]: finalValue };
      }
      return doc;
    }));
  };

  const handleRemoveDoctor = (id: string) => {
    if (doctors.length <= 1) {
      return toast.error('At least one doctor is required');
    }
    const doctorToRemove = doctors.find(d => d.id === id);
    const newDoctors = doctors.filter(doc => doc.id !== id);
    if (doctorToRemove?.isMain && newDoctors.length > 0) {
      newDoctors[0].isMain = true;
    }
    setDoctors(newDoctors);
  };

  const handleSetMainDoctor = (id: string) => {
    setDoctors(doctors.map(doc => ({
      ...doc,
      isMain: doc.id === id
    })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isDemo) {
      toast.info('Settings cannot be changed in demo mode. Login to manage your actual clinic.');
      return;
    }

    if (!clinic?.id || loading) return;

    // Validation
    if (!formData.name.trim()) {
      return toast.error('Clinic Name is required');
    }

    if (doctors.length === 0 || doctors.some(d => !d.name.trim())) {
      return toast.error('Please ensure all doctors have a name');
    }

    setLoading(true);
    const loadingToast = toast.loading('Updating clinic profile...');
    
    try {
      // Format clinic and doctor data to UPPERCASE as requested
      const uppercaseClinicName = formData.name.trim().toUpperCase();
      const uppercaseAddress = (formData.address || '').trim().toUpperCase();
      
      const formattedDoctors = doctors.map(d => ({
        id: d.id,
        name: d.name.trim().toUpperCase().startsWith('DR. ') ? d.name.trim().toUpperCase() : `DR. ${d.name.trim().toUpperCase()}`,
        qualification: (d.qualification || '').trim().toUpperCase(),
        registrationNumber: (d.registrationNumber || d.regNumber || '').trim().toUpperCase(),
        isMain: !!d.isMain,
        signatureUrl: d.signatureUrl || ''
      }));

      const mainDoctor = formattedDoctors.find(d => d.isMain) || formattedDoctors[0];

      // Helper to allow Base64 data to sync branding across devices
      const sanitizeForFirestore = (data: any) => {
        // We now allow Base64 data for branding assets (logo, stamp, signature) 
        // to ensure patients can see them on their devices when viewing bills.
        // The images are aggressively compressed in the storage layer to stay well under 1MB.
        return { ...data };
      };

      // Fetch logo and stamp URLs to save in Firestore
      const finalData: any = {
        ownerId: (rawClinic?.ownerId || clinic?.ownerId || user?.uid || ''), 
        name: uppercaseClinicName,
        address: uppercaseAddress,
        phone: (formData.phone || '').trim(),
        email: (formData.email || '').trim(),
        gstNumber: (formData.gstNumber || '').trim().toUpperCase(),
        currency: (formData.currency || '₹').trim(),
        logoUrl: formData.logoUrl || '', 
        stampUrl: formData.stampUrl || '',
        doctorName: mainDoctor ? mainDoctor.name : '', 
        doctorQualification: mainDoctor ? mainDoctor.qualification : '',
        doctorRegNumber: mainDoctor ? (mainDoctor.registrationNumber || '') : '',
        doctors: formattedDoctors
      };

      // Apply sanitization to the payload BEFORE the change check and update
      const firestorePayload = sanitizeForFirestore(finalData);

      // Log the exact object being sent to Firestore
      console.log('Sending sanitized clinic data to Firestore:', firestorePayload);

      // Optimization: Compare with current raw clinic data (server state) to avoid redundant writes
      const hasChanged = JSON.stringify(firestorePayload) !== JSON.stringify(rawClinic);

      if (!hasChanged) {
        toast.dismiss(loadingToast);
        toast.success('Settings are already up to date');
        setLoading(false);
        // Still allow tab switching for UX flow
        if (activeTab === 'profile') setActiveTab('doctors');
        else if (activeTab === 'doctors') setActiveTab('branding');
        return;
      }

      // Add server-side timestamp only if something actually changed
      firestorePayload.updatedAt = serverTimestamp();

      // Final Size Safeguard (Safeguard 8)
      // Firestore has a 1MB limit. We check if the payload is approaching this limit.
      const payloadString = JSON.stringify(firestorePayload);
      const payloadSize = payloadString.length;
      
      if (payloadSize > 800000) { // 800KB warning (approaching 1MB limit)
        toast.error(`Settings data is too large (${Math.round(payloadSize / 1024)}KB). Please try using smaller images for logo/signatures.`);
        setLoading(false);
        toast.dismiss(loadingToast);
        return false;
      }

      await updateDoc(doc(db, 'clinics', clinic.id), firestorePayload);
      
      toast.dismiss(loadingToast);
      toast.success('Clinic profile updated successfully');

      // Auto switch tabs for onboarding flow
      if (activeTab === 'profile') {
        setActiveTab('doctors');
      } else if (activeTab === 'doctors') {
        setActiveTab('branding');
      } else if (activeTab === 'branding') {
        toast.info('Setup complete. You can now start generating bills.');
      }
      return true;
    } catch (error: any) {
      toast.dismiss(loadingToast);
      console.error('Error updating clinic:', error);
      toast.error('Failed to update clinic profile. Please try again.');
      handleFirestoreError(error, 'update', `clinics/${clinic.id}`);
      return false;
    } finally {
      setLoading(false);
    }
  };
  return (
    <AppLayout>
      <div className="flex flex-col max-w-5xl mx-auto px-4 py-4 md:py-6">
        {/* Header Section - Compact */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900 leading-none">Settings & Branding</h1>
              <p className="text-gray-500 text-xs mt-1">Configure your professional clinic profile</p>
            </div>
          </div>
          {isDemo && (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              Demo Mode
            </Badge>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          {/* Unified Professional Wizard Steps */}
          <div className="relative mb-6">
            <TabsList className="grid w-full grid-cols-3 h-14 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/50 shadow-sm">
              <TabsTrigger 
                value="profile" 
                className="flex items-center justify-center gap-2 rounded-lg transition-all data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-600 group"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 group-data-[state=active]:bg-blue-600 group-data-[state=active]:text-white text-[10px] font-black transition-colors">1</div>
                <span className="font-bold text-[11px] uppercase tracking-wider text-slate-500 group-data-[state=active]:text-blue-700">Clinic Profile</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="doctors" 
                className="flex items-center justify-center gap-2 rounded-lg transition-all data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-600 group"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 group-data-[state=active]:bg-blue-600 group-data-[state=active]:text-white text-[10px] font-black transition-colors">2</div>
                <span className="font-bold text-[11px] uppercase tracking-wider text-slate-500 group-data-[state=active]:text-blue-700">Manage Doctors</span>
              </TabsTrigger>

              <TabsTrigger 
                value="branding" 
                className="flex items-center justify-center gap-2 rounded-lg transition-all data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-600 group"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 group-data-[state=active]:bg-blue-600 group-data-[state=active]:text-white text-[10px] font-black transition-colors">3</div>
                <span className="font-bold text-[11px] uppercase tracking-wider text-slate-500 group-data-[state=active]:text-blue-700">Branding</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <form onSubmit={handleSubmit} className="flex-1">
            <AnimatePresence mode="wait">
              {/* Tab 1: Clinic Profile */}
              {activeTab === 'profile' && (
                <TabsContent value="profile" className="mt-0 focus-visible:outline-none">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }} 
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Card className="border-none shadow-xl shadow-slate-200/50 ring-1 ring-slate-200 overflow-hidden rounded-2xl">
                      <CardHeader className="bg-white border-b border-slate-50 py-5 px-8">
                        <div className="flex items-center gap-3">
                          <Building2 className="text-blue-600" size={22} />
                          <div>
                            <CardTitle className="text-xl font-bold text-slate-900">Clinic Identity</CardTitle>
                            <p className="text-slate-500 text-[11px] uppercase font-bold tracking-tighter">Information used for digital billing and prescriptions</p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-8 bg-white">
                        <div className="grid gap-6 md:grid-cols-2">
                          <div className="space-y-1.5">
                            <Label htmlFor="name" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Clinic Name</Label>
                            <Input id="name" value={formData.name} onChange={handleChange} required disabled={isDemo} className="h-12 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-600 font-bold text-slate-900" placeholder="e.g. CITY DENTAL CARE" />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="email" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Official Email</Label>
                            <Input id="email" type="email" value={formData.email} onChange={handleChange} disabled={isDemo} className="h-12 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-100" placeholder="contact@yourclinic.com" />
                          </div>
                          <div className="md:col-span-2 space-y-1.5">
                            <Label htmlFor="address" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Physical Address</Label>
                            <Input id="address" value={formData.address} onChange={handleChange} required disabled={isDemo} className="h-12 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-100" placeholder="Full address as it should appear on bills" />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="phone" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Phone</Label>
                            <Input id="phone" value={formData.phone} onChange={handleChange} disabled={isDemo} className="h-12 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-100 font-mono" placeholder="+91 XXXX XXX XXX" />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="gstNumber" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GST Number (Optional)</Label>
                            <Input id="gstNumber" value={formData.gstNumber} onChange={handleChange} disabled={isDemo} className="h-12 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-100 font-mono text-sm uppercase" placeholder="27AAAAA0000A1Z5" />
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="bg-slate-50 px-8 py-5 flex justify-between items-center border-t border-slate-100">
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Profile Readiness: 33%</span>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 font-black h-12 px-8 rounded-xl active:scale-95 transition-all" disabled={loading || isDemo}>
                          {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                          Save & Continue
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                </TabsContent>
              )}

              {/* Tab 2: Doctors */}
              {activeTab === 'doctors' && (
                <TabsContent value="doctors" className="mt-0 focus-visible:outline-none">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }} 
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Card className="border-none shadow-xl shadow-slate-200/50 ring-1 ring-slate-200 overflow-hidden rounded-2xl">
                      <CardHeader className="bg-white border-b border-slate-50 py-5 px-8 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Stethoscope className="text-blue-600" size={22} />
                          <div>
                            <CardTitle className="text-xl font-bold text-slate-900">Medical Professionals</CardTitle>
                            <p className="text-slate-500 text-[11px] uppercase font-bold tracking-tighter">Add doctors and orthodontists at your clinic</p>
                          </div>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={handleAddDoctor} disabled={isDemo} className="h-10 px-5 rounded-xl text-blue-600 border-blue-100 hover:bg-blue-50 font-black uppercase tracking-tighter text-[10px]">
                          <Plus className="mr-1.5 h-4 w-4" /> Add Doctor
                        </Button>
                      </CardHeader>
                      <CardContent className="p-6 md:p-8 space-y-4 max-h-[55vh] overflow-y-auto">
                        {doctors.map((doc, index) => (
                          <div key={doc.id} className="relative p-6 rounded-2xl border border-slate-100 bg-slate-50/50 group transition-all hover:bg-white hover:ring-2 hover:ring-blue-100 hover:shadow-md">
                            <div className="flex flex-col md:flex-row gap-8">
                              <div className="flex-1 space-y-5">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    {doc.isMain ? (
                                      <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ring-1 ring-blue-200">
                                        <Star size={10} fill="currentColor" /> Primary Consultant
                                      </div>
                                    ) : (
                                      <button type="button" onClick={() => handleSetMainDoctor(doc.id)} className="text-[9px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest bg-white border border-slate-100 px-3 py-1 rounded-full transition-colors">Make Primary</button>
                                    )}
                                  </div>
                                  {!doc.isMain && (
                                    <button type="button" onClick={() => handleRemoveDoctor(doc.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1">
                                      <Trash2 size={16} />
                                    </button>
                                  )}
                                </div>
                                <div className="grid gap-5 md:grid-cols-3">
                                  <div className="space-y-1.5">
                                    <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Full Name</Label>
                                    <Input value={doc.name} onChange={(e) => handleUpdateDoctor(doc.id, 'name', e.target.value)} required disabled={isDemo} className="h-11 bg-white border-slate-200 font-bold focus:border-blue-600" placeholder="e.g. Dr. Jane Fox" />
                                  </div>
                                  <div className="space-y-1.5">
                                    <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Degrees</Label>
                                    <Input value={doc.qualification} onChange={(e) => handleUpdateDoctor(doc.id, 'qualification', e.target.value)} disabled={isDemo} className="h-11 bg-white border-slate-200 text-xs" placeholder="BDS, MDS" />
                                  </div>
                                  <div className="space-y-1.5">
                                    <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Reg. ID</Label>
                                    <Input value={doc.registrationNumber} onChange={(e) => handleUpdateDoctor(doc.id, 'registrationNumber', e.target.value)} disabled={isDemo} className="h-11 bg-white border-slate-200 font-mono text-xs" placeholder="REG-XXX" />
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col items-center justify-center border-l border-slate-100 pl-8 md:w-40 min-h-[100px]">
                                <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Digital Signature</Label>
                                {doc.signatureUrl ? (
                                  <div className="relative group/sig">
                                    <div className="h-12 w-32 object-contain border border-slate-100 rounded-lg p-1.5 bg-white shadow-sm ring-1 ring-slate-50 flex items-center justify-center">
                                      <img src={doc.signatureUrl} alt="Signature" className="max-h-full max-w-full" />
                                    </div>
                                    <button type="button" onClick={() => handleRemoveAsset('signatureUrl', doc.id)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg opacity-0 group-hover/sig:opacity-100 transition-opacity">
                                      <Trash2 size={10} />
                                    </button>
                                  </div>
                                ) : (
                                  <Label htmlFor={`sig-upload-${doc.id}`} className="cursor-pointer flex flex-col items-center justify-center h-12 w-32 border-2 border-dashed border-slate-200 rounded-xl bg-white hover:bg-blue-50 hover:border-blue-400 transition-all group/up">
                                    <Upload size={14} className="text-slate-300 group-hover/up:text-blue-500 transition-colors" />
                                    <input id={`sig-upload-${doc.id}`} type="file" className="hidden" accept="image/*" onChange={(e) => handleFileSelect(e, 'signatureUrl', doc.id)} />
                                  </Label>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                      <CardFooter className="bg-slate-50 px-8 py-5 flex justify-between items-center border-t border-slate-100">
                         <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Profile Readiness: 66%</span>
                         <div className="flex gap-3">
                           <Button type="button" variant="ghost" onClick={() => setActiveTab('profile')} className="h-11 px-6 text-xs font-bold text-slate-400 hover:text-slate-600">Previous</Button>
                           <Button type="submit" className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 font-black h-11 px-8 rounded-xl active:scale-95 transition-all" disabled={loading || isDemo}>
                             Save & Continue
                           </Button>
                         </div>
                      </CardFooter>
                    </Card>
                  </motion.div>
                </TabsContent>
              )}

              {/* Tab 3: Branding */}
              {activeTab === 'branding' && (
                <TabsContent value="branding" className="mt-0 focus-visible:outline-none">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }} 
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Card className="border-none shadow-xl shadow-slate-200/50 ring-1 ring-slate-200 overflow-hidden rounded-2xl">
                      <CardHeader className="bg-white border-b border-slate-50 py-5 px-8">
                        <div className="flex items-center gap-3">
                          <Sparkles className="text-blue-600" size={22} />
                          <div>
                            <CardTitle className="text-xl font-bold text-slate-900">Clinical Branding</CardTitle>
                            <p className="text-slate-500 text-[11px] uppercase font-bold tracking-tighter">Your clinic's official symbols for authentic bills</p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-8 md:p-10 bg-white">
                        <div className="grid gap-12 md:grid-cols-2">
                          {/* Logo Section */}
                          <div className="flex flex-col items-center space-y-4">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Clinic Logo</Label>
                            {formData.logoUrl ? (
                              <div className="relative group/logo">
                                <div className="h-40 w-40 object-contain border-2 border-slate-100 rounded-[2rem] p-6 bg-white shadow-sm ring-1 ring-slate-50 transition-all flex items-center justify-center">
                                  <img src={formData.logoUrl} alt="Logo" className="max-h-full max-w-full" />
                                </div>
                                <button type="button" onClick={() => handleRemoveAsset('logoUrl')} className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-2.5 shadow-xl opacity-0 group-hover/logo:opacity-100 transition-opacity">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            ) : (
                              <Label htmlFor="logo-upload" className="flex flex-col items-center justify-center h-40 w-40 border-2 border-dashed border-slate-200 rounded-[2rem] bg-slate-50/50 cursor-pointer hover:bg-blue-50 hover:border-blue-400 transition-all group/up">
                                <Upload className="mb-3 text-slate-300 group-hover/up:text-blue-600" size={28} />
                                <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest border border-blue-100 bg-white px-4 py-1.5 rounded-full">Upload Logo</span>
                                <input id="logo-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handleFileSelect(e, 'logoUrl')} />
                              </Label>
                            )}
                          </div>

                          {/* Stamp Section */}
                          <div className="flex flex-col items-center space-y-4">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Legal Stamp</Label>
                            {formData.stampUrl ? (
                              <div className="relative group/stamp">
                                <div className="h-40 w-40 object-contain border-2 border-slate-100 rounded-[2rem] p-6 bg-white shadow-sm ring-1 ring-slate-50 transition-all flex items-center justify-center">
                                  <img src={formData.stampUrl} alt="Stamp" className="max-h-full max-w-full" />
                                </div>
                                <button type="button" onClick={() => handleRemoveAsset('stampUrl')} className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-2.5 shadow-xl opacity-0 group-hover/stamp:opacity-100 transition-opacity">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            ) : (
                              <Label htmlFor="stamp-upload" className="flex flex-col items-center justify-center h-40 w-40 border-2 border-dashed border-slate-200 rounded-[2rem] bg-slate-50/50 cursor-pointer hover:bg-blue-50 hover:border-blue-400 transition-all group/up">
                                <Upload className="mb-3 text-slate-300 group-hover/up:text-blue-600" size={28} />
                                <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest border border-blue-100 bg-white px-4 py-1.5 rounded-full">Upload Stamp</span>
                                <input id="stamp-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handleFileSelect(e, 'stampUrl')} />
                              </Label>
                            )}
                          </div>
                        </div>

                        <div className="mt-12 p-6 bg-slate-900 text-white rounded-2xl shadow-xl relative overflow-hidden group">
                           <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-1000"></div>
                           <div className="flex items-start gap-4">
                             <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg border border-white/10">
                               <ShieldCheck size={24} />
                             </div>
                             <div>
                               <h4 className="font-bold text-sm mb-1">Identity Security Active</h4>
                               <p className="text-[11px] opacity-70 leading-relaxed max-w-lg">Your medical credentials and branding assets are encrypted and stored in your private cloud. They will only appear on invoices generated by you.</p>
                             </div>
                           </div>
                        </div>
                      </CardContent>
                      <CardFooter className="bg-slate-50 px-8 py-5 flex justify-between items-center border-t border-slate-100">
                         <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Setup Status: Ready</span>
                         <div className="flex gap-3">
                            <button type="button" onClick={() => setActiveTab('doctors')} className="h-11 px-6 text-xs font-bold text-slate-400 hover:text-slate-600">Previous</button>
                            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-200 font-black h-12 px-10 rounded-xl active:scale-95 transition-all" disabled={loading || isDemo}>
                              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                              Complete Profile
                            </Button>
                         </div>
                      </CardFooter>
                    </Card>
                  </motion.div>
                </TabsContent>
              )}
            </AnimatePresence>
          </form>
        </Tabs>
      </div>



      {cropperOpen && currentImage && (
        <ImageCropper
          image={currentImage}
          title={cropperTitle}
          aspect={cropperAspect}
          onCropComplete={onCropComplete}
          onCancel={() => {
            setCropperOpen(false);
            setCurrentImage(null);
            setCurrentField(null);
          }}
        />
      )}
    </AppLayout>
  );
}
