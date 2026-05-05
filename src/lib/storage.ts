import { compressImage } from './imageUtils';
import { saveLocalAsset, deleteLocalAsset } from './localStore';

/**
 * Handles "uploading" of clinic assets by compressing them and saving to local IndexedDB 
 * AND returning the Base64 data for cloud sync in Firestore.
 * This ensures branding is available across all devices and to patients.
 */
export const uploadClinicAsset = async (
  clinicId: string, 
  dataUrl: string, 
  assetType: 'logo' | 'stamp' | 'signature',
  doctorId: string | null = null
): Promise<string> => {
  console.log(`Starting cloud-enabled storage for ${assetType}...`);
  try {
    // 1. Compress image
    // Signatures and stamps need transparency (PNG), so we reduce size by lowering resolution
    // Logos can be JPEG or PNG.
    const maxWidth = assetType === 'signature' ? 300 : assetType === 'stamp' ? 200 : 250;
    const compressedDataUrl = await compressImage(dataUrl, maxWidth, 0.6);
    
    // 2. Save to Local IndexedDB for offline support/fallback
    const localKey = doctorId 
      ? `clinic-asset:${clinicId}:signature:${doctorId}`
      : `clinic-asset:${clinicId}:${assetType}`;
    
    console.log(`Saving to local storage with key: ${localKey}`);
    await saveLocalAsset(localKey, compressedDataUrl);
    
    // Return the actual compressed data URL so it can be stored in Firestore for all devices to access
    return compressedDataUrl;
  } catch (error) {
    console.error(`Error saving local ${assetType}:`, error);
    throw error;
  }
};

/**
 * Handles deletion of local assets
 */
export const deleteClinicAsset = async (url: string): Promise<void> => {
  if (!url || !url.startsWith('local-asset:')) return;
  
  try {
    const key = url.replace('local-asset:', '');
    console.log(`Deleting local asset: ${key}`);
    await deleteLocalAsset(key);
  } catch (error) {
    console.error('Error deleting local asset:', error);
  }
};
