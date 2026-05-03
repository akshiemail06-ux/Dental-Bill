import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { handleFirestoreError } from '../lib/error-handler';
import { Clinic, Doctor } from '../types';

import { getLocalAsset } from '../lib/localStore';

interface ClinicContextType {
  clinic: Clinic | null;
  rawClinic: Clinic | null; // The raw data from Firestore with local-asset: references
  loading: boolean;
  missingAssets: boolean;
  refreshLocalAssets: () => Promise<void>;
  setMissingAssets: (value: boolean) => void;
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

export const ClinicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, isAuthReady, isDemo } = useAuth();
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [dbClinic, setDbClinic] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState(true);
  const [localAssetMap, setLocalAssetMap] = useState<Record<string, string>>({});
  const [missingAssets, setMissingAssets] = useState(false);

  const demoClinic: Clinic = {
    id: 'demo-clinic',
    name: 'Smile Dental Care',
    logoUrl: '/logo.svg',
    doctorName: 'Akshit Bhardwaj',
    doctorQualification: 'BDS, MDS (Orthodontics)',
    doctorRegNumber: 'HN-12345-D',
    address: '123, Health Enclave, Sector 15, New Delhi',
    phone: '9876543210',
    email: 'contact@smiledental.com',
    currency: '₹',
    ownerId: 'demo-user',
    doctors: [
      {
        id: 'demo-doc-1',
        name: 'Akshit Bhardwaj',
        qualification: 'BDS, MDS (Orthodontics)',
        regNumber: 'HN-12345-D',
        isMain: true
      },
      {
        id: 'demo-doc-2',
        name: 'Priya Sharma',
        qualification: 'BDS',
        regNumber: 'D-67890',
        isMain: false
      }
    ],
    stampUrl: 'https://picsum.photos/seed/dental-stamp/200/100',
    signatureUrl: 'https://picsum.photos/seed/dental-sig/200/80',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const refreshLocalAssets = async () => {
    const sourceClinic = dbClinic || clinic;
    if (!sourceClinic?.id || isDemo) return;

    const newMap: Record<string, string> = { ...localAssetMap };
    let changed = false;
    let foundMissing = false;
    let foundAtLeastOne = false;

    // Check clinic main assets
    const assetsToLoad = [
      { key: sourceClinic.logoUrl, field: 'logoUrl' },
      { key: sourceClinic.stampUrl, field: 'stampUrl' }
    ];

    // Check doctor signatures
    if (sourceClinic.doctors) {
      sourceClinic.doctors.forEach(doc => {
        if (doc.signatureUrl) {
          assetsToLoad.push({ key: doc.signatureUrl, field: `doc-sig-${doc.id}` });
        }
      });
    }

    const uninitialized = !sourceClinic.logoUrl && !sourceClinic.stampUrl;

    for (const item of assetsToLoad) {
      if (item.key && item.key.startsWith('local-asset:')) {
        const idbKey = item.key.replace('local-asset:', '');
        const data = await getLocalAsset(idbKey);
        
        if (data) {
          foundAtLeastOne = true;
          if (newMap[item.key] !== data) {
            newMap[item.key] = data;
            changed = true;
          }
        } else {
          foundMissing = true;
        }
      }
    }

    if (changed) {
      setLocalAssetMap(newMap);
    }
    
    // Only alert if we found missing local assets AND it's not a fresh clinic setup
    // And we didn't find ANY assets (to avoid annoying users who just haven't uploaded everything yet)
    if (foundMissing && !uninitialized && !foundAtLeastOne) {
      setMissingAssets(true);
    }
  };


  // Firestore listener - only depends on clinicId
  useEffect(() => {
    if (isDemo) {
      setDbClinic(demoClinic);
      setLoading(false);
      return;
    }

    if (isAuthReady && profile?.clinicId) {
      const clinicDocRef = doc(db, 'clinics', profile.clinicId);
      const unsubscribe = onSnapshot(clinicDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as Clinic;
          setDbClinic({ id: docSnap.id, ...data });
        } else {
          setDbClinic(null);
        }
        setLoading(false);
      }, (error) => {
        console.error("Clinic listener error:", error);
        handleFirestoreError(error, 'get', `clinics/${profile.clinicId}`);
        setLoading(false);
      });

      return () => unsubscribe();
    } else if (isAuthReady && !profile?.clinicId) {
      setDbClinic(null);
      setLoading(false);
    }
  }, [isAuthReady, profile?.clinicId, isDemo]);

  // Merge logic - combine server data with local assets
  useEffect(() => {
    if (!dbClinic && !isDemo) {
      setClinic(null);
      return;
    }

    const baseClinic = (dbClinic || demoClinic) as Clinic;
    
    // Create a version of the clinic with resolved local URLs
    const resolvedClinic: Clinic = {
      ...baseClinic,
      logoUrl: baseClinic.logoUrl?.startsWith('local-asset:') 
        ? (localAssetMap[baseClinic.logoUrl] || '') 
        : baseClinic.logoUrl,
      stampUrl: baseClinic.stampUrl?.startsWith('local-asset:') 
        ? (localAssetMap[baseClinic.stampUrl] || '') 
        : baseClinic.stampUrl,
      doctors: baseClinic.doctors?.map(doc => ({
        ...doc,
        signatureUrl: doc.signatureUrl?.startsWith('local-asset:') 
          ? (localAssetMap[doc.signatureUrl] || '') 
          : doc.signatureUrl
      }))
    };

    if (JSON.stringify(resolvedClinic) !== JSON.stringify(clinic)) {
      setClinic(resolvedClinic);
    }
  }, [dbClinic, isDemo, localAssetMap]);

  // Trigger local asset refresh when clinic data changes
  useEffect(() => {
    if (dbClinic && !isDemo) {
      refreshLocalAssets();
    }
  }, [
    dbClinic?.id, 
    dbClinic?.logoUrl, 
    dbClinic?.stampUrl, 
    dbClinic?.doctors?.length,
    dbClinic?.updatedAt?.toString()
  ]);

  return (
    <ClinicContext.Provider value={{ clinic, rawClinic: dbClinic, loading, missingAssets, refreshLocalAssets, setMissingAssets }}>
      {children}
    </ClinicContext.Provider>
  );
};

export const useClinic = () => {
  const context = useContext(ClinicContext);
  if (context === undefined) {
    throw new Error('useClinic must be used within a ClinicProvider');
  }
  return context;
};
