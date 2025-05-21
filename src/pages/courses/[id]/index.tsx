import React, {useState, useEffect } from 'react';
import {GetServerSideProps } from 'next';
import {useRouter } from 'next/router';
import {doc, getDoc } from 'firebase/firestore';
import {firestore } from '@/services/firebase';
import {Course, CourseProgress } from '@/types/course.types';
import Layout from '@/components/layout/Layout';
import CourseProgressVisualizer from '@/components/courses/CourseProgressVisualizer';
// Removing unused imports
// import Button from '@/components/ui/Button';
// import Link from 'next/link';
import Image from 'next/image';
import {Stream } from '@cloudflare/stream-react';
import {useAuth } from '@/context/AuthContext';
import {withAuth } from '@/utils/withAuth';
import {getCourseProgress } from '@/services/courseProgressService';

const CoursePage: React.FC = () => {
  const router = useRouter();
  const {id } = router.query;
  const {user } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'overview'>('content');

  // Ensure id is a string for template expressions
  const courseId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : '';

  // Fetch course data
  useEffect(() => {
    const fetchCourseData = async () => {
      if (!id || !user) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch course
        const courseRef = doc(firestore, `courses/${id}`);
        const courseSnapshot = await getDoc(courseRef);

        if (!courseSnapshot.exists()) {
          setError('Course not found');
          return;
      }

        const courseData: Course = {
          id: courseSnapshot.id,
          ...courseSnapshot.data() as Omit<Course, 'id'>
      };

        // Check if course is published
        if (courseData.status !== 'published') {
          setError('This course is not available yet.');
          return;
      }

        setCourse(courseData);

        // Fetch progress
        if (user) {
          const progressData = await getCourseProgress(user.uid, courseId);
          setProgress(progressData);
      }
    } catch (err) {
        console.error('Error fetching course:', err);
        setError('Failed to load course. Please try again.');
    } finally {
        setLoading(false);
    }
  };

    fetchCourseData();
}, [id, user]);

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="p-8 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        </div>
      </Layout>
    );
}

  if (error || !course) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error || 'Course not found'}
          </div>
        </div>
      </Layout>
    );
}

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Course Header */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-neutral-200 mb-6">
          <div className="md:flex">
            {/* Course Thumbnail */}
            <div className="md:w-1/3 relative h-48 md:h-auto">
              {course.thumbnail ? (
                <div className="relative w-full h-full">
                  <Image
                    src={course.thumbnail}
                    alt={course.title}
                    layout="fill"
                    objectFit="cover"
                  />
                </div>
              ) : (
                <div className="w-full h-full bg-neutral-200 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Course Info */}
            <div className="p-6 md:w-2/3">
              <h1 className="text-2xl font-bold text-neutral-900 mb-2">{course.title}</h1>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {course.level && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {course.level}
                  </span>
                )}
                {course.duration && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {course.duration}
                  </span>
                )}
                {progress && progress.completed && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Completed
                  </span>
                )}
              </div>

              <p className="text-neutral-600 mb-4">{course.description}</p>

              {course.instructor && (
                <div className="flex items-center mt-4">
                  <div className="flex-shrink-0">
                    {course.instructorAvatar ? (
                      <div className="relative w-10 h-10 rounded-full overflow-hidden">
                        <Image
                          src={course.instructorAvatar}
                          alt={course.instructor}
                          layout="fill"
                          objectFit="cover"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-neutral-900">{course.instructor}</p>
                    {course.instructorTitle && (
                      <p className="text-xs text-neutral-500">{course.instructorTitle}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-neutral-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'content'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
            }`}
              onClick={() => setActiveTab('content')}
            >
              Course Content
            </button>
            <button
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
            }`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'content' ? (
          <CourseProgressVisualizer courseId={courseId} progress={progress || undefined} />
        ) : (
          <div className="space-y-6">
            {/* Intro Video */}
            {course.introVideoId && (
              <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-neutral-200">
                <div className="p-4 border-b border-neutral-200">
                  <h2 className="text-lg font-medium text-neutral-900">Course Introduction</h2>
                </div>
                <div className="aspect-w-16 aspect-h-9">
                  <Stream
                    src={course.introVideoId}
                    controls
                    responsive={true}
                    className="w-full h-full"
                  />
                </div>
              </div>
            )}

            {/* Course Details */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-neutral-200">
              <div className="p-4 border-b border-neutral-200">
                <h2 className="text-lg font-medium text-neutral-900">Course Details</h2>
              </div>
              <div className="p-6">
                {course.longDescription && (
                  <div className="mb-6">
                    <h3 className="text-md font-medium text-neutral-900 mb-2">Description</h3>
                    <div className="prose max-w-none" dangerouslySetInnerHTML={{__html: course.longDescription }} />
                  </div>
                )}

                {course.whatYouWillLearn && course.whatYouWillLearn.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-md font-medium text-neutral-900 mb-2">What You Will Learn</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      {course.whatYouWillLearn.map((item, index) => (
                        <li key={index} className="text-neutral-600">{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {course.requirements && course.requirements.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-md font-medium text-neutral-900 mb-2">Requirements</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      {course.requirements.map((item, index) => (
                        <li key={index} className="text-neutral-600">{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {course.tags && course.tags.length > 0 && (
                  <div>
                    <h3 className="text-md font-medium text-neutral-900 mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {course.tags.map((tag, index) => (
                        <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = withAuth(async () => {
  // Add an await statement to make the function actually async
  await Promise.resolve();

  return {
    props: {}
};
});

export default CoursePage;
