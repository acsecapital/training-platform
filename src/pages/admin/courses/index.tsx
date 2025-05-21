import React, {useState, useEffect } from 'react';
import {collection, getDocs, query, orderBy, limit, startAfter, where, deleteDoc, doc } from 'firebase/firestore';
import {firestore } from '@/services/firebase';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import CourseTable from '@/components/admin/courses/CourseTable';
import CourseFilters from '@/components/admin/courses/CourseFilters';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import {verifyAllModuleLessonCounts } from '@/services/moduleService';
import {CourseRepository } from '@/repositories/courseRepository';

// Import the AdminCourse type from the types file
import {AdminCourse } from '@/types/course.types';

const CoursesAdminPage: React.FC = () => {
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>('all');
  const [levelFilter, setLevelFilter] = useState<'all' | 'Beginner' | 'Intermediate' | 'Advanced'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const pageSize = 10;

  // Fetch courses from Firestore
  const fetchCourses = async (isInitial = false) => {
    try {
      setLoading(true);
      setError(null);

      const coursesQuery = collection(firestore, 'courses');
      const queryConstraints: any[] = [orderBy('createdAt', 'desc'), limit(pageSize)];

      // Apply filters
      if (statusFilter !== 'all') {
        queryConstraints.unshift(where('status', '==', statusFilter));
    }

      if (levelFilter !== 'all') {
        queryConstraints.unshift(where('level', '==', levelFilter));
    }

      // Apply pagination
      if (!isInitial && lastVisible) {
        queryConstraints.push(startAfter(lastVisible));
    }

      const q = query(coursesQuery, ...queryConstraints);
      const querySnapshot = await getDocs(q);

      // Check if we have more results
      setHasMore(querySnapshot.docs.length === pageSize);

      // Set the last visible document for pagination
      if (querySnapshot.docs.length > 0) {
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
    } else {
        setLastVisible(null);
    }

      // Process the results
      const fetchedCourses: AdminCourse[] = [];

      // For each course, verify the module and lesson counts
      for (const courseDoc of querySnapshot.docs) {
        try {
          // Verify the modulesList is correct
          await CourseRepository.verifyModulesList(courseDoc.id);

          // Verify lesson counts for this course
          await verifyAllModuleLessonCounts(courseDoc.id);

          // Get the enhanced course with computed properties
          const enhancedCourse = await CourseRepository.getAdminCourse(courseDoc.id);

          // Convert to AdminCourse format for the table
          fetchedCourses.push({
            id: enhancedCourse.id,
            title: enhancedCourse.title,
            description: enhancedCourse.description,
            thumbnail: enhancedCourse.thumbnail,
            duration: enhancedCourse.duration,
            level: enhancedCourse.level,
            status: enhancedCourse.status,
            modulesList: enhancedCourse.modulesList,
            lessons: enhancedCourse.computedLessonCount,
            price: enhancedCourse.price,
            isFree: enhancedCourse.isFree,
            trialPeriod: enhancedCourse.trialPeriod,
            createdAt: enhancedCourse.createdAt,
            updatedAt: enhancedCourse.updatedAt,
            categoryIds: enhancedCourse.categoryIds,
        });
      } catch (err) {
          console.error(`Error processing course ${courseDoc.id}:`, err);
          // Still add the course with basic data to avoid missing entries
          const data = courseDoc.data();

          // Helper function to format dates
          const formatFirestoreDate = (dateValue: any): string => {
            if (!dateValue) return new Date().toISOString();

            // Handle Firestore timestamp
            if (dateValue && typeof dateValue === 'object' && 'seconds' in dateValue) {
              return new Date(dateValue.seconds * 1000).toISOString();
          }
            // Handle ISO string
            else if (typeof dateValue === 'string') {
              return dateValue;
          }
            // Handle Date object
            else if (dateValue instanceof Date) {
              return dateValue.toISOString();
          }

            return new Date().toISOString();
        };

          fetchedCourses.push({
            id: courseDoc.id,
            title: data.title || '',
            description: data.description || '',
            thumbnail: data.thumbnail || '',
            duration: data.duration || '',
            level: data.level || 'Beginner',
            status: data.status || 'draft',
            modulesList: Array.isArray(data.modulesList) ? data.modulesList : [],
            lessons: data.lessons || 0,
            price: data.price,
            isFree: data.isFree,
            trialPeriod: data.trialPeriod,
            createdAt: formatFirestoreDate(data.createdAt),
            updatedAt: formatFirestoreDate(data.updatedAt),
            categoryIds: data.categoryIds || [],
        });
      }
    }

      if (isInitial) {
        setCourses(fetchedCourses);
    } else {
        setCourses(prev => [...prev, ...fetchedCourses]);
    }
  } catch (err: any) {
      console.error('Error fetching courses:', err);
      setError('Failed to load courses. Please try again.');
  } finally {
      setLoading(false);
  }
};

  // Initial fetch
  useEffect(() => {
    fetchCourses(true);
}, [statusFilter, levelFilter]);

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // In a real implementation, we would use Firestore's search capabilities
    // or a service like Algolia for better search functionality
};

  // Handle filter changes
  const handleFilterChange = (status: 'all' | 'draft' | 'published', level: 'all' | 'Beginner' | 'Intermediate' | 'Advanced') => {
    setStatusFilter(status);
    setLevelFilter(level);
};

  // Handle course deletion
  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return;
  }

    try {
      await deleteDoc(doc(firestore, 'courses', courseId));
      setCourses(prev => prev.filter(course => course.id !== courseId));
  } catch (err: any) {
      console.error('Error deleting course:', err);
      alert('Failed to delete course. Please try again.');
  }
};

  return (
    <AdminLayout title="Courses">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-neutral-900">Search and Manage Courses</h1>
          <Link href="/admin/courses/create">
            <Button variant="primary" className="mt-4 sm:mt-0">
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Create Course
              </span>
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <CourseFilters
          onFilterChange={handleFilterChange}
          onSearch={handleSearch}
          statusFilter={statusFilter}
          levelFilter={levelFilter}
          searchQuery={searchQuery}
        />

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Course table */}
        <CourseTable
          courses={courses}
          loading={loading}
          onDelete={handleDeleteCourse}
        />

        {/* Load more button */}
        {hasMore && (
          <div className="flex justify-center mt-6">
            <Button
              variant="outline"
              onClick={() => fetchCourses(false)}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Load More'}
            </Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default function AdminCoursesPage() {
  return (
    <ProtectedRoute adminOnly>
      <CoursesAdminPage />
    </ProtectedRoute>
  );
}
