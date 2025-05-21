import React, {useState, useEffect } from 'react';
import {useRouter } from 'next/router';
import {doc, getDoc, collection, query, where, getDocs, updateDoc, Timestamp } from 'firebase/firestore';
import {firestore } from '../../../services/firebase';
import LearningLayout from '../../../components/layout/LearningLayout';
import Button from '../../../components/ui/Button';
import {useAuth } from '../../../context/AuthContext';
import Link from 'next/link';
import {getCourseCompletionData } from '../../../services/courseService';
import {getCertificate } from '../../../services/certificateService';

interface CourseCompletionStats {
  score: number;
  totalModules: number;
  completedModules: number;
  totalLessons: number;
  completedLessons: number;
  completionDate: string;
  certificateId?: string;
}

// Use the actual Certificate interface from the application
import {Certificate } from '../../../types/certificate.types';

export default function CourseCompletion() {
  const router = useRouter();
  const {id: courseId } = router.query;
  const {user } = useAuth();

  const [loading, setLoading] = useState(true);
  // Define a proper type for course with title property
  interface CourseData {
    title: string;
    [key: string]: unknown;
  }
  const [course, setCourse] = useState<CourseData>({ title: '' });
  const [completionStats, setCompletionStats] = useState<CourseCompletionStats | null>(null);
  // We need to keep this state even if not directly referenced in the UI
  const [, setCertificate] = useState<Certificate | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId || !user?.id) return;

    const fetchCourseData = async () => {
      try {
        setLoading(true);

        // Fetch course data
        const courseRef = doc(firestore, 'courses', courseId as string);
        const courseDoc = await getDoc(courseRef);

        if (!courseDoc.exists()) {
          setError('Course not found');
          setLoading(false);
          return;
      }

        // Ensure the data has a title property
        const courseData = courseDoc.data();
        setCourse({
          title: courseData.title || '',
          ...courseData
        });

        // Calculate course stats
        await calculateCourseStats(user.id, courseId as string);
    } catch (err) {
        console.error('Error fetching completion data:', err);
        setError('Failed to load course completion data. Please try again later.');
    } finally {
        setLoading(false);
    }
  };

    fetchCourseData();
}, [courseId, user?.id]);

  const calculateCourseStats = async (userId: string, courseId: string) => {
    try {
      // Get completion stats from courseService
      const stats = await getCourseCompletionData(userId, courseId);
      setCompletionStats(stats);

      // If there's a certificate, fetch the certificate details
      if (stats.certificateId) {
        try {
          const certData = await getCertificate(stats.certificateId);
          // Set the certificate data if it exists
          if (certData) {
            setCertificate(certData);
        }
      } catch (certError) {
          console.error('Error fetching certificate:', certError);
          // Don't set error state here - we'll still show completion stats
      }
    }

      // Update last access date in the enrollment
      try {
        const enrollmentsRef = collection(firestore, 'enrollments');
        const q = query(enrollmentsRef,
          where('userId', '==', userId),
          where('courseId', '==', courseId)
        );

        const enrollmentDocs = await getDocs(q);
        if (!enrollmentDocs.empty) {
          const enrollmentDoc = enrollmentDocs.docs[0];
          await updateDoc(enrollmentDoc.ref, {
            lastAccessedAt: Timestamp.now(),
            status: 'completed'
        });
      }
    } catch (enrollmentError) {
        console.error('Error updating enrollment:', enrollmentError);
        // Continue even if we can't update the enrollment
    }
  } catch (err) {
      console.error('Error calculating course stats:', err);
      setError('Failed to calculate course completion statistics.');
  }
};

  if (loading) {
    return (
      <LearningLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </LearningLayout>
    );
}

  if (error) {
    return (
      <LearningLayout>
        <div className="flex flex-col items-center justify-center h-screen p-6">
          <div className="bg-white rounded-lg shadow-md p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-4">Error</h2>
            <p className="text-neutral-600 mb-6">{error}</p>
            <Button variant="primary" onClick={() => router.push('/my-learning')}>
              Return to My Learning
            </Button>
          </div>
        </div>
      </LearningLayout>
    );
}

  if (!completionStats) {
    return (
      <LearningLayout>
        <div className="flex flex-col items-center justify-center h-screen p-6">
          <div className="bg-white rounded-lg shadow-md p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-4">Course Completion Status Unavailable</h2>
            <p className="text-neutral-600 mb-6">We couldn't find completion data for this course. This might be because you haven't completed the course yet.</p>
            <Button variant="primary" onClick={() => router.push(`/courses/${courseId}`)}>
              Return to Course
            </Button>
          </div>
        </div>
      </LearningLayout>
    );
}

  const completionDate = new Date(completionStats.completionDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
});

  const passThreshold = 70; // Customizable pass threshold
  const isPassed = completionStats.score >= passThreshold;

  const handleViewCertificate = () => {
    // In a real implementation, redirect to certificate page
    if (completionStats?.certificateId) {
      void router.push(`/certificates/${completionStats.certificateId}`);
    }
};

  return (
    <LearningLayout title={`${course?.title} - Completion`}>
      <div className="container max-w-5xl mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Celebration Header */}
          <div className="bg-gradient-to-r from-blue-800 to-blue-600 py-10 px-6 text-white text-center">
            <div className="inline-block p-3 bg-white bg-opacity-20 rounded-full mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-2">Congratulations!</h1>
            <p className="text-xl opacity-90">You've successfully completed the course</p>
            <h2 className="text-2xl font-bold mt-4">{course?.title}</h2>
          </div>

          {/* Completion Stats */}
          <div className="p-8">
            <div className="flex flex-wrap justify-center gap-8 mb-8">
              {/* Overall Score */}
              <div className="text-center">
                <div className="relative w-28 h-28 mb-2 mx-auto">
                  <svg viewBox="0 0 36 36" className="w-28 h-28 -rotate-90">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      stroke="#E5E7EB"
                      strokeWidth="3"
                      fill="none"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      stroke={isPassed ? "#34D399" : "#F87171"}
                      strokeWidth="3"
                      fill="none"
                      strokeDasharray={`${completionStats.score}, 100`}
                    />
                  </svg>
                  <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                    <span className="text-2xl font-bold">{completionStats.score}%</span>
                  </div>
                </div>
                <p className="text-neutral-600 font-medium">Overall Score</p>
                <p className={`font-semibold ${isPassed ? 'text-green-600' : 'text-red-600'}`}>
                  {isPassed ? 'Passed!' : 'Not Passed'}
                </p>
              </div>

              {/* Progress Stats */}
              <div className="space-y-4">
                <div>
                  <p className="text-neutral-500 mb-1">Modules Completed</p>
                  <p className="text-lg font-semibold">
                    {completionStats.completedModules}/{completionStats.totalModules}
                  </p>
                </div>
                <div>
                  <p className="text-neutral-500 mb-1">Lessons Completed</p>
                  <p className="text-lg font-semibold">
                    {completionStats.completedLessons}/{completionStats.totalLessons}
                  </p>
                </div>
                <div>
                  <p className="text-neutral-500 mb-1">Completed Date</p>
                  <p className="text-lg font-semibold">{completionDate}</p>
                </div>
              </div>
            </div>

            {/* Certificate Section */}
            {completionStats.certificateId && (
              <div className="border-t border-gray-200 pt-8 mt-8">
                <h3 className="text-xl font-semibold text-center mb-6">Your Certificate of Completion</h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 flex flex-col md:flex-row items-center justify-between">
                  <div className="mb-4 md:mb-0 text-center md:text-left">
                    <p className="text-lg font-medium mb-1">Certificate ID: {completionStats.certificateId}</p>
                    <p className="text-neutral-600">
                      This certificate verifies that you've successfully completed the course.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="primary"
                      onClick={() => void handleViewCertificate()}
                    >
                      View Certificate
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-10 flex flex-col md:flex-row gap-4 justify-center">
              <Link href="/my-learning" passHref>
                <Button variant="primary">
                  Return to My Learning
                </Button>
              </Link>
              <Link href="/courses" passHref>
                <Button variant="secondary">
                  Explore More Courses
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </LearningLayout>
  );
}

