import {firestore} from '@/services/firebase';
import {CourseProgress} from '@/types/course.types';
import {doc, getDoc, updateDoc} from 'firebase/firestore';

/**
 * Directly fix the progress for a specific enrollment
 * This is a more direct approach than the syncCourseProgress utility
 * @param userId User ID
 * @param courseId Course ID
 * @returns Promise<boolean> indicating success
 */
export const fixEnrollmentProgress = async (
  userId: string,
  courseId: string
): Promise<boolean> => {
  try {
    console.log(`Fixing enrollment progress for user ${userId} in course ${courseId}`);
    
    // First, get the progress from courseProgress collection
    const progressRef = doc(firestore, 'courseProgress', `${userId}_${courseId}`);
    const progressDoc = await getDoc(progressRef);
    
    if (!progressDoc.exists()) {
      console.error('Course progress document not found');
      return false;
  }
    
    const progress = progressDoc.data() as CourseProgress;
    
    // Get the enrollment document
    const enrollmentRef = doc(firestore, `users/${userId}/enrollments/${courseId}`);
    const enrollmentDoc = await getDoc(enrollmentRef);
    
    if (!enrollmentDoc.exists()) {
      console.error('Enrollment document not found');
      return false;
  }
    
    const enrollment = enrollmentDoc.data();
    console.log('Current enrollment data:', enrollment);
    
    // Use the progress directly from the courseProgress document
    // Do NOT override it based on the completed flag
    const newProgress = progress.overallProgress;
    
    console.log(`Updating enrollment progress from ${enrollment.progress} to ${newProgress}`);
    
    // Update the enrollment document
    await updateDoc(enrollmentRef, {
      progress: newProgress,
      status: progress.completed ? 'completed' : 'active',
      completedLessons: progress.completedLessons || [],
      lastAccessedAt: new Date().toISOString()
  });
    
    return true;
} catch (error) {
    console.error('Error fixing enrollment progress:', error);
    return false;
  }
};