import { get, set, del } from 'idb-keyval';

export const saveLocalAsset = async (key: string, dataUrl: string) => {
  await set(key, dataUrl);
  return true;
};

export const getLocalAsset = async (key: string): Promise<string | null> => {
  try {
    const asset = await get(key);
    return asset || null;
  } catch (error) {
    console.error('Error getting local asset from IndexedDB:', error);
    return null;
  }
};

export const deleteLocalAsset = async (key: string) => {
  await del(key);
  return true;
};
