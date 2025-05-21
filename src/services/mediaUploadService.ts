import {ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {storage } from '@/services/firebase';
import {v4 as uuidv4 } from 'uuid';

/**
 * Upload an image to Firebase Storage
 * @param file The file to upload
 * @param path The path in storage to upload to (default: 'editor-images')
 * @returns Promise with the download URL
 */
export const uploadEditorImage = async (file: File, path: string = 'editor-images'): Promise<string> => {
  try {
    // Generate a unique filename
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const fullPath = `${path}/${fileName}`;
    
    // Create a storage reference
    const storageRef = ref(storage, fullPath);
    
    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
} catch (error) {
    console.error('Error uploading image:', error);
    throw error;
}
};

/**
 * Upload multiple images to Firebase Storage
 * @param files Array of files to upload
 * @param path The path in storage to upload to (default: 'editor-images')
 * @returns Promise with an array of download URLs
 */
export const uploadMultipleEditorImages = async (files: File[], path: string = 'editor-images'): Promise<string[]> => {
  try {
    const uploadPromises = files.map(file => uploadEditorImage(file, path));
    return await Promise.all(uploadPromises);
} catch (error) {
    console.error('Error uploading multiple images:', error);
    throw error;
}
};

/**
 * Extract images from HTML content
 * @param htmlContent The HTML content to extract images from
 * @returns Array of image URLs
 */
export const extractImagesFromContent = (htmlContent: string): string[] => {
  const imgRegex = /<img[^>]+src="([^">]+)"/g;
  const urls: string[] = [];
  let match;
  
  while ((match = imgRegex.exec(htmlContent)) !== null) {
    urls.push(match[1]);
}
  
  return urls;
};

/**
 * Check if a URL is a Firebase Storage URL
 * @param url The URL to check
 * @returns Boolean indicating if the URL is a Firebase Storage URL
 */
export const isFirebaseStorageUrl = (url: string): boolean => {
  return url.includes('firebasestorage.googleapis.com');
};

/**
 * Get the path from a Firebase Storage URL
 * @param url The Firebase Storage URL
 * @returns The path in Firebase Storage
 */
export const getPathFromStorageUrl = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(/\/o\/([^?]+)/);
    
    if (pathMatch && pathMatch[1]) {
      return decodeURIComponent(pathMatch[1]);
  }
    
    return null;
} catch (error) {
    console.error('Error parsing storage URL:', error);
    return null;
}
};
