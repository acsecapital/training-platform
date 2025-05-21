/**
 * Utility functions for handling Firestore quota exceeded errors
 */

import {FirebaseError } from 'firebase/app';
import {toast } from 'sonner';

/**
 * Check if an error is a Firestore quota exceeded error
 */
export const isQuotaExceededError = (error: unknown): boolean => {
  if (error instanceof FirebaseError) {
    return error.code === 'resource-exhausted' || error.message?.includes('Quota exceeded');
}

  // Handle non-FirebaseError objects
  if (typeof error === 'object' && error !== null) {
    // Use type assertion to a less strict error-like structure
    // This acknowledges we don't know the exact shape but expect these properties.
    const potentialError = error as { code?: unknown; message?: unknown; name?: unknown };

    return (
      potentialError.code === 'resource-exhausted' ||
      (typeof potentialError.message === 'string' && potentialError.message.includes('Quota exceeded')) ||
      (potentialError.name === 'FirebaseError' && typeof potentialError.message === 'string' && potentialError.message.includes('resource-exhausted'))
    );
  }
  return false;
};

/**
 * Handle Firestore quota exceeded errors with fallback to cache
 * @param error The error to handle
 * @param cacheKey The localStorage key for cached data
 * @param setData Function to set data in the component state
 * @param setError Function to set error in the component state
 * @param errorMessage Custom error message to display
 * @returns true if the error was handled, false otherwise
 */
export const handleQuotaExceededError = <T>(
  error: unknown,
  cacheKey: string,
  setData: (data: T) => void,
  setError?: (error: string | null) => void,
  errorMessage: string = 'Unable to load data due to high traffic. Please try again later.'
): boolean => {
  if (!isQuotaExceededError(error)) {
    return false;
}

  // Log the error
  console.warn('Firestore quota exceeded, attempting to use cached data', error);
  
  // Show toast notification
  toast.error('High traffic detected. Using cached data if available.');
  
  // Try to use cached data
  const cachedData = localStorage.getItem(cacheKey);
  if (cachedData) {
    try {
      const parsedData = JSON.parse(cachedData) as T;
      setData(parsedData);
      return true;
  } catch (e) {
      console.error('Error parsing cached data:', e);
      if (setError) setError('Unable to load cached data. Please try again later.');
  }
} else {
    // No cached data available
    if (setError) setError(errorMessage);
}
  
  return true;
};

/**
 * Execute a Firestore operation with quota error handling
 * @param operation The Firestore operation to execute
 * @param cacheKey The localStorage key for cached data
 * @param setData Function to set data in the component state
 * @param setError Function to set error in the component state
 * @param errorMessage Custom error message to display
 * @returns The result of the operation or null if an error occurred
 */
export const executeWithQuotaHandling = async <T>(
  operation: () => Promise<T>,
  cacheKey: string,
  setData: (data: T) => void,
  setError?: (error: string | null) => void,
  errorMessage: string = 'Unable to load data due to high traffic. Please try again later.'
): Promise<T | null> => {
  try {
    // Execute the Firestore operation
    const result = await operation();
    
    // Cache the result
    localStorage.setItem(cacheKey, JSON.stringify(result));
    
    // Set the data
    setData(result);
    
    return result;
} catch (error) {
    // Handle quota exceeded errors
    const handled = handleQuotaExceededError(error, cacheKey, setData, setError, errorMessage);
    
    // If the error wasn't a quota exceeded error, or couldn't be handled, rethrow it
    if (!handled) {
      console.error('Error executing Firestore operation:', error);
      if (setError) setError('An error occurred. Please try again later.');
  }
    
    return null;
}
};
