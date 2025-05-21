/**
 * Firestore Write Limiter
 *
 * This utility helps prevent excessive writes to Firestore by:
 * 1. Batching writes together
 * 2. Debouncing frequent updates to the same document
 * 3. Implementing write quotas
 */

import {writeBatch, doc, DocumentData, UpdateData } from 'firebase/firestore';
import {firestore } from '@/services/firebase';

// Configuration
const MAX_WRITES_PER_MINUTE = 500;
const BATCH_INTERVAL = 5000; // 5 seconds
const MAX_BATCH_SIZE = 500; // Firestore limit

// Define type for Firestore document data
type FirestoreDocumentData = UpdateData<DocumentData>;

// State
let writeCount = 0;
let lastResetTime = Date.now();
const pendingWrites = new Map<string, {data: FirestoreDocumentData, timestamp: number }>();
let batchTimer: NodeJS.Timeout | null = null;

// Reset write count every minute
setInterval(() => {
  writeCount = 0;
  lastResetTime = Date.now();
}, 60 * 1000);

/**
 * Queue a write operation
 */
export const queueWrite = (
  path: string,
  data: FirestoreDocumentData,
  options: {priority?: 'high' | 'normal' | 'low'} = {}
): void => {
  const now = Date.now();

  // Check if we're over quota
  if (writeCount >= MAX_WRITES_PER_MINUTE && options.priority !== 'high') {
    console.warn(`Write quota exceeded (${writeCount}/${MAX_WRITES_PER_MINUTE} per minute). Skipping write to ${path}`);

    if (options.priority === 'low') {
      // Drop low priority writes when over quota
      return;
  }

    // For normal priority, delay until next minute
    setTimeout(() => queueWrite(path, data, options),
      60 * 1000 - (now - lastResetTime) + 100);
    return;
}

  // Add to pending writes, overwriting any previous write to the same path
  pendingWrites.set(path, {data, timestamp: now });

  // Start batch timer if not already running
  if (!batchTimer) {
    batchTimer = setTimeout(() => void processBatch(), BATCH_INTERVAL);
}
};

/**
 * Process a batch of writes
 */
const processBatch = async (): Promise<void> => {
  batchTimer = null;

  if (pendingWrites.size === 0) {
    return;
}

  try {
    // Create a new batch
    const batch = writeBatch(firestore);
    let batchCount = 0;
    const processedPaths: string[] = [];

    // Convert Map entries to Array before iterating
    const pendingWritesArray = Array.from(pendingWrites);

    // Add writes to batch
    for (const [path, {data }] of pendingWritesArray) {
      if (batchCount >= MAX_BATCH_SIZE) {
        break;
    }

      const docRef = doc(firestore, path);
      batch.update(docRef, data);

      processedPaths.push(path);
      batchCount++;
  }

    // Remove processed writes from pending
    processedPaths.forEach(path => pendingWrites.delete(path));

    // Commit batch
    await batch.commit();

    // Update write count
    writeCount += batchCount;

    console.log(`Processed ${batchCount} writes in batch`);
} catch (error) {
    console.error('Error processing write batch:', error);
}

  // If there are more pending writes, schedule another batch
  if (pendingWrites.size > 0) {
    batchTimer = setTimeout(() => void processBatch(), BATCH_INTERVAL);
}
};

/**
 * Force process all pending writes immediately
 * Useful when the application is about to unload
 */
export const flushWrites = async (): Promise<void> => {
  if (batchTimer) {
    clearTimeout(batchTimer);
    batchTimer = null;
}

  return processBatch();
};

// Flush writes when the window is about to unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    void flushWrites();
});
}
