// src/utils/firestore-helpers.ts
import {
  DocumentReference,
  DocumentData,
  Query,
  getDocs,
  getDoc,
  QuerySnapshot,
  DocumentSnapshot,
  FirestoreError
} from 'firebase/firestore';

/**
 * Retry a Firestore query with exponential backoff
 * @param queryFn Function that returns a promise for a Firestore query
 * @param maxRetries Maximum number of retries
 * @param initialDelay Initial delay in milliseconds
 * @returns Promise with the query result
 */
export async function retryFirestoreQuery<T>(
  queryFn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: unknown;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // If it's a retry attempt, log it
      if (attempt > 0) {
        console.log(`Retry attempt ${attempt} for Firestore query after ${delay}ms delay`);
    }

      // Execute the query function
      return await queryFn();
  } catch (error: unknown) {
      lastError = error;

      // If it's a quota exceeded error, wait and retry
      if (
        (error instanceof FirestoreError && error.code === 'resource-exhausted') ||
        (error instanceof Error && error.message.includes('Quota exceeded'))
      ) {
        console.warn(`Firestore quota exceeded on attempt ${attempt}. Retrying in ${delay}ms...`);

        // If we've reached max retries, throw the error
        if (attempt === maxRetries) {
          console.error(`Max retries (${maxRetries}) reached for Firestore query.`);
          throw error;
      }

        // Wait for the delay period
        await new Promise(resolve => setTimeout(resolve, delay));

        // Exponential backoff: double the delay for next attempt
        delay *= 2;
    } else {
        // For other errors, don't retry
        throw error;
    }
  }
}

  // This should never be reached due to the throw in the loop,
  // but TypeScript requires a return statement
  throw lastError;
}

/**
 * Wrapper for getDocs with retry logic
 * @param query Firestore query
 * @returns Promise with query snapshot
 */
export async function getDocsWithRetry(
  query: Query<DocumentData>
): Promise<QuerySnapshot<DocumentData>> {
  return retryFirestoreQuery(() => getDocs(query));
}

/**
 * Wrapper for getDoc with retry logic
 * @param docRef Document reference
 * @returns Promise with document snapshot
 */
export async function getDocWithRetry(
  docRef: DocumentReference<DocumentData>
): Promise<DocumentSnapshot<DocumentData>> {
  return retryFirestoreQuery(() => getDoc(docRef));
}
