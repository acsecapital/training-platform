import {firestore } from '@/services/firebase';
import {doc, getDoc, updateDoc, serverTimestamp, runTransaction } from 'firebase/firestore';
import {CourseProgress } from '@/types/course.types';
import {syncUserCourseProgress } from './syncCourseProgress';

interface OverrideResult {
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Mark a course as completed for a user
 */
export const adminMarkCourseComplete = async (
  userId: string,
  courseId: string,
  adminId: string,
  adminNote?: string
): Promise<OverrideResult> => {
  try {
    const progressRef = doc(firestore, 'courseProgress', `${userId}_${courseId}`);
    const enrollmentRef = doc(firestore, `users/${userId}/enrollments/${courseId}`);

    await runTransaction(firestore, async (transaction) => {
      const progressDoc = await transaction.get(progressRef);
      const enrollmentDoc = await transaction.get(enrollmentRef);

      if (!progressDoc.exists()) {
        throw new Error('Course progress not found. User may not be enrolled in this course.');
    }

      // Update the progress document within the transaction
      transaction.update(progressRef, {
        completed: true,
        overallProgress: 100,
        completedDate: new Date().toISOString(),
        adminOverride: {
          action: 'mark_complete',
          adminId,
          timestamp: new Date().toISOString(),
          note: adminNote || 'Manually marked as completed by admin'
      },
        lastUpdated: serverTimestamp()
    });

      // Update the enrollment document within the transaction if it exists
      if (enrollmentDoc.exists()) {
        transaction.update(enrollmentRef, {
          status: 'completed',
          progress: 100,
          lastAccessedAt: new Date().toISOString(),
          adminOverride: {
            action: 'mark_complete',
            adminId,
            timestamp: new Date().toISOString(),
            note: adminNote || 'Manually marked as completed by admin'
        }
      });
    }
  });

    return {
      success: true,
      message: 'Course marked as completed successfully'
  };
} catch (error: unknown) {
    console.error('Error marking course as completed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      success: false,
      message: `Error marking course as completed: ${errorMessage}`
  };
}
};

/**
 * Reset a course's progress for a user
 */
export const adminResetCourseProgress = async (
  userId: string,
  courseId: string,
  adminId: string,
  adminNote?: string
): Promise<OverrideResult> => {
  try {
    const progressRef = doc(firestore, 'courseProgress', `${userId}_${courseId}`);
    const enrollmentRef = doc(firestore, `users/${userId}/enrollments/${courseId}`);

    await runTransaction(firestore, async (transaction) => {
      const progressDoc = await transaction.get(progressRef);
      const enrollmentDoc = await transaction.get(enrollmentRef);

      if (!progressDoc.exists()) {
        throw new Error('Course progress not found. User may not be enrolled in this course.');
    }

      // Update the progress document within the transaction
      transaction.update(progressRef, {
        completed: false,
        completedDate: null,
        overallProgress: 0,
        completedLessons: [],
        completedModules: [],
        lessonProgress: {},
        moduleProgress: {},
        quizScores: {},
        quizAttempts: {},
        adminOverride: {
          action: 'reset_progress',
          adminId,
          timestamp: new Date().toISOString(),
          note: adminNote || 'Progress reset by admin'
      },
        lastUpdated: serverTimestamp()
    });

      // Update the enrollment document within the transaction if it exists
      if (enrollmentDoc.exists()) {
        transaction.update(enrollmentRef, {
          status: 'active',
          progress: 0,
          completedLessons: [],
          lastAccessedAt: new Date().toISOString(),
          adminOverride: {
            action: 'reset_progress',
            adminId,
            timestamp: new Date().toISOString(),
            note: adminNote || 'Progress reset by admin'
        }
      });
    }
  });

    return {
      success: true,
      message: 'Course progress reset successfully'
  };
} catch (error: unknown) {
    console.error('Error resetting course progress:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      success: false,
      message: `Error resetting course progress: ${errorMessage}`
  };
}
};

/**
 * Revoke a user's enrollment in a course
 */
export const adminRevokeEnrollment = async (
  userId: string,
  courseId: string,
  adminId: string,
  adminNote?: string
): Promise<OverrideResult> => {
  try {
    const progressRef = doc(firestore, 'courseProgress', `${userId}_${courseId}`);
    const enrollmentRef = doc(firestore, `users/${userId}/enrollments/${courseId}`);

    await runTransaction(firestore, async (transaction) => {
      const progressDoc = await transaction.get(progressRef);
      const enrollmentDoc = await transaction.get(enrollmentRef);

      // Update the course progress document within the transaction if it exists
      if (progressDoc.exists()) {
        transaction.update(progressRef, {
          revoked: true,
          revokedBy: adminId,
          revokedAt: new Date().toISOString(),
          revokedNote: adminNote || 'Enrollment revoked by admin',
          lastUpdated: serverTimestamp()
      });
    }

      // Update the enrollment document within the transaction if it exists
      if (enrollmentDoc.exists()) {
        transaction.update(enrollmentRef, {
          status: 'revoked',
          revokedBy: adminId,
          revokedAt: new Date().toISOString(),
          revokedNote: adminNote || 'Enrollment revoked by admin'
      });
    } else {
        // If enrollment doesn't exist, we still consider it a success for revocation purposes
        // but might want to log this or handle differently depending on requirements.
        // For now, we'll just proceed without throwing an error.
    }
  });

    return {
      success: true,
      message: 'Enrollment revoked successfully'
  };
} catch (error: unknown) {
    console.error('Error revoking enrollment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      success: false,
      message: `Error revoking enrollment: ${errorMessage}`
  };
}
};

/**
 * Mark a module as completed for a user
 */
export const adminMarkModuleComplete = async (
  userId: string,
  courseId: string,
  moduleId: string,
  adminId: string,
  adminNote?: string
): Promise<OverrideResult> => {
  try {
    // Get the course progress document
    const progressRef = doc(firestore, 'courseProgress', `${userId}_${courseId}`);
    const progressDoc = await getDoc(progressRef);

    if (!progressDoc.exists()) {
      return {
        success: false,
        message: 'Course progress not found. User may not be enrolled in this course.'
    };
  }

    const progressData = progressDoc.data() as CourseProgress;

    // Update the module progress
    const moduleProgress = progressData.moduleProgress || {};
    moduleProgress[moduleId] = {
      ...moduleProgress[moduleId],
      completed: true,
      progress: 100,
      completedDate: new Date().toISOString(),
      adminOverride: {
        action: 'mark_module_complete',
        adminId,
        timestamp: new Date().toISOString(),
        note: adminNote || 'Module manually marked as completed by admin'
    }
  };

    // Add to completed modules if not already there
    let completedModules = progressData.completedModules || [];
    if (!completedModules.includes(moduleId)) {
      completedModules = [...completedModules, moduleId];
  }

    // Update the progress document
    await updateDoc(progressRef, {
      moduleProgress,
      completedModules,
      adminOverride: {
        action: 'mark_module_complete',
        adminId,
        timestamp: new Date().toISOString(),
        note: adminNote || 'Module manually marked as completed by admin'
    },
      lastUpdated: serverTimestamp()
  });

    // Sync progress to enrollment
    await syncUserCourseProgress(userId, courseId);

    return {
      success: true,
      message: 'Module marked as completed successfully'
  };
} catch (error: unknown) {
    console.error('Error marking module as completed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      success: false,
      message: `Error marking module as completed: ${errorMessage}`
  };
}
};

/**
 * Reset a module's progress for a user
 */
export const adminResetModuleProgress = async (
  userId: string,
  courseId: string,
  moduleId: string,
  adminId: string,
  adminNote?: string
): Promise<OverrideResult> => {
  try {
    // Get the course progress document
    const progressRef = doc(firestore, 'courseProgress', `${userId}_${courseId}`);
    const progressDoc = await getDoc(progressRef);

    if (!progressDoc.exists()) {
      return {
        success: false,
        message: 'Course progress not found. User may not be enrolled in this course.'
    };
  }

    const progressData = progressDoc.data() as CourseProgress;

    // Update the module progress
    const moduleProgress = progressData.moduleProgress || {};
    moduleProgress[moduleId] = {
      ...moduleProgress[moduleId],
      completed: false,
      progress: 0,
      completedDate: null,
      adminOverride: {
        action: 'reset_module_progress',
        adminId,
        timestamp: new Date().toISOString(),
        note: adminNote || 'Module progress reset by admin'
    }
  };

    // Remove from completed modules
    let completedModules = progressData.completedModules || [];
    completedModules = completedModules.filter(id => id !== moduleId);

    // Update the progress document
    await updateDoc(progressRef, {
      moduleProgress,
      completedModules,
      adminOverride: {
        action: 'reset_module_progress',
        adminId,
        timestamp: new Date().toISOString(),
        note: adminNote || 'Module progress reset by admin'
    },
      lastUpdated: serverTimestamp()
  });

    // Sync progress to enrollment
    await syncUserCourseProgress(userId, courseId);

    return {
      success: true,
      message: 'Module progress reset successfully'
  };
} catch (error: unknown) {
    console.error('Error resetting module progress:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      success: false,
      message: `Error resetting module progress: ${errorMessage}`
  };
}
};

/**
 * Mark a lesson as completed for a user
 */
export const adminMarkLessonComplete = async (
  userId: string,
  courseId: string,
  moduleId: string,
  lessonId: string,
  adminId: string,
  adminNote?: string
): Promise<OverrideResult> => {
  try {
    // Get the course progress document
    const progressRef = doc(firestore, 'courseProgress', `${userId}_${courseId}`);
    const progressDoc = await getDoc(progressRef);

    if (!progressDoc.exists()) {
      return {
        success: false,
        message: 'Course progress not found. User may not be enrolled in this course.'
    };
  }

    const progressData = progressDoc.data() as CourseProgress;

    // Update the lesson progress
    const lessonProgress = progressData.lessonProgress || {};
    const lessonKey = `${moduleId}_${lessonId}`;

    lessonProgress[lessonKey] = {
      ...lessonProgress[lessonKey],
      lessonId,
      moduleId,
      completed: true,
      progress: 100,
      completedDate: new Date().toISOString(),
      lastAccessDate: new Date().toISOString(),
      adminOverride: {
        action: 'mark_lesson_complete',
        adminId,
        timestamp: new Date().toISOString(),
        note: adminNote || 'Lesson manually marked as completed by admin'
    }
  };

    // Add to completed lessons if not already there
    let completedLessons = progressData.completedLessons || [];
    if (!completedLessons.includes(lessonKey)) {
      completedLessons = [...completedLessons, lessonKey];
  }

    // Update the progress document
    await updateDoc(progressRef, {
      lessonProgress,
      completedLessons,
      adminOverride: {
        action: 'mark_lesson_complete',
        adminId,
        timestamp: new Date().toISOString(),
        note: adminNote || 'Lesson manually marked as completed by admin'
    },
      lastUpdated: serverTimestamp()
  });

    // Sync progress to enrollment
    await syncUserCourseProgress(userId, courseId);

    return {
      success: true,
      message: 'Lesson marked as completed successfully'
  };
} catch (error: unknown) {
    console.error('Error marking lesson as completed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      success: false,
      message: `Error marking lesson as completed: ${errorMessage}`
  };
}
};

/**
 * Reset a lesson's progress for a user
 */
export const adminResetLessonProgress = async (
  userId: string,
  courseId: string,
  moduleId: string,
  lessonId: string,
  adminId: string,
  adminNote?: string
): Promise<OverrideResult> => {
  try {
    // Get the course progress document
    const progressRef = doc(firestore, 'courseProgress', `${userId}_${courseId}`);
    const progressDoc = await getDoc(progressRef);

    if (!progressDoc.exists()) {
      return {
        success: false,
        message: 'Course progress not found. User may not be enrolled in this course.'
    };
  }

    const progressData = progressDoc.data() as CourseProgress;

    // Update the lesson progress
    const lessonProgress = progressData.lessonProgress || {};
    const lessonKey = `${moduleId}_${lessonId}`;

    lessonProgress[lessonKey] = {
      ...lessonProgress[lessonKey],
      lessonId,
      moduleId,
      completed: false,
      progress: 0,
      completedDate: null,
      lastAccessDate: new Date().toISOString(),
      adminOverride: {
        action: 'reset_lesson_progress',
        adminId,
        timestamp: new Date().toISOString(),
        note: adminNote || 'Lesson progress reset by admin'
    }
  };

    // Remove from completed lessons
    let completedLessons = progressData.completedLessons || [];
    completedLessons = completedLessons.filter(id => id !== lessonKey);

    // Update the progress document
    await updateDoc(progressRef, {
      lessonProgress,
      completedLessons,
      adminOverride: {
        action: 'reset_lesson_progress',
        adminId,
        timestamp: new Date().toISOString(),
        note: adminNote || 'Lesson progress reset by admin'
    },
      lastUpdated: serverTimestamp()
  });

    // Sync progress to enrollment
    await syncUserCourseProgress(userId, courseId);

    return {
      success: true,
      message: 'Lesson progress reset successfully'
  };
} catch (error: unknown) {
    console.error('Error resetting lesson progress:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      success: false,
      message: `Error resetting lesson progress: ${errorMessage}`
  };
}
};
