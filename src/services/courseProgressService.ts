import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  arrayUnion,
  increment,
  Timestamp,
  orderBy,
  writeBatch,
  deleteField,
  FieldValue,
  UpdateData
} from 'firebase/firestore';
import {firestore } from './firebase';
import {CourseProgress, ModuleProgress, LessonProgress, CourseEnrollment } from '@/types/course.types';
import {
  createProgressReminder,
  createCompletionReminder,
  createInactivityReminder
} from './reminderService';
import {generateCertificate, getDefaultCertificateTemplate } from './certificateService';

// Define Bookmark locally as it's not exported from @/types/course.types
interface Bookmark {
  id: string;
  position: number;
  note: string;
  createdAt: string;
}

// Cache for progress data
const progressCache = new Map<string, {data: CourseProgress | null, timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// Batch write queue
interface WriteOperation {
  docPath: string;
  data: UpdateData<CourseProgress>;
  timestamp: number;
}
const writeQueue: WriteOperation[] = [];
let writeTimer: NodeJS.Timeout | null = null;
const BATCH_INTERVAL = 5000; // 5 seconds
const MAX_BATCH_SIZE = 500; // Firestore limit is 500 operations per batch

/**
 * Queue a write operation to be batched
 */
const queueWrite = (docPath: string, data: UpdateData<CourseProgress>) => {
  // Add to queue
  writeQueue.push({
    docPath,
    data,
    timestamp: Date.now()
});

  // Start timer if not already running
  if (!writeTimer) {
    writeTimer = setTimeout(() => { void processBatchWrites(); }, BATCH_INTERVAL);
}
};

/**
 * Process queued write operations in batches
 */
const processBatchWrites = async () => {
  // Clear timer
  writeTimer = null;

  // If queue is empty, do nothing
  if (writeQueue.length === 0) {
    return;
}

  try {
    // Get operations to process (up to max batch size)
    const operations = writeQueue.splice(0, MAX_BATCH_SIZE);

    // Group by timestamp to avoid hotspotting
    // This creates multiple batches with operations spread across time
    const timeGroups: {[key: string]: WriteOperation[] } = {};
    operations.forEach(op => {
      // Group by 10-second intervals
      const timeKey = Math.floor(op.timestamp / 10000).toString();
      if (!timeGroups[timeKey]) {
        timeGroups[timeKey] = [];
    }
      timeGroups[timeKey].push(op);
  });

    // Process each time group
    for (const timeKey in timeGroups) {
      const batch = writeBatch(firestore);
      const groupOps = timeGroups[timeKey];

      // Add operations to batch
      groupOps.forEach(op => {
        const docRef = doc(firestore, op.docPath);
        batch.update(docRef, {
          ...op.data,
          lastUpdated: serverTimestamp()
      });
    });

      // Commit batch
      await batch.commit();
      console.log(`Processed ${groupOps.length} write operations in batch`);
  }
} catch (error) {
    console.error('Error processing batch writes:', error);

    // If there was an error, re-queue operations with exponential backoff
    if (writeQueue.length < 1000) {// Prevent infinite growth
      setTimeout(() => { void processBatchWrites(); }, BATCH_INTERVAL * 2);
  }
}

  // If there are more operations, schedule another batch
  if (writeQueue.length > 0) {
    writeTimer = setTimeout(() => { void processBatchWrites(); }, BATCH_INTERVAL);
}
};

/**
 * Get course progress for a user
 */
export const getCourseProgress = async (userId: string, courseId: string): Promise<CourseProgress | null> => {
  const docId = `${userId}_${courseId}`;
  const cached = progressCache.get(docId);

  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return cached.data;
}

  try {
    const progressRef = doc(firestore, 'courseProgress', docId);
    const progressDoc = await getDoc(progressRef);

    if (!progressDoc.exists()) {
      return null;
  }

    const progress = progressDoc.data() as CourseProgress;
    progressCache.set(docId, {data: progress, timestamp: Date.now() });

    return progress;
} catch (error) {
    console.error('Error getting course progress:', error);
    return null;
}
};

/**
 * Initialize course progress for a user
 */
export const initializeCourseProgress = async (userId: string, courseId: string, courseName: string): Promise<CourseProgress> => {
  try {
    const progressRef = doc(firestore, 'courseProgress', `${userId}_${courseId}`);
    const progressDoc = await getDoc(progressRef);

    if (progressDoc.exists()) {
      return progressDoc.data() as CourseProgress;
  }

    // Get all modules and lessons to initialize progress tracking
    const modulesRef = collection(firestore, `courses/${courseId}/modules`);
    const modulesQuery = query(modulesRef, where('status', '==', 'published'), orderBy('order', 'asc'));
    const modulesSnapshot = await getDocs(modulesQuery);

    const moduleProgress: Record<string, ModuleProgress> = {};
    const lessonProgress: Record<string, LessonProgress> = {};

    // Initialize module and lesson progress
    for (const moduleDoc of modulesSnapshot.docs) {
      const moduleId = moduleDoc.id;

      // Get lessons for this module
      const lessonsRef = collection(firestore, `courses/${courseId}/modules/${moduleId}/lessons`);
      const lessonsQuery = query(lessonsRef, where('status', '==', 'published'), orderBy('order', 'asc'));
      const lessonsSnapshot = await getDocs(lessonsQuery);

      // Initialize module progress
      moduleProgress[moduleId] = {
        moduleId,
        startDate: '',
        lastAccessDate: '',
        completed: false,
        progress: 0,
        timeSpent: 0,
        completedLessons: 0,
        totalLessons: lessonsSnapshot.size
    };

      // Initialize lesson progress
      lessonsSnapshot.forEach(lessonDoc => {
        const lessonId = lessonDoc.id;

        lessonProgress[`${moduleId}_${lessonId}`] = {
          lessonId,
          moduleId,
          startDate: '',
          lastAccessDate: '',
          completed: false,
          timeSpent: 0,
          progress: 0,
          notes: [],
          bookmarks: []
      };
    });
  }

    const newProgress: CourseProgress = {
      courseId,
      userId,
      startDate: new Date().toISOString(),
      lastAccessDate: new Date().toISOString(),
      completedLessons: [],
      completedModules: [],
      quizScores: {},
      quizAttempts: {},
      lessonProgress,
      moduleProgress,
      overallProgress: 0,
      completed: false,
      timeSpent: 0
  };

    await setDoc(progressRef, newProgress);

    // Create initial progress reminder
    await createProgressReminder(userId, courseId, courseName, 0);

    return newProgress;
} catch (error) {
    console.error('Error initializing course progress:', error);
    throw error;
}
};

/**
 * Calculate course progress without database operations
 */
export const calculateCourseProgress = (
  completedLessons: string[],
  totalLessons: number
): {overallProgress: number, completed: boolean } => {
  const safeTotalLessons = Math.max(1, totalLessons);
  const overallProgress = Math.floor((completedLessons.length / safeTotalLessons) * 100);
  const completed = completedLessons.length >= safeTotalLessons && safeTotalLessons > 0;

  return {overallProgress, completed };
};

/**
 * Update lesson progress with optimized writes
 */
export const updateLessonProgress = async (
  userId: string,
  courseId: string,
  courseName: string,
  lessonId: string,
  completed: boolean,
  totalLessons: number
): Promise<CourseProgress> => {
  try {
    // Generate document ID
    const docId = `${userId}_${courseId}`;
    const docPath = `courseProgress/${docId}`; // This is the path to the document in Firestore

    // Get current progress (from cache if possible)
    let progress: CourseProgress;
    const cached = progressCache.get(docId);

    if (cached && cached.data && (Date.now() - cached.timestamp) < CACHE_TTL) {
      progress = cached.data;
  } else {
      const progressRef = doc(firestore, 'courseProgress', docId);
      const progressDoc = await getDoc(progressRef);

      if (!progressDoc.exists()) {
        throw new Error('Course progress not found');
    }
      progress = progressDoc.data() as CourseProgress;
      progressCache.set(docId, {data: progress, timestamp: Date.now() });
  }

    // Check if we need to update
    const completedLessons = [...(progress.completedLessons || [])];
    const lessonIndex = completedLessons.indexOf(lessonId);

    if ((completed && lessonIndex >= 0) || (!completed && lessonIndex < 0)) {
      // No change needed
      return progress;
  }

    // Update completed lessons
    if (completed) {
      completedLessons.push(lessonId);
  } else {
      completedLessons.splice(lessonIndex, 1);
  }

    // Calculate new progress
    const {overallProgress, completed: isCompleted } = calculateCourseProgress(
      completedLessons,
      totalLessons
    );

    // Prepare update data
    const updateData: {
      completedLessons: string[];
      overallProgress: number;
      completed: boolean;
      lastAccessDate: string;
      completedDate?: string | FieldValue;
    } = {
      completedLessons,
      overallProgress,
      completed: isCompleted,
      lastAccessDate: new Date().toISOString()
      // completedDate will be added conditionally
  };

    // Add completion date if newly completed
    if (isCompleted && !progress.completed) {
      updateData.completedDate = new Date().toISOString();
  } else if (!isCompleted && progress.completed) {
      // Use deleteField() to properly remove the field from Firestore
      updateData.completedDate = deleteField();
  }

    // Queue the write instead of immediate update
    queueWrite(docPath, updateData);

    // Separate completedDate from updateData and resolve its type for the cache/return object
    const { completedDate: rawCompletedDateFromUpdateData, ...restOfUpdateData } = updateData;
    const resolvedCompletedDateForCache: string | undefined =
      rawCompletedDateFromUpdateData === deleteField() ? undefined :
      (typeof rawCompletedDateFromUpdateData === 'string' ? rawCompletedDateFromUpdateData : undefined);

    const updatedProgress: CourseProgress = {
      ...progress,
      ...restOfUpdateData,
      completedDate: resolvedCompletedDateForCache
    };
    progressCache.set(docId, {data: updatedProgress, timestamp: Date.now() });

    // Return updated progress
    return updatedProgress;
} catch (error) {
    console.error('Error updating lesson progress:', error);
    throw error;
}
};

/**
 * Mark a module as complete
 */
export const markModuleComplete = async (
  userId: string,
  courseId: string,
  moduleId: string
): Promise<CourseProgress> => {
  try {
    const progressRef = doc(firestore, 'courseProgress', `${userId}_${courseId}`);
    const progressDoc = await getDoc(progressRef);

    if (!progressDoc.exists()) {
      throw new Error('Course progress not found');
  }

    const progress = progressDoc.data() as CourseProgress;
    const completedModules = [...progress.completedModules];

    if (!completedModules.includes(moduleId)) {
      completedModules.push(moduleId);
  }

    await updateDoc(progressRef, {
      completedModules,
      lastAccessDate: new Date().toISOString(),
      lastUpdated: serverTimestamp()
  });

    return {
      ...progress,
      completedModules,
      lastAccessDate: new Date().toISOString()
  } as CourseProgress;
} catch (error) {
    console.error('Error marking module complete:', error);
    throw error;
}
};

/**
 * Mark a course as complete
 */
export const markCourseComplete = async (
  userId: string,
  courseId: string,
  courseName: string
): Promise<CourseProgress> => {
  try {
    const progressRef = doc(firestore, 'courseProgress', `${userId}_${courseId}`);
    const progressDoc = await getDoc(progressRef);

    if (!progressDoc.exists()) {
      throw new Error('Course progress not found');
  }

    const progress = progressDoc.data() as CourseProgress;

    // Get all published lessons in the course to verify completion
    const modulesRef = collection(firestore, `courses/${courseId}/modules`);
    const modulesQuery = query(modulesRef, where('status', '==', 'published'));
    const modulesSnapshot = await getDocs(modulesQuery);

    let totalLessons = 0;
    const moduleIds: string[] = [];

    // Count total lessons and collect module IDs
    for (const moduleDoc of modulesSnapshot.docs) {
      const moduleId = moduleDoc.id;
      moduleIds.push(moduleId);

      const lessonsRef = collection(firestore, `courses/${courseId}/modules/${moduleId}/lessons`);
      const lessonsQuery = query(lessonsRef, where('status', '==', 'published'));
      const lessonsSnapshot = await getDocs(lessonsQuery);

      totalLessons += lessonsSnapshot.size;
  }

    // Calculate actual progress based on completed lessons
    const completedLessons = progress.completedLessons.length;
    const actualProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    // Only mark as complete if all lessons are actually completed
    const isActuallyComplete = totalLessons > 0 && completedLessons >= totalLessons;
    const completionDate = new Date().toISOString();

    await updateDoc(progressRef, {
      completed: isActuallyComplete,
      completionDate: isActuallyComplete ? completionDate : null,
      overallProgress: actualProgress,
      lastAccessDate: completionDate,
      lastUpdated: serverTimestamp()
  });

    // Create completion reminder
    await createCompletionReminder(userId, courseId, courseName);

    // Issue certificate if course is configured to issue certificates
    await issueCertificateForCourse(userId, courseId, courseName);

    return {
      ...progress,
      completed: true,
      completionDate,
      overallProgress: 100,
      lastAccessDate: completionDate
  } as CourseProgress;
} catch (error) {
    console.error('Error marking course complete:', error);
    throw error;
}
};

/**
 * Issue a certificate for a completed course
 */
const issueCertificateForCourse = async (
  userId: string,
  courseId: string,
  courseName: string
): Promise<void> => {
  try {
    // Get course details to check if certificates are enabled
    const courseRef = doc(firestore, 'courses', courseId);
    const courseDoc = await getDoc(courseRef);

    if (!courseDoc.exists()) {
      console.error('Course not found for certificate issuance');
      return;
  }

    const courseData = courseDoc.data();

    // Check if certificates are enabled for this course
    if (!courseData.certificatesEnabled) {
      console.log('Certificates not enabled for this course');
      return;
  }

    // Get user details
    const userRef = doc(firestore, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      console.error('User not found for certificate issuance');
      return;
  }

    const userData = userDoc.data();

    // Get certificate template (use course-specific template or default)
    const templateId = courseData.certificateTemplateId as string | null || null;
    let template: Record<string, unknown> | null = null;

    if (templateId) {
      // Use course-specific template
      const templateRef = doc(firestore, 'certificateTemplates', templateId);
      const templateDoc = await getDoc(templateRef);

      if (templateDoc.exists()) {
        template = templateDoc.data() as Record<string, unknown>;
    }
  }

    // If no template found, use default template
    if (!template) {
      const defaultTemplate = await getDefaultCertificateTemplate();

      if (!defaultTemplate) {
        console.error('No certificate template found');
        return;
      }

      template = defaultTemplate as unknown as Record<string, unknown>;
    }

    // Generate certificate
    const certificate = await generateCertificate({
      templateId: template.id as string,
      userId,
      courseId,
      values: {
        studentName: (userData.displayName as string) || (userData.email as string) || 'Student',
        courseName: courseName || (courseData.title as string) || 'Course',
        completionDate: new Date().toISOString(),
        issuerName: (courseData.instructorName as string) || 'Instructor',
        issuerTitle: (courseData.instructorTitle as string) || 'Course Instructor'
    },
      isPublic: courseData.publicCertificates === true
  });

    if (certificate) {
      console.log(`Certificate ${certificate.id} issued successfully for course ${courseId} to user ${userId}`);
  }
} catch (error) {
    console.error('Error issuing certificate:', error);
}
};

/**
 * Check for inactive enrollments and create reminders
 */
export const checkInactiveEnrollments = async (): Promise<number> => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString();

    // Query for progress records that haven't been accessed in a while
    const progressQuery = query(
      collection(firestore, 'courseProgress'),
      where('lastAccessDate', '<=', sevenDaysAgoStr),
      where('completed', '==', false)
    );

    const progressSnapshot = await getDocs(progressQuery);

    let count = 0;

    // Process each inactive enrollment
    for (const progressDoc of progressSnapshot.docs) {
      const progress = progressDoc.data() as CourseProgress;

      // Get course name
      const courseRef = doc(firestore, 'courses', progress.courseId);
      const courseDoc = await getDoc(courseRef);

      if (!courseDoc.exists()) {
        continue;
    }

      const courseData = courseDoc.data();
      const courseName = (courseData.title as string) || 'Unknown Course';

      // Calculate days since last access
      const lastAccessDate = new Date(progress.lastAccessDate);
      const daysSinceLastAccess = Math.floor((now.getTime() - lastAccessDate.getTime()) / (24 * 60 * 60 * 1000));

      // Create inactivity reminder
      await createInactivityReminder(
        progress.userId,
        progress.courseId,
        courseName,
        daysSinceLastAccess
      );

      count++;
  }

    return count;
} catch (error) {
    console.error('Error checking inactive enrollments:', error);
    return 0;
}
};

/**
 * Update quiz score for a lesson
 */
export const updateQuizScore = async (
  userId: string,
  courseId: string,
  lessonId: string,
  score: number
): Promise<CourseProgress> => {
  try {
    const progressRef = doc(firestore, 'courseProgress', `${userId}_${courseId}`);
    const progressDoc = await getDoc(progressRef);

    if (!progressDoc.exists()) {
      throw new Error('Course progress not found');
  }

    const progress = progressDoc.data() as CourseProgress;
    const quizScores = {...progress.quizScores, [lessonId]: score };

    await updateDoc(progressRef, {
      quizScores,
      lastAccessDate: new Date().toISOString(),
      lastUpdated: serverTimestamp()
  });

    return {
      ...progress,
      quizScores,
      lastAccessDate: new Date().toISOString()
  } as CourseProgress;
} catch (error) {
    console.error('Error updating quiz score:', error);
    throw error;
}
};

/**
 * Mark a lesson as completed
 */
import { getQueryClient } from '@/utils/queryClient';

export const markLessonCompleted = async (
  userId: string,
  courseId: string,
  moduleId: string,
  lessonId: string,
  timeSpent: number = 0,
  position: number = 0
): Promise<void> => {
  const queryClient = getQueryClient();
  try {
    const progressRef = doc(firestore, 'courseProgress', `${userId}_${courseId}`);
    const progressDoc = await getDoc(progressRef);

    if (!progressDoc.exists()) {
      // Create progress if it doesn't exist
      await initializeCourseProgress(userId, courseId, 'Unknown Course');
      return;
  }

    const progress = progressDoc.data() as CourseProgress;
    const lessonKey = `${moduleId}_${lessonId}`;
    const now = new Date().toISOString();

    // Update lesson progress
    const lessonProgress = progress.lessonProgress || {};
    const currentLessonProgress = lessonProgress[lessonKey] || {
      lessonId,
      moduleId,
      startDate: now,
      lastAccessDate: now,
      completed: false,
      timeSpent: 0,
      progress: 0,
      notes: [],
      bookmarks: []
  };

    // Update lesson progress
    lessonProgress[lessonKey] = {
      ...currentLessonProgress,
      completed: true,
      completedDate: now,
      lastAccessDate: now,
      timeSpent: currentLessonProgress.timeSpent + timeSpent,
      progress: 100,
      position: position || currentLessonProgress.position
  };

    // Update module progress
    const moduleProgress = progress.moduleProgress || {};
    const currentModuleProgress = moduleProgress[moduleId] || {
      moduleId,
      startDate: now,
      lastAccessDate: now,
      completed: false,
      progress: 0,
      timeSpent: 0,
      completedLessons: 0,
      totalLessons: 0
  };

    // Count completed lessons in this module
    const completedLessonsInModule = Object.keys(lessonProgress)
      .filter(key => key.startsWith(`${moduleId}_`) && lessonProgress[key].completed)
      .length;

    // Update module progress
    moduleProgress[moduleId] = {
      ...currentModuleProgress,
      lastAccessDate: now,
      timeSpent: (currentModuleProgress.timeSpent || 0) + timeSpent,
      completedLessons: completedLessonsInModule,
      progress: (currentModuleProgress.totalLessons || 0) > 0
        ? Math.round((completedLessonsInModule / (currentModuleProgress.totalLessons || 1)) * 100)
        : 0
  };

    // Update the progress document
    const updatedProgress = {
      completedLessons: arrayUnion(lessonKey),
      lastAccessDate: now,
      timeSpent: progress.timeSpent + timeSpent,
      lessonProgress,
      moduleProgress,
      lastPosition: {
        moduleId,
        lessonId,
        position
    },
      lastUpdated: serverTimestamp()
  };

    await updateDoc(progressRef, updatedProgress);

    // Check if all lessons in the module are completed
    await checkModuleCompletion(userId, courseId, moduleId);

    // Update overall progress
    await updateOverallProgress(userId, courseId);

    // Invalidate relevant queries to trigger UI updates
    queryClient.invalidateQueries({
      queryKey: ['courseProgress', userId, courseId]
    });
    queryClient.invalidateQueries({
      queryKey: ['enrolledCoursesWithProgress', userId]
    });
  } catch (error) {
    console.error('Error marking lesson as completed:', error);
    throw error;
  };
};

/**
 * Update lesson progress without marking it as completed
 */
export const updateLessonTracking = async (
  userId: string,
  courseId: string,
  moduleId: string,
  lessonId: string,
  timeSpent: number = 0,
  position: number = 0,
  progressPercentage: number = 0
): Promise<void> => {
  try {
    const progressRef = doc(firestore, 'courseProgress', `${userId}_${courseId}`);
    const progressDoc = await getDoc(progressRef);

    if (!progressDoc.exists()) {
      // Create progress if it doesn't exist
      await initializeCourseProgress(userId, courseId, 'Unknown Course');
      return;
  }

    const progress = progressDoc.data() as CourseProgress;
    const lessonKey = `${moduleId}_${lessonId}`;
    const now = new Date().toISOString();

    // Update lesson progress
    const lessonProgress = progress.lessonProgress || {};
    const currentLessonProgress = lessonProgress[lessonKey] || {
      lessonId,
      moduleId,
      startDate: now,
      lastAccessDate: now,
      completed: false,
      timeSpent: 0,
      progress: 0,
      notes: [],
      bookmarks: []
  };

    // If this is the first time accessing this lesson, set the start date
    if (!currentLessonProgress.startDate) {
      currentLessonProgress.startDate = now;
  }

    // Update lesson progress
    lessonProgress[lessonKey] = {
      ...currentLessonProgress,
      lastAccessDate: now,
      timeSpent: currentLessonProgress.timeSpent + timeSpent,
      progress: Math.max(progressPercentage, currentLessonProgress.progress || 0),
      position: position
  };

    // Update module progress
    const moduleProgress = progress.moduleProgress || {};
    const currentModuleProgress = moduleProgress[moduleId] || {
      moduleId,
      startDate: now,
      lastAccessDate: now,
      completed: false,
      progress: 0,
      timeSpent: 0,
      completedLessons: 0,
      totalLessons: 0
  };

    // If this is the first time accessing this module, set the start date
    if (!currentModuleProgress.startDate) {
      currentModuleProgress.startDate = now;
  }

    // Count completed lessons in this module
    const completedLessonsInModule = Object.keys(lessonProgress)
      .filter(key => key.startsWith(`${moduleId}_`) && lessonProgress[key].completed)
      .length;

    // Calculate average progress for incomplete lessons
    const incompleteLessons = Object.keys(lessonProgress)
      .filter(key => key.startsWith(`${moduleId}_`) && !lessonProgress[key].completed);

    const incompleteProgress = incompleteLessons.reduce(
      (sum, key) => sum + (lessonProgress[key].progress || 0),
      0
    );

    const averageIncompleteProgress = incompleteLessons.length > 0
      ? incompleteProgress / incompleteLessons.length
      : 0;

    // Calculate overall module progress
    const totalLessons = currentModuleProgress.totalLessons || 1;
    const moduleProgressPercentage = (
      (completedLessonsInModule * 100) + // Completed lessons count as 100%
      ((totalLessons - completedLessonsInModule) * averageIncompleteProgress / 100) // Add partial progress
    ) / totalLessons;

    // Update module progress
    moduleProgress[moduleId] = {
      ...currentModuleProgress,
      lastAccessDate: now,
      timeSpent: (currentModuleProgress.timeSpent || 0) + timeSpent,
      completedLessons: completedLessonsInModule,
      progress: Math.round(moduleProgressPercentage)
  };

    // Update the progress document
    const updatedProgress = {
      lastAccessDate: now,
      timeSpent: progress.timeSpent + timeSpent,
      lessonProgress,
      moduleProgress,
      lastPosition: {
        moduleId,
        lessonId,
        position
    },
      lastUpdated: serverTimestamp()
  };

    await updateDoc(progressRef, updatedProgress);

    // Update overall progress without marking anything as completed
    await updateOverallProgressCalculation(userId, courseId);
} catch (error) {
    console.error('Error updating lesson tracking:', error);
}
};

/**
 * Update overall progress calculation without marking anything as completed
 */
const updateOverallProgressCalculation = async (userId: string, courseId: string): Promise<void> => {
  try {
    const progressRef = doc(firestore, 'courseProgress', `${userId}_${courseId}`);
    const progressDoc = await getDoc(progressRef);

    if (!progressDoc.exists()) {
      return;
  }

    const progress = progressDoc.data() as CourseProgress;

    // Calculate overall progress based on module progress
    const moduleProgressValues = Object.values(progress.moduleProgress || {});

    if (moduleProgressValues.length === 0) {
      return;
  }

    const overallProgress = Math.round(
      moduleProgressValues.reduce((sum, module) => sum + module.progress, 0) / moduleProgressValues.length
    );

    // Update progress
    await updateDoc(progressRef, {
      overallProgress,
      lastUpdated: serverTimestamp()
  });
} catch (error) {
    console.error('Error updating overall progress calculation:', error);
}
};

/**
 * Add a bookmark to a lesson
 */
export const addLessonBookmark = async (
  userId: string,
  courseId: string,
  moduleId: string,
  lessonId: string,
  position: number,
  note: string
): Promise<void> => {
  try {
    const progressRef = doc(firestore, 'courseProgress', `${userId}_${courseId}`);
    const progressDoc = await getDoc(progressRef);

    if (!progressDoc.exists()) {
      // Create progress if it doesn't exist
      await initializeCourseProgress(userId, courseId, 'Unknown Course');
      return;
  }

    const progress = progressDoc.data() as CourseProgress;
    const lessonKey = `${moduleId}_${lessonId}`;
    const now = new Date().toISOString();

    // Update lesson progress
    const lessonProgress = progress.lessonProgress || {};
    const currentLessonProgress = lessonProgress[lessonKey] || {
      lessonId,
      moduleId,
      startDate: now,
      lastAccessDate: now,
      completed: false,
      timeSpent: 0,
      progress: 0,
      notes: [],
      bookmarks: []
  };

    // Add bookmark
    const bookmarks = currentLessonProgress.bookmarks || [];
    const newBookmark = {
      id: `bookmark_${Date.now()}`,
      position,
      note,
      createdAt: now
  };

    // Update lesson progress
    lessonProgress[lessonKey] = {
      ...currentLessonProgress,
      lastAccessDate: now,
      bookmarks: [...bookmarks, newBookmark]
  };

    // Update the progress document
    await updateDoc(progressRef, {
      lessonProgress,
      lastAccessDate: now,
      lastUpdated: serverTimestamp()
  });
} catch (error) {
    console.error('Error adding lesson bookmark:', error);
}
};

/**
 * Add a note to a lesson
 */
export const addLessonNote = async (
  userId: string,
  courseId: string,
  moduleId: string,
  lessonId: string,
  note: string
): Promise<void> => {
  try {
    const progressRef = doc(firestore, 'courseProgress', `${userId}_${courseId}`);
    const progressDoc = await getDoc(progressRef);

    if (!progressDoc.exists()) {
      // Create progress if it doesn't exist
      await initializeCourseProgress(userId, courseId, 'Unknown Course');
      return;
  }

    const progress = progressDoc.data() as CourseProgress;
    const lessonKey = `${moduleId}_${lessonId}`;
    const now = new Date().toISOString();

    // Update lesson progress
    const lessonProgress = progress.lessonProgress || {};
    const currentLessonProgress = lessonProgress[lessonKey] || {
      lessonId,
      moduleId,
      startDate: now,
      lastAccessDate: now,
      completed: false,
      timeSpent: 0,
      progress: 0,
      notes: [],
      bookmarks: []
  };

    // Add note
    const notes = currentLessonProgress.notes || [];

    // Update lesson progress
    lessonProgress[lessonKey] = {
      ...currentLessonProgress,
      lastAccessDate: now,
      notes: [...notes, note]
  };

    // Update the progress document
    await updateDoc(progressRef, {
      lessonProgress,
      lastAccessDate: now,
      lastUpdated: serverTimestamp()
  });
} catch (error) {
    console.error('Error adding lesson note:', error);
}
};

/**
 * Check if all lessons in a module are completed
 */
const checkModuleCompletion = async (userId: string, courseId: string, moduleId: string): Promise<void> => {
  try {
    // Get the module data
    const moduleRef = doc(firestore, `courses/${courseId}/modules/${moduleId}`);
    const moduleSnapshot = await getDoc(moduleRef);

    if (!moduleSnapshot.exists()) {
      return;
  }

    // Get module data
    // const moduleData = moduleSnapshot.data() as Module; // moduleData is not used

    // Get all lessons for the module
    const lessonsRef = collection(firestore, `courses/${courseId}/modules/${moduleId}/lessons`);
    const lessonsQuery = query(lessonsRef, where('status', '==', 'published'));
    const lessonsSnapshot = await getDocs(lessonsQuery);

    const lessonIds = lessonsSnapshot.docs.map(doc => doc.id);

    // Get the user's progress
    const progressRef = doc(firestore, `users/${userId}/courseProgress/${courseId}`);
    const progressSnapshot = await getDoc(progressRef);

    if (!progressSnapshot.exists()) {
      return;
  }

    const progressData = progressSnapshot.data() as CourseProgress;

    // Check if all lessons are completed
    const allLessonsCompleted = lessonIds.every(lessonId =>
      progressData.completedLessons.includes(`${moduleId}_${lessonId}`)
    );

    // If all lessons are completed and the module is not already marked as completed
    if (allLessonsCompleted && !progressData.completedModules.includes(moduleId)) {
      await updateDoc(progressRef, {
        completedModules: arrayUnion(moduleId),
        lastUpdated: serverTimestamp()
    });
  }
} catch (error) {
    console.error('Error checking module completion:', error);
}
};

/**
 * Update overall course progress
 */
const updateOverallProgress = async (userId: string, courseId: string): Promise<void> => {
  try {
    // Get all published lessons in the course
    const modulesRef = collection(firestore, `courses/${courseId}/modules`);
    const modulesQuery = query(modulesRef, where('status', '==', 'published'));
    const modulesSnapshot = await getDocs(modulesQuery);

    let totalLessons = 0;
    const moduleIds: string[] = [];

    // Count total lessons
    for (const moduleDoc of modulesSnapshot.docs) {
      moduleIds.push(moduleDoc.id);

      const lessonsRef = collection(firestore, `courses/${courseId}/modules/${moduleDoc.id}/lessons`);
      const lessonsQuery = query(lessonsRef, where('status', '==', 'published'));
      const lessonsSnapshot = await getDocs(lessonsQuery);

      totalLessons += lessonsSnapshot.size;
  }

    // Get user progress
    const progressRef = doc(firestore, `users/${userId}/courseProgress/${courseId}`);
    const progressSnapshot = await getDoc(progressRef);

    if (!progressSnapshot.exists()) {
      return;
  }

    const progressData = progressSnapshot.data() as CourseProgress;
    const completedLessons = progressData.completedLessons.length;

    // Calculate progress percentage
    const overallProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    // Check if all modules are completed
    const allModulesCompleted = moduleIds.every(moduleId =>
      progressData.completedModules.includes(moduleId)
    );

    // Data for the courseProgress document (users/{userId}/courseProgress/{courseId})
    const courseProgressUpdateData = {
      overallProgress,
      completed: allModulesCompleted && overallProgress === 100,
      lastUpdated: serverTimestamp()
    };
    await updateDoc(progressRef, courseProgressUpdateData);

    // Also update the corresponding enrollment document in users/{userId}/enrollments/{courseId}
    try {
      const enrollmentDocRef = doc(firestore, `users/${userId}/enrollments/${courseId}`);
      const enrollmentSnap = await getDoc(enrollmentDocRef);
      let currentEnrollmentStatus: CourseEnrollment['status'] = 'active'; // Default to 'active'

      if (enrollmentSnap.exists()) {
        const enrollmentData = enrollmentSnap.data() as Partial<CourseEnrollment>;
        currentEnrollmentStatus = enrollmentData.status || 'active';
      }

      // Update the main enrollment document with the same progress.
      await updateDoc(enrollmentDocRef, {
        progress: overallProgress, // Sync the progress value
        status: (allModulesCompleted && overallProgress === 100) ? 'completed' : currentEnrollmentStatus, // Use fetched status
        lastAccessedAt: serverTimestamp(), // Keep lastAccessedAt fresh
      });
    } catch (enrollmentError) {
      console.error(`Error updating enrollment document for user ${userId}, course ${courseId}:`, enrollmentError);
      // Decide if this error should propagate or be handled silently
    }

    // If course is completed, update user stats
    if (allModulesCompleted && overallProgress === 100 && !progressData.completed) {
      // Update user stats
      const userStatsRef = doc(firestore, `users/${userId}/stats/courses`);
      const userStatsSnapshot = await getDoc(userStatsRef);

      if (userStatsSnapshot.exists()) {
        await updateDoc(userStatsRef, {
          completedCourses: increment(1),
          lastCompletionDate: Timestamp.now()
      });
    } else {
        await setDoc(userStatsRef, {
          completedCourses: 1,
          lastCompletionDate: Timestamp.now()
      });
    }
  }
} catch (error) {
    console.error('Error updating overall progress:', error);
}
};

/**
 * Get all courses in progress for a user
 */
export const getCoursesInProgress = async (userId: string): Promise<CourseProgress[]> => {
  try {
    const progressRef = collection(firestore, `users/${userId}/courseProgress`);
    const progressSnapshot = await getDocs(progressRef);

    const coursesInProgress: CourseProgress[] = [];

    progressSnapshot.forEach(doc => {
      coursesInProgress.push({
        ...doc.data() as CourseProgress,
        courseId: doc.id,
        userId
    });
  });

    return coursesInProgress;
} catch (error) {
    console.error('Error getting courses in progress:', error);
    return [];
}
};

/**
 * Reset course progress for a user
 */
export const resetCourseProgress = async (userId: string, courseId: string): Promise<void> => {
  try {
    const progressRef = doc(firestore, `users/${userId}/courseProgress/${courseId}`);

    await setDoc(progressRef, {
      courseId,
      userId,
      startDate: new Date().toISOString(),
      lastAccessDate: new Date().toISOString(),
      completedLessons: [],
      completedModules: [],
      quizScores: {},
      overallProgress: 0,
      completed: false,
      lastUpdated: serverTimestamp()
  });
} catch (error) {
    console.error('Error resetting course progress:', error);
}
};

/**
 * Get lesson progress for a user
 */
export const getLessonProgress = async (
  userId: string,
  courseId: string,
  moduleId: string,
  lessonId: string
): Promise<LessonProgress | {
    completed: boolean;
    progress: number;
    timeSpent: number;
    currentPosition: number;
    bookmarks: Bookmark[]
  }> => {
  try {
    const progressRef = doc(firestore, 'courseProgress', `${userId}_${courseId}`);
    const progressDoc = await getDoc(progressRef);

    if (!progressDoc.exists()) {
      return {
        lessonId, // Add missing properties to match LessonProgress structure
        moduleId,
        completed: false,
        progress: 0,
        timeSpent: 0,
        currentPosition: 0,
        bookmarks: []
    };
  }

    const progressData = progressDoc.data() as CourseProgress;
    const lessonKey = `${moduleId}_${lessonId}`;

    // Return lesson-specific progress data
    return progressData.lessonProgress && progressData.lessonProgress[lessonKey]
      ? progressData.lessonProgress[lessonKey]
      : {
          lessonId,
          moduleId,
          completed: false,
          progress: 0,
          timeSpent: 0,
          currentPosition: 0,
          bookmarks: []
      };
} catch (error) {
    console.error('Error getting lesson progress:', error);
    return {
      lessonId,
      moduleId,
      completed: false,
      progress: 0,
      timeSpent: 0,
      currentPosition: 0,
      bookmarks: []
  };
}
};

/**
 * Sync course progress with optimized writes
 * This should be called less frequently, e.g., when user leaves the course page
 */
export const syncCourseProgress = (userId: string, courseId: string): void => {
  const docId = `${userId}_${courseId}`;
  const cached = progressCache.get(docId);

  if (!cached) {
    return; // Nothing to sync
}

  try {
    // Get the latest progress from cache
    const progress = cached.data as CourseProgress; // We know it's CourseProgress if cached

    // Queue the write to the main courseProgress document
    // The original intention might have been to update a separate 'enrollments' collection,
    // but the current `queueWrite` is for `courseProgress`.
    // If a separate enrollments collection needs updating, that's a different logic.
    // For now, this syncs the cached `courseProgress` data.
    // The `progress` object itself is what's in `courseProgress/${docId}`
    // So we are essentially re-queueing the latest state from cache.
    queueWrite(`courseProgress/${docId}`, progress as UpdateData<CourseProgress>);
} catch (error) {
    console.error('Error syncing course progress:', error);
}
};
