import React, {useState, useEffect, useMemo, useCallback } from 'react';
import {useRouter } from 'next/router';
import {motion } from 'framer-motion';
import {useAuth } from '@/context/AuthContext';
// Removed unused import: useCourses
import LearningLayout from '@/components/layout/LearningLayout';
import VideoPlayer from '@/components/learning/VideoPlayer';
import LessonContent from '@/components/learning/LessonContent';
import QuizComponent from '@/components/learning/QuizComponent';
import Button from '@/components/ui/Button';
import CourseCompletionScreen from '@/components/course-learning/CourseCompletionScreen';

import {ChevronLeftIcon, ChevronRightIcon, BookOpenIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import {useCourse, useEnrollments, usePrefetchLesson, useLesson } from '@/hooks/useFirebaseQueries';
import {doc, serverTimestamp, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import {firestore } from '@/services/firebase';
import {QuizQuestion, QuizOption, Module, Lesson } from '@/types/course.types';
import {storeProgressLocally, hasPendingUpdates } from '@/utilities/offlineProgressSync';
import {FrontendQuizQuestion } from '@/types/quiz.types';
import { calculateCourseProgress } from '../../../services/courseProgressService';

// Adapter function to convert QuizQuestion to FrontendQuizQuestion
function adaptQuizQuestionToFrontend(quizQuestion: QuizQuestion): FrontendQuizQuestion {
  // Map string options to QuizOption objects with proper IDs
  const frontendOptions: QuizOption[] = [];

  // Handle different option formats
  if (quizQuestion.options) {
    quizQuestion.options.forEach((option: any, index) => {
      // If option is an object with id and text properties (from Firestore)
      if (typeof option === 'object' && option !== null && 'id' in option && 'text' in option) {
        frontendOptions.push({
          id: String(option.id),
          text: String(option.text)
        });
      }
      // If option is a string (from older format)
      else if (typeof option === 'string') {
        frontendOptions.push({
          id: `option-${index}`,
          text: option
        });
      }
    });
  }

  // Determine the correct option ID
  let correctOptionId: string = '';

  // First check if correctOptionId is directly available (as in the Firestore structure)
  if ('correctOptionId' in quizQuestion && typeof quizQuestion.correctOptionId === 'string') {
    correctOptionId = quizQuestion.correctOptionId;
  }
  // Otherwise try to find it from correctAnswer
  else if (typeof quizQuestion.correctAnswer === 'string') {
    // Try to find an option with matching ID first (preferred)
    const correctOptionById = frontendOptions.find(opt => opt.id === quizQuestion.correctAnswer);
    if (correctOptionById) {
      correctOptionId = correctOptionById.id;
    } else {
      // Fall back to matching by text
      const correctOptionByText = frontendOptions.find(opt => opt.text === quizQuestion.correctAnswer);
      if (correctOptionByText) {
        correctOptionId = correctOptionByText.id;
      } else {
        console.warn(`Could not find matching option for correct answer: ${quizQuestion.correctAnswer} in question ${quizQuestion.id}`);
      }
    }
  } else if (Array.isArray(quizQuestion.correctAnswer)) {
    console.warn(`QuizQuestion ${quizQuestion.id} has array correctAnswer, but FrontendQuizQuestion expects single correctOptionId.`);
    if (quizQuestion.correctAnswer.length > 0) {
      // Try to find by ID first, then by text
      const correctOption = frontendOptions.find(opt =>
        opt.id === quizQuestion.correctAnswer[0] ||
        opt.text === quizQuestion.correctAnswer[0]
      );
      if (correctOption) {
        correctOptionId = correctOption.id;
      }
    }
  }

  // Create the frontend question object
  const frontendQuestion: FrontendQuizQuestion = {
    id: quizQuestion.id,
    question: quizQuestion.question,
    text: quizQuestion.question, // Use question for text field
    options: frontendOptions,
    correctOptionId: correctOptionId,
    explanation: quizQuestion.explanation
  };

  return frontendQuestion;
}

export default function LearnCourse() {
  const router = useRouter();
  const {id} = router.query;
  const courseId = Array.isArray(id) ? id[0] : id;
  const {user} = useAuth();

  // State for current module and lesson indices
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);

  // State to track if there are pending updates that need to be synced
  const [hasPending, setHasPending] = useState(false);

  // State to control displaying the final quiz
  const [showFinalQuiz, setShowFinalQuiz] = useState(false);

  // Add this near the top of the component where other state is defined
  const [forceRefresh, setForceRefresh] = useState<number>(Date.now());

  // Add this effect to periodically check for updates when the user is idle
  useEffect(() => {
    // Only run this in production to avoid excessive reads during development
    if (process.env.NODE_ENV !== 'production') return;
    
    let idleTimer: NodeJS.Timeout;
    let checkInterval: NodeJS.Timeout;
    
    // Set up an interval to check for updates when user is idle
    const setupCheckInterval = () => {
      // Clear any existing interval
      if (checkInterval) clearInterval(checkInterval);
      
      // Check for updates every 5 minutes when idle
      checkInterval = setInterval(() => {
        setForceRefresh(Date.now());
      }, 5 * 60 * 1000);
    };
    
    // Reset the idle timer when user interacts
    const resetIdleTimer = () => {
      if (idleTimer) clearTimeout(idleTimer);
      if (checkInterval) clearInterval(checkInterval);
      
      // Set a new idle timer - after 2 minutes of inactivity, start checking for updates
      idleTimer = setTimeout(setupCheckInterval, 2 * 60 * 1000);
    };
    
    // Set up event listeners for user activity
    window.addEventListener('mousemove', resetIdleTimer);
    window.addEventListener('keypress', resetIdleTimer);
    window.addEventListener('scroll', resetIdleTimer);
    window.addEventListener('click', resetIdleTimer);
    
    // Initial setup
    resetIdleTimer();
    
    // Cleanup
    return () => {
      if (idleTimer) clearTimeout(idleTimer);
      if (checkInterval) clearInterval(checkInterval);
      window.removeEventListener('mousemove', resetIdleTimer);
      window.removeEventListener('keypress', resetIdleTimer);
      window.removeEventListener('scroll', resetIdleTimer);
      window.removeEventListener('click', resetIdleTimer);
    };
  }, []);

  // Use React Query hooks
  const {data: course, isLoading: courseLoading, isError: courseError, error: courseErrorObj} = useCourse(courseId);
  const {data: enrollments, isLoading: enrollmentsLoading, isError: enrollmentsError, error: enrollmentsErrorObj, updateProgressInCache} = useEnrollments(user?.id);

  // Fetch the current lesson data using the new hook
  const currentModule = course?.modules?.[currentModuleIndex] as Module | undefined;
  const currentLessonStub = useMemo(() => {
    if (currentModule && currentModule.lessons && currentModule.lessons.length > 0 && currentLessonIndex >= 0 && currentLessonIndex < currentModule.lessons.length) {
      return currentModule.lessons[currentLessonIndex];
    }
    return undefined;
  }, [currentModule, currentLessonIndex]);

  // Moved usePrefetchLesson to be called unconditionally at the top level
  const { prefetchNextLesson } = usePrefetchLesson(courseId, currentModule?.id);

  // Use React Query hook to fetch the current lesson's full data
  const {data: currentLesson, isLoading: lessonLoading, isError: lessonError, error: lessonErrorObj} = useLesson(
    courseId,
    currentModule?.id,
    currentLessonStub?.id,
    forceRefresh // Pass this to trigger refresh checks
  );

  // Derived state
  const enrollment = enrollments?.find(e => e.courseId === courseId);
  const modules = course?.modules || [];
  const completedLessons = enrollment?.completedLessons || [];
  const loading = courseLoading || enrollmentsLoading || lessonLoading;
  const isError = courseError || enrollmentsError || lessonError;
  const errorMessage = courseErrorObj?.message || enrollmentsErrorObj?.message || lessonErrorObj?.message || 'An unknown error occurred.';

  // Calculate total lessons, the index of the last lesson, and the index of the last non-quiz lesson
  const { totalLessons, lastLessonModuleIndex, lastLessonIndex, lastNonQuizLessonModuleIndex, lastNonQuizLessonIndex } = useMemo(() => {
    if (!modules) return { totalLessons: 0, lastLessonModuleIndex: -1, lastLessonIndex: -1, lastNonQuizLessonModuleIndex: -1, lastNonQuizLessonIndex: -1 };

    let total = 0;
    let lastModuleIdx = -1;
    let lastLessonIdx = -1;
    let lastNonQuizModuleIdx = -1;
    let lastNonQuizLessonIdx = -1;

    modules.forEach((module, moduleIdx) => {
      const lessonCount = module.lessons?.length || 0;
      total += lessonCount;
      if (lessonCount > 0) {
        lastModuleIdx = moduleIdx;
        lastLessonIdx = lessonCount - 1;

        // Find the last non-quiz lesson in this module using a backward loop
        let foundNonQuizIndexInModule = -1;
        if (module.lessons) {
          for (let i = lessonCount - 1; i >= 0; i--) {
            if (module.lessons[i]?.type !== 'quiz') {
              foundNonQuizIndexInModule = i;
              break;
            }
          }
        }

        if (foundNonQuizIndexInModule !== -1) {
          lastNonQuizModuleIdx = moduleIdx;
          lastNonQuizLessonIdx = foundNonQuizIndexInModule;
        }
      }
    });

    // If no non-quiz lessons were found, the last non-quiz lesson is the last lesson overall (if any)
    if (lastNonQuizModuleIdx === -1 && total > 0) {
       lastNonQuizModuleIdx = lastModuleIdx;
       lastNonQuizLessonIdx = lastLessonIdx;
    }

    return { totalLessons: total, lastLessonModuleIndex: lastModuleIdx, lastLessonIndex: lastLessonIdx, lastNonQuizLessonModuleIndex: lastNonQuizModuleIdx, lastNonQuizLessonIndex: lastNonQuizLessonIdx };
  }, [modules]);

  // Calculate total lessons for the current course (used for optimistic updates)
  const totalLessonsInCurrentCourse = useMemo(() => {
    if (!modules) return 1; // Default to 1 to avoid division by zero if modules aren't loaded
    let total = 0;
    modules.forEach((module) => {
      total += module.lessons?.length || 0;
    });
    return Math.max(1, total); // Ensure at least 1
  }, [modules]);

  // Calculate overall progress percentage
  // This calculation aligns with the calculateCourseProgress function in courseProgressService.ts
  const progressPercentage = useMemo(() => {
    if (!modules || !completedLessons) return 0;

    // Calculate total lessons across all modules
    let totalLessons = 0;
    modules.forEach((module) => {
      totalLessons += module.lessons?.length || 0;
    });

    // Use the centralized calculation function
    const { overallProgress } = calculateCourseProgress(completedLessons, totalLessons);
    return overallProgress;
  }, [modules, completedLessons]);

  // Effect to reset indices or validate when course data changes
  useEffect(() => {
    // Only log detailed info in development environment
    if (process.env.NODE_ENV === 'development') {
      console.log('Course data changed:', {
        hasCourse: !!course,
        hasModules: !!course?.modules,
        moduleCount: course?.modules?.length || 0,
        currentModuleIndex,
        currentLessonIndex
      });
    }

    if (course?.modules && course.modules.length > 0) {
      // Ensure current indices are valid for the loaded course
      const totalModules = course.modules.length;
      let moduleIndex = currentModuleIndex;
      let lessonIndex = currentLessonIndex;

      // Validate module index
      if (moduleIndex >= totalModules) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`Module index ${moduleIndex} is out of bounds (total: ${totalModules}), resetting to 0`);
        }
        moduleIndex = 0; // Reset to first module if out of bounds
      }

      // Find the first module with lessons if the current module has no lessons
      // This is done without additional Firestore reads since we already have the module data
      let selectedModule = course.modules[moduleIndex];
      let selectedModuleIndex = moduleIndex;

      // If the current module has no lessons, try to find a module that has lessons
      // This is an in-memory operation and doesn't trigger additional Firestore reads
      if (!selectedModule.lessons || selectedModule.lessons.length === 0) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`Current module ${selectedModule.id} has no lessons, looking for a module with lessons`);

          // Log all modules and their lesson counts for debugging
          course.modules.forEach((m, idx) => {
            console.log(`Module ${idx} (${m.id}): ${m.lessons?.length || 0} lessons`);
          });
        }

        // Find the first module with lessons - this is an efficient operation
        // that doesn't create additional arrays or objects
        const moduleWithLessons = course.modules.findIndex(m => m.lessons && m.lessons.length > 0);

        if (moduleWithLessons !== -1) {
          if (process.env.NODE_ENV === 'development') {
            console.log(`Found module with lessons at index ${moduleWithLessons}`);
          }
          selectedModuleIndex = moduleWithLessons;
          selectedModule = course.modules[selectedModuleIndex];
          moduleIndex = selectedModuleIndex;
        } else {
          // If no module has lessons, we'll stick with the current module
          // This is likely a data fetching issue, as we know lessons exist in Firestore
          if (process.env.NODE_ENV === 'development') {
            console.log(`No modules with lessons found, sticking with current module ${selectedModule.id}`);
            console.log('This is likely a data fetching issue - the lessons exist in Firestore but weren\'t fetched correctly');
          }
        }
      }

      // Validate lesson index within the selected module
      const totalLessonsInModule = selectedModule.lessons?.length || 0;

      // Only log in development environment
      if (process.env.NODE_ENV === 'development') {
        console.log('Selected module:', {
          moduleId: selectedModule.id,
          moduleTitle: selectedModule.title,
          hasLessons: !!selectedModule.lessons,
          lessonCount: totalLessonsInModule,
          currentLessonIndex: lessonIndex
        });
      }

      if (lessonIndex >= totalLessonsInModule) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`Lesson index ${lessonIndex} is out of bounds (total: ${totalLessonsInModule}), resetting to 0`);
        }
        lessonIndex = 0; // Reset to first lesson in module if out of bounds
      }

      // Update state only if indices changed - this minimizes re-renders
      if (moduleIndex !== currentModuleIndex) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`Updating module index from ${currentModuleIndex} to ${moduleIndex}`);
        }
        setCurrentModuleIndex(moduleIndex);
      }

      if (lessonIndex !== currentLessonIndex) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`Updating lesson index from ${currentLessonIndex} to ${lessonIndex}`);
        }
        setCurrentLessonIndex(lessonIndex);
      }
    } else if (course) {
      console.warn('Course has no modules or empty modules array');
    }
  }, [course, currentModuleIndex, currentLessonIndex]); // Depend on course data and current indices

  // Effect to prefetch the next lesson when current lesson changes
  useEffect(() => {
    // Use currentModule and modules derived from the course data
    if (!currentModule || !currentModule.lessons || currentModule.lessons.length === 0) {
      return;
    }

    // Determine the next lesson to prefetch
    let nextLessonStub = null;

    if (currentModule.lessons && currentLessonIndex < currentModule.lessons.length - 1) {
      // Next lesson in the same module
      nextLessonStub = currentModule.lessons[currentLessonIndex + 1];
    } else if (currentModuleIndex < modules.length - 1) {
      // First lesson of the next module
      const nextModule = modules[currentModuleIndex + 1];
      if (nextModule?.lessons?.length) {
        nextLessonStub = nextModule.lessons[0];
      }
    }

    // Prefetch the next lesson if available
    if (nextLessonStub?.id && currentModule?.id) {
      prefetchNextLesson(nextLessonStub.id);
    } else if (process.env.NODE_ENV === 'development') {
      console.log('No next lesson stub or module ID available for prefetching.');
    }
  }, [currentModuleIndex, currentLessonIndex, currentModule, modules, prefetchNextLesson, courseId]);

  // Handle marking a lesson as complete with Firestore quota handling
  const handleMarkComplete = useCallback(() => {
    // Use typedLesson and currentModule fetched by hooks
    if (!user?.id || !courseId || !currentLesson || !currentModule) {
      console.warn('Missing critical data for handleMarkComplete');
      return;
    }

    // Use the typed lesson to avoid TypeScript errors
    const lesson = currentLesson as Lesson;

    // Format the lessonKey according to the database structure
    const lessonKey = `${currentModule.id}_${lesson.id}`;

    // Check if this lesson is already completed
    if (completedLessons.includes(lessonKey)) {
      console.log(`Lesson ${lessonKey} is already completed`);
      
      // Check if this is the last lesson
      const isLastLesson = currentModuleIndex === modules.length - 1 && 
                           currentLessonIndex === (currentModule.lessons?.length || 0) - 1;
      
      if (isLastLesson) {
        // Show final quiz/completion screen
        setShowFinalQuiz(true);
      } else {
        // Navigate to next lesson
        if (currentLessonIndex < (currentModule?.lessons?.length || 0) - 1) {
          setCurrentLessonIndex(currentLessonIndex + 1);
        } else if (currentModuleIndex < (modules?.length || 0) - 1) {
          setCurrentModuleIndex(currentModuleIndex + 1);
          setCurrentLessonIndex(0);
        }
      }
      return;
    }

    const nowISO = new Date().toISOString();

    // Prepare the progress data for potential offline storage
    const progressDataForOffline = {
      userId: user.id,
      courseId: courseId,
      moduleId: currentModule.id,
      lessonId: lesson.id,
      lessonKey,
      completed: true,
      timestamp: nowISO,
      type: 'lesson_completion',
      position: lesson.type === 'video' ? 0 : undefined,
      timeSpent: 0
    };

    // Store progress locally first to handle potential Firestore quota issues
    storeProgressLocally(progressDataForOffline);
  
    // If we have the updateProgressInCache function, use it
    if (typeof updateProgressInCache === 'function') {
      updateProgressInCache(courseId, lessonKey, totalLessonsInCurrentCourse);
    }

    // Check if this is the last lesson
    const isLastLesson = currentModuleIndex === modules.length - 1 && 
                         currentLessonIndex === (currentModule.lessons?.length || 0) - 1;

    if (isLastLesson) {
      setShowFinalQuiz(true);
      console.log('Reached the end of the course, showing final quiz.');
    } else {
      // Navigate to the next lesson
      if (currentLessonIndex < (currentModule?.lessons?.length || 0) - 1) {
        setCurrentLessonIndex(currentLessonIndex + 1);
      } else if (currentModuleIndex < (modules?.length || 0) - 1) {
        setCurrentModuleIndex(currentModuleIndex + 1);
        setCurrentLessonIndex(0);
      }
    }
  }, [user?.id, courseId, currentLesson, currentModule, completedLessons, 
      currentModuleIndex, currentLessonIndex, modules, updateProgressInCache, totalLessonsInCurrentCourse]);

  // Navigation functions
  const navigateToPreviousLesson = useCallback(() => {
    if (currentLessonIndex > 0) {
      setCurrentLessonIndex(currentLessonIndex - 1);
    } else if (currentModuleIndex > 0) {
      setCurrentModuleIndex(currentModuleIndex - 1);
      // Navigate to the last lesson of the previous module
      const previousModule = modules[currentModuleIndex - 1];
      if (previousModule?.lessons?.length) {
        setCurrentLessonIndex(previousModule.lessons.length - 1);
      } else {
        setCurrentLessonIndex(0);
      }
    }
  }, [currentLessonIndex, currentModuleIndex, modules]);

  // Add this function to check if a lesson is completed
  const isLessonCompleted = useCallback((moduleId: string, lessonId: string) => {
    // Check against completedLessons from enrollment data
    return completedLessons.includes(`${moduleId}_${lessonId}`);
  }, [completedLessons]);

  // Add this to handle course completion
  const handleCourseCompletion = useCallback(() => {
    if (!user?.id || !courseId) return;
    
    // Show the final quiz or completion screen
    setShowFinalQuiz(true);
    
    // Optional: Track that user has viewed the completion screen
    try {
      const progressRef = doc(firestore, 'courseProgress', `${user.id}_${courseId}`);
      updateDoc(progressRef, {
        completionScreenViewed: true,
        lastUpdated: serverTimestamp()
      }).catch(err => console.error('Error updating completion status:', err));
    } catch (error) {
      console.error('Error in handleCourseCompletion:', error);
    }
  }, [user?.id, courseId]);

  // Modify the navigateToNextLesson function to handle course completion
  const navigateToNextLesson = useCallback(() => {
    // Use currentModule and modules derived from course data
    if (currentLessonIndex < (currentModule?.lessons?.length || 0) - 1) {
      setCurrentLessonIndex(currentLessonIndex + 1);
    } else if (currentModuleIndex < (modules?.length || 0) - 1) {
      setCurrentModuleIndex(currentModuleIndex + 1);
      setCurrentLessonIndex(0);
    } else {
      // This is the very last lesson, show completion screen
      handleCourseCompletion();
    }
  }, [currentLessonIndex, currentModuleIndex, currentModule?.lessons?.length, modules?.length, handleCourseCompletion]);

  // The actual current module and lesson data comes from the hooks
  // Add a check to ensure currentLesson is available before rendering content
  // currentModule is derived from course data
  // currentLesson is fetched by useLesson hook

  // Render loading state if data is still fetching
  if (loading) {
    return (
      <LearningLayout courseTitle={course?.title || 'Loading Course...'}>
        <div className="flex justify-center items-center h-full">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
        </div>
      </LearningLayout>
    );
  }

  // Render error state if there's an error
  if (isError) {
    return (
      <LearningLayout courseTitle="Error Loading Course">
        <div className="flex justify-center items-center h-full text-red-500">
          Error loading course: {errorMessage}
        </div>
      </LearningLayout>
    );
  }

  // Ensure course and currentLesson are available before rendering main content
  if (!course) {
    // Course data is missing
    return (
      <LearningLayout courseTitle="Course Not Found">
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          <div className="bg-white rounded-lg shadow-sm p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-4">Course Not Found</h2>
            <p className="text-neutral-600 mb-6">
              We couldn't find the course you're looking for. It may have been removed or you don't have access to it.
            </p>
            <Button
              variant="primary"
              onClick={() => void router.push('/my-learning')}
            >
              Return to My Learning
            </Button>
          </div>
        </div>
      </LearningLayout>
    );
  }

  // Check if we have modules but no lessons
  // Only log detailed module info in development to reduce console clutter
  if (process.env.NODE_ENV === 'development') {
    console.log('Course modules check:', {
      modulesLength: course.modules.length,
      modulesWithLessons: course.modules.map(m => ({
        moduleId: m.id,
        moduleTitle: m.title,
        hasLessons: !!m.lessons,
        lessonCount: m.lessons?.length || 0,
        // Log the actual lessons array for debugging
        lessonIds: m.lessons?.map(l => l.id) || []
      }))
    });
  } else {
    // In production, just log the summary
    console.log(`Course has ${course.modules.length} modules`);
  }

  // Force a refresh of the React Query cache for this course
  // This will ensure we're getting fresh data from Firestore
  if (process.env.NODE_ENV === 'development') {
    console.log('Checking if we need to invalidate the course query cache...');

    // Only show "No Lessons Available" if ALL modules have no lessons
    // Calculate total lessons without creating new arrays (more efficient)
    const totalLessonsCount = course.modules.reduce((count, module) => count + (module.lessons?.length || 0), 0);

    if (course.modules.length > 0 && totalLessonsCount === 0) {
      console.log('No lessons found in any module, but we know they exist in Firestore');
      console.log('This is likely a data fetching issue - checking module structure');

      // Log the module structure for debugging
      course.modules.forEach(module => {
        console.log(`Module ${module.id}:`, {
          title: module.title,
          hasLessonsArray: !!module.lessons,
          lessonsLength: module.lessons?.length || 0
        });
      });

      // Check if we should show the "No Lessons Available" message
      // We'll only show it if we're sure there are no lessons
      return (
        <LearningLayout courseTitle={course.title || "Course"}>
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="bg-white rounded-lg shadow-sm p-8 max-w-md">
              <h2 className="text-xl font-semibold mb-4">No Lessons Available</h2>
              <p className="text-neutral-600 mb-6">
                This course has modules but no lessons have been added yet. Please check back later.
              </p>
              <Button
                variant="primary"
                onClick={() => void router.push('/my-learning')}
              >
                Return to My Learning
              </Button>
            </div>
          </div>
        </LearningLayout>
      );
    }
  }

  // Check if currentLesson is missing but we have course and module data
  if (!currentLesson && currentModule && currentLessonStub) {
    return (
      <LearningLayout courseTitle={`${course.title} | ${currentModule.title}`}>
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          <div className="bg-white rounded-lg shadow-sm p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-4">Lesson Content Unavailable</h2>
            <p className="text-neutral-600 mb-6">
              We couldn't load the content for this lesson. The lesson may have been removed or there might be a temporary issue.
            </p>
            <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
              <Button
                variant="outline"
                onClick={() => void router.reload()}
              >
                Try Again
              </Button>
              <Button
                variant="primary"
                onClick={() => void router.push('/my-learning')}
              >
                Return to My Learning
              </Button>
            </div>
          </div>
        </div>
      </LearningLayout>
    );
  }

  // Use the prefetch hook to optimize loading of next lessons
  // Pass the ID of the lesson stub to the prefetch hook
  // const {prefetchNextLesson } = usePrefetchLesson(
  //   courseId,
  //   currentModule?.id,
  //   currentLessonStub?.id
  // );

  // Overall progress is now calculated in the progressPercentage useMemo

  // Helper function for enrollment document - not currently used directly
  // but kept for reference as it may be needed in future implementations
  // This function is aligned with the Firestore database structure
  // Note: This function is intentionally prefixed with underscore to indicate it's not actively used
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _findOrCreateEnrollmentDoc = async (userId: string, courseId: string) => {
    try {
      const enrollmentRef = doc(firestore, `users/${userId}/enrollments/${courseId}`);
      const enrollmentDoc = await getDoc(enrollmentRef);

      if (enrollmentDoc.exists()) {
        return enrollmentRef;
      } else {
        // If no enrollment document is found, create one with the courseId as the document ID
        // This structure matches the users-firestore-structure.md documentation
        await setDoc(enrollmentRef, {
          courseId,
          courseName: course?.title || 'Unknown Course',
          enrolledAt: serverTimestamp(),
          progress: 0,
          completedLessons: [],
          lastAccessedAt: serverTimestamp(),
          status: 'active',
          // Add enrolledBy information as specified in the database structure
          enrolledBy: {
            method: 'self_enrollment',
            timestamp: serverTimestamp()
          }
        });
        return enrollmentRef;
      }
    } catch (error) {
      console.error('Error finding or creating enrollment document:', error);
      throw error;
    }
  };

  // Show loading spinner while data is being fetched
  if (loading) {
    return (
      <LearningLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </LearningLayout>
    );
  }

  // Show error message if course failed to load
  if (!course) {
    return (
      <LearningLayout>
        <div className="flex flex-col items-center justify-center h-screen p-6 text-center">
          <div className="bg-white rounded-lg shadow-sm p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-4">Course Not Found</h2>
            <p className="text-neutral-600 mb-6">
              We couldn't find the course you're looking for. It may have been removed or you don't have access to it.
            </p>
            <Button
              variant="primary"
              onClick={() => void router.push('/my-learning')}
            >
              Return to My Learning
            </Button>
          </div>
        </div>
      </LearningLayout>
    );
  }

  // If course exists but has no modules, show a message
  if (modules.length === 0) {
    return (
      <LearningLayout title={`${course.title} | Learning`}> // Added check for course.title
        <div className="flex flex-col items-center justify-center h-screen p-6 text-center">
          <div className="bg-white rounded-lg shadow-sm p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-4">No Content Available</h2>
            <p className="text-neutral-600 mb-6">
              This course doesn't have any modules or lessons yet. Please check back later.
            </p>
            <Button
              variant="primary"
              onClick={() => void router.push('/my-learning')}
            >
              Return to My Learning
            </Button>
          </div>
        </div>
      </LearningLayout>
    );
  }

  // Ensure currentModule and currentLessonStub are valid before rendering
  // Also ensure currentLesson is loaded before rendering content/quiz
  if (!currentModule) {
    // No current module selected
    return (
      <LearningLayout courseTitle={course.title || "Course"}>
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          <div className="bg-white rounded-lg shadow-sm p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-4">Module Not Found</h2>
            <p className="text-neutral-600 mb-6">
              We couldn't find the selected module. Please try selecting a different module.
            </p>
            <Button
              variant="primary"
              onClick={() => {
                // Try to select the first module if available
                if (course.modules.length > 0) {
                  setCurrentModuleIndex(0);
                  setCurrentLessonIndex(0);
                } else {
                  router.push('/my-learning');
                }
              }}
            >
              {course.modules.length > 0 ? 'Go to First Module' : 'Return to My Learning'}
            </Button>
          </div>
        </div>
      </LearningLayout>
    );
  }

  if (!currentLessonStub) {
    // No lesson stub selected
    return (
      <LearningLayout courseTitle={`${course.title} | ${currentModule.title}`}>
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          <div className="bg-white rounded-lg shadow-sm p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-4">Lesson Not Found</h2>
            <p className="text-neutral-600 mb-6">
              We couldn't find the selected lesson. The module might not have any lessons yet.
            </p>
            <Button
              variant="primary"
              onClick={() => void router.push('/my-learning')}
            >
              Return to My Learning
            </Button>
          </div>
        </div>
      </LearningLayout>
    );
  }

  if (!currentLesson) {
    // Show loading state while currentLesson is being fetched
    return (
      <LearningLayout courseTitle={`${course.title} | ${currentModule.title}`}>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </LearningLayout>
    );
  }

  return (
    <LearningLayout title={`${course?.title || 'Loading...'} | Learning`}>
      <div className="flex flex-col h-screen bg-white">
        {/* Top Navigation Bar */}
        <div className="bg-white border-b border-neutral-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/my-learning')}
              className="mr-4"
            >
              <ChevronLeftIcon className="w-4 h-4 mr-1" />
              My Courses
            </Button>
            <h1 className="text-lg font-semibold text-neutral-800 hidden md:block">
              {course?.title || 'Loading...'}
            </h1>
          </div>
          <div className="flex items-center">
            <div className="text-sm text-neutral-600 mr-4 hidden md:block">
              <span className="font-medium">{progressPercentage}%</span> complete
            </div>
            <div className="w-32 bg-neutral-200 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
                style={{width: `${progressPercentage}%`}}
              ></div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar - Module Navigation */}
          <div className="hidden md:block w-72 border-r border-neutral-200 bg-neutral-50 overflow-y-auto">
            <div className="p-4">
              <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-4">
                Course Content
              </h2>
              <div className="space-y-2">
                {modules?.map((module, moduleIdx) => (
                  <div key={module.id} className="mb-4">
                    <div className="flex items-center mb-2">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center mr-2 ${
                        moduleIdx < currentModuleIndex ? 'bg-green-500 text-white' : 
                        moduleIdx === currentModuleIndex ? 'bg-primary text-white' : 
                        'bg-neutral-200 text-neutral-500'
                      }`}>
                        {moduleIdx < currentModuleIndex ? (
                          <CheckCircleIcon className="w-3 h-3" />
                        ) : (
                          <span className="text-xs">{moduleIdx + 1}</span>
                        )}
                      </div>
                      <h3 className="text-sm font-medium text-neutral-800">{module.title}</h3>
                    </div>
                    <div className="ml-7 space-y-1">
                      {module.lessons?.map((lesson, lessonIdx) => (
                        <button
                          key={lesson.id}
                          onClick={() => {
                            setCurrentModuleIndex(moduleIdx);
                            setCurrentLessonIndex(lessonIdx);
                          }}
                          className={`w-full text-left pl-4 pr-2 py-2 text-sm rounded-md flex items-center ${
                            moduleIdx === currentModuleIndex && lessonIdx === currentLessonIndex
                              ? 'bg-primary-50 text-primary-700 font-medium'
                              : completedLessons.includes(`${module.id}_${lesson.id}`)
                              ? 'text-neutral-700 bg-neutral-100'
                              : 'text-neutral-600 hover:bg-neutral-100'
                          }`}
                        >
                          <div className="w-5 h-5 mr-2 flex-shrink-0">
                            {completedLessons.includes(`${module.id}_${lesson.id}`) ? (
                              <CheckCircleIcon className="w-5 h-5 text-green-500" />
                            ) : lesson.type === 'video' ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            ) : lesson.type === 'quiz' ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            ) : (
                              <BookOpenIcon className="w-5 h-5 text-neutral-400" />
                            )}
                          </div>
                          <span className="truncate">{lesson.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Lesson Header */}
            {!showFinalQuiz && (
              <div className="bg-white border-b border-neutral-200 p-4 flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-sm text-neutral-500 mb-1">
                    {currentModule?.title} • Lesson {currentLessonIndex + 1} of {currentModule?.lessons?.length || 0}
                  </div>
                  <h2 className="text-xl font-semibold text-neutral-800">
                    {currentLessonStub?.title}
                  </h2>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={navigateToPreviousLesson}
                    disabled={currentModuleIndex === 0 && currentLessonIndex === 0}
                    className="flex items-center"
                  >
                    <ChevronLeftIcon className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={navigateToNextLesson}
                    disabled={currentModuleIndex === lastLessonModuleIndex && currentLessonIndex === lastLessonIndex}
                    className="flex items-center"
                  >
                    Next
                    <ChevronRightIcon className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto">
              {showFinalQuiz ? (
                <CourseCompletionScreen courseId={courseId as string} />
              ) : (
                <div className="w-full py-6">
                  {/* Lesson Content or Video Player - No duplicate title */}
                  <div className="px-6">
                    {currentLesson.type === 'video' && currentLesson.videoId ? (
                      <div className="mb-8">
                        <div className="aspect-video bg-black rounded-lg overflow-hidden mb-6">
                          <VideoPlayer videoId={currentLesson.videoId} />
                        </div>
                        {currentLesson.content && (
                          <div className="prose prose-lg max-w-none">
                            {currentLesson.content.includes('```') || currentLesson.content.includes('#') ? 
                              <LessonContent content={currentLesson.content} /> : 
                              <div dangerouslySetInnerHTML={{ __html: currentLesson.content }} />
                            }
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="prose prose-lg max-w-none">
                        {currentLesson.content && (
                          currentLesson.content.includes('```') || currentLesson.content.includes('#') ? 
                            <LessonContent content={currentLesson.content} /> : 
                            <div dangerouslySetInnerHTML={{ __html: currentLesson.content }} />
                        )}
                      </div>
                    )}

                    {/* Quiz Component */}
                    {currentLesson.type === 'quiz' && currentLesson.questions && (
                      <div className="mt-8 bg-white rounded-xl border border-neutral-200 p-6">
                        <h3 className="text-xl font-semibold mb-6">Knowledge Check</h3>
                        <QuizComponent
                          quiz={{
                            questions: (currentLesson.quizQuestions || currentLesson.questions || [])
                              .map(adaptQuizQuestionToFrontend),
                            passingScore: currentLesson.passingScore || 70
                          }}
                          onComplete={() => void handleMarkComplete()}
                          courseId={courseId as string}
                          lessonId={currentLesson.id}
                        />
                      </div>
                    )}
                    
                    {/* Mark as Complete Button - Fixed at bottom center */}
                    {currentLesson.type !== 'quiz' && (
                      <div className="fixed bottom-0 left-0 right-0 py-4 bg-white border-t border-neutral-200 flex justify-center z-10">
                        <Button
                          variant="primary"
                          size="lg"
                          onClick={() => void handleMarkComplete()}
                          disabled={completedLessons.includes(`${currentModule?.id}_${currentLesson.id}`)}
                          className="px-8"
                        >
                          {completedLessons.includes(`${currentModule?.id}_${currentLesson.id}`) ? (
                            <>
                              <CheckCircleIcon className="w-5 h-5 mr-2" />
                              Completed
                            </>
                          ) : (
                            'Mark as Complete'
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </LearningLayout>
  );
}
