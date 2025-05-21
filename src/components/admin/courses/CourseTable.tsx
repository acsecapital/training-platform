import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {AdminCourse } from '@/types/course.types';
import CourseStatusBadge from './CourseStatusBadge';

// Helper function to get the module count consistently
const getModuleCount = (course: AdminCourse): number => {
  if (Array.isArray(course.modulesList)) {
    return course.modulesList.length;
}
  return 0;
};

interface CourseTableProps {
  courses: AdminCourse[];
  loading: boolean;
  onDelete: (courseId: string) => void;
}

const CourseTable: React.FC<CourseTableProps> = ({courses, loading, onDelete }) => {
  // Format date - handles different date formats including Firestore timestamps
  const formatDate = (dateValue: any) => {
    if (!dateValue) return 'N/A';

    try {
      let date;

      // Handle Firestore timestamp objects
      if (dateValue && typeof dateValue === 'object' && 'seconds' in dateValue && 'nanoseconds' in dateValue) {
        // Convert Firestore timestamp to Date
        date = new Date(dateValue.seconds * 1000);
    }
      // Handle ISO string dates
      else if (typeof dateValue === 'string') {
        date = new Date(dateValue);
    }
      // Handle Date objects
      else if (dateValue instanceof Date) {
        date = dateValue;
    }
      else {
        return 'Invalid date';
    }

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date';
    }

      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
  } catch (error) {
      console.error('Error formatting date:', error, dateValue);
      return 'Invalid date';
  }
};

  if (loading && courses.length === 0) {
    return (
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="p-8 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
}

  if (courses.length === 0) {
    return (
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-neutral-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <h3 className="text-lg font-medium text-neutral-900 mb-1">No courses found</h3>
          <p className="text-neutral-500">
            Get started by creating your first course.
          </p>
          <Link href="/admin/courses/create" className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
            Create Course
          </Link>
        </div>
      </div>
    );
}

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Course
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Level
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Modules / Lessons
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Pricing
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Created
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {courses.map((course) => (
              <tr key={course.id} className="hover:bg-neutral-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 relative rounded overflow-hidden">
                      {course.thumbnail ? (
                        <Image
                          src={course.thumbnail}
                          alt={course.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 bg-neutral-200 flex items-center justify-center text-neutral-500">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-neutral-900">
                        {course.title}
                      </div>
                      <div className="text-sm text-neutral-500 truncate max-w-xs">
                        {course.description.length > 60
                          ? `${course.description.substring(0, 60)}...`
                          : course.description}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <CourseStatusBadge status={course.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                    ${course.level === 'Beginner' ? 'bg-green-100 text-green-800' :
                      course.level === 'Intermediate' ? 'bg-blue-100 text-blue-800' :
                      'bg-purple-100 text-purple-800'}`}>
                    {course.level}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                  {getModuleCount(course)} / {course.lessons ?? 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                  {course.isFree ? (
                    <span className="text-green-600 font-medium">Free</span>
                  ) : course.price ? (
                    `$${typeof course.price === 'number' ? course.price.toFixed(2) : course.price}`
                  ) : course.trialPeriod ? (
                    <span className="text-blue-600">Trial ({course.trialPeriod})</span>
                  ) : (
                    'N/A'
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                  {formatDate(course.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <Link href={`/courses/${course.id}`} className="text-primary hover:text-primary-700" target="_blank">
                      <span className="sr-only">View</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </Link>
                    <Link href={`/admin/courses/${course.id}/edit`} className="text-indigo-600 hover:text-indigo-900">
                      <span className="sr-only">Edit</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </Link>
                    <button
                      onClick={() => onDelete(course.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <span className="sr-only">Delete</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {loading && courses.length > 0 && (
        <div className="p-4 flex justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
};

export default CourseTable;
