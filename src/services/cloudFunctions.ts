import {getFunctions, httpsCallable } from 'firebase/functions';
import {app } from './firebase';
import { Certificate } from '@/types/certificate.types'; // Added import

// Initialize Firebase Functions
const functions = getFunctions(app);

// Call a Cloud Function
export const callGenerateCertificate = async (courseId: string): Promise<Certificate | null> => {
  try {
    // It's good practice to type httpsCallable as well for better type safety
    const generateCertificateFunction = httpsCallable<{ courseId: string }, Certificate | null>(functions, 'generateCertificate');
    const result = await generateCertificateFunction({courseId });
    return result.data;
} catch (error) {
    console.error('Error calling generateCertificate function:', error);
    throw error;
}
};

// Other function calls can be added here