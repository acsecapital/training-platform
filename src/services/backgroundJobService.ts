import {
  collection,
  doc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  orderBy,
  CollectionReference
} from 'firebase/firestore';
import {firestore } from '@/services/firebase';
import {processDueNotifications } from './notificationSchedulerService';
import {deleteExpiredNotifications } from './notificationService';
/**
 * Background job types
 */
export type BackgroundJobType =
  | 'process_notifications'
  | 'clean_expired_notifications'
  | 'process_email_queue'
  | 'update_course_statistics'
  | 'generate_user_reports';

/**
 * Background job status
 */
export type BackgroundJobStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed';

/**
 * Background job interface
 */
export interface BackgroundJob {
  id: string;
  type: BackgroundJobType;
  status: BackgroundJobStatus;
  createdAt: string;
  scheduledFor: string;
  startedAt?: string;
  completedAt?: string;
  result?: unknown;
  error?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Schedule a background job
 */
export const scheduleBackgroundJob = async (
  type: BackgroundJobType,
  scheduledFor: Date = new Date(),
  metadata?: Record<string, unknown>
): Promise<string> => {
  try {
    const jobsRef = collection(firestore, 'backgroundJobs');
    const now = new Date().toISOString();

    const docRef = await addDoc(jobsRef, {
      type,
      status: 'pending',
      createdAt: now,
      scheduledFor: scheduledFor.toISOString(),
      metadata: metadata || {}
  });

    return docRef.id;
} catch (error) {
    console.error('Error scheduling background job:', error);
    throw error;
}
};

/**
 * Firestore data structure for BackgroundJob (excluding id)
 */
interface BackgroundJobDoc {
  type: BackgroundJobType;
  status: BackgroundJobStatus;
  createdAt: string;
  scheduledFor: string;
  startedAt?: string;
  completedAt?: string;
  result?: unknown;
  error?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Get pending background jobs
 */
export const getPendingBackgroundJobs = async (): Promise<BackgroundJob[]> => {
  try {
    const now = new Date().toISOString();
    const jobsRef = collection(firestore, 'backgroundJobs') as CollectionReference<BackgroundJobDoc>;
    const q = query(
      jobsRef,
      where('status', '==', 'pending'),
      where('scheduledFor', '<=', now),
      orderBy('scheduledFor', 'asc')
    );

    const jobsSnapshot = await getDocs(q);
    return jobsSnapshot.docs.map(docSnapshot => ({
      id: docSnapshot.id,
      ...docSnapshot.data()
  })) as BackgroundJob[]; // Final assertion is okay as BackgroundJobDoc + id matches BackgroundJob
} catch (error) {
    console.error('Error getting pending background jobs:', error);
    throw error;
}
};

/**
 * Process a background job
 */
export const processBackgroundJob = async (job: BackgroundJob): Promise<void> => {
  try {
    // Mark job as running
    const jobRef = doc(firestore, 'backgroundJobs', job.id);
    await updateDoc(jobRef, {
      status: 'running',
      startedAt: new Date().toISOString()
  });

    let result: unknown;

    // Process job based on type
    switch (job.type) {
      case 'process_notifications':
        result = await processDueNotifications();
        break;
      case 'clean_expired_notifications':
        result = await deleteExpiredNotifications();
        break;
      case 'process_email_queue':
        // This would be handled by a backend service
        result = {message: 'Email queue processing is handled by backend'};
        break;
      case 'update_course_statistics':
        // Implement course statistics update
        result = {message: 'Course statistics update not implemented yet'};
        break;
      case 'generate_user_reports':
        // Implement user reports generation
        result = {message: 'User reports generation not implemented yet'};
        break;
      default:
        // This should never happen if all job types are handled above,
        // but we need to handle it for type safety
        throw new Error(`Unknown job type: ${job.type as string}`);
  }

    // Mark job as completed
    await updateDoc(jobRef, {
      status: 'completed',
      completedAt: new Date().toISOString(),
      result: result // Store the result
  });
} catch (err: unknown) {
    console.error(`Error processing background job ${job.id}:`, err);

    // Mark job as failed
    const jobRef = doc(firestore, 'backgroundJobs', job.id);
    await updateDoc(jobRef, {
      status: 'failed',
      completedAt: new Date().toISOString(),
      error: err instanceof Error ? err.message : String(err)
  });
}
};

/**
 * Process all pending background jobs
 */
export const processAllPendingJobs = async (): Promise<number> => {
  try {
    const pendingJobs = await getPendingBackgroundJobs();

    // Process each job
    for (const job of pendingJobs) {
      await processBackgroundJob(job);
  }

    return pendingJobs.length;
} catch (error) {
    console.error('Error processing pending jobs:', error);
    return 0;
}
};

/**
 * Schedule recurring background jobs
 */
export const scheduleRecurringJobs = (): void => {
  // Schedule notification processing job (every 15 minutes)
  setInterval(() => {
    void (async () => {
      try {
        await scheduleBackgroundJob('process_notifications');
        console.log('Scheduled notification processing job');
      } catch (e: unknown) {
        console.error('Error scheduling notification processing job:', e instanceof Error ? e.message : String(e));
      }
    })();
}, 15 * 60 * 1000);

  // Schedule expired notifications cleanup (daily)
  setInterval(() => {
    void (async () => {
      try {
        await scheduleBackgroundJob('clean_expired_notifications');
        console.log('Scheduled expired notifications cleanup job');
      } catch (e: unknown) {
        console.error('Error scheduling expired notifications cleanup job:', e instanceof Error ? e.message : String(e));
      }
    })();
}, 24 * 60 * 60 * 1000);

  // Schedule course statistics update (daily)
  setInterval(() => {
    void (async () => {
      try {
        await scheduleBackgroundJob('update_course_statistics');
        console.log('Scheduled course statistics update job');
      } catch (e: unknown) {
        console.error('Error scheduling course statistics update job:', e instanceof Error ? e.message : String(e));
      }
    })();
}, 24 * 60 * 60 * 1000);

  // Schedule job processor (every 5 minutes)
  setInterval(() => {
    void (async () => {
      try {
        const processedCount = await processAllPendingJobs();
        if (processedCount > 0) {
          console.log(`Processed ${processedCount} background jobs`);
        }
      } catch (e: unknown) {
        console.error('Error processing background jobs:', e instanceof Error ? e.message : String(e));
      }
    })();
  }, 5 * 60 * 1000);
};
