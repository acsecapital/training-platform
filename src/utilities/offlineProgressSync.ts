/**
 * Utility functions for handling offline course progress and syncing when online
 * This helps handle Firestore quota exceeded errors by providing local progress tracking
 */
import {doc, serverTimestamp, writeBatch, arrayUnion } from 'firebase/firestore';
import {firestore } from '@/services/firebase';

type ProgressData = {
  userId: string;
  courseId: string;
  moduleId: string;
  lessonId: string;
  lessonKey: string;
  completed: boolean;
  timestamp: string;
  type: string;
};

/**
 * Store progress data locally when Firestore operations fail due to quota limits
 */
export const storeProgressLocally = (progressData: ProgressData): void => {
  try {
    // Store in localStorage for persistence across sessions
    const existingData = localStorage.getItem('pendingProgressUpdates') || '[]';
    const updatesArray: ProgressData[] = JSON.parse(existingData) as ProgressData[];
    updatesArray.push({
      ...progressData,
      timestamp: new Date().toISOString()
  });
    localStorage.setItem('pendingProgressUpdates', JSON.stringify(updatesArray));
    console.log('Progress stored locally for later synchronization', progressData);
} catch (e) {
    console.error('Error storing progress locally:', e);
}
};

/**
 * Attempt to synchronize pending progress updates with Firestore
 */
export const syncPendingUpdates = async (): Promise<boolean> => {
  try {
    const pendingData = localStorage.getItem('pendingProgressUpdates');

    if (!pendingData) {
      return true; // Nothing to sync
  }

    const updates: ProgressData[] = JSON.parse(pendingData) as ProgressData[];

    if (updates.length === 0) {
      return true; // Nothing to sync
  }

    console.log(`Attempting to sync ${updates.length} pending progress updates using batch writes.`);

    const batch = writeBatch(firestore);
    const processedUpdateKeys = new Set<string>(); // To track which updates have been batched

    // Process updates, prioritizing the latest for each lesson/course
    // Iterate in reverse to easily pick the latest update for a given lesson/course
    for (let i = updates.length - 1; i >= 0; i--) {
      const update = updates[i];
      const updateKey = `${update.userId}_${update.courseId}_${update.lessonKey}`;

      // If we've already processed a later update for this key, skip this one
      if (processedUpdateKeys.has(updateKey)) {
        continue;
    }

      if (update.type === 'lesson_completion') {
        const {userId, courseId, lessonKey } = update;

        // Reference to the courseProgress document
        const progressRef = doc(firestore, 'courseProgress', `${userId}_${courseId}`);

        // Add update operation to the batch
        // Note: This assumes the update structure is compatible with setDoc/updateDoc merge
        // A more complex merge logic might be needed depending on how progressData is structured.
        batch.set(progressRef, {
          completedLessons: arrayUnion(lessonKey), // Assuming completedLessons is an array
          lastAccessDate: new Date().toISOString(),
          lastUpdated: serverTimestamp()
      }, {merge: true });

        processedUpdateKeys.add(updateKey);
    }
      // Add other update types here if necessary
  }

    if (processedUpdateKeys.size === 0) {
      console.log('No unique pending updates to sync after processing.');
      return true; // Nothing to sync
  }

    // Commit the batch
    await batch.commit();
    console.log(`Successfully synced ${processedUpdateKeys.size} unique pending updates using batch write.`);

    // Clear all pending updates from local storage after successful batch commit
    localStorage.removeItem('pendingProgressUpdates');
    console.log('Cleared all pending updates from local storage.');

    return true; // Sync successful

} catch (error) {
    console.error('Error syncing pending updates:', error);
    return false;
}
};

/**
 * Get stored pending progress updates
 */
export const getPendingUpdates = (): ProgressData[] => {
  try {
    const pendingData = localStorage.getItem('pendingProgressUpdates');
    return pendingData ? JSON.parse(pendingData) as ProgressData[] : [];
} catch (e) {
    console.error('Error retrieving pending updates:', e);
    return [];
}
};

/**
 * Check if there are any pending progress updates
 */
export const hasPendingUpdates = (): boolean => {
  return getPendingUpdates().length > 0;
};
