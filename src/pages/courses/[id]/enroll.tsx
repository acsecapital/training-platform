import React, {useState, useEffect } from 'react';
import {useRouter } from 'next/router';
import {doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import {firestore } from '@/services/firebase';
import {useAuth } from '@/context/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import Button from '@/components/ui/Button';

const CourseEnrollPage: React.FC = () => {
  const router = useRouter();
  const {id } = router.query;
  const {user, isAuthenticated } = useAuth();

  const [courseTitle, setCourseTitle] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [coursePrice, setCoursePrice] = useState(0);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isAlreadyEnrolled, setIsAlreadyEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch course data and check enrollment status
  useEffect(() => {
    const fetchData = async () => {
      if (!id || typeof id !== 'string') return;

      try {
        setLoading(true);
        setError(null);

        // Fetch course data
        const courseDoc = await getDoc(doc(firestore, 'courses', id));

        if (!courseDoc.exists()) {
          setError('Course not found');
          return;
      }

        const courseData = courseDoc.data();
        setCourseTitle(courseData.title || 'Untitled Course');
        setCourseDescription(courseData.description || '');
        setCoursePrice(courseData.price || 0);

        // Check if user is already enrolled
        if (isAuthenticated && user) {
          const enrollmentDoc = await getDoc(doc(firestore, `users/${user.uid}/enrollments`, id));
          setIsAlreadyEnrolled(enrollmentDoc.exists());
      }
    } catch (err) {
        console.error('Error fetching course data:', err);
        setError('Failed to load course data. Please try again.');
    } finally {
        setLoading(false);
    }
  };

    fetchData();
}, [id, isAuthenticated, user]);

  // Handle enrollment
  const handleEnroll = async () => {
    if (!id || typeof id !== 'string') return;

    // Check if user is authenticated
    if (!isAuthenticated || !user) {
      void router.push(`/auth/login?redirect=/courses/${id}/enroll`);
      return;
  }

    // Check if already enrolled
    if (isAlreadyEnrolled) {
      void router.push(`/courses/${id}/learn`);
      return;
  }

    try {
      setIsEnrolling(true);
      setError(null);

      // Create enrollment record
      await addDoc(collection(firestore, `users/${user.uid}/enrollments`), {
        courseId: id,
        courseName: courseTitle,
        enrolledAt: serverTimestamp(),
        progress: 0,
        completedLessons: [],
        lastAccessedAt: serverTimestamp(),
        status: 'active',
    });

      // Redirect to learning page
      void router.push(`/courses/${id}/learn`);
  } catch (err) {
      console.error('Error enrolling in course:', err);
      setError('Failed to enroll in course. Please try again.');
      setIsEnrolling(false);
  }
};

  if (loading) {
    return (
      <MainLayout title="Enrolling in Course...">
        <div className="container mx-auto px-4 py-16 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
}

  if (error) {
    return (
      <MainLayout title="Enrollment Error">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm border border-neutral-200 p-8">
            <div className="text-center mb-8">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h1 className="text-2xl font-bold mb-2">Enrollment Error</h1>
              <p className="text-neutral-600 mb-6">{error}</p>

              <div className="flex justify-center">
                <Button
                  href="/courses"
                  variant="primary"
                >
                  Browse Courses
                </Button>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
}

  if (isAlreadyEnrolled) {
    return (
      <MainLayout title={`Already Enrolled: ${courseTitle}`}>
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm border border-neutral-200 p-8">
            <div className="text-center mb-8">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-green-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h1 className="text-2xl font-bold mb-2">You're Already Enrolled</h1>
              <p className="text-neutral-600 mb-6">
                You are already enrolled in <span className="font-semibold">{courseTitle}</span>. Continue your learning journey!
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  href={`/courses/${id}`}
                  variant="outline"
                >
                  Course Details
                </Button>
                <Button
                  href={`/courses/${id}/learn`}
                  variant="primary"
                >
                  Continue Learning
                </Button>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
}

  return (
    <MainLayout title={`Enroll: ${courseTitle}`}>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
            <div className="p-8 border-b border-neutral-200">
              <h1 className="text-2xl font-bold mb-2">{courseTitle}</h1>
              <p className="text-neutral-600">{courseDescription}</p>
            </div>

            <div className="p-8">
              <h2 className="text-xl font-semibold mb-6">Enrollment Details</h2>

              <div className="space-y-6">
                <div className="flex justify-between items-center p-4 bg-neutral-50 rounded-lg">
                  <span className="font-medium">Course Fee</span>
                  <span className="text-xl font-bold">${coursePrice.toFixed(2)}/month</span>
                </div>

                <div className="p-4 bg-blue-50 text-blue-800 rounded-lg">
                  <h3 className="font-medium mb-2">What You'll Get</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Full access to all course materials</span>
                    </li>
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Certificate of completion</span>
                    </li>
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Progress tracking</span>
                    </li>
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Lifetime access to course updates</span>
                    </li>
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    href={`/courses/${id}`}
                    variant="outline"
                    fullWidth
                  >
                    Back to Course
                  </Button>
                  <Button
                    onClick={handleEnroll}
                    variant="primary"
                    fullWidth
                    disabled={isEnrolling}
                  >
                    {isEnrolling ? 'Enrolling...' : `Enroll Now - $${coursePrice.toFixed(2)}/month`}
                  </Button>
                </div>

                <p className="text-sm text-neutral-500 text-center">
                  By enrolling, you agree to our <a href="/terms" className="text-primary hover:underline">Terms of Service</a> and <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default CourseEnrollPage;
