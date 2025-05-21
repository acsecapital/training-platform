/**
 * Firebase Firestore wrapper to prevent excessive reads during scrolling
 *
 * This wrapper intercepts Firestore operations and throttles them during scrolling
 * to prevent quota exhaustion.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  DocumentReference,
  CollectionReference,
  Query,
  DocumentData,
  QuerySnapshot,
  DocumentSnapshot,
  QueryConstraint
} from 'firebase/firestore';
import {firestore } from './firebase';
import {canPerformFirestoreOperation } from '@/utils/scrollLock';

// Cache for Firestore operations
interface FirestoreCache {
  [key: string]: {
    data: DocumentSnapshot<DocumentData> | QuerySnapshot<DocumentData>;
    timestamp: number;
    expiresIn: number; // milliseconds
  };
}

// Global cache object
const firestoreCache: FirestoreCache = {};

// Helper to generate cache keys
function generateCacheKey(path: string, queryParams?: Record<string, unknown>): string {
  if (queryParams) {
    try {
      return `${path}_${JSON.stringify(queryParams)}`;
    } catch (e) {
      // Fallback for non-serializable queryParams, though Firestore constraints should be serializable.
      console.warn('Could not stringify queryParams for cache key:', e, queryParams);
      return `${path}_${Object.keys(queryParams).join('-')}_fallback`;
    }
  }
  return path;
}

// Check if cache is valid
function isValidCache(cacheKey: string): boolean {
  if (!firestoreCache[cacheKey]) return false;

  const now = Date.now();
  const {timestamp, expiresIn } = firestoreCache[cacheKey];
  return now - timestamp < expiresIn;
}

// Wrapper for getDoc with throttling and caching
export async function safeGetDoc<T = DocumentData>(
  docRef: DocumentReference<T>,
  cacheTime: number = 5 * 60 * 1000 // 5 minutes default
): Promise<DocumentSnapshot<T>> {
  const path = docRef.path;
  const cacheKey = generateCacheKey(path);

  // Check cache first
  const cachedEntry = firestoreCache[cacheKey];
  if (cachedEntry && isValidCache(cacheKey)) {
    return cachedEntry.data as DocumentSnapshot<T>;
  }

  // If scrolling and throttled, use stale cache if available
  if (!canPerformFirestoreOperation()) {
    if (cachedEntry) {
      return cachedEntry.data as DocumentSnapshot<T>;
    }
  }

  // Perform the actual Firestore operation
  const snapshot = await getDoc(docRef);

  // Cache the result
  firestoreCache[cacheKey] = {
    data: snapshot as DocumentSnapshot<DocumentData>,
    timestamp: Date.now(),
    expiresIn: cacheTime
  };

  return snapshot;
}

// Define an interface for the internal structure of a Firestore Query object
// This is for type safety when accessing internal properties, but be aware that these are internal and might change.
interface FirebaseQueryInternal<T = DocumentData> extends Query<T> {
  _query: {
    path: {
      segments: string[];
    };
    filters: QueryConstraint[];
    orderBys: QueryConstraint[];
    // Add other properties of _query if needed
  };
}

// Wrapper for getDocs with throttling and caching
export async function safeGetDocs<T = DocumentData>(
  queryRef: Query<T>,
  cacheTime: number = 5 * 60 * 1000 // 5 minutes default
): Promise<QuerySnapshot<T>> {
  // Cast to our internal interface to safely access _query
  const internalQueryRef = queryRef as FirebaseQueryInternal<T>;

  // Generate a cache key based on the query
  const queryPath = internalQueryRef._query.path.segments.join('/');
  const queryFilters = internalQueryRef._query.filters;
  const queryOrderBys = internalQueryRef._query.orderBys;
  const queryParams: Record<string, unknown> = {filters: queryFilters, orderBys: queryOrderBys };
  const cacheKey = generateCacheKey(queryPath, queryParams);

  // Check cache first
  const cachedEntry = firestoreCache[cacheKey];
  if (cachedEntry && isValidCache(cacheKey)) {
    return cachedEntry.data as QuerySnapshot<T>;
  }

  // If scrolling and throttled, use stale cache if available
  if (!canPerformFirestoreOperation()) {
    if (cachedEntry) {
      return cachedEntry.data as QuerySnapshot<T>;
    }
  }

  // Perform the actual Firestore operation
  const snapshot = await getDocs(queryRef);

  // Cache the result
  firestoreCache[cacheKey] = {
    data: snapshot as QuerySnapshot<DocumentData>,
    timestamp: Date.now(),
    expiresIn: cacheTime
  };

  return snapshot;
}

// Export wrapped collection function
export function safeCollection(path: string): CollectionReference<DocumentData> {
  return collection(firestore, path);
}

// Export wrapped doc function
export function safeDoc<T = DocumentData>(path: string, ...pathSegments: string[]): DocumentReference<T> {
  return doc(firestore, path, ...pathSegments) as DocumentReference<T>;
}

// Re-export other Firestore functions
export {query, where, orderBy, limit };
