import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  startAfter,
  DocumentSnapshot,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import {firestore } from './firebase';
import {initializeCourseProgress } from './courseProgressService';
import {CourseProgress } from '@/types/course.types';
import {sendTeamEnrollmentNotification } from './teamNotificationService';

export interface Course {
  modulesList: string[] | undefined;
  id: string;
  title: string;
  description: string;
  shortDescription?: string;
  thumbnail?: string;
  coverImage?: string;
  price: number;
  salePrice?: number;
  duration: number; // in minutes
  level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  instructorId: string;
  instructorName: string;
  instructorAvatar?: string;
  rating?: number;
  reviewCount?: number;
  enrollmentCount?: number;
  completionRate?: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  featured?: boolean;
  prerequisites?: string[];
  objectives?: string[];
  targetAudience?: string[];
  syllabus?: {
    id: string;
    title: string;
    description?: string;
    lessons: {
      id: string;
      title: string;
      description?: string;
      duration: number; // in minutes
      type: 'video' | 'text' | 'quiz' | 'assignment';
      videoUrl?: string;
      content?: string;
  }[];
}[];
}

/**
 * Get course by ID
 */
export const getCourseById = async (courseId: string): Promise<Course | null> => {
  try {
    const courseDocRef = doc(firestore, 'courses', courseId);
    const courseDoc = await getDoc(courseDocRef);

    if (!courseDoc.exists()) {
      return null;
  }

    return {
      id: courseDoc.id,
      ...courseDoc.data()
  } as Course;
} catch (error) {
    console.error('Error getting course by ID:', error);
    return null;
}
};

/**
 * Get all published courses
 */
export const getPublishedCourses = async (
  categoryFilter?: string,
  levelFilter?: string,
  pageSize = 10,
  lastDoc?: DocumentSnapshot
): Promise<{courses: Course[], lastDoc: DocumentSnapshot | null }> => {
  try {
    let coursesQuery = query(
      collection(firestore, 'courses'),
      where('status', '==', 'published'),
      orderBy('publishedAt', 'desc')
    );

    if (categoryFilter) {
      coursesQuery = query(
        coursesQuery,
        where('category', '==', categoryFilter)
      );
  }

    if (levelFilter) {
      coursesQuery = query(
        coursesQuery,
        where('level', '==', levelFilter)
      );
  }

    if (lastDoc) {
      coursesQuery = query(
        coursesQuery,
        startAfter(lastDoc),
        limit(pageSize)
      );
  } else {
      coursesQuery = query(
        coursesQuery,
        limit(pageSize)
      );
  }

    const querySnapshot = await getDocs(coursesQuery);

    const courses = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
  })) as Course[];

    const newLastDoc = querySnapshot.docs.length > 0
      ? querySnapshot.docs[querySnapshot.docs.length - 1]
      : null;

    return {courses, lastDoc: newLastDoc };
} catch (error) {
    console.error('Error getting published courses:', error);
    return {courses: [], lastDoc: null };
}
};

/**
 * Get featured courses
 */
export const getFeaturedCourses = async (limitCount = 6): Promise<Course[]> => {
  try {
    const coursesQuery = query(
      collection(firestore, 'courses'),
      where('status', '==', 'published'),
      where('featured', '==', true),
      orderBy('publishedAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(coursesQuery);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
  })) as Course[];
} catch (error) {
    console.error('Error getting featured courses:', error);
    return [];
}
};

/**
 * Get courses by instructor
 */
export const getCoursesByInstructor = async (instructorId: string): Promise<Course[]> => {
  try {
    const coursesQuery = query(
      collection(firestore, 'courses'),
      where('instructorId', '==', instructorId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(coursesQuery);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
  })) as Course[];
} catch (error) {
    console.error('Error getting courses by instructor:', error);
    return [];
}
};

/**
 * Get courses by category
 */
export const getCoursesByCategory = async (category: string, limitCount = 10): Promise<Course[]> => {
  try {
    const coursesQuery = query(
      collection(firestore, 'courses'),
      where('status', '==', 'published'),
      where('category', '==', category),
      orderBy('publishedAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(coursesQuery);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
  })) as Course[];
} catch (error) {
    console.error('Error getting courses by category:', error);
    return [];
}
};

/**
 * Search courses
 */
export const searchCourses = async (searchTerm: string): Promise<Course[]> => {
  try {
    // Note: This is a simple implementation that doesn't use full-text search
    // For production, consider using Algolia, Elasticsearch, or Firebase Extensions
    const coursesRef = collection(firestore, 'courses');
    const querySnapshot = await getDocs(coursesRef);

    const searchTermLower = searchTerm.toLowerCase();

    return querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
    }) as Course)
      .filter(course =>
        course.status === 'published' &&
        (
          course.title.toLowerCase().includes(searchTermLower) ||
          course.description.toLowerCase().includes(searchTermLower) ||
          course.tags.some(tag => tag.toLowerCase().includes(searchTermLower))
        )
      );
} catch (error) {
    console.error('Error searching courses:', error);
    return [];
}
};

/**
 * Enroll a team in courses
 * @param companyId - The company ID
 * @param teamId - The team ID
 * @param courseIds - Array of course IDs to enroll the team in
 * @param memberIds - Array of team member user IDs
 * @returns Object containing success status and counts
 */
/**
 * Get all published courses for enrollment
 * This function doesn't rely on publishedAt field to avoid issues with courses
 * that are marked as published but don't have a publishedAt timestamp
 */
export const getCoursesForEnrollment = async (
  pageSize = 100
): Promise<Course[]> => {
  try {
    // Query courses by status only, without ordering by publishedAt
    const coursesQuery = query(
      collection(firestore, 'courses'),
      where('status', '==', 'published'),
      limit(pageSize)
    );

    const querySnapshot = await getDocs(coursesQuery);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
  })) as Course[];
} catch (error) {
    console.error('Error getting courses for enrollment:', error);
    return [];
}
};

export const enrollTeamInCourses = async (
  companyId: string,
  teamId: string,
  courseIds: string[],
  memberIds: string[]
): Promise<{
  success: boolean;
  enrolledUsers: number;
  enrolledCourses: number;
  errors: string[];
}> => {
  try {
    if (!courseIds.length || !memberIds.length) {
      return {
        success: false,
        enrolledUsers: 0,
        enrolledCourses: 0,
        errors: ['No courses or members provided for enrollment']
    };
  }

    const errors: string[] = [];
    let enrolledUserCount = 0;
    let enrolledCourseCount = 0;

    // Get course details to use in enrollment records
    const courseDetails: Record<string, {title: string }> = {};
    for (const courseId of courseIds) {
      const course = await getCourseById(courseId);
      if (course) {
        courseDetails[courseId] = {title: course.title };
    } else {
        errors.push(`Course with ID ${courseId} not found`);
    }
  }

    // Process each team member
    for (const userId of memberIds) {
      let userEnrollmentCount = 0;

      // Enroll the user in each course
      for (const courseId of courseIds) {
        if (!courseDetails[courseId]) continue;

        try {
          // Check if user is already enrolled
          const enrollmentsRef = collection(firestore, `users/${userId}/enrollments`);
          const q = query(enrollmentsRef, where('courseId', '==', courseId));
          const existingEnrollment = await getDocs(q);

          if (existingEnrollment.empty) {
            // Create enrollment record
            await addDoc(enrollmentsRef, {
              courseId,
              courseName: courseDetails[courseId].title,
              enrolledAt: serverTimestamp(),
              progress: 0,
              completedLessons: [],
              lastAccessedAt: serverTimestamp(),
              status: 'active',
              enrolledBy: {
                method: 'team_enrollment',
                teamId,
                companyId,
                timestamp: serverTimestamp()
            }
          });

            // Initialize course progress
            await initializeCourseProgress(
              userId,
              courseId,
              courseDetails[courseId].title
            );

            userEnrollmentCount++;
            enrolledCourseCount++;
        }
      } catch (err) {
          console.error(`Error enrolling user ${userId} in course ${courseId}:`, err);
          errors.push(`Failed to enroll user ${userId} in course ${courseId}`);
      }
    }

      if (userEnrollmentCount > 0) {
        enrolledUserCount++;
    }
  }

    // Create a team enrollment record for tracking
    try {
      await addDoc(collection(firestore, 'teamEnrollments'), {
        companyId,
        teamId,
        courseIds,
        memberIds,
        enrolledAt: serverTimestamp(),
        enrolledUsers: enrolledUserCount,
        enrolledCourses: enrolledCourseCount,
        status: errors.length === 0 ? 'completed' : 'partial',
        errors: errors.length > 0 ? errors : []
    });

      // Send notification to team manager
      if (enrolledUserCount > 0) {
        await sendTeamEnrollmentNotification(
          companyId,
          teamId,
          courseIds,
          enrolledUserCount,
          enrolledCourseCount
        );
    }
  } catch (err) {
      console.error('Error creating team enrollment record:', err);
      errors.push('Failed to create team enrollment record');
  }

    return {
      success: enrolledUserCount > 0 && errors.length === 0,
      enrolledUsers: enrolledUserCount,
      enrolledCourses: enrolledCourseCount,
      errors
  };
} catch (error) {
    console.error('Error enrolling team in courses:', error);
    return {
      success: false,
      enrolledUsers: 0,
      enrolledCourses: 0,
      errors: [(error as Error).message || 'Unknown error occurred']
  };
}
};

/**
 * Get course completion data for a user
 * @param userId - The user ID
 * @param courseId - The course ID
 * @returns CourseCompletionStats object with completion statistics
 */
export const getCourseCompletionData = async (
  userId: string,
  courseId: string
): Promise<{
  score: number;
  totalModules: number;
  completedModules: number;
  totalLessons: number;
  completedLessons: number;
  completionDate: string;
  certificateId?: string;
}> => {
  try {
    // Get course progress data
    const progressRef = doc(firestore, 'courseProgress', `${userId}_${courseId}`);
    const progressDoc = await getDoc(progressRef);
    
    if (!progressDoc.exists()) {
      throw new Error('Course progress not found');
  }
    
    const progressData = progressDoc.data() as CourseProgress;
    
    // Get course structure to count modules and lessons
    const courseRef = doc(firestore, 'courses', courseId);
    const courseDoc = await getDoc(courseRef);
    
    if (!courseDoc.exists()) {
      throw new Error('Course not found');
  }
    
    // Get all modules to count total modules and lessons
    const modulesRef = collection(firestore, `courses/${courseId}/modules`);
    const modulesQuery = query(modulesRef, where('status', '==', 'published'));
    const modulesSnapshot = await getDocs(modulesQuery);
    
    let totalLessons = 0;
    
    // Count total lessons across all modules
    for (const moduleDoc of modulesSnapshot.docs) {
      const lessonsRef = collection(firestore, `courses/${courseId}/modules/${moduleDoc.id}/lessons`);
      const lessonsQuery = query(lessonsRef, where('status', '==', 'published'));
      const lessonsSnapshot = await getDocs(lessonsQuery);
      totalLessons += lessonsSnapshot.size;
  }
    
    // Get certificate if it exists
    let certificateId: string | undefined;
    const certificatesRef = collection(firestore, 'certificates');
    const certificatesQuery = query(
      certificatesRef,
      where('userId', '==', userId),
      where('courseId', '==', courseId),
      limit(1)
    );
    const certificatesSnapshot = await getDocs(certificatesQuery);
    
    if (!certificatesSnapshot.empty) {
      certificateId = certificatesSnapshot.docs[0].id;
  }
    
    // Calculate completion statistics
    return {
      score: progressData.overallProgress || 0,
      totalModules: modulesSnapshot.size,
      completedModules: progressData.completedModules?.length || 0,
      totalLessons,
      completedLessons: progressData.completedLessons?.length || 0, // Ensure this is an array before accessing length
      completionDate: progressData.completedDate || progressData.lastAccessDate || new Date().toISOString(),
      certificateId
  };
} catch (error) {
    console.error('Error getting course completion data:', error);
    throw error;
}
};
