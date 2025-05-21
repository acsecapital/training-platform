/**
 * Utility to optimize course progress synchronization
 * This helps reduce excessive Firestore operations by throttling and batching sync operations
 */

import {syncUserCourseProgress } from '@/utilities/syncCourseProgress';

// Track pending sync operations
interface PendingSyncOperation {
  userId: string;
  courseId: string;
  timestamp: number;
  resolve: (success: boolean) => void;
  reject: (error: Error) => void;
}

// Singleton class to manage sync operations
class ProgressSyncManager {
  private static instance: ProgressSyncManager;
  private pendingOperations: Map<string, PendingSyncOperation> = new Map();
  private isProcessing: boolean = false;
  private syncInterval: number = 5000; // 5 seconds between batch syncs
  private intervalId: NodeJS.Timeout | null = null;
  private lastSyncTime: number = 0;
  private minTimeBetweenSyncs: number = 1000; // 1 second minimum between syncs for the same course

  private constructor() {
    // Start the processing interval
    this.startProcessingInterval();
}

  public static getInstance(): ProgressSyncManager {
    if (!ProgressSyncManager.instance) {
      ProgressSyncManager.instance = new ProgressSyncManager();
  }
    return ProgressSyncManager.instance;
}

  /**
   * Queue a sync operation
   * @returns Promise that resolves when the sync is complete
   */
  public queueSyncOperation(userId: string, courseId: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const key = `${userId}_${courseId}`;
      const now = Date.now();

      // Check if we already have a pending operation for this user/course
      const existingOperation = this.pendingOperations.get(key);
      if (existingOperation) {
        // If the existing operation is recent, just reuse its promise
        if (now - existingOperation.timestamp < this.minTimeBetweenSyncs) {
          console.log(`Reusing recent sync operation for ${key}`);
          existingOperation.resolve = resolve;
          existingOperation.reject = reject;
          return;
      }
    }

      // Add new operation to the queue
      this.pendingOperations.set(key, {
        userId,
        courseId,
        timestamp: now,
        resolve,
        reject
    });

      // If we're not already processing, start processing
      if (!this.isProcessing && !this.intervalId) {
        this.startProcessingInterval();
    }
  });
}

  /**
   * Start the interval to process pending operations
   */
  private startProcessingInterval(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.intervalId = setInterval(() => {
      void this.processPendingOperations(); // Add 'void' to explicitly mark the promise as ignored
    }, this.syncInterval);
  }

  /**
   * Process all pending operations
   */
  private async processPendingOperations(): Promise<void> {
    if (this.isProcessing || this.pendingOperations.size === 0) {
      return;
  }

    this.isProcessing = true;
    const now = Date.now();

    // Only process operations that are at least minTimeBetweenSyncs old
    // to allow for batching of rapid updates
    const operationsToProcess = Array.from(this.pendingOperations.entries())
      .filter(([_, op]) => now - op.timestamp >= this.minTimeBetweenSyncs);

    if (operationsToProcess.length === 0) {
      this.isProcessing = false;
      return;
  }

    console.log(`Processing ${operationsToProcess.length} sync operations`);

    // Process each operation
    for (const [key, operation] of operationsToProcess) {
      try {
        const success = await syncUserCourseProgress(operation.userId, operation.courseId);
        operation.resolve(success);
    } catch (error) {
        console.error(`Error syncing progress for ${key}:`, error);
        operation.reject(error instanceof Error ? error : new Error(String(error)));
    } finally {
        this.pendingOperations.delete(key);
    }
  }

    this.lastSyncTime = now;
    this.isProcessing = false;
}

  /**
   * Clean up resources when the component unmounts
   */
  public cleanup(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
  }
}
}

/**
 * Optimized function to sync user course progress
 * This batches and throttles sync operations to reduce Firestore operations
 */
export const optimizedSyncProgress = async (
  userId: string,
  courseId: string
): Promise<boolean> => {
  const syncManager = ProgressSyncManager.getInstance();
  return syncManager.queueSyncOperation(userId, courseId);
};

/**
 * Clean up the sync manager when the app unmounts
 */
export const cleanupSyncManager = (): void => {
  const syncManager = ProgressSyncManager.getInstance();
  syncManager.cleanup();
};

