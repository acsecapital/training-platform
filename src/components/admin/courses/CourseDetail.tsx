import React, {useState, useEffect } from 'react';
import {doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import {firestore } from '@/services/firebase';
import {Course, Module, Lesson } from '@/types/course.types';
import {formatDate } from '@/utils/formatters';
import {
  BookOpen,
  Calendar,
  Clock,
  Users,
  BarChart2,
  Edit,
  ArrowLeft,
  Layers,
  FileText,
  Eye,
  User
} from 'lucide-react';
import Link from 'next/link';
import {useRouter } from 'next/router';
import Button from '@/components/ui/Button';

interface CourseDetailProps {
  courseId: string;
}

const CourseDetail: React.FC<CourseDetailProps> = ({courseId }) => {
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [enrollmentCount, setEnrollmentCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchCourse();
}, [courseId]);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch course data
      const courseRef = doc(firestore, 'courses', courseId);
      const courseDoc = await getDoc(courseRef);

      if (!courseDoc.exists()) {
        setError('Course not found');
        setLoading(false);
        return;
    }

      const courseData = {
        id: courseDoc.id,
        ...courseDoc.data()
    } as Course;

      setCourse(courseData);

      // Fetch modules
      const modulesRef = collection(firestore, 'courses', courseId, 'modules');
      const modulesQuery = query(modulesRef);
      const modulesSnapshot = await getDocs(modulesQuery);

      // Create an array to hold modules with lesson counts
      const modulesWithLessonCounts: Module[] = [];

      // Process each module and fetch its lessons
      for (const moduleDoc of modulesSnapshot.docs) {
        const moduleData = {
          id: moduleDoc.id,
          ...moduleDoc.data()
      } as Module;

        // Fetch lessons for this module to get accurate count
        const lessonsRef = collection(firestore, `courses/${courseId}/modules/${moduleDoc.id}/lessons`);
        const lessonsSnapshot = await getDocs(lessonsRef);

        // Update the lessonCount property
        moduleData.lessonCount = lessonsSnapshot.size;

        modulesWithLessonCounts.push(moduleData);
    }

      setModules(modulesWithLessonCounts);

      // Count enrollments (this is an approximation since enrollments are stored in user subcollections)
      // In a real implementation, you might want to store a counter in the course document
      // or implement a more efficient way to count enrollments
      try {
        // Get all users
        const usersRef = collection(firestore, 'users');
        const usersSnapshot = await getDocs(usersRef);

        let count = 0;

        // For each user, check if they have an enrollment for this course
        const enrollmentPromises = usersSnapshot.docs.map(async (userDoc) => {
          const userId = userDoc.id;
          const enrollmentsRef = collection(firestore, `users/${userId}/enrollments`);
          const enrollmentsQuery = query(enrollmentsRef, where('courseId', '==', courseId));
          const enrollmentsSnapshot = await getDocs(enrollmentsQuery);

          return enrollmentsSnapshot.docs.length;
      });

        const enrollmentCounts = await Promise.all(enrollmentPromises);
        count = enrollmentCounts.reduce((sum, count) => sum + count, 0);

        setEnrollmentCount(count);
    } catch (err) {
        console.error('Error counting enrollments:', err);
        // Don't set an error, just log it
    }
  } catch (err: any) {
      console.error('Error fetching course:', err);
      setError('Failed to load course details. Please try again.');
  } finally {
      setLoading(false);
  }
};

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
}

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
        <div className="flex">
          <div className="py-1">
            <svg className="h-6 w-6 text-red-500 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p className="font-bold">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
}

  if (!course) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded relative" role="alert">
        <div className="flex">
          <div className="py-1">
            <svg className="h-6 w-6 text-yellow-500 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p className="font-bold">Not Found</p>
            <p className="text-sm">The course you're looking for doesn't exist or has been deleted.</p>
          </div>
        </div>
      </div>
    );
}

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            Published
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            Draft
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            Archived
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
  }
};

  return (
    <div className="space-y-6">
      {/* Back button and actions */}
      <div className="flex justify-between items-center">
        <Link
          href="/admin/courses"
          className="inline-flex items-center text-sm text-primary-600 hover:text-primary-900"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Courses
        </Link>
        <div className="flex space-x-2">
          <Link href={`/admin/courses/${courseId}/edit`} passHref>
            <Button
              variant="outline"
              size="sm"
            >
              <Edit className="h-4 w-4 mr-1.5" />
              Edit Course
            </Button>
          </Link>
          <Link href={`/admin/courses/${courseId}/modules`} passHref>
            <Button
              variant="outline"
              size="sm"
            >
              <Layers className="h-4 w-4 mr-1.5" />
              Manage Modules
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`/admin/courses/${courseId}/preview`, '_blank')}
          >
            <Eye className="h-4 w-4 mr-1.5" />
            Preview
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => window.open(`/courses/${courseId}`, '_blank')} // Corrected Link
          >
            <BookOpen className="h-4 w-4 mr-1.5" />
            View Live
          </Button>
        </div>
      </div>

      {/* Course header */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-neutral-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-neutral-900">
              {course.title}
            </h2>
            {getStatusBadge(course.status)}
          </div>
        </div>
        <div className="px-6 py-5">
          <div className="flex flex-col md:flex-row">
            {course.thumbnail && (
              <div className="md:w-1/3 mb-4 md:mb-0 md:mr-6">
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-auto rounded-lg object-cover"
                  style={{maxHeight: '200px'}}
                />
              </div>
            )}
            <div className={course.thumbnail ? 'md:w-2/3' : 'w-full'}>
              <p className="text-neutral-600 mb-4">{course.description}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-neutral-500 mr-2" />
                  <span className="text-sm text-neutral-600">
                    Duration: {course.duration || 'Not specified'}
                  </span>
                </div>
                <div className="flex items-center">
                  <Layers className="h-5 w-5 text-neutral-500 mr-2" />
                  <span className="text-sm text-neutral-600">
                    Level: {course.level || 'Not specified'}
                  </span>
                </div>
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-neutral-500 mr-2" />
                  <span className="text-sm text-neutral-600">
                    Enrollments: {enrollmentCount}
                  </span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-neutral-500 mr-2" />
                  <span className="text-sm text-neutral-600">
                    Created: {formatDate(course.createdAt)}
                  </span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-neutral-500 mr-2" />
                  <span className="text-sm text-neutral-600">
                    Updated: {formatDate(course.updatedAt)}
                  </span>
                </div>
                {course.instructor && (
                  <div className="flex items-center">
                    <User className="h-5 w-5 text-neutral-500 mr-2" />
                    <span className="text-sm text-neutral-600">
                      Instructor: {course.instructor}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Instructor Information */}
      {course.instructor && (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-neutral-200">
            <h3 className="text-lg font-medium text-neutral-900">Instructor Information</h3>
          </div>
          <div className="px-6 py-5">
            <div className="flex items-start">
              {course.instructorAvatar && (
                <div className="mr-4">
                  <img
                    src={course.instructorAvatar}
                    alt={course.instructor}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                </div>
              )}
              <div>
                <h4 className="text-lg font-medium text-neutral-900">{course.instructor}</h4>
                {course.instructorTitle && (
                  <p className="text-sm text-neutral-600 mt-1">{course.instructorTitle}</p>
                )}
                {course.instructorBio && (
                  <p className="text-neutral-600 mt-3">{course.instructorBio}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modules */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-neutral-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-neutral-900">
              Course Modules ({modules.length})
            </h3>
            <Link href={`/admin/courses/${courseId}/modules`} passHref>
              <Button
                variant="outline"
                size="sm"
              >
                Manage Modules
              </Button>
            </Link>
          </div>
        </div>
        <div className="px-6 py-5">
          {modules.length > 0 ? (
            <ul className="space-y-4">
              {modules.map((module, index) => (
                <li key={module.id} className="border border-neutral-200 rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <h4 className="font-medium text-neutral-800">{index + 1}. {module.title}</h4>
                    <p className="text-sm text-neutral-500 mt-1">{module.description || 'No description'}</p>
                    <p className="text-xs text-neutral-400 mt-1">{module.lessonCount || 0} {module.lessonCount === 1 ? 'lesson' : 'lessons'}</p>
                  </div>
                  <Link href={`/admin/courses/${courseId}/modules/${module.id}/lessons`} passHref>
                    <Button
                      variant="ghost"
                      size="sm"
                    >
                      Manage Lessons
                    </Button>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-neutral-500 text-center py-4">No modules have been added to this course yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;