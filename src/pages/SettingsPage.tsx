import React, { useState, useEffect } from 'react';
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
import { Loader2, Save, Upload, Trash2, Building2, User, MapPin, Phone, Mail, Hash, Crop, Plus, Star, GraduationCap, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import ImageCropper from '../components/ImageCropper';
import { makeBackgroundTransparent } from '../lib/imageUtils';
import { uploadClinicAsset, deleteClinicAsset } from '../lib/storage';
import { Doctor } from '../types';
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
      const localRef = await uploadClinicAsset(clinic.id, finalImage, type, currentDoctorId);

      // Step 2: UI update (state)
      if (type === 'signature' && currentDoctorId) {
        setDoctors(doctors.map(d => d.id === currentDoctorId ? { ...d, signatureUrl: finalImage } : d));
      } else {
        setFormData({ ...formData, [currentField]: finalImage });
      }

      // Step 3: Update Firestore with the LOCAL REFERENCE
      // This tells other devices/reloads where to look in IndexedDB
      if (type === 'signature' && currentDoctorId) {
        const updatedDoctors = doctors.map(d => {
          const isTarget = d.id === currentDoctorId;
          return {
            id: d.id,
            name: d.name || '',
            qualification: d.qualification || '',
            registrationNumber: (d.registrationNumber || (d as any).regNumber || '').trim(),
            isMain: !!d.isMain,
            signatureUrl: isTarget ? localRef : (d.signatureUrl || '')
          };
        });

        // Ensure we don't send base64 data to Firestore
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

        await updateDoc(doc(db, 'clinics', clinic.id), {
          doctors: sanitizedDoctors,
          updatedAt: serverTimestamp()
        });
      } else {
        await updateDoc(doc(db, 'clinics', clinic.id), {
          [currentField]: localRef,
          updatedAt: serverTimestamp()
        });
      }

      setCropperOpen(false);
      setLoading(false);
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} saved locally on this device!`, { id: mainToastId });

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

      // Helper to strip base64 data to prevent Firestore size limit errors
      const sanitizeForFirestore = (data: any) => {
        const sanitized = { ...data };
        
        // IMPORTANT: Branding assets (logo, stamp, signature) are stored locally.
        // The Firestore field should only contain a "local-asset:ID" reference.
        
        // If the current value in formData is base64 (resolved), 
        // we should REVERT it to the original local-asset reference from Firestore
        // to avoid overwriting the cloud reference with an empty string or base64.

        const getOriginalRef = (currentVal: string, field: string) => {
          if (currentVal?.startsWith('data:image')) {
            const originalRef = (rawClinic as any)?.[field];
            if (originalRef?.startsWith('local-asset:')) return originalRef;
            return ''; // If no original ref, don't save base64
          }
          return currentVal;
        };

        sanitized.logoUrl = getOriginalRef(sanitized.logoUrl, 'logoUrl');
        sanitized.stampUrl = getOriginalRef(sanitized.stampUrl, 'stampUrl');
        
        // Sanitize doctors array
        if (sanitized.doctors) {
          sanitized.doctors = sanitized.doctors.map((d: any) => {
            const cleanDoc = { ...d };
            if (cleanDoc.signatureUrl?.startsWith('data:image')) {
              const originalDoc = rawClinic?.doctors?.find((orig: any) => orig.id === d.id);
              if (originalDoc?.signatureUrl?.startsWith('local-asset:')) {
                cleanDoc.signatureUrl = originalDoc.signatureUrl;
              } else {
                cleanDoc.signatureUrl = '';
              }
            }
            return cleanDoc;
          });
        }
        
        return sanitized;
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
      const payloadSize = JSON.stringify(firestorePayload).length;
      if (payloadSize > 500000) { // 500KB limit (half of Firestore limit) to be safe
        throw new Error(`Payload size too large (${payloadSize} bytes). Please ensure images are not being included in text data.`);
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
    } catch (error: any) {
      toast.dismiss(loadingToast);
      console.error('Error updating clinic:', error);
      toast.error('Failed to update clinic profile. Please try again.');
      handleFirestoreError(error, 'update', `clinics/${clinic.id}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Settings</h1>
          <p className="text-gray-500">Manage your clinic profile and preferences</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex w-full overflow-x-auto scrollbar-hide sm:grid sm:grid-cols-3 max-w-xl bg-gray-100 p-1 rounded-xl">
            <TabsTrigger value="profile" className="flex-1 min-w-[120px] sm:min-w-0">Clinic Profile</TabsTrigger>
            <TabsTrigger value="doctors" className="flex-1 min-w-[100px] sm:min-w-0">Doctors</TabsTrigger>
            <TabsTrigger value="branding" className="flex-1 min-w-[150px] sm:min-w-0">Branding & Assets</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit}>
            <TabsContent value="profile" className="mt-6">
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle>Clinic Information</CardTitle>
                  <CardDescription>This information will appear on all your generated bills.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Clinic Name</Label>
                    <Input id="name" value={formData.name} onChange={handleChange} required disabled={isDemo} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Clinic Address</Label>
                    <Input id="address" value={formData.address} onChange={handleChange} required disabled={isDemo} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" value={formData.phone} onChange={handleChange} disabled={isDemo} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Clinic Email</Label>
                    <Input id="email" type="email" value={formData.email} onChange={handleChange} disabled={isDemo} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gstNumber">GST Number</Label>
                    <Input id="gstNumber" value={formData.gstNumber} onChange={handleChange} disabled={isDemo} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency Symbol</Label>
                    <Input id="currency" value={formData.currency} onChange={handleChange} required disabled={isDemo} />
                  </div>
                </CardContent>
                <CardFooter className="border-t bg-gray-50/50 px-6 py-4">
                  <Button className="bg-blue-600 hover:bg-blue-700" type="submit" disabled={loading || isDemo}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} {isDemo ? 'View Only (Demo)' : 'Save Changes'}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="doctors" className="mt-6">
              <Card className="border-none shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Doctor Management</CardTitle>
                    <CardDescription>Add and manage doctors associated with your clinic.</CardDescription>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddDoctor} disabled={isDemo}>
                    <Plus className="mr-2 h-4 w-4" /> Add Doctor
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  {doctors.map((doc, index) => (
                    <div key={doc.id} className="p-6 rounded-xl border border-gray-100 bg-gray-50/30 space-y-4 relative group">
                      <div className="absolute top-4 right-4 flex items-center gap-2">
                        {doc.isMain ? (
                          <Badge className="bg-blue-100 text-blue-600 border-none flex items-center gap-1">
                            <Star size={10} fill="currentColor" /> Main Doctor
                          </Badge>
                        ) : (
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            className="text-xs text-gray-500 hover:text-blue-600"
                            onClick={() => handleSetMainDoctor(doc.id)}
                          >
                            Set as Main
                          </Button>
                        )}
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleRemoveDoctor(doc.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>

                      <div className="grid gap-4 md:grid-cols-4">
                        <div className="md:col-span-3 space-y-4">
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label className="flex items-center gap-2">
                                <User size={14} className="text-gray-400" /> Name
                              </Label>
                              <Input 
                                placeholder="John Doe" 
                                value={doc.name} 
                                onChange={(e) => handleUpdateDoctor(doc.id, 'name', e.target.value)}
                                required
                                disabled={isDemo}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="flex items-center gap-2">
                                <GraduationCap size={14} className="text-gray-400" /> Qualification
                              </Label>
                              <Input 
                                placeholder="BDS, MDS" 
                                value={doc.qualification} 
                                onChange={(e) => handleUpdateDoctor(doc.id, 'qualification', e.target.value)}
                                disabled={isDemo}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="flex items-center gap-2">
                                <Award size={14} className="text-gray-400" /> Registration Number
                              </Label>
                              <Input 
                                placeholder="Reg. No: 12345" 
                                value={doc.registrationNumber} 
                                onChange={(e) => handleUpdateDoctor(doc.id, 'registrationNumber', e.target.value)}
                                disabled={isDemo}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Doctor Signature Upload */}
                        <div className="flex flex-col items-center justify-center border-l pl-4">
                          <Label className="text-xs text-gray-400 mb-2 uppercase tracking-widest font-bold">Signature</Label>
                          {doc.signatureUrl ? (
                            <div className="relative group">
                              <img src={doc.signatureUrl} alt="Signature" className="h-16 w-32 object-contain border rounded-lg bg-white p-1" />
                              <div className="absolute -top-2 -right-2 hidden group-hover:flex gap-1">
                                <button 
                                  type="button"
                                  onClick={() => handleRemoveAsset('signatureUrl', doc.id)}
                                  className="bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600"
                                >
                                  <Trash2 size={10} />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex h-16 w-32 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50">
                              <Label htmlFor={`sig-upload-${doc.id}`} className="cursor-pointer flex flex-col items-center gap-1 text-[10px] font-medium text-blue-600 hover:underline">
                                <Upload size={14} className="text-gray-400" />
                                <span>Upload</span>
                                <input id={`sig-upload-${doc.id}`} type="file" className="hidden" accept="image/*" onChange={(e) => handleFileSelect(e, 'signatureUrl', doc.id)} />
                              </Label>
                            </div>
                          )}
                          <p className="mt-2 text-[10px] text-gray-400 text-center">Stored locally on this device.</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
                <CardFooter className="border-t bg-gray-50/50 px-6 py-4">
                  <Button className="bg-blue-600 hover:bg-blue-700" type="submit" disabled={loading || isDemo}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} {isDemo ? 'View Only (Demo)' : 'Save Changes'}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="branding" className="mt-6">
              <div className="grid gap-6 md:grid-cols-2 max-w-2xl">
                {/* Logo */}
                <Card className="border-none shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">Clinic Logo</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                    {formData.logoUrl ? (
                      <div className="relative group">
                        <img src={formData.logoUrl} alt="Logo" className="h-32 w-32 object-contain border rounded-lg p-2 bg-white" />
                        <div className="absolute -top-2 -right-2 hidden group-hover:flex gap-1">
                          <button 
                            type="button"
                            onClick={() => handleRemoveAsset('logoUrl')}
                            className="bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex h-32 w-32 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50">
                        <Upload className="mb-2 text-gray-400" size={24} />
                        <Label htmlFor="logo-upload" className="cursor-pointer text-xs font-medium text-blue-600 hover:underline">
                          Upload Logo
                          <input id="logo-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handleFileSelect(e, 'logoUrl')} />
                        </Label>
                      </div>
                    )}
                    <p className="mt-4 text-xs text-gray-500">Square PNG recommended. Stored locally on this device.</p>
                  </CardContent>
                </Card>

                {/* Stamp */}
                <Card className="border-none shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">Clinic Stamp</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                    {formData.stampUrl ? (
                      <div className="relative group">
                        <img src={formData.stampUrl} alt="Stamp" className="h-32 w-32 object-contain border rounded-lg p-2 bg-white" />
                        <div className="absolute -top-2 -right-2 hidden group-hover:flex gap-1">
                          <button 
                            type="button"
                            onClick={() => handleRemoveAsset('stampUrl')}
                            className="bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex h-32 w-32 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50">
                        <Upload className="mb-2 text-gray-400" size={24} />
                        <Label htmlFor="stamp-upload" className="cursor-pointer text-xs font-medium text-blue-600 hover:underline">
                           Upload Stamp
                          <input id="stamp-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handleFileSelect(e, 'stampUrl')} />
                        </Label>
                      </div>
                    )}
                    <p className="mt-4 text-xs text-gray-500">Used at the bottom. Stored locally on this device.</p>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6 flex justify-start">
                <Button className="bg-blue-600 hover:bg-blue-700" type="submit" disabled={loading || isDemo}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} {isDemo ? 'View Only (Demo)' : 'Complete Final Save'}
                </Button>
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-800">
                  <strong>Branding & Assets:</strong> Logo, stamp, and signature are stored locally on this device/browser only. If you use another device or browser, upload them again there.
                </p>
                <p className="mt-1 text-xs text-blue-600">
                  Other clinic data (text settings) is securely synced via cloud and available across all your devices.
                </p>
              </div>
            </TabsContent>
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
