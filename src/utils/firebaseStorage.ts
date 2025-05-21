import {ref, getDownloadURL } from 'firebase/storage';
import {storage } from '@/services/firebase';

/**
 * Get a download URL for a file in Firebase Storage
 * @param path Path to the file in Firebase Storage
 * @returns Promise that resolves to the download URL
 */
export const getStorageUrl = async (path: string): Promise<string> => {
  try {
    const storageRef = ref(storage, path);
    const url = await getDownloadURL(storageRef);
    return url;
} catch (error) {
    console.error('Error getting download URL:', error);
    throw error;
}
};

/**
 * Get a Firebase Storage path from a gs:// URL
 * @param gsUrl gs:// URL
 * @returns Storage path
 */
export const getPathFromGsUrl = (gsUrl: string): string => {
  // Remove the gs://bucket-name/ prefix
  const match = gsUrl.match(/gs:\/\/[^/]+\/(.+)/);
  if (match && match[1]) {
    return match[1];
}
  return gsUrl;
};
