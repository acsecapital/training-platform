import React, {useState, useEffect } from 'react';
import {
  setDoc,
  updateDoc,
  increment,
  getDoc,
  getDocs,
  collection,
  doc,
  query,
  orderBy
} from 'firebase/firestore';
import {firestore } from '@/services/firebase';
import {useAuth } from '@/context/AuthContext';
import {CourseReview } from '@/types/course.types';
import ReviewsList from '@/components/course-detail/ReviewsList';
import CourseReviewForm from '@/components/course-detail/CourseReviewForm';
import * as reviewService from '@/services/reviewService';
import {useRouter } from 'next/router';
import Image from 'next/image';
import MainLayout from '@/components/layout/MainLayout';
import Button from '@/components/ui/Button';
import VideoPlayer from '@/components/video-player/VideoPlayer';
import {formatDate } from '@/utils/formatters';
import {canPerformFirestoreOperation } from '@/utils/scrollLock';

// Helper function to check if a URL is external
const isExternalUrl = (url?: string | null): boolean => {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://');
};

// Helper function to get a valid avatar URL
const getValidAvatarUrl = (avatarUrl: string | undefined | null): string => {
  if (!avatarUrl || avatarUrl.trim() === '') {
    console.log('Using default avatar: Empty or undefined avatar URL');
    return '/assets/default-avatar.png';
}

  // Handle DiceBear and other avatar service URLs
  if (avatarUrl.includes('dicebear.com') ||
      avatarUrl.includes('avatars.githubusercontent.com') ||
      avatarUrl.includes('gravatar.com')) {
    console.log('Using avatar service URL:', avatarUrl);

    // Special handling for DiceBear URLs
    if (avatarUrl.includes('dicebear.com')) {
      // Ensure the URL is properly formatted
      try {
        const diceBearUrl = new URL(avatarUrl);
        // Add size parameter if not present
        if (!diceBearUrl.searchParams.has('size')) {
          diceBearUrl.searchParams.append('size', '200');
      }
        console.log('Formatted DiceBear URL:', diceBearUrl.toString());
        return diceBearUrl.toString();
    } catch (error) {
        console.warn('Error formatting DiceBear URL:', error);
    }
  }

    return avatarUrl;
}

  // Check if URL is valid
  try {
    new URL(avatarUrl);
    console.log('Using valid avatar URL:', avatarUrl);
    return avatarUrl;
} catch (error) {
    console.warn('Invalid avatar URL:', avatarUrl);
    return '/assets/default-avatar.png';
}
};

// Define a more specific type for the course data
interface CourseData {
  id: string;
  title: string;
  description: string;
  longDescription?: string;
  thumbnail?: string;
  duration?: string;
  level?: string;
  instructor?: string;
  instructorTitle?: string;
  instructorBio?: string;
  instructorAvatar?: string;
  price?: number;
  rating?: number;
  reviewCount?: number;
  enrolledCount?: number;
  introVideoId?: string;
  whatYouWillLearn?: string[];
  requirements?: string[];
  lastUpdated?: string;
  status?: string;
  [key: string]: unknown;
}

// Define a type for module data
interface ModuleData {
  id: string;
  title: string;
  description?: string;
  order: number;
  duration?: string;
  lessons?: LessonData[];
  [key: string]: unknown;
}

// Define a type for lesson data
interface LessonData {
  id: string;
  title: string;
  description?: string;
  type: string;
  duration?: string;
  [key: string]: unknown;
}

export default function CourseDetailPage() {
  const router = useRouter();
  const {id: rawId } = router.query;
  const id = typeof rawId === 'string' ? rawId : '';
  const {user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'instructor' | 'reviews'>('overview');
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [reviews, setReviews] = useState<CourseReview[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [userReview, setUserReview] = useState<CourseReview | null>(null);
  const [course, setCourse] = useState<CourseData | null>(null);
  const [modules, setModules] = useState<ModuleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);

  // Fetch course data with improved caching and loading strategy
  useEffect(() => {
    // Create a flag to track if the component is still mounted
    let isMounted = true;

    const fetchCourseData = async () => {
      if (!id) return;

      try {
        // Only set loading to true if we don't have cached data
        const cachedCourseData = localStorage.getItem(`course_${id}`);
        const cacheTimestamp = localStorage.getItem(`course_timestamp_${id}`);

        if (!cachedCourseData || !cacheTimestamp) {
          if (isMounted) setLoading(true);
      }

        if (isMounted) setError(null);

        let courseData;
        let modulesData;
        let shouldFetchFromFirestore = true;

        // Use cache if it's less than 15 minutes old
        if (cachedCourseData && cacheTimestamp) {
          try {
            const parsedData = JSON.parse(cachedCourseData);
            const timestamp = parseInt(cacheTimestamp);
            const now = Date.now();
            const fifteenMinutes = 15 * 60 * 1000;

            if (now - timestamp < fifteenMinutes) {
              courseData = parsedData.course;
              modulesData = parsedData.modules;

              // Only update state if component is still mounted
              if (isMounted) {
                setCourse(courseData);
                setModules(modulesData);
                shouldFetchFromFirestore = false;
            }

              // Check enrollment status separately if not scrolling
              if (user && canPerformFirestoreOperation() && isMounted) {
                const enrollmentRef = doc(firestore, `users/${user.uid}/enrollments/${id}`);
                const enrollmentSnapshot = await getDoc(enrollmentRef);
                if (isMounted) setIsEnrolled(enrollmentSnapshot.exists());
            }

              // Set loading to false with a slight delay to prevent flickering
              if (isMounted) {
                setTimeout(() => {
                  if (isMounted) setLoading(false);
              }, 100);
            }
          }
        } catch (err) {
            console.error('Error parsing cached course data:', err);
        }
      }

        // Fetch from Firestore if needed and not scrolling
        if (shouldFetchFromFirestore && canPerformFirestoreOperation()) {
          // Fetch course
          const courseRef = doc(firestore, 'courses', id);
          const courseSnapshot = await getDoc(courseRef);

          if (!courseSnapshot.exists()) {
            if (isMounted) {
              setError('Course not found');
              setLoading(false);
          }
            return;
        }

          courseData = {
            id: courseSnapshot.id,
            ...courseSnapshot.data() as Record<string, unknown>
        } as CourseData;

          // Log the course data from Firestore
          console.log('Frontend - Course data from Firestore:', {
            instructor: courseData.instructor,
            instructorTitle: courseData.instructorTitle,
            instructorBio: courseData.instructorBio,
            instructorAvatar: courseData.instructorAvatar,
            instructorAvatarType: typeof courseData.instructorAvatar,
            instructorAvatarEmpty: courseData.instructorAvatar === '',
            instructorAvatarTrimEmpty: courseData.instructorAvatar && courseData.instructorAvatar.trim() === '',
            instructorType: typeof courseData.instructor,
            instructorEmpty: courseData.instructor === '',
            instructorTrimEmpty: courseData.instructor && courseData.instructor.trim() === ''
        });

          // Test the avatar URL
          if (courseData.instructorAvatar) {
            console.log('Testing avatar URL:', getValidAvatarUrl(courseData.instructorAvatar));
        }

          if (isMounted) setCourse(courseData);

          // Fetch modules
          const modulesRef = collection(firestore, `courses/${id}/modules`);
          const modulesQuery = query(modulesRef, orderBy('order', 'asc'));
          const modulesSnapshot = await getDocs(modulesQuery);

          modulesData = await Promise.all(
            modulesSnapshot.docs.map(async (moduleDoc) => {
              // Fetch lessons for each module
              const lessonsRef = collection(firestore, `courses/${id}/modules/${moduleDoc.id}/lessons`);
              const lessonsQuery = query(lessonsRef, orderBy('order', 'asc'));
              const lessonsSnapshot = await getDocs(lessonsQuery);

              const lessons = lessonsSnapshot.docs.map((lessonDoc) => ({
                id: lessonDoc.id,
                ...lessonDoc.data() as Record<string, unknown>
              } as LessonData));

              return {
                id: moduleDoc.id,
                ...moduleDoc.data() as Record<string, unknown>,
                lessons
              } as ModuleData;
            })
          );

          if (isMounted) setModules(modulesData);

          // Cache the course data
          localStorage.setItem(`course_${id}`, JSON.stringify({
            course: courseData,
            modules: modulesData
        }));
          localStorage.setItem(`course_timestamp_${id}`, Date.now().toString());

          // Check if user is enrolled
          if (user && isMounted) {
            const enrollmentRef = doc(firestore, `users/${user.uid}/enrollments/${id}`);
            const enrollmentSnapshot = await getDoc(enrollmentRef);
            if (isMounted) setIsEnrolled(enrollmentSnapshot.exists());
        }

          // Set loading to false with a slight delay to ensure smooth transition
          if (isMounted) {
            setTimeout(() => {
              if (isMounted) setLoading(false);
          }, 100);
        }
      } else if (shouldFetchFromFirestore) {
          // If we're scrolling, use any available cached data
          const cachedCourseData = localStorage.getItem(`course_${id}`);
          if (cachedCourseData) {
            try {
              const parsedData = JSON.parse(cachedCourseData);
              if (isMounted) {
                setCourse(parsedData.course);
                setModules(parsedData.modules);

                // Set loading to false with a slight delay
                setTimeout(() => {
                  if (isMounted) setLoading(false);
              }, 100);
            }
          } catch (cacheErr) {
              console.error('Error using cached data:', cacheErr);
              if (isMounted) {
                setError('Failed to load course data');
                setLoading(false);
            }
          }
        } else {
            if (isMounted) {
              setError('Cannot load course data while scrolling');
              setLoading(false);
          }
        }
      }
    } catch (err) {
        console.error('Error fetching course data:', err);

        // Try to use cached data even if it's older when there's an error
        try {
          const cachedCourseData = localStorage.getItem(`course_${id}`);
          if (cachedCourseData && isMounted) {
            const parsedData = JSON.parse(cachedCourseData);
            setCourse(parsedData.course);
            setModules(parsedData.modules);
            setError('Using cached data due to connection issues');

            // Set loading to false with a slight delay
            setTimeout(() => {
              if (isMounted) setLoading(false);
          }, 100);
        } else if (isMounted) {
            setError('Failed to load course data');
            setLoading(false);
        }
      } catch (cacheErr) {
          console.error('Error using cached data:', cacheErr);
          if (isMounted) {
            setError('Failed to load course data');
            setLoading(false);
        }
      }
    }
  };

    void fetchCourseData();

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
  };
}, [id, user]);

  // Fetch reviews when the component mounts or when the tab changes to reviews
  useEffect(() => {
    const fetchReviews = async () => {
      if (!id) return;

      if (activeTab === 'reviews') {
        try {
          setIsLoadingReviews(true);

          // Only fetch if not scrolling or use cached data
          if (canPerformFirestoreOperation()) {
            // Use cached data if available (15 minute cache)
            const courseReviews = await reviewService.getCourseReviews(id, undefined, true);
            setReviews(courseReviews);

            // Check if the user has already reviewed this course
            if (user) {
              const userCourseReview = await reviewService.getUserCourseReview(user.uid, id, true);
              setUserReview(userCourseReview);
          }
        } else {
            // If scrolling, try to use any cached data from the review service
            try {
              const cachedReviews = localStorage.getItem(`reviews_${id}_all`);
              if (cachedReviews) {
                setReviews(JSON.parse(cachedReviews));
            }

              if (user) {
                const cachedUserReview = localStorage.getItem(`user_review_${user.uid}_${id}`);
                if (cachedUserReview) {
                  setUserReview(JSON.parse(cachedUserReview));
              }
            }
          } catch (cacheErr) {
              console.error('Error using cached review data:', cacheErr);
          }
        }
      } catch (error) {
          console.error('Error fetching reviews:', error);
      } finally {
          setIsLoadingReviews(false);
      }
    }
  };

    // Only fetch reviews when the tab changes to reviews
    // This prevents unnecessary Firestore reads when scrolling
    void fetchReviews();
}, [id, activeTab, user]);

  // Handle submitting a review
  const handleSubmitReview = async (reviewData: Omit<CourseReview, 'id' | 'date'>) => {
    if (!id || !user) return;

    try {
      await reviewService.addCourseReview({
        ...reviewData,
        courseId: id,
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        userAvatar: user.photoURL || undefined
    });

      // Refresh reviews
      const courseReviews = await reviewService.getCourseReviews(id);
      setReviews(courseReviews);

      // Get the user's review
      const userCourseReview = await reviewService.getUserCourseReview(user.uid, id);
      setUserReview(userCourseReview);

      // Hide the review form
      setShowReviewForm(false);
  } catch (error) {
      console.error('Error submitting review:', error);
      throw error;
  }
};

  // Handle marking a review as helpful
  const handleMarkHelpful = async (reviewId: string) => {
    try {
      await reviewService.markReviewHelpful(reviewId);

      // Update the review in the local state
      setReviews(prevReviews =>
        prevReviews.map(review =>
          review.id === reviewId
            ? {...review, helpful: (review.helpful || 0) + 1 }
            : review
        )
      );
  } catch (error) {
      console.error('Error marking review as helpful:', error);
      throw error;
  }
};

  // Handle reporting a review
  const handleReportReview = async (reviewId: string) => {
    try {
      await reviewService.reportReview(reviewId);

      // Update the review in the local state
      setReviews(prevReviews =>
        prevReviews.map(review =>
          review.id === reviewId
            ? {...review, reported: true }
            : review
        )
      );
  } catch (error) {
      console.error('Error reporting review:', error);
      throw error;
  }
};

  // Toggle module expansion
  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
};

  // Handle enrollment
  const handleEnroll = async () => {
    if (!id || !user) {
      // Redirect to login if not logged in
      void router.push(`/auth/login?redirect=/courses/${id}`);
      return;
  }

    try {
      // Create enrollment record
      const enrollmentRef = doc(firestore, `users/${user.uid}/enrollments/${id}`);
      await setDoc(enrollmentRef, {
        courseId: id,
        enrolledAt: new Date(),
        progress: 0,
        status: 'active'
    });

      // Update course enrollment count
      const courseRef = doc(firestore, `courses/${id}`);
      await updateDoc(courseRef, {
        enrolledCount: increment(1)
    });

      setIsEnrolled(true);

      // Redirect to learning interface
      void router.push(`/courses/${id}/learn`);
  } catch (error) {
      console.error('Error enrolling in course:', error);
      alert('Failed to enroll in course. Please try again.');
  }
};

  // Handle loading state with a more persistent approach
  if (loading) {
    return (
      <MainLayout>
        <div className="fixed inset-0 bg-white z-50 flex justify-center items-center">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
            <p className="text-neutral-600">Loading course content...</p>
          </div>
        </div>
      </MainLayout>
    );
}

  // Handle error state
  if (error || !course) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold mb-4">Course Not Found</h1>
          <p className="text-lg text-neutral-600 mb-8">
            {error || "The course you're looking for doesn't exist or has been removed."}
          </p>
          <Button href="/courses" variant="primary">
            Browse Courses
          </Button>
        </div>
      </MainLayout>
    );
}

  return (
    <MainLayout title={`${course.title} | Training Platform`}>
      {/* Course Header */}
      <div className="bg-gradient-primary py-20 text-white">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            {/* Course Info */}
            <div className="w-full md:w-1/2">
              <div className="flex items-center mb-4">
                <span className={`px-2 py-1 text-xs font-medium rounded ${
                  course.level === 'Beginner' ? 'bg-green-100 text-green-800' :
                  course.level === 'Intermediate' ? 'bg-blue-100 text-blue-800' :
                  'bg-purple-100 text-purple-800'
              }`}>
                  {course.level}
                </span>
                <span className="ml-3 text-sm opacity-80">{course.duration} • {modules.length} modules</span>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold mb-4">{course.title}</h1>

              <p className="text-lg mb-6 opacity-90">{course.description}</p>

              <div className="flex items-center mb-6">
                <div className="flex items-center">
                  <span className="text-yellow-300 mr-1">★</span>
                  <span>{course.rating || 0}</span>
                </div>
                <span className="mx-2 opacity-60">|</span>
                <span>{course.reviewCount || 0} reviews</span>
                <span className="mx-2 opacity-60">|</span>
                <span>{course.enrolledCount || 0} students enrolled</span>
              </div>

              {/* Show instructor section if any instructor information is available */}
              {(course.instructorTitle || course.instructorBio) && (
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
                    {isExternalUrl(course.instructorAvatar) ? (
                      // Use regular img tag for external URLs
                      <img
                        src={getValidAvatarUrl(course.instructorAvatar)}
                        alt={course.instructorTitle || 'Instructor'}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      // Use Next.js Image for internal URLs
                      <Image
                        src={getValidAvatarUrl(course.instructorAvatar)}
                        alt={course.instructorTitle || 'Instructor'}
                        width={40}
                        height={40}
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">
                      {course.instructor && course.instructor.trim() !== ''
                        ? course.instructor
                        : course.instructorTitle || 'Instructor'}
                    </p>
                    <p className="text-sm opacity-80">{course.instructorTitle || 'Instructor'}</p>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4">
                {isEnrolled ? (
                  <Button
                    href={`/courses/${id}/learn`}
                    variant="secondary"
                    size="lg"
                    className="bg-white text-primary hover:bg-neutral-100"
                  >
                    Continue Learning
                  </Button>
                ) : (
                  <Button
                    onClick={() => void handleEnroll()}
                    variant="success"
                    size="lg"
                  >
                    Enroll Now {course.price ? `- $${course.price}` : ''}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white text-white hover:bg-white hover:bg-opacity-10"
                >
                  Try Free Preview
                </Button>
              </div>
            </div>

            {/* Course Video Preview */}
            <div className="w-full md:w-1/2">
              <div className="rounded-xl overflow-hidden shadow-lg">
                {course.introVideoId ? (
                  <VideoPlayer
                    videoId={course.introVideoId}
                    title={`${course.title} - Preview`}
                  />
                ) : course.thumbnail ? (
                  <div className="aspect-video relative">
                    <Image
                      src={course.thumbnail}
                      alt={course.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
                      <div className="w-16 h-16 rounded-full bg-white bg-opacity-80 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video bg-neutral-800 flex items-center justify-center">
                    <p className="text-white">No preview available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <section className="py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main Content */}
            <div className="w-full lg:w-2/3">
              {/* Tabs */}
              <div className="border-b border-neutral-200 mb-8">
                <div className="flex overflow-x-auto">
                  <button
                    className={`px-6 py-3 font-medium text-sm whitespace-nowrap ${
                      activeTab === 'overview'
                        ? 'border-b-2 border-primary text-primary'
                        : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                    onClick={() => setActiveTab('overview')}
                  >
                    Overview
                  </button>
                  <button
                    className={`px-6 py-3 font-medium text-sm whitespace-nowrap ${
                      activeTab === 'curriculum'
                        ? 'border-b-2 border-primary text-primary'
                        : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                    onClick={() => setActiveTab('curriculum')}
                  >
                    Curriculum
                  </button>
                  <button
                    className={`px-6 py-3 font-medium text-sm whitespace-nowrap ${
                      activeTab === 'instructor'
                        ? 'border-b-2 border-primary text-primary'
                        : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                    onClick={() => setActiveTab('instructor')}
                  >
                    Instructor
                  </button>
                  <button
                    className={`px-6 py-3 font-medium text-sm whitespace-nowrap ${
                      activeTab === 'reviews'
                        ? 'border-b-2 border-primary text-primary'
                        : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                    onClick={() => setActiveTab('reviews')}
                  >
                    Reviews
                  </button>
                </div>
              </div>

              {/* Tab Content with subtle animation */}
              <div className="mb-8">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div>
                    <h2 className="text-2xl font-bold mb-4">About This Course</h2>
                    <div
                      className="prose max-w-none mb-8"
                      dangerouslySetInnerHTML={{__html: course.longDescription || course.description }}
                    />

                    {course.whatYouWillLearn && course.whatYouWillLearn.length > 0 && (
                      <div className="mb-8">
                        <h3 className="text-xl font-semibold mb-4">What You'll Learn</h3>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {course.whatYouWillLearn.map((item: string, index: number) => (
                            <li key={index} className="flex items-start">
                              <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {course.requirements && course.requirements.length > 0 && (
                      <div className="mb-8">
                        <h3 className="text-xl font-semibold mb-4">Requirements</h3>
                        <ul className="list-disc pl-5 space-y-2">
                          {course.requirements.map((item: string, index: number) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div>
                      <h3 className="text-xl font-semibold mb-4">Course Details</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-neutral-500">Total Duration</p>
                          <p className="font-medium">{course.duration || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-neutral-500">Modules</p>
                          <p className="font-medium">{modules.length}</p>
                        </div>
                        <div>
                          <p className="text-sm text-neutral-500">Level</p>
                          <p className="font-medium">{course.level || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-neutral-500">Last Updated</p>
                          <p className="font-medium">{course.lastUpdated ? formatDate(course.lastUpdated) : 'Not specified'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Curriculum Tab */}
                {activeTab === 'curriculum' && (
                  <div>
                    <h2 className="text-2xl font-bold mb-4">Course Curriculum</h2>
                    <p className="text-sm text-neutral-600 mb-6">
                      {modules.length} modules • {modules.reduce((total, module) => total + (module.lessons?.length || 0), 0)} lessons • {course.duration || 'Not specified'} total length
                    </p>

                    <div className="space-y-4">
                      {modules.map((module, index) => (
                        <div key={module.id} className="border border-neutral-200 rounded-lg overflow-hidden">
                          {/* Module Header */}
                          <div
                            className="bg-neutral-50 p-4 flex justify-between items-center cursor-pointer"
                            onClick={() => toggleModule(module.id)}
                          >
                            <div>
                              <h3 className="font-semibold text-base">{index + 1}. {module.title}</h3>
                              <p className="text-sm text-neutral-600">{module.description || 'No description provided'}</p>
                            </div>
                            <div className="flex items-center">
                              <span className="text-sm text-neutral-500 mr-3">{module.duration || 'Not specified'}</span>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className={`h-5 w-5 text-neutral-500 transition-transform ${
                                  expandedModules.includes(module.id) ? 'transform rotate-180' : ''
                              }`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>

                          {/* Module Lessons */}
                          {expandedModules.includes(module.id) && (
                            <div className="divide-y divide-neutral-100">
                              {module.lessons && module.lessons.length > 0 ? (
                                module.lessons.map((lesson: any, lessonIndex: number) => (
                                  <div key={lesson.id} className="p-4 flex justify-between items-center">
                                    <div className="flex items-center">
                                      {lesson.type === 'video' ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                      ) : lesson.type === 'quiz' ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                      ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                      )}
                                      <span>{lessonIndex + 1}. {lesson.title}</span>
                                    </div>
                                    <span className="text-sm text-neutral-500">{lesson.duration || 'Not specified'}</span>
                                  </div>
                                ))
                              ) : (
                                <div className="p-4 text-center text-neutral-500">No lessons available in this module</div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Instructor Tab */}
                {activeTab === 'instructor' && (
                  <div>
                    <h2 className="text-2xl font-bold mb-4">Meet Your Instructor</h2>

                    {/* Log instructor data for debugging */}
                    <div className="hidden">
                      {(() => {
                        console.log('Instructor data in tab:', {
                          instructor: course.instructor,
                          instructorTitle: course.instructorTitle,
                          instructorBio: course.instructorBio,
                          instructorAvatar: course.instructorAvatar,
                          instructorType: typeof course.instructor
                      });
                        return null;
                    })()}
                    </div>

                    {/* Check if any instructor information is available */}
                    {(course.instructorTitle || course.instructorBio) ? (
                      <div className="flex flex-col md:flex-row gap-6 items-start">
                        <div className="w-24 h-24 rounded-full overflow-hidden flex-shrink-0">
                          {isExternalUrl(course.instructorAvatar) ? (
                            // Use regular img tag for external URLs
                            <img
                              src={getValidAvatarUrl(course.instructorAvatar)}
                              alt={course.instructorTitle || 'Instructor'}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            // Use Next.js Image for internal URLs
                            <Image
                              src={getValidAvatarUrl(course.instructorAvatar)}
                              alt={course.instructorTitle || 'Instructor'}
                              width={96}
                              height={96}
                              className="object-cover w-full h-full"
                            />
                          )}
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold mb-1">
                            {course.instructor && course.instructor.trim() !== ''
                              ? course.instructor
                              : course.instructorTitle || 'Instructor'}
                          </h3>
                          <p className="text-neutral-600 mb-4">{course.instructorTitle || 'Instructor'}</p>

                          {course.instructorBio && course.instructorBio.trim() !== '' && (
                            <div className="prose max-w-none">
                              <p>{course.instructorBio}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-neutral-600">No instructor information available for this course.</p>
                    )}
                  </div>
                )}

                {/* Reviews Tab */}
                {activeTab === 'reviews' && (
                  <div>
                    {showReviewForm ? (
                      <CourseReviewForm
                        courseId={id}
                        courseName={course.title}
                        onSubmit={handleSubmitReview}
                        onCancel={() => setShowReviewForm(false)}
                        className="mb-8"
                      />
                    ) : (
                      <>
                        {isLoadingReviews ? (
                          <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                          </div>
                        ) : (
                          <ReviewsList
                            reviews={reviews}
                            averageRating={course.rating || 0}
                            totalReviews={reviews.length}
                            onMarkHelpful={handleMarkHelpful}
                            onReport={handleReportReview}
                            onWriteReview={() => {
                              if (userReview) {
                                // User has already reviewed this course
                                alert('You have already reviewed this course');
                            } else {
                                setShowReviewForm(true);
                            }
                          }}
                          />
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="w-full lg:w-1/3">
              <div className="bg-white rounded-xl shadow-soft p-6 sticky top-24">
                <h3 className="text-xl font-semibold mb-4">Course Information</h3>

                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>{course.duration || 'Not specified'} of on-demand video</span>
                  </li>
                  <li className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    <span>{modules.length} modules</span>
                  </li>
                  <li className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span>{modules.reduce((total, module) => total + (module.lessons?.length || 0), 0)} lessons</span>
                  </li>
                  <li className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Last updated {course.lastUpdated ? formatDate(course.lastUpdated) : 'Not specified'}</span>
                  </li>
                  <li className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>Certificate of completion</span>
                  </li>
                </ul>

                <div className="mb-6">
                  {isEnrolled ? (
                    <Button
                      href={`/courses/${id}/learn`}
                      variant="primary"
                      size="lg"
                      className="w-full"
                    >
                      Continue Learning
                    </Button>
                  ) : (
                    <Button
                      onClick={() => void handleEnroll()}
                      variant="success"
                      size="lg"
                      className="w-full"
                    >
                      Enroll Now
                    </Button>
                  )}
                </div>

                <p className="text-sm text-neutral-500 text-center">
                  30-Day Money-Back Guarantee
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Courses Section */}
      <section className="py-12 bg-neutral-50">
        <div className="container mx-auto px-6">
          <h2 className="text-2xl font-bold mb-8">Related Courses</h2>

          {/* This would be replaced with actual related courses component */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-soft overflow-hidden">
              <div className="aspect-video bg-neutral-200"></div>
              <div className="p-4">
                <h3 className="font-semibold mb-2">Related Course Title</h3>
                <p className="text-sm text-neutral-600 mb-2">Brief description of the related course</p>
                <div className="flex items-center text-sm">
                  <span className="text-yellow-500 mr-1">★</span>
                  <span>4.5</span>
                  <span className="mx-2">|</span>
                  <span>2 hours</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-soft overflow-hidden">
              <div className="aspect-video bg-neutral-200"></div>
              <div className="p-4">
                <h3 className="font-semibold mb-2">Related Course Title</h3>
                <p className="text-sm text-neutral-600 mb-2">Brief description of the related course</p>
                <div className="flex items-center text-sm">
                  <span className="text-yellow-500 mr-1">★</span>
                  <span>4.5</span>
                  <span className="mx-2">|</span>
                  <span>2 hours</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-soft overflow-hidden">
              <div className="aspect-video bg-neutral-200"></div>
              <div className="p-4">
                <h3 className="font-semibold mb-2">Related Course Title</h3>
                <p className="text-sm text-neutral-600 mb-2">Brief description of the related course</p>
                <div className="flex items-center text-sm">
                  <span className="text-yellow-500 mr-1">★</span>
                  <span>4.5</span>
                  <span className="mx-2">|</span>
                  <span>2 hours</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}

















