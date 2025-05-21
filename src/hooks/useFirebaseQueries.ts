import { useEffect, useState, useCallback } from 'react';
import {useQuery, useQueryClient } from '@tanstack/react-query';
import {doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import {firestore } from '@/services/firebase';
import {Course, Module, Lesson, CourseEnrollment } from '@/types/course.types';
import {STALE_TIMES } from '@/utils/queryClient';
import { calculateCourseProgress } from '../services/courseProgressService';

// Hook to fetch a course with its modules and lessons
export function useCourse(courseId: string | undefined) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      console.log(`useCourse queryFn executing for courseId: ${courseId}`);

      if (!courseId) {
        console.log('No courseId provided, returning null');
        return null;
      }

      try {
        // Fetch course data
        const coursePath = `courses/${courseId}`;
        console.log(`Fetching course from path: ${coursePath}`);

        const courseRef = doc(firestore, coursePath);
        const courseSnapshot = await getDoc(courseRef);

        if (!courseSnapshot.exists()) {
          console.warn(`Course not found at path: ${coursePath}`);
          return null;
        }

        console.log(`Course data fetched successfully for ${courseId}`);
        const courseDocData = courseSnapshot.data() as Course;

        // Fetch modules
        const modulesPath = `courses/${courseId}/modules`;
        console.log(`Fetching modules from path: ${modulesPath}`);

        const modulesRef = collection(firestore, modulesPath);
        const modulesQuery = query(modulesRef, orderBy('order', 'asc'));
        const modulesSnapshot = await getDocs(modulesQuery);

        console.log(`Found ${modulesSnapshot.docs.length} modules for course ${courseId}`);

        // Log the first module for debugging
        if (modulesSnapshot.docs.length > 0) {
          const firstModule = modulesSnapshot.docs[0];
          console.log(`First module: ${firstModule.id}`, firstModule.data());
        }

        // Process modules and fetch lesson stubs for each module
        const moduleChunks: Array<Array<QueryDocumentSnapshot<Module>>> = []; // Refined type based on Firestore SDK return type
        const chunkSize = 3;

        for (let i = 0; i < modulesSnapshot.docs.length; i += chunkSize) {
          moduleChunks.push(modulesSnapshot.docs.slice(i, i + chunkSize));
        }

        let allModules: Module[] = [];
        console.log(`Processing ${moduleChunks.length} chunks of modules`);

        for (const moduleChunk of moduleChunks) {
          console.log(`Processing chunk with ${moduleChunk.length} modules`);

          const modulePromises = moduleChunk.map(async (moduleDoc: QueryDocumentSnapshot<Module>) => {
            const moduleData = moduleDoc.data() as Module;
            const moduleId = moduleDoc.id;
            console.log(`Processing module ${moduleId}`);
            console.log(`Module data for ${moduleId}:`, moduleData);

            const lessonsPath = `courses/${courseId}/modules/${moduleId}/lessons`;
            console.log(`Fetching lessons from path: ${lessonsPath}`);

            let lessonStubs: Lesson[] = [];
            try {
              const lessonsRef = collection(firestore, lessonsPath);
              const lessonsQuery = query(lessonsRef, orderBy('order', 'asc'));
              const lessonsSnapshot = await getDocs(lessonsQuery);
              console.log(`Module ${moduleId}: Found ${lessonsSnapshot.docs.length} lessons.`);

              lessonsSnapshot.docs.forEach(lessonDoc => {
                console.log(`Raw lesson data for lesson ${lessonDoc.id} in module ${moduleId}:`, lessonDoc.data());
              });

              if (lessonsSnapshot.docs.length > 0) {
                lessonStubs = lessonsSnapshot.docs.map((lessonDoc: QueryDocumentSnapshot<Lesson>) => {
                  const lessonData = lessonDoc.data() as Lesson;
                  return { // Explicitly map fields to Lesson interface
                    id: lessonDoc.id,
                    title: lessonData.title || 'Untitled Lesson',
                    description: lessonData.description,
                    type: lessonData.type || 'text',
                    content: lessonData.content,
                    videoId: lessonData.videoId,
                    duration: lessonData.duration ?? 0,
                    order: lessonData.order ?? 0,
                    status: lessonData.status || 'draft',
                    quizQuestions: lessonData.quizQuestions || lessonData.questions,
                    passingScore: lessonData.passingScore,
                    resources: lessonData.resources,
                    createdAt: lessonData.createdAt,
                    updatedAt: lessonData.updatedAt,
                    completed: lessonData.completed,
                    instructor: lessonData.instructor,
                    instructorTitle: lessonData.instructorTitle,
                    instructorBio: lessonData.instructorBio,
                    instructorAvatar: lessonData.instructorAvatar,
                  } as Lesson; // Cast to Lesson
                });
              }

              return { // Explicitly map fields to Module interface
                id: moduleId,
                title: moduleData.title || 'Untitled Module',
                description: moduleData.description,
                order: moduleData.order ?? 0,
                status: moduleData.status || 'draft',
                lessons: lessonStubs,
                isRequired: moduleData.isRequired,
                availableFrom: moduleData.availableFrom,
                availableTo: moduleData.availableTo,
                prerequisites: moduleData.prerequisites,
                completionPercentageRequired: moduleData.completionPercentageRequired,
                sectionId: moduleData.sectionId,
                createdAt: moduleData.createdAt,
                updatedAt: moduleData.updatedAt,
                lessonCount: lessonStubs.length,
                instructor: moduleData.instructor,
                instructorTitle: moduleData.instructorTitle,
                instructorBio: moduleData.instructorBio,
                instructorAvatar: moduleData.instructorAvatar,
              } as Module; // Cast to Module
            } catch (error) {
              console.error(`Error fetching lessons for module ${moduleId}:`, error);
              return { // Explicitly map fields to Module interface on error
                id: moduleId,
                title: moduleData.title || 'Untitled Module',
                description: moduleData.description,
                order: moduleData.order ?? 0,
                status: moduleData.status || 'draft',
                lessons: [],
                lessonCount: 0,
                isRequired: moduleData.isRequired,
                availableFrom: moduleData.availableFrom,
                availableTo: moduleData.availableTo,
                prerequisites: moduleData.prerequisites,
                completionPercentageRequired: moduleData.completionPercentageRequired,
                sectionId: moduleData.sectionId,
                createdAt: moduleData.createdAt,
                updatedAt: moduleData.updatedAt,
                instructor: moduleData.instructor,
                instructorTitle: moduleData.instructorTitle,
                instructorBio: moduleData.instructorBio,
                instructorAvatar: moduleData.instructorAvatar,
              } as Module; // Cast to Module
            }
          });

          const chunkModules = await Promise.all(modulePromises);
          allModules = [...allModules, ...chunkModules];
        }

        const totalLessonsCount = allModules.reduce((acc, module) => acc + (module.lessons?.length || 0), 0);

        const finalCourseData: Course = { // Explicitly map fields to Course interface
          id: courseSnapshot.id,
          title: courseDocData.title || 'Untitled Course',
          description: courseDocData.description || '',
          longDescription: courseDocData.longDescription,
          thumbnail: courseDocData.thumbnail || '',
          duration: courseDocData.duration || 'N/A',
          durationDetails: courseDocData.durationDetails,
          lessons: courseDocData.lessons ?? totalLessonsCount,
          level: courseDocData.level || 'Beginner',
          instructor: courseDocData.instructor || 'N/A',
          instructorTitle: courseDocData.instructorTitle,
          instructorBio: courseDocData.instructorBio,
          instructorAvatar: courseDocData.instructorAvatar,
          price: courseDocData.price,
          isFree: courseDocData.isFree,
          trialPeriod: courseDocData.trialPeriod,
          rating: courseDocData.rating,
          reviewCount: courseDocData.reviewCount,
          enrolledCount: courseDocData.enrolledCount,
          lastUpdated: courseDocData.lastUpdated || new Date().toISOString(),
          introVideoId: courseDocData.introVideoId,
          modulesList: allModules.map(m => m.id),
          whatYouWillLearn: courseDocData.whatYouWillLearn,
          requirements: courseDocData.requirements,
          tags: courseDocData.tags,
          category: courseDocData.category,
          featured: courseDocData.featured,
          progress: courseDocData.progress,
          status: courseDocData.status || 'draft',
          createdAt: courseDocData.createdAt || new Date().toISOString(),
          updatedAt: courseDocData.updatedAt || new Date().toISOString(),
          categoryIds: courseDocData.categoryIds,
        };

        return { // Cast the final result
          ...finalCourseData,
          modules: allModules,
        } as Course & { modules: Module[] };
    } catch (error) {
        console.error(`Error fetching course ${courseId}:`, error);
        throw error;
    }
  },
    enabled: !!courseId,
    staleTime: STALE_TIMES.SEMI_STATIC, // Course structure changes less frequently
    gcTime: 60 * 60 * 1000, // Keep in cache for 1 hour even when inactive
    retry: 2,
});
}

// Hook to fetch user enrollments
export function useEnrollments(userId: string | undefined) {
  const queryClient = useQueryClient();

  const result = useQuery({
    queryKey: ['enrollments', userId],
    queryFn: async () => {
      if (!userId) return [];

      try {
        const enrollmentsRef = collection(firestore, `users/${userId}/enrollments`);
        const snapshot = await getDocs(enrollmentsRef);
        return snapshot.docs.map((doc: QueryDocumentSnapshot<CourseEnrollment>) => {
          const data = doc.data() as CourseEnrollment;
          return { // Explicitly map fields to CourseEnrollment interface
            id: doc.id,
            courseId: data.courseId || doc.id, // Fallback if courseId doesn't exist
            courseName: data.courseName || 'Unknown Course Name',
            enrolledAt: data.enrolledAt || new Date().toISOString(),
            expiryDate: data.expiryDate,
            paymentId: data.paymentId,
            status: data.status || 'active', // Default to 'active' if not present
            userId: data.userId, // This is likely `userId` from the path, but if stored in doc too
            progress: data.progress ?? 0, // Default to 0 if not present
            completedLessons: data.completedLessons ?? [], // Default to empty array if not present
            totalLessons: data.totalLessons ?? 0, // Default to 0 if not present
            lastAccessedAt: data.lastAccessedAt || new Date().toISOString(), // Default to now if not present
          } as CourseEnrollment; // Cast to CourseEnrollment
        });
      } catch (error) {
        console.error(`Error fetching enrollments for user ${userId}:`, error);
        throw error;
      }
    },
    enabled: !!userId,
    staleTime: STALE_TIMES.DYNAMIC, // Enrollments change more frequently than courses
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes even when inactive
    retry: 2,
  });

  // Add a function to manually update the progress in the cache
  const updateProgressInCache = useCallback((
    courseId: string,
    completedLessonKey: string,
    totalLessonsForCourse: number
  ) => {
    if (!userId) return;

    queryClient.setQueryData(['enrollments', userId], (oldData: CourseEnrollment[] | undefined) => {
      if (!oldData) return oldData;

      return oldData.map((enrollment: CourseEnrollment) => {
        if (enrollment.courseId === courseId) {
          // Only add if not already in the array
          const completedLessons = enrollment.completedLessons || [];
          if (!completedLessons.includes(completedLessonKey)) {
            const newCompletedLessons = [...completedLessons, completedLessonKey];

            // Use the passed totalLessonsForCourse for accurate optimistic update
            // Ensure totalLessonsForCourse is at least 1 to prevent division by zero
            const safeTotalLessons = Math.max(1, totalLessonsForCourse);
            const { overallProgress } = calculateCourseProgress(newCompletedLessons, safeTotalLessons);

            return {
              ...enrollment,
              completedLessons: newCompletedLessons,
              progress: overallProgress,
              totalLessons: safeTotalLessons
            };
          }
        }
        return enrollment;
      });
    });
  }, [userId, queryClient]);

  return {
    ...result,
    updateProgressInCache
  };
}

// Hook to provide a function for prefetching a lesson
export function usePrefetchLesson(
  courseId: string | undefined,
  moduleId: string | undefined
): { prefetchNextLesson: (nextLessonId: string) => void } {
  const queryClient = useQueryClient();

  return {
    prefetchNextLesson: (nextLessonId: string) => {
      // Ensure all necessary IDs are present before attempting to prefetch
      if (courseId && moduleId && nextLessonId) {
        void queryClient.prefetchQuery({
          queryKey: ['lesson', courseId, moduleId, nextLessonId],
          queryFn: async () => {
            try {
              const lessonRef = doc(firestore, `courses/${courseId}/modules/${moduleId}/lessons/${nextLessonId}`);
              const lessonSnapshot = await getDoc(lessonRef);

              if (!lessonSnapshot.exists()) {
                console.warn(`Prefetch: Lesson not found at courses/${courseId}/modules/${moduleId}/lessons/${nextLessonId}`);
                return null;
              }
              const lessonData = lessonSnapshot.data();
              return {
                id: lessonSnapshot.id,
                title: lessonData.title || 'Untitled Lesson',
                description: lessonData.description,
                type: lessonData.type || 'text',
                content: lessonData.content,
                videoId: lessonData.videoId,
                duration: lessonData.duration ?? 0,
                order: lessonData.order ?? 0,
                status: lessonData.status || 'draft',
                quizQuestions: lessonData.quizQuestions || lessonData.questions,
                passingScore: lessonData.passingScore,
                resources: lessonData.resources,
                createdAt: lessonData.createdAt,
                updatedAt: lessonData.updatedAt,
                completed: lessonData.completed,
                instructor: lessonData.instructor,
                instructorTitle: lessonData.instructorTitle,
                instructorBio: lessonData.instructorBio,
                instructorAvatar: lessonData.instructorAvatar,
              } as Lesson;
            } catch (error) {
              console.error(`Error prefetching lesson ${nextLessonId} for course ${courseId}, module ${moduleId}:`, error);
              throw error; // Re-throw to be consistent with useQuery behavior
            }
          },
          staleTime: STALE_TIMES.SEMI_STATIC,
        });
      } else {
        console.warn('prefetchNextLesson called with missing IDs:', { courseId, moduleId, nextLessonId });
      }
    }
  };
}

// Hook to fetch a single lesson with timestamp checking
export function useLesson(courseId: string | undefined, moduleId: string | undefined, lessonId: string | undefined, forceRefresh?: number) {
  const queryClient = useQueryClient();

  // Add a lastUpdatedCheck state to track when we last checked for updates
  const [lastUpdateCheck, setLastUpdateCheck] = useState<number>(Date.now());

  // Create a lightweight query to just fetch the lesson's metadata (updatedAt timestamp)
  const metadataQuery = useQuery({
    queryKey: ['lesson-metadata', courseId, moduleId, lessonId, lastUpdateCheck],
    queryFn: async () => {
      if (!courseId || !moduleId || !lessonId) return null;

      try {
        const lessonRef = doc(firestore, `courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`);
        const metaSnapshot = await getDoc(lessonRef);

        if (!metaSnapshot.exists()) return null;

        // Only return the updatedAt timestamp to minimize data transfer
        const metaData = metaSnapshot.data() as { updatedAt: Timestamp | string | undefined; id: string }; // Explicitly type metadata
        return { // Explicitly map metadata fields
          updatedAt: metaData.updatedAt,
          id: metaSnapshot.id
        };
      } catch (error) {
        console.error(`Error checking lesson metadata:`, error);
        return null;
      }
    },
    enabled: !!courseId && !!moduleId && !!lessonId,
    staleTime: 60 * 1000, // Check for updates every minute
    gcTime: 2 * 60 * 1000, // Keep metadata in cache for 2 minutes
    retry: 1
  });

  // Main query to fetch the full lesson data
  const queryResult = useQuery({
    queryKey: ['lesson', courseId, moduleId, lessonId], // Removed metadataQuery.data?.updatedAt
    queryFn: async () => {
      // Log when the query function is executed
      console.log('useLesson queryFn executing with:', { courseId, moduleId, lessonId });

      if (!courseId || !moduleId || !lessonId) {
        console.warn('useLesson missing required parameters:', { courseId, moduleId, lessonId });
        return null;
      }

      try {
        // Construct the path to the lesson document
        const lessonPath = `courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`;
        console.log(`Fetching lesson from path: ${lessonPath}`);

        // Get the lesson document
        const lessonRef = doc(firestore, lessonPath);
        const lessonSnapshot = await getDoc(lessonRef);

        // Check if the lesson document exists
        if (!lessonSnapshot.exists()) {
          console.warn(`Lesson not found at path: ${lessonPath}`);

          // Only do additional debugging in development environment to save Firestore reads
          if (process.env.NODE_ENV === 'development') {
            console.log('Development environment detected, fetching additional debug info');
            // This code only runs in development, not in production
            try {
              // Instead of fetching all documents, just get the count using a limit query
              // This is more efficient than fetching all documents
              const lessonsRef = collection(firestore, `courses/${courseId}/modules/${moduleId}/lessons`);
              // Use the imported query function from Firestore (not the queryResult variable)
              const firestoreQuery = query(lessonsRef, limit(5)); // Just get up to 5 lessons to confirm they exist
              const lessonsSnapshotDebug = await getDocs(firestoreQuery); // Renamed to avoid conflict
              console.log(`Found ${lessonsSnapshotDebug.docs.length}+ lessons in module ${moduleId} (limited to 5 for debugging)`);
            } catch (e) {
              console.error('Error checking lessons in module:', e);
            }
          }

          return null;
        }

        // Get the lesson data
        const lessonData = lessonSnapshot.data() as Lesson;
        console.log(`Lesson data fetched successfully:`, {
          id: lessonSnapshot.id,
          title: lessonData.title,
          type: lessonData.type,
          content: lessonData.content ? 'Content exists' : 'No content',
          hasQuizQuestions: !!lessonData.quizQuestions || !!lessonData.questions
        });

        // Return the lesson data with its ID, explicitly mapping fields
        return { // Explicitly map fields to Lesson interface
          id: lessonSnapshot.id,
          title: lessonData.title || 'Untitled Lesson',
          description: lessonData.description,
          type: lessonData.type || 'text',
          content: lessonData.content,
          videoId: lessonData.videoId,
          duration: lessonData.duration ?? 0,
          order: lessonData.order ?? 0,
          status: lessonData.status || 'draft',
          quizQuestions: lessonData.quizQuestions || lessonData.questions,
          passingScore: lessonData.passingScore,
          resources: lessonData.resources,
          createdAt: lessonData.createdAt,
          updatedAt: lessonData.updatedAt,
          completed: lessonData.completed,
          instructor: lessonData.instructor,
          instructorTitle: lessonData.instructorTitle,
          instructorBio: lessonData.instructorBio,
          instructorAvatar: lessonData.instructorAvatar,
        } as Lesson; // Cast to Lesson
      } catch (error) {
        console.error(`Error fetching lesson ${lessonId} for course ${courseId}, module ${moduleId}:`, error);
        throw error; // Re-throw to be consistent with useQuery behavior
      }
    },
    enabled: !!courseId && !!moduleId && !!lessonId,
    staleTime: STALE_TIMES.SEMI_STATIC,
    gcTime: 60 * 60 * 1000,
    retry: 2,
  });

  // Effect to trigger a metadata check periodically or on forceRefresh
  useEffect(() => {
    // Trigger a check if forceRefresh changes or periodically
    const interval = setInterval(() => {
      setLastUpdateCheck(Date.now());
    }, 60 * 1000); // Check every minute

    // Clear interval on component unmount or when dependencies change
    return () => clearInterval(interval);
  }, [forceRefresh]); // Depend on forceRefresh to allow manual refresh

  // Add error logging inside the hook
  useEffect(() => {
    if (queryResult.error) {
      console.error('useLesson query error:', queryResult.error);
    }
  }, [queryResult.error]);

  return queryResult;
}
