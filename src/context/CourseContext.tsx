import React, {createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'; // Added useCallback, useMemo
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  setDoc,
  addDoc,
  deleteDoc,
  orderBy,
  limit,
  startAfter,         // Kept from your snippet
  DocumentData,
  QueryDocumentSnapshot,
  Timestamp,          // Kept from your snippet
  QueryConstraint,
} from 'firebase/firestore';
import {firestore } from '@/services/firebase';
import {
  Course,
  CourseProgress,
  CourseEnrollment,
  CourseLevel,
  CourseDuration,     // Kept from your snippet
  Module,             // Kept from your snippet
} from '@/types/course.types';
import {useAuth } from './AuthContext'; // Assuming AuthContext is already stabilized
import * as courseProgressService from '@/services/courseProgressService';
import {verifyAllModuleLessonCounts } from '@/services/moduleService';
import {useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; // Kept from your snippet

// Define interfaces (already provided and reviewed)
interface CourseContextType {
  courses: Course[];
  enrolledCourses: Course[];
  completedCourses: Course[];
  featuredCourses: Course[];
  courseProgress: Record<string, CourseProgress>;
  loading: boolean;
  error: string | null;
  fetchCourses: (options?: FetchCoursesOptions, internalCall?: boolean) => Promise<Course[]>;
  fetchCourse: (courseId: string, internalCall?: boolean) => Promise<Course>;
  fetchEnrolledCourses: (internalCall?: boolean) => Promise<Course[]>;
  fetchCompletedCourses: (internalCall?: boolean) => Promise<Course[]>;
  enrollInCourse: (courseId: string, internalCall?: boolean) => Promise<void>;
  unenrollFromCourse: (courseId: string, internalCall?: boolean) => Promise<void>;
  updateCourseProgress: (courseId: string, lessonId: string, completed: boolean, internalCall?: boolean) => Promise<void>;
  markModuleComplete: (courseId: string, moduleId: string, internalCall?: boolean) => Promise<void>;
  markCourseComplete: (courseId: string, internalCall?: boolean) => Promise<string>;
  fetchCourseProgress: (courseId: string) => Promise<CourseProgress | null>;
  searchCourses: (queryText: string, filters?: CourseFilters, internalCall?: boolean) => Promise<Course[]>; // Renamed query to queryText
}

interface FetchCoursesOptions {
  category?: string;
  level?: CourseLevel;
  limit?: number;
  lastVisible?: QueryDocumentSnapshot<DocumentData>;
  featured?: boolean;
  status?: 'draft' | 'published';
  verifyModuleLessonCounts?: boolean;
  courseId?: string;
}

interface CourseFilters {
  categories?: string[];
  levels?: CourseLevel[];
  durations?: ('short' | 'medium' | 'long')[];
  priceRange?: {min: number; max: number };
  rating?: number;
}

interface CourseProviderProps {
  children: React.ReactNode;
}

export const CourseContext = createContext<CourseContextType | undefined>(undefined);

export const CourseProvider: React.FC<CourseProviderProps> = ({children }) => {
  const {user } = useAuth(); // Assuming useAuth() provides a stable 'user' object
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [completedCourses, setCompletedCourses] = useState<Course[]>([]);
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([]);
  const [courseProgress, setCourseProgress] = useState<Record<string, CourseProgress>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient(); // From your snippet

  // --- START OF MEMOIZED FUNCTIONS (Order Matters) ---

  const getFirestoreUserId = useCallback((): string => {
    // Relies on 'user' from useAuth
    if (!user || !user.id) {
      console.error('Attempted Firestore operation without authenticated user ID.');
      throw new Error('User not authenticated for this operation');
  }
    return user.id;
}, [user]);

  // Define fetchCourse early as it's a common dependency
  const fetchCourse = useCallback(async (courseId: string, internalCall: boolean = false): Promise<Course> => {
    // Relies on setLoading, setError (stable state setters)
    // Relies on verifyAllModuleLessonCounts (stable import)
    if (!internalCall) {
      setLoading(true);
      setError(null);
  }
    try {
      const courseDoc = await getDoc(doc(firestore, 'courses', courseId));
      if (!courseDoc.exists()) {
        throw new Error('Course not found');
    }
      const courseData = courseDoc.data() as Course;
      return {...courseData, id: courseDoc.id } as Course;
  } catch (error: any) {
      console.error(`Failed to fetch course ${courseId}:`, error);
      const errorMessage = error.message || 'Failed to fetch course';
      if (!internalCall) setError(errorMessage);
      throw new Error(errorMessage);
  } finally {
      if (!internalCall) setLoading(false);
  }
}, []); // Dependencies: Stable setters, stable imports

  // Define fetchCourses
  const fetchCourses = useCallback(async (options?: FetchCoursesOptions, internalCall: boolean = false): Promise<Course[]> => {
    // Relies on setLoading, setError, setCourses (stable state setters)
    // Relies on verifyAllModuleLessonCounts (stable import)
    if (!internalCall) {
      setLoading(true);
      setError(null);
  }
    try {
      if (options?.verifyModuleLessonCounts && options.courseId) {
        await verifyAllModuleLessonCounts(options.courseId);
    }
      const coursesQueryBuilder = collection(firestore, 'courses');
      const constraints: QueryConstraint[] = [];
      if (options?.status) {
        constraints.push(where('status', '==', options.status));
    } else {
        constraints.push(where('status', '==', 'published'));
    }
      if (options?.featured !== undefined) {
        constraints.push(where('featured', '==', options.featured));
    }
      constraints.push(orderBy('title', 'asc'));
      if (options?.limit && typeof options.limit === 'number') {
        constraints.push(limit(options.limit));
    }
      const finalQuery = query(coursesQueryBuilder, ...constraints);
      const querySnapshot = await getDocs(finalQuery);
      const fetchedCoursesData: Course[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        fetchedCoursesData.push({id: docSnap.id, ...data } as Course);
    });
      if (!options?.featured) {
        setCourses(fetchedCoursesData);
    }
      return fetchedCoursesData;
  } catch (error: any) {
      console.error('Failed to fetch courses:', error);
      const errorMessage = error.message || 'Failed to fetch courses';
      if (!internalCall) setError(errorMessage);
      throw new Error(errorMessage);
  } finally {
      if (!internalCall) setLoading(false);
  }
}, []); // Dependencies: Stable setters, stable imports

  // Define fetchCourseProgress
  const fetchCourseProgress = useCallback(async (courseId: string): Promise<CourseProgress | null> => {
    // Relies on user, getFirestoreUserId (memoized), setCourseProgress (stable)
    // Relies on courseProgressService.getCourseProgress (stable import)
    if (!user?.id) {
      return null;
  }
    const userId = getFirestoreUserId();
    try {
      const progress = await courseProgressService.getCourseProgress(userId, courseId);
      if (progress) {
        setCourseProgress(prev => ({...prev, [courseId]: progress }));
    } else {
        setCourseProgress(prev => {
          const newState = {...prev };
          delete newState[courseId];
          return newState;
      });
    }
      return progress;
  } catch (error) {
      console.error(`Error fetching course progress for ${courseId}:`, error);
      return null;
  }
}, [user, getFirestoreUserId]);

  // --- End of Part 1 ---

    // --- Continuation from Part 1 ---
  // fetchCourseProgress was the last function in Part 1

  // --- Part 2 Functions ---

  const fetchEnrolledCourses = useCallback(async (internalCall: boolean = false): Promise<Course[]> => {
    // Relies on user, getFirestoreUserId, fetchCourse, fetchCourseProgress (all memoized/stable)
    // Relies on stable setters: setEnrolledCourses, setCompletedCourses, setCourseProgress, setLoading, setError
    if (!user?.id) {
      setEnrolledCourses([]);
      setCompletedCourses([]);
      setCourseProgress({});
      return [];
  }
    const userId = getFirestoreUserId();
    if (!internalCall) {
      setLoading(true);
      setError(null);
  }
    try {
      const enrollmentsRef = collection(firestore, `users/${userId}/enrollments`);
      const enrollmentsQuery = query(enrollmentsRef, where('status', '==', 'active'), orderBy('enrolledAt', 'desc'));
      const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
      const enrollments = enrollmentsSnapshot.docs.map(d => ({...(d.data() as CourseEnrollment), enrollmentId: d.id }));
      const uniqueEnrollmentsByCourseId = Array.from(
        enrollments.reduce((map, enrollment) => {
          const existingEnrollment = map.get(enrollment.courseId);
          if (!existingEnrollment || (enrollment.enrolledAt && existingEnrollment.enrolledAt && new Date(enrollment.enrolledAt) > new Date(existingEnrollment.enrolledAt))) {
            map.set(enrollment.courseId, enrollment);
        }
          return map;
      }, new Map<string, CourseEnrollment & {enrollmentId: string }>()).values()
      );

      const progressPromises = uniqueEnrollmentsByCourseId.map(e => fetchCourseProgress(e.courseId));
      const progressResults = await Promise.all(progressPromises);
      const tempProgressMap: Record<string, CourseProgress> = {};
      progressResults.forEach(p => {if (p) {tempProgressMap[p.courseId] = p; } });

      const enrolledCoursesDetailsPromises = uniqueEnrollmentsByCourseId.map(async e => {
        try {
          const course = await fetchCourse(e.courseId, true);
          const progress = tempProgressMap[course.id];
          return {...course, progress: progress?.overallProgress || 0 };
      } catch (error) {
          console.error(`Error fetching details for enrolled course ${e.courseId} in fetchEnrolledCourses:`, error);
          return undefined;
      }
    });
      const finalEnrolledCourses = (await Promise.all(enrolledCoursesDetailsPromises)).filter((c): c is Course & {progress: number } => c !== undefined);

      const completed: (Course & {progress: number })[] = [];
      const inProgress: (Course & {progress: number })[] = [];
      finalEnrolledCourses.forEach(c => {(c.progress === 100 ? completed.push(c) : inProgress.push(c)); });

      setEnrolledCourses(inProgress);
      setCompletedCourses(completed);
      setCourseProgress(prevGlobalProgress => ({...prevGlobalProgress, ...tempProgressMap }));
      return finalEnrolledCourses;
  } catch (error: any) {
      console.error('Error fetching enrolled courses:', error);
      const errorMessage = error.message || 'Failed to fetch enrolled courses';
      if(!internalCall) setError(errorMessage);
      throw new Error(errorMessage);
  } finally {
      if (!internalCall) setLoading(false);
  }
}, [user, getFirestoreUserId, fetchCourse, fetchCourseProgress]);

  const fetchCompletedCourses = useCallback(async (internalCall: boolean = false): Promise<Course[]> => {
    // Relies on user, getFirestoreUserId, fetchCourse (all memoized/stable)
    // Relies on stable setters: setCompletedCourses, setLoading, setError
    if (!user?.id) {
      setCompletedCourses([]);
      return [];
  }
    const userId = getFirestoreUserId();
    if (!internalCall) {
      setLoading(true);
      setError(null);
  }
    try {
      const progressQ = query(collection(firestore, 'courseProgress'), where('userId', '==', userId), where('completed', '==', true), orderBy('completedDate', 'desc'));
      const progressSnapshot = await getDocs(progressQ);
      const completedProgressDocs = progressSnapshot.docs.map(d => d.data() as CourseProgress);
      const completedCoursesPromises = completedProgressDocs.map(async progressItem => {
          try {
              const course = await fetchCourse(progressItem.courseId, true);
              return {...course, progress: 100 } as Course & {progress: number };
        } catch (error) {
              console.error(`Error fetching details for completed course ${progressItem.courseId}:`, error);
              return undefined;
        }
    });
      const completedCoursesData = (await Promise.all(completedCoursesPromises)).filter((c): c is Course & {progress: number } => c !== undefined);
      setCompletedCourses(completedCoursesData);
      return completedCoursesData;
  } catch (error: any) {
      console.error('Error fetching completed courses:', error);
      const errorMessage = error.message || 'Failed to fetch completed courses';
      if(!internalCall) setError(errorMessage);
      throw new Error(errorMessage);
  } finally {
      if (!internalCall) setLoading(false);
  }
}, [user, getFirestoreUserId, fetchCourse]);

  const enrollInCourse = useCallback(async (courseId: string, internalCall: boolean = false): Promise<void> => {
    // Relies on user, getFirestoreUserId, fetchCourse, fetchEnrolledCourses (all memoized/stable)
    // Relies on stable setters: setLoading, setError
    if (!user?.id) throw new Error('User not authenticated');
    const userId = getFirestoreUserId();
    if (!internalCall) {
      setLoading(true);
      setError(null);
  }
    try {
      const enrollmentsRef = collection(firestore, `users/${userId}/enrollments`);
      const enrollmentQuery = query(enrollmentsRef, where('courseId', '==', courseId));
      const enrollmentSnapshot = await getDocs(enrollmentQuery);

      if (!enrollmentSnapshot.empty) {
        const enrollmentDoc = enrollmentSnapshot.docs[0];
        const enrollmentData = enrollmentDoc.data() as CourseEnrollment;
        if (enrollmentData.status !== 'active') {
          await updateDoc(enrollmentDoc.ref, {status: 'active', enrolledAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
          const progressRef = doc(firestore, 'courseProgress', `${userId}_${courseId}`);
          const progressSnap = await getDoc(progressRef);
          if (progressSnap.exists()){
            await updateDoc(progressRef, {completed: false, completedDate: null, certificateId: null, /* certificateIssueDate: null */ }).catch(console.warn);
        }
      } else return;
    } else {
        const course = await fetchCourse(courseId, true);
        const newEnrollmentData: Omit<CourseEnrollment, 'id'> = {
          courseId, courseName: course.title, enrolledAt: new Date().toISOString(), status: 'active',
          progress: 0, completedLessons: [], lastAccessedAt: new Date().toISOString(),
      };
        await addDoc(enrollmentsRef, newEnrollmentData);
        const progressRef = doc(firestore, 'courseProgress', `${userId}_${courseId}`);
        const progressDocSnap = await getDoc(progressRef);
        if (!progressDocSnap.exists()) {
          const newProgressData: CourseProgress = {
            courseId, userId: userId, startDate: new Date().toISOString(), lastAccessDate: new Date().toISOString(),
            completedLessons: [], completedModules: [], quizScores: {}, quizAttempts: {},
            lessonProgress: {}, moduleProgress: {}, overallProgress: 0, completed: false, timeSpent: 0, lastPosition: undefined,
        };
          await setDoc(progressRef, newProgressData);
      } else {
          const existingProgress = progressDocSnap.data() as CourseProgress;
          if (existingProgress.completed) {
            await updateDoc(progressRef, {completed: false, completedDate: null, certificateId: null, certificateIssueDate: null });
        }
      }
    }
      await fetchEnrolledCourses(true);
  } catch (error: any) {
      console.error(`Failed to enroll in course ${courseId}:`, error);
      const errorMessage = error.message || 'Failed to enroll in course';
      if(!internalCall) setError(errorMessage);
      throw new Error(errorMessage);
  } finally {
      if (!internalCall) setLoading(false);
  }
}, [user, getFirestoreUserId, fetchCourse, fetchEnrolledCourses]);

  const unenrollFromCourse = useCallback(async (courseId: string, internalCall: boolean = false): Promise<void> => {
    // Relies on user, getFirestoreUserId, fetchEnrolledCourses (all memoized/stable)
    // Relies on stable setters: setLoading, setError
    if (!user?.id) throw new Error('User not authenticated');
    const userId = getFirestoreUserId();
    if (!internalCall) {
      setLoading(true);
      setError(null);
  }
    try {
      const enrollmentsRef = collection(firestore, `users/${userId}/enrollments`);
      const enrollmentQuery = query(enrollmentsRef, where('courseId', '==', courseId), where('status', '==', 'active'));
      const enrollmentSnapshot = await getDocs(enrollmentQuery);
      if (enrollmentSnapshot.empty) {
        console.warn(`Attempted to unenroll from course ${courseId} but no active enrollment found.`);
        return;
    }
      const enrollmentDocRef = enrollmentSnapshot.docs[0].ref;
      await updateDoc(enrollmentDocRef, {status: 'inactive', updatedAt: new Date().toISOString() });
      await fetchEnrolledCourses(true);
  } catch (error: any) {
      console.error(`Failed to unenroll from course ${courseId}:`, error);
      const errorMessage = error.message || 'Failed to unenroll from course';
      if(!internalCall) setError(errorMessage);
      throw new Error(errorMessage);
  } finally {
      if (!internalCall) setLoading(false);
  }
}, [user, getFirestoreUserId, fetchEnrolledCourses]);

  // --- End of Part 2 ---

    // --- Continuation from Part 2 ---
  // unenrollFromCourse was the last function in Part 2

  // --- Part 3 Functions, useEffects, contextValue, return ---

  const updateCourseProgress = useCallback(async (courseId: string, lessonId: string, completed: boolean, internalCall: boolean = false): Promise<void> => {
    // Relies on user, getFirestoreUserId, fetchCourse, fetchEnrolledCourses (all memoized/stable)
    // Relies on stable setters: setLoading, setError, setCourseProgress
    // Relies on stable import: courseProgressService.updateLessonProgress
    if (!user?.id) throw new Error('User not authenticated');
    const userId = getFirestoreUserId();
    if (!internalCall) {
      setLoading(true);
      setError(null);
  }
    try {
      const course = await fetchCourse(courseId, true);
      const totalLessons = course.modulesList?.reduce((total, moduleId) => {
        // Check if moduleId is actually a Module object (for backward compatibility)
        if (typeof moduleId === 'object' && moduleId !== null) {
          const moduleObj = moduleId as Module;
          return total + (moduleObj.lessons?.length || 0);
      }
        
        // If it's a string ID, we can't directly access lessons
        // This is likely the source of your type error
        return total;
    }, 0) || 0;
      const updatedProgressData = await courseProgressService.updateLessonProgress(userId, courseId, course.title, lessonId, completed, totalLessons);
      if (updatedProgressData) {
        setCourseProgress(prev => ({...prev, [courseId]: updatedProgressData }));
    } else {
        console.warn(`updateLessonProgress service did not return updated progress for ${courseId}.`);
    }
      await fetchEnrolledCourses(true);
  } catch (error: any) {
      console.error(`Failed to update progress for lesson ${lessonId} in course ${courseId}:`, error);
      const errorMessage = error.message || 'Failed to update course progress';
      if(!internalCall) setError(errorMessage);
      throw new Error(errorMessage);
  } finally {
      if (!internalCall) setLoading(false);
  }
}, [user, getFirestoreUserId, fetchCourse, fetchEnrolledCourses]);

  const markModuleComplete = useCallback(async (courseId: string, moduleId: string, internalCall: boolean = false): Promise<void> => {
    // Relies on user, getFirestoreUserId, fetchEnrolledCourses (all memoized/stable)
    // Relies on stable setters: setLoading, setError, setCourseProgress
    // Relies on stable import: courseProgressService.markModuleComplete
    if (!user?.id) throw new Error('User not authenticated');
    const userId = getFirestoreUserId();
    if (!internalCall) {
      setLoading(true);
      setError(null);
  }
    try {
      const updatedProgressData = await courseProgressService.markModuleComplete(userId, courseId, moduleId);
      if (updatedProgressData) {
        setCourseProgress(prev => ({...prev, [courseId]: updatedProgressData }));
    } else {
        console.warn(`markModuleComplete service did not return updated progress for ${courseId}.`);
    }
      await fetchEnrolledCourses(true);
  } catch (error: any) {
      console.error(`Failed to mark module ${moduleId} complete in course ${courseId}:`, error);
      const errorMessage = error.message || 'Failed to mark module as complete';
      if(!internalCall) setError(errorMessage);
      throw new Error(errorMessage);
  } finally {
      if (!internalCall) setLoading(false);
  }
}, [user, getFirestoreUserId, fetchEnrolledCourses]);

  const markCourseComplete = useCallback(async (courseId: string, internalCall: boolean = false): Promise<string> => {
    // Relies on user, getFirestoreUserId, fetchCourse, fetchEnrolledCourses (all memoized/stable)
    // Relies on stable setters: setLoading, setError, setCourseProgress
    // Relies on stable import: courseProgressService.markCourseComplete
    if (!user?.id) throw new Error('User not authenticated');
    const userId = getFirestoreUserId();
    if (!internalCall) {
      setLoading(true);
      setError(null);
  }
    try {
      const course = await fetchCourse(courseId, true);
      const verificationCode = `CERT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      const tempId = 'generating';
      const certificateRef = await addDoc(collection(firestore, 'certificates'), {
        userId: userId, courseId: courseId, courseName: course.title, userName: user.displayName || 'Learner',
        issueDate: new Date().toISOString(), templateId: 'default', pdfUrl: `/certificates/${tempId}.pdf`,
        thumbnailUrl: `/certificates/${tempId}.jpg`, verificationCode: verificationCode, status: 'active',
        instructor: course.instructor || null, instructorTitle: course.instructorTitle || null,
    });
      const certificateDocId = certificateRef.id;
      await updateDoc(certificateRef, {pdfUrl: `/certificates/${certificateDocId}.pdf`, thumbnailUrl: `/certificates/${certificateDocId}.jpg` });
      const updatedServiceProgress = await courseProgressService.markCourseComplete(userId, courseId, course.title);

      setCourseProgress(prev => {
          const baseProgress = updatedServiceProgress || prev[courseId] || {courseId, userId } as CourseProgress;
          return {
              ...prev,
              [courseId]: {
                  ...baseProgress,
                  // Use the progress values from the service rather than overriding them
                  // This ensures we use the single source of truth from the backend
                  certificateId: certificateDocId,
                  certificateIssueDate: new Date().toISOString()
            }
        };
    });
      await fetchEnrolledCourses(true);
      return certificateDocId;
  } catch (error: any) {
      console.error(`Failed to mark course ${courseId} as complete:`, error);
      const errorMessage = error.message || 'Failed to mark course as complete';
      if(!internalCall) setError(errorMessage);
      throw new Error(errorMessage);
  } finally {
      if (!internalCall) setLoading(false);
  }
}, [user, getFirestoreUserId, fetchCourse, fetchEnrolledCourses]); // Depends on user from auth

  const searchCourses = useCallback(async (queryText: string, filters?: CourseFilters, internalCall: boolean = false): Promise<Course[]> => {
    // Relies on 'courses' state variable
    // Relies on stable setters: setLoading, setError
    if (!internalCall) {
      setLoading(true);
      setError(null);
  }
    try {
      let filteredResults = [...courses]; // Use the 'courses' state from CourseProvider scope
      if (queryText) {
        const queryLower = queryText.toLowerCase();
        filteredResults = filteredResults.filter(course =>
          course.title.toLowerCase().includes(queryLower) ||
          (course.description?.toLowerCase().includes(queryLower)) ||
          (course.longDescription?.toLowerCase().includes(queryLower)) ||
          (course.tags?.some(tag => tag.toLowerCase().includes(queryLower)))
        );
    }
      if (filters) {// Apply filters (client-side)
        if (filters.categories && filters.categories.length > 0) {
          filteredResults = filteredResults.filter(c => c.categoryIds?.some(catId => filters.categories?.includes(catId)));
      }
        if (filters.levels && filters.levels.length > 0) {
          filteredResults = filteredResults.filter(c => filters.levels?.includes(c.level));
      }
        if (filters.durations && filters.durations.length > 0) {
          filteredResults = filteredResults.filter(c => {
            let totalSeconds = c.durationDetails?.totalSeconds;
            if (totalSeconds === undefined && c.duration) {
              const parts = c.duration.split(' ');
              if (parts.length === 2) {
                const value = parseFloat(parts[0]);
                const unit = parts[1].toLowerCase();
                if (!isNaN(value)) {
                  if (unit.startsWith('hour')) totalSeconds = value * 3600;
                  else if (unit.startsWith('minute')) totalSeconds = value * 60;
              }
            }
          }
            if (totalSeconds === undefined) return false;
            return filters.durations?.some(fDuration => {
              if (fDuration === 'short') return totalSeconds < (2 * 3600);
              if (fDuration === 'medium') return totalSeconds >= (2 * 3600) && totalSeconds <= (4 * 3600);
              if (fDuration === 'long') return totalSeconds > (4 * 3600);
              return false;
          });
        });
      }
        if (filters.priceRange && typeof filters.priceRange?.min === 'number' && typeof filters.priceRange?.max === 'number') {
          filteredResults = filteredResults.filter(c => {
            const price = c.price || 0;
            const isFree = c.isFree || false;
            if (filters.priceRange?.min === 0 && isFree) return true;
            return (price >= (filters.priceRange?.min ?? 0) && price <= (filters.priceRange?.max ?? Infinity));
        });
      }
        if (filters.rating !== undefined && filters.rating > 0) {
          filteredResults = filteredResults.filter(c => c.rating !== undefined && c.rating >= filters.rating!);
      }
    }
      return filteredResults;
  } catch (error: any) {
      console.error('Failed to search courses:', error);
      const errorMessage = error.message || 'Failed to search courses';
      if(!internalCall) setError(errorMessage);
      throw new Error(errorMessage);
  } finally {
      if (!internalCall) setLoading(false);
  }
}, [courses]); // Depends only on the 'courses' state variable

  // --- End of All Memoized Functions ---


  // --- useEffect Hooks (should now use memoized functions if they call them) ---

  // Fetch featured courses on mount
  useEffect(() => {
    const loadFeaturedCourses = async () => {
      try {
        // Calls memoized fetchCourses
        const featuredCoursesData = await fetchCourses({featured: true, limit: 6 }, true);
        setFeaturedCourses(featuredCoursesData);
    } catch (error) {
        console.error('Error loading featured courses:', error);
    }
  };
    loadFeaturedCourses();
}, [fetchCourses]); // Dependency is the memoized fetchCourses

  // Fetch enrolled courses when user changes
  useEffect(() => {
    if (user?.id) {
      // Calls memoized fetchEnrolledCourses
      fetchEnrolledCourses(true); // Use internal call = true
  } else {
      setEnrolledCourses([]);
      setCompletedCourses([]);
      setCourseProgress({});
  }
}, [user?.id, fetchEnrolledCourses]); // Dependencies are user.id and the memoized fetchEnrolledCourses


  // --- contextValue wrapped in useMemo ---
  const contextValue = useMemo(() => {
    // console.log("[CourseContext] Recalculating contextValue"); // Keep commented unless debugging
    return {
      // State values
      courses,
      enrolledCourses,
      completedCourses,
      featuredCourses,
      courseProgress,
      loading,
      error,
      // Memoized functions
      fetchCourses,
      fetchCourse,
      fetchEnrolledCourses,
      fetchCompletedCourses,
      enrollInCourse,
      unenrollFromCourse,
      updateCourseProgress,
      markModuleComplete,
      markCourseComplete,
      fetchCourseProgress,
      searchCourses,
  };
}, [
    // State dependencies
    courses, enrolledCourses, completedCourses, featuredCourses, courseProgress, loading, error,
    // Function dependencies (now stable references)
    fetchCourses, fetchCourse, fetchEnrolledCourses, fetchCompletedCourses, enrollInCourse,
    unenrollFromCourse, updateCourseProgress, markModuleComplete, markCourseComplete,
    fetchCourseProgress, searchCourses
  ]);

  // --- Provider Return ---
  return (
    <CourseContext.Provider value={contextValue}>
      {children}
    </CourseContext.Provider>
  );

}; // End of CourseProvider Component

// --- useCourses Hook (remains the same) ---
export const useCourses = () => {
  const context = useContext(CourseContext);
  if (!context) {
    throw new Error('useCourses must be used within a CourseProvider');
}
  return context;
};


