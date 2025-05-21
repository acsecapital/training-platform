import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCourses } from '@/context/CourseContext';
import CourseCard from './CourseCard';
import { CourseWithProgress } from '@/types/course.types';

interface CourseGridProps {
  courses: CourseWithProgress[];
  className?: string;
  columns?: 1 | 2 | 3 | 4;
}

const CourseGrid: React.FC<CourseGridProps> = ({
  courses,
  className = '',
  columns = 3,
}) => {
  const { user } = useAuth();
  const { courseProgress, enrolledCourses } = useCourses();

  // Grid column classes based on the columns prop
  const gridColumnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  }[columns];

  return (
    <div className={`grid ${gridColumnClasses} gap-6 ${className}`}>
      {courses.map((course) => {
        // Check if user is enrolled in this course
        const isEnrolled = true; // All courses in this grid have progress, so treat as enrolled
        return (
          <CourseCard
            key={course.id}
            course={course}
            isEnrolled={isEnrolled}
          />
        );
      })}
    </div>
  );
};

// Simple placeholder function for formatting dates
// In a real application, you might import a shared utility function
const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return date.toLocaleDateString();
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};


export default CourseGrid;
