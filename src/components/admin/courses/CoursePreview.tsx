import React, {useState, useEffect } from 'react';
import {Course } from '@/types/course.types';
import {doc, getDoc } from 'firebase/firestore';
import {firestore } from '@/services/firebase';
import CourseStructureVisualizer from './CourseStructureVisualizer';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import Image from 'next/image';
import {Stream } from '@cloudflare/stream-react';

interface CoursePreviewProps {
  courseId: string;
}

const CoursePreview: React.FC<CoursePreviewProps> = ({courseId }) => {
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'structure'>('overview');

  // Fetch course data
  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId) return;

      try {
        setLoading(true);
        setError(null);

        const courseRef = doc(firestore, `courses/${courseId}`);
        const courseSnapshot = await getDoc(courseRef);

        if (courseSnapshot.exists()) {
          setCourse({
            id: courseSnapshot.id,
            ...courseSnapshot.data() as Omit<Course, 'id'>
        });
      } else {
          setError('Course not found');
      }
    } catch (err: any) {
        console.error('Error fetching course:', err);
        setError('Failed to load course. Please try again.');
    } finally {
        setLoading(false);
    }
  };

    fetchCourse();
}, [courseId]);

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
}

  if (error || !course) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        {error || 'Course not found'}
      </div>
    );
}

  return (
    <div className="space-y-6">
      {/* Course Header */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-neutral-200">
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
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-neutral-900 mb-2">{course.title}</h1>
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    course.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                    {course.status === 'published' ? 'Published' : 'Draft'}
                  </span>
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
                  {course.price !== undefined && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                      {course.price === 0 ? 'Free' : `$${course.price.toFixed(2)}`}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex space-x-2">
                <Link href={`/admin/courses/${courseId}/edit`} passHref>
                  <Button variant="outline" size="sm">
                    Edit Course
                  </Button>
                </Link>
                <Link href={`/courses/${courseId}`} passHref>
                  <Button variant="primary" size="sm">
                    View Live
                  </Button>
                </Link>
              </div>
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
      <div className="border-b border-neutral-200">
        <nav className="-mb-px flex space-x-8">
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
          <button
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'structure'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
          }`}
            onClick={() => setActiveTab('structure')}
          >
            Course Structure
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' ? (
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

          {/* Course Stats */}
          <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-neutral-200">
            <div className="p-4 border-b border-neutral-200">
              <h2 className="text-lg font-medium text-neutral-900">Course Statistics</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-neutral-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-neutral-500 mb-1">Enrolled Students</h3>
                  <p className="text-2xl font-bold text-neutral-900">{course.enrolledCount || 0}</p>
                </div>
                <div className="bg-neutral-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-neutral-500 mb-1">Average Rating</h3>
                  <div className="flex items-center">
                    <p className="text-2xl font-bold text-neutral-900 mr-2">{course.rating?.toFixed(1) || 'N/A'}</p>
                    {course.rating && (
                      <div className="flex text-yellow-400">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg key={star} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill={star <= Math.round(course.rating || 0) ? 'currentColor' : 'none'}>
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-neutral-500 mt-1">{course.reviewCount || 0} reviews</p>
                </div>
                <div className="bg-neutral-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-neutral-500 mb-1">Last Updated</h3>
                  <p className="text-lg font-medium text-neutral-900">
                    {course.lastUpdated ? new Date(course.lastUpdated).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <CourseStructureVisualizer courseId={courseId} />
      )}
    </div>
  );
};

export default CoursePreview;
