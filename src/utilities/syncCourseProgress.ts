import {firestore} from "@/services/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
  CollectionReference,
  Query
} from "firebase/firestore";
import {CourseProgress} from "@/types/course.types";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {calculateCourseProgress} from "@/services/courseProgressService";

/**
 * Sync progress from courseProgress collection to user enrollments
 * @param {string} [userId] User ID to sync progress for (if provided, only syncs for this user)
 * @param {string} [courseId] Course ID to sync progress for (if provided, only syncs for this course)
 * @return {Promise<{synced: number, failed: number, details: Array<{userId: string, courseId: string,
 *   oldProgress: number, newProgress: number, success: boolean, error?: string}>}>}
 *   Object with counts of synced and failed items
 */
export const syncCourseProgress = async (
  userId?: string,
  courseId?: string
): Promise<{
  synced: number;
  failed: number;
  details: Array<{
    userId: string;
    courseId: string;
    oldProgress: number;
    newProgress: number;
    success: boolean;
    error?: string;
}>;
}> => {
  const result = {
    synced: 0,
    failed: 0,
    details: [] as Array<{
      userId: string;
      courseId: string;
      oldProgress: number;
      newProgress: number;
      success: boolean;
      error?: string;
  }>,
};

  try {
    // Build query for courseProgress collection
    let progressQuery: CollectionReference | Query = collection(firestore, "courseProgress");

    // If userId and courseId are provided, get a specific document
    if (userId && courseId) {
      const progressRef = doc(firestore, "courseProgress", `${userId}_${courseId}`);
      const progressDoc = await getDoc(progressRef);

      if (!progressDoc.exists()) {
        return {
          synced: 0,
          failed: 1,
          details: [{
            userId,
            courseId,
            oldProgress: 0,
            newProgress: 0,
            success: false,
            error: "Course progress document not found",
        }]
      };
    }

      // Process this single document
      const progress = progressDoc.data() as CourseProgress;
      await syncSingleCourseProgress(progress, result);

      return result;
  }

    // Apply filters if userId or courseId are provided
    if (userId) {
      progressQuery = query(progressQuery, where("userId", "==", userId));
  }
    if (courseId) {
      progressQuery = query(progressQuery, where("courseId", "==", courseId));
  }

    // Otherwise, get all documents matching filters
    const progressSnapshot = await getDocs(progressQuery);

    // Process each document
    for (const progressDoc of progressSnapshot.docs) {
      const progress = progressDoc.data() as CourseProgress;

      // Skip if we're filtering by userId and this document doesn't match
      // This check is redundant if filters are applied to the query, but kept for safety
      if (userId && progress.userId !== userId) continue;

      // Skip if we're filtering by courseId and this document doesn't match
      // This check is redundant if filters are applied to the query, but kept for safety
      if (courseId && progress.courseId !== courseId) continue;

      await syncSingleCourseProgress(progress, result);
  }

    return result;
} catch (error) {
    console.error("Error syncing course progress:", error);
    throw error;
}
};

/**
 * Sync a single course progress document to the corresponding enrollment
 * @param {CourseProgress} progress The course progress document to sync
 * @param {Object} result The result object to update with sync results
 * @return {Promise<void>} Nothing
 */
const syncSingleCourseProgress = async (
  progress: CourseProgress,
  result: {
    synced: number;
    failed: number;
    details: Array<{
      userId: string;
      courseId: string;
      oldProgress: number;
      newProgress: number;
      success: boolean;
      error?: string;
  }>;
}
): Promise<void> => {
  try {
    const {userId, courseId} = progress;

    // Get the enrollment document - this is the one used by the my-learning page
    const enrollmentPath = `users/${userId}/enrollments/${courseId}`;
    const enrollmentRef = doc(firestore, enrollmentPath);
    const enrollmentDoc = await getDoc(enrollmentRef);

    if (!enrollmentDoc.exists()) {
      result.failed++;
      result.details.push({
        userId,
        courseId,
        oldProgress: 0,
        newProgress: progress.overallProgress,
        success: false,
        error: "Enrollment document not found",
    });
      return;
  }

    const enrollment = enrollmentDoc.data();
    // Explicitly type the enrollment data to avoid 'any' type
    const oldProgress = typeof enrollment?.progress === 'number' ? enrollment.progress : 0;

    // Use the progress directly from the courseProgress document
    // Do NOT override it based on the completed flag
    const newProgress = progress.overallProgress;

    console.log(
      `Updating enrollment progress for user ${userId} in course ${courseId}` +
      ` from ${oldProgress} to ${newProgress}`
    );

    await updateDoc(enrollmentRef, {
      progress: newProgress,
      // Set status based on the completed flag
      status: progress.completed ? "completed" : "active",
      // Also update completedLessons array if it exists
      ...(progress.completedLessons ? {completedLessons: progress.completedLessons} : {}),
      // Update lastAccessedAt timestamp
      lastAccessedAt: new Date().toISOString(),
  });

    result.synced++;
    result.details.push({
      userId,
      courseId,
      oldProgress: oldProgress, // Explicitly use the properly typed oldProgress
      newProgress,
      success: true,
  });
} catch (error) {
    result.failed++;
    result.details.push({
      userId: progress.userId,
      courseId: progress.courseId,
      oldProgress: 0,
      newProgress: progress.overallProgress,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
  });
}
};

/**
 * Sync progress for a specific user and course
 * @param {string} userId The user ID to sync progress for
 * @param {string} courseId The course ID to sync progress for
 * @return {Promise<boolean>} True if sync was successful, false otherwise
 */
export const syncUserCourseProgress = async (
  userId: string,
  courseId: string
): Promise<boolean> => {
  try {
    const result = await syncCourseProgress(userId, courseId);
    return result.synced > 0;
} catch (error) {
    console.error("Error syncing user course progress:", error);
    return false;
}
};

