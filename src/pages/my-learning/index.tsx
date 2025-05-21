import React, { useState, useEffect, useCallback, useMemo } from 'react'; // Added useCallback, useMemo
import MainLayout from '@/components/layout/MainLayout';
import CourseGrid from '@/components/course-catalog/CourseGrid'; // Assumed stable
import { Course, CourseEnrollment, CourseWithProgress } from '@/types/course.types';
import Button from '@/components/ui/Button'; // Assumed stable
import { useAuth } from '@/context/AuthContext'; // Assumed stable
import { firestore } from '@/services/firebase';
import { collection, query, where, orderBy, getDocs, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore'; // Removed unused doc, getDoc, limit
import { parseDurationString } from '@/utils/durationUtils';
import { getCourseProgress, getCoursesInProgress } from '@/services/courseProgressService'; // Import the progress service

// Define a type for the cached data structure
interface CachedUserCourses {
  enrolled: CourseWithProgress[];
  completed: CourseWithProgress[];
}

export default function MyLearningPage() {
  const { user, loading: authLoading } = useAuth(); // Get stable user from context, removed unused isAuthenticated
  // Removed unused activeTab state as we're using a different UI approach
  const [enrolledCourses, setEnrolledCourses] = useState<CourseWithProgress[]>([]);
  const [completedCourses, setCompletedCourses] = useState<CourseWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [initialDataFetched, setInitialDataFetched] = useState(false); // New state to track initial fetch
  const [lessonStats, setLessonStats] = useState({
    inProgress: 0,
    completed: 0,
    totalTimeSpent: 0, // in seconds
  });

  // Function to fetch user's enrolled courses
  // Wrapped in useCallback for stability
  const fetchUserCourses = useCallback(async (useCache = true) => {
    if (!user) {
      // If user logs out while on the page, reset states
      setEnrolledCourses([]);
      setCompletedCourses([]);
      setLoading(false);
      setInitialDataFetched(true); // Mark as fetched even if no user
      return;
    }

    setLoading(true);
    setError(null);
    setQuotaExceeded(false);

    // Check cache first if allowed
    if (useCache) {
      const cachedData = localStorage.getItem(`user_courses_${user.uid}`);
      const cacheTimestamp = localStorage.getItem(`user_courses_timestamp_${user.uid}`);
      if (cachedData && cacheTimestamp) {
        try {
          const parsedData = JSON.parse(cachedData) as CachedUserCourses;
          const timestamp = parseInt(cacheTimestamp);
          const now = Date.now();
          const oneHour = 60 * 60 * 1000;
          if (now - timestamp < oneHour) {
            setEnrolledCourses(parsedData?.enrolled || []);
            setCompletedCourses(parsedData?.completed || []);
            setLoading(false);
            setInitialDataFetched(true); // Mark as fetched from cache
            // console.log("Using cached courses for My Learning");
            // Optionally trigger background refresh
            return; // Exit early if valid cache is used
          }
        } catch (e) {
          console.error("Failed to parse cached user courses", e);
          // Clear invalid cache
          localStorage.removeItem(`user_courses_${user.uid}`);
          localStorage.removeItem(`user_courses_timestamp_${user.uid}`);
        }
      }
    }

    // Fetch fresh data
    try {
      // Fetch enrollments (Consider pagination if list can be huge)
      const enrollmentsRef = collection(firestore, `users/${user.uid}/enrollments`);
      // Fetch ALL enrollments first, then filter status client-side OR
      // Query specific statuses if needed (e.g., separate query for 'completed')
      // Fetching all and sorting locally might be simpler if list isn't massive
      const enrollmentsQuery = query(enrollmentsRef, orderBy('enrolledAt', 'desc'));
      const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
      const enrollmentData = (enrollmentsSnapshot.docs).map(d => {// Explicitly assert docs type and map
        const data = d.data() as CourseEnrollment; // Cast data() to CourseEnrollment
        return {
          courseId: data.courseId,
          courseName: data.courseName,
          enrolledAt: data.enrolledAt,
          expiryDate: data.expiryDate,
          paymentId: data.paymentId,
          status: data.status,
          enrollmentId: d.id // Access d.id
        } as CourseEnrollment & { enrollmentId: string }; // Explicitly cast return object
      });

      // Get unique course IDs from enrollments
      const courseIds = Array.from(new Set(enrollmentData.map(e => e.courseId)));

      // Fetch course details for these IDs
      // NOTE: Firestore 'in' query limited to 10 items per query.
      // If user is enrolled in > 10 courses, batching with multiple 'in' queries is necessary.
      const courseBatches = [];
      for (let i = 0; i < courseIds.length; i += 10) {
        courseBatches.push(courseIds.slice(i, i + 10));
      }

      const courseResults: Course[] = [];
      for (const batch of courseBatches) {
        if (batch.length === 0) continue;
        try {
          const coursesRef = collection(firestore, 'courses');
          const coursesQuery = query(coursesRef, where('__name__', 'in', batch)); // Use __name__ for document ID
          const coursesSnapshot = await getDocs(coursesQuery);
          // Using a traditional for loop for explicit typing
          for (let i = 0; i < coursesSnapshot.docs.length; i++) {
            const docSnap: QueryDocumentSnapshot<DocumentData> = coursesSnapshot.docs[i];
            const docId: string = docSnap.id; // Explicitly get id

            if (docSnap.exists()) {
              const courseData = docSnap.data();
              courseResults.push({ ...courseData, id: docId } as Course);
            } else {
              console.warn(`Course document not found for ID: ${docId}`);
            }
          }
        } catch (err) {
          console.error(`Error fetching course details for batch ${batch.join(',')}:`, err);
          // Depending on error handling strategy, you might want to throw or handle partial failures
        }
      }

      const coursesMap = new Map(courseResults.map(c => [c.id, c]));

      // Filter enrollments to only include those for which we found course details
      const relevantEnrollments = enrollmentData.filter(enrollment => coursesMap.has(enrollment.courseId));

      // Fetch progress and combine with course details for relevant enrollments
      const coursesWithProgressPromises = relevantEnrollments.map(async enrollment => {
        const courseDetail = coursesMap.get(enrollment.courseId)!; // Use non-null assertion as we filtered
        // Fetch progress using the service
        const progressData = await getCourseProgress(user.uid, enrollment.courseId);
        const progressPercentage = progressData?.overallProgress || 0;

        return {
          ...courseDetail,
          progress: progressPercentage,
          // Ensure all necessary fields are included from courseDetail
          modulesList: courseDetail.modulesList,
          durationDetails: courseDetail.durationDetails,
          enrolledCount: courseDetail.enrolledCount,
          reviewCount: courseDetail.reviewCount,
          rating: courseDetail.rating,
        } as CourseWithProgress; // Explicitly cast the result of the map
      });

      const coursesWithProgress = await Promise.all(coursesWithProgressPromises);

      // Filter out any potential null or undefined values and ensure 'id' exists
      const validCoursesWithProgress = coursesWithProgress.filter(
        (course): course is CourseWithProgress => course != null && typeof course.id === 'string' && course.id.length > 0
      );

      // Separate into enrolled (active, progress < 100) and completed
      const enrolled: CourseWithProgress[] = [];
      const completed: CourseWithProgress[] = [];

      validCoursesWithProgress.forEach((course: CourseWithProgress) => {
        // Define completed based on progress OR enrollment status if available
        const enrollment = enrollmentData.find(e => e.courseId === course.id);
        const isCompleted = (course.progress >= 100) || (enrollment?.status === 'completed');
        // Define in-progress based on active status AND progress < 100
        const isInProgress = (enrollment?.status === 'active') && (course.progress < 100);

        if (isCompleted) {
          // Ensure progress is 100 if marked completed
          completed.push({ ...course, progress: 100 });
        } else if (isInProgress) {
          enrolled.push(course);
        }
        // Courses that are inactive and not completed won't appear in either list
      });

      // Deduplicate completed courses (if multiple completed enrollments exist for one course)
      const uniqueCompleted = Array.from(
        completed.reduce((map, course) => {
          if (!map.has(course.id)) {// Keep the first encountered completed record
            map.set(course.id, course);
          }
          return map;
        }, new Map<string, CourseWithProgress>()).values()
      );


      // Update state
      setEnrolledCourses(enrolled);
      setCompletedCourses(uniqueCompleted);

      // Cache the results
      localStorage.setItem(`user_courses_${user.uid}`, JSON.stringify({ enrolled, completed: uniqueCompleted }));
      localStorage.setItem(`user_courses_timestamp_${user.uid}`, Date.now().toString());

    } catch (err: unknown) {
      console.error('Error fetching user courses:', err);
      let specificErrorMessage = 'Failed to load your courses. Please try again.';
      let isQuotaError = false;

      if (err instanceof Error) {
        // For Firebase errors or other errors with a 'code' property
        const errorWithCode = err as Error & { code?: string };
        if (errorWithCode.code === 'resource-exhausted' || errorWithCode.message?.includes('Quota exhausted')) {
          isQuotaError = true;
        }
        // Use the error's message if available, otherwise keep the generic one
        specificErrorMessage = errorWithCode.message || specificErrorMessage;
      } else if (typeof err === 'object' && err !== null) {
        // Fallback for other object-like errors that might have code/message
        const errorObject = err as { code?: string; message?: string };
        if (errorObject.code === 'resource-exhausted' || errorObject.message?.includes('Quota exhausted')) {
          isQuotaError = true;
        }
        if (errorObject.message) {
          specificErrorMessage = errorObject.message;
        }
      }

      if (isQuotaError) {
        setQuotaExceeded(true);
        // Use older cache if possible on quota error
        const cachedData = localStorage.getItem(`user_courses_${user.uid}`);
        if (cachedData) {
          try {
            const parsedData = JSON.parse(cachedData) as CachedUserCourses;
            setEnrolledCourses(parsedData?.enrolled || []);
            setCompletedCourses(parsedData?.completed || []);
          } catch (cacheParseError) {
            console.error("Failed to parse cached courses during quota error:", cacheParseError);
            setError('Unable to load cached courses during high traffic.');
          }
        } else {
          setError('Unable to load your courses due to high traffic. Please try again later.');
        }
      } else {
        setError(specificErrorMessage);
      }
    } finally {
      setLoading(false);
      setInitialDataFetched(true); // Ensure this is set after any fetch attempt
    }
  }, [user]); // Dependency: user object

  // Fetch courses when component mounts or user changes
  useEffect(() => {
    void fetchUserCourses(); // Call memoized function, void to handle promise
  }, [fetchUserCourses]); // Dependency is the stable fetchUserCourses function

  // Calculate total learning time (Memoized)
  const totalLearningTimeHours = useMemo(() => {
    const totalSeconds = [...enrolledCourses, ...completedCourses].reduce((total, course) => {
      let seconds = 0;
      try {
        if (course.durationDetails) {
          seconds = course.durationDetails.totalSeconds || 0;
        } else if (typeof course.duration === 'string' && course.duration) {
          const parsed = parseDurationString(course.duration);
          seconds = parsed?.totalSeconds || 0;
        } else if (typeof course.duration === 'number') {
          seconds = course.duration; // Assuming number is total seconds
        }
      } catch {
        // Ignore errors during calculation and default to 0 seconds
        seconds = 0;
      }
      return total + seconds;
    }, 0);
    // Round to one decimal place for hours
    return Math.round((totalSeconds / 3600) * 10) / 10;
  }, [enrolledCourses, completedCourses]);

  // Calculate progress percentages (Memoized)
  const progressPercentages = useMemo(() => {
    const totalCourses = enrolledCourses.length + completedCourses.length;
    if (totalCourses === 0) return { enrolled: 0, completed: 0 };
    return {
      enrolled: (enrolledCourses.length / totalCourses) * 100,
      completed: (completedCourses.length / totalCourses) * 100,
    };
  }, [enrolledCourses, completedCourses]);

  useEffect(() => {
    if (!user) {
      setLessonStats({ inProgress: 0, completed: 0, totalTimeSpent: 0 });
      return;
    }

    const fetchLessonStats = async () => {
      try {
        // Get all courses in progress for the user
        const coursesInProgress = await getCoursesInProgress(user.uid);

        let inProgressLessons = 0;
        let completedLessons = 0;
        let totalTimeSpent = 0;

        // Process each course to get lesson statistics
        for (const course of coursesInProgress) {
          // Count completed lessons
          completedLessons += course.completedLessons?.length || 0;

          // Calculate in-progress and time spent
          if (course.lessonProgress) {
            Object.values(course.lessonProgress).forEach(lesson => {
              if (lesson.progress > 0 && lesson.progress < 100) {
                inProgressLessons++;
              }
              totalTimeSpent += lesson.timeSpent || 0;
            });
          }
        }

        setLessonStats({
          inProgress: inProgressLessons,
          completed: completedLessons,
          totalTimeSpent,
        });
      } catch (error) {
        console.error('Error calculating lesson stats:', error);
      }
    };

    void fetchLessonStats();
  }, [user, enrolledCourses, completedCourses]);

  const formatLearningTime = (seconds: number): string => {
    if (!seconds) return '0m';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <MainLayout title="My Learning | Closer College Training Platform">
      {/* Header */}
      <div className="bg-gradient-primary py-20 text-white">
        <div className="container mx-auto px-6 sm:px-12 lg:px-24 xl:px-32">
          <h1 className="text-3xl font-bold mt-6 mb-4">My Learning</h1>
          <p className="text-lg opacity-90 max-w-3xl">Track your progress, continue your courses, and view your completed training.</p>
        </div>
      </div>

      {/* Learning Dashboard */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-6 sm:px-12 lg:px-24 xl:px-32">
          {/* Authentication and Data Loading State */}
          {(authLoading || loading) && !initialDataFetched ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : !user ? (
            /* No User State */
            <div className="bg-white rounded-xl shadow-card p-8 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-neutral-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2-2v6a2 2 0 002-2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              <h3 className="text-xl font-semibold mb-2">Sign In Required</h3>
              <p className="text-neutral-600 mb-4">Please sign in to view your enrolled courses.</p>
              <Button href="/auth/login?redirect=/my-learning" variant="primary">Sign In</Button>
            </div>
          ) : error ? (
            /* Error State */
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
              <div className="flex">
                <div className="py-1"><svg className="h-6 w-6 text-red-500 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                <div>
                  <p className="font-bold">Error</p>
                  <p className="text-sm">{error}</p>
                  <button onClick={() => void fetchUserCourses()} className="mt-2 text-sm font-medium text-red-700 hover:text-red-900">Try Again</button> {/* Calls memoized function, void to handle promise */}
                </div>
              </div>
            </div>
          ) : (
            /* Main Content Area */
            <>
              {/* Quota Exceeded Warning */}
              {quotaExceeded && !error && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md mb-6">
                  <div className="flex">
                    <div className="py-1"><svg className="h-6 w-6 text-yellow-500 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg></div>
                    <div><p className="font-bold">High Traffic Alert</p><p className="text-sm">We're experiencing high traffic. Some data may be limited or from cache.</p></div>
                  </div>
                </div>
              )}

              {/* Progress Summary - Split into two cards */}
              {/* Your Learning Progress Section */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
                <h2 className="text-lg font-medium text-gray-900 mb-6">Your Learning Progress</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border border-gray-100 rounded p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">In Progress</p>
                        <p className="text-xl font-medium text-gray-900 mt-1">{enrolledCourses.length} Courses</p>
                      </div>
                      <div className="p-2 bg-blue-50 rounded-full">
                        <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${progressPercentages.enrolled}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="border border-gray-100 rounded p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Completed</p>
                        <p className="text-xl font-medium text-gray-900 mt-1">{completedCourses.length} Courses</p>
                      </div>
                      <div className="p-2 bg-green-50 rounded-full">
                        <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${progressPercentages.completed}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="border border-gray-100 rounded p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Learning Time</p>
                        <p className="text-xl font-medium text-gray-900 mt-1">{totalLearningTimeHours} Hours</p>
                      </div>
                      <div className="p-2 bg-purple-50 rounded-full">
                        <svg className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lesson Progress Section */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
                <h2 className="text-lg font-medium text-gray-900 mb-6">Lesson Progress</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border border-gray-100 rounded p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">In Progress</p>
                        <p className="text-xl font-medium text-gray-900 mt-1">{lessonStats.inProgress} Lessons</p>
                      </div>
                      <div className="p-2 bg-yellow-50 rounded-full">
                        <svg className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5s3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18s-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className="bg-yellow-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${lessonStats.inProgress > 0 ? 50 : 0}%` }} // Placeholder progress
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="border border-gray-100 rounded p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Completed</p>
                        <p className="text-xl font-medium text-gray-900 mt-1">{lessonStats.completed} Lessons</p>
                      </div>
                      <div className="p-2 bg-green-50 rounded-full">
                        <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${lessonStats.completed > 0 ? 100 : 0}%` }} // Placeholder progress
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="border border-gray-100 rounded p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Total Time</p>
                        <p className="text-xl font-medium text-gray-900 mt-1">{formatLearningTime(lessonStats.totalTimeSpent)}</p>
                      </div>
                      <div className="p-2 bg-indigo-50 rounded-full">
                        <svg className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Continue Learning Section */}
              <div className="p-6 mb-8">
                <h2 className="text-lg font-medium text-gray-900 mb-6">Continue Learning</h2>
                {enrolledCourses.length > 0 ? (
                  <CourseGrid courses={enrolledCourses} />
                ) : (
                  <div className="text-center py-8">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-neutral-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5s3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18s-3.332.477-4.5 1.253" /></svg>
                    <h3 className="text-xl font-semibold mb-2">No Courses In Progress</h3>
                    <p className="text-neutral-600 mb-4">Enroll in a course to start your learning journey.</p>
                    <Button href="/courses" variant="primary">Browse Courses</Button>
                  </div>
                )}
              </div>

              {/* Completed Courses Section */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
                <h2 className="text-lg font-medium text-gray-900 mb-6">Completed Courses</h2>
                {completedCourses.length > 0 ? (
                  <CourseGrid courses={completedCourses} />
                ) : (
                  <div className="text-center py-8">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-neutral-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <h3 className="text-xl font-semibold mb-2">No Completed Courses Yet</h3>
                    <p className="text-neutral-600 mb-4">Keep learning to unlock your completed courses here!</p>
                    <Button href="/courses" variant="primary">Browse Courses</Button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </section>
    </MainLayout>
  );
}