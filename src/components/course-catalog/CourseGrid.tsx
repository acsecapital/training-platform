import React from 'react';
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


export default CourseGrid;
