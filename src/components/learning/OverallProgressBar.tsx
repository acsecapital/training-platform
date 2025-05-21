import React, { useMemo } from 'react';
import { Course, CourseProgress } from '@/types/course.types';
import ProgressBar from '@/components/ui/ProgressBar';
import { calculateCourseProgress } from '@/services/courseProgressService';

interface OverallProgressBarProps {
  courses: Course[];
  courseProgress: Record<string, CourseProgress>;
  className?: string;
}

const OverallProgressBar: React.FC<OverallProgressBarProps> = ({
  courses,
  courseProgress,
  className = '',
}) => {
  const { totalLessons, completedLessons, overallProgress } = useMemo(() => {
    let total = 0;
    let completed = 0;

    courses.forEach(course => {
      const progress = courseProgress[course.id];
      const courseTotalLessons = course.lessons || 0;
      const courseCompletedLessons = progress?.completedLessons?.length || 0;
      
      total += courseTotalLessons;
      completed += courseCompletedLessons;
    });

    // Use the same calculation as in courseProgressService
    const safeTotal = Math.max(1, total);
    const { overallProgress: calculatedProgress } = calculateCourseProgress(
      Array(completed).fill(''), // Dummy array of completed lessons
      safeTotal
    );

    return {
      totalLessons: safeTotal,
      completedLessons: completed,
      overallProgress: calculatedProgress,
    };
  }, [courses, courseProgress]);

  if (courses.length === 0) {
    return null;
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-neutral-200 p-6 ${className}`}>
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-neutral-900">Overall Learning Progress</h2>
          <span className="text-sm font-medium text-primary">
            {overallProgress}% Complete
          </span>
        </div>
        
        <ProgressBar 
          progress={overallProgress} 
          height="h-3"
          color="bg-primary"
          backgroundColor="bg-neutral-100"
          showPercentage={false}
        />
        
        <div className="flex justify-between text-sm text-neutral-600">
          <span>{completedLessons} of {totalLessons} lessons completed</span>
          <span>{totalLessons - completedLessons} lessons remaining</span>
        </div>
      </div>
    </div>
  );
};

export default OverallProgressBar;
