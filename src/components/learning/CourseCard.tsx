import React, { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Course, CourseProgress } from '@/types/course.types';
import Button from '@/components/ui/Button';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';

interface ModuleLesson {
  id: string;
  title: string;
  duration?: number;
  type?: string;
}

interface CourseModule {
  id: string;
  title: string;
  description?: string;
  lessons?: ModuleLesson[];
}

interface CourseCardProps {
  course: Course & {
    modules?: CourseModule[];
    lessons?: number;
  };
  progress?: CourseProgress;
  formatDate: (date?: string) => string;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, progress: initialProgress, formatDate }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Use initial progress but listen for updates
  const progress = initialProgress;
  
  // Set up a subscription to progress updates
  useEffect(() => {
    if (!user?.id || !course.id) return;

    // Invalidate the progress query when the component mounts
    void queryClient.invalidateQueries({
      queryKey: ['courseProgress', user.id, course.id]
    });
    
    // Also invalidate the enrolled courses query to ensure the parent updates
    void queryClient.invalidateQueries({
      queryKey: ['enrolledCoursesWithProgress', user.id]
    });
  }, [user?.id, course.id, queryClient]);
  
  // Calculate progress values
  const progressPercent = progress?.overallProgress || 0;
  const isCompleted = progress?.completed || false;
  const status = isCompleted ? 'completed' : 'active';
  
  // Calculate remaining lessons if we have the data
  const totalLessons = course.lessons || 0;
  const completedLessonCount = progress?.completedLessons?.length || 0;
  const remainingLessons = Math.max(0, totalLessons - completedLessonCount);
  
  // Invalidate the query whenever the component mounts or updates
  useEffect(() => {
    if (user?.id) {
      void queryClient.invalidateQueries({
        queryKey: ['courseProgress', user.id, course.id]
      });
    }
  }, [user?.id, course.id, queryClient]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
      <div className="aspect-video relative">
        {course.thumbnail ? (
          <Image
            src={course.thumbnail}
            alt={course.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-neutral-200 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        )}

        {/* Status badge */}
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            status === 'completed'
              ? 'bg-green-100 text-green-800'
              : 'bg-blue-100 text-blue-800'
        }`}>
            {status === 'completed' ? 'Completed' : 'In Progress'}
          </span>
        </div>

        {/* Course level badge */}
        {course.level && (
          <div className="absolute top-2 left-2">
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-neutral-800 bg-opacity-70 text-white">
              {course.level}
            </span>
          </div>
        )}
      </div>

      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-semibold text-neutral-800">{course.title}</h3>
        </div>

        {/* Course metadata */}
        <div className="flex items-center text-sm text-neutral-500 mb-4">
          {course.duration && (
            <div className="flex items-center mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{course.duration}</span>
            </div>
          )}

          {Array.isArray(course.modulesList) && course.modulesList.length > 0 && (
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span>
                {`${course.modulesList.length} ${course.modulesList.length === 1 ? 'module' : 'modules'}`}
              </span>
            </div>
          )}
        </div>

        {/* Progress bar with detailed stats */}
        <div className="mb-4">
          <div className="flex justify-between items-center text-sm text-neutral-600 mb-1">
            <span className="font-medium">Course Progress</span>
            <span className="font-semibold">{progressPercent}%</span>
          </div>
          <div className="w-full bg-neutral-100 rounded-full h-2.5 mb-2">
            <div
              className={`${isCompleted ? 'bg-green-500' : 'bg-primary'} h-2.5 rounded-full transition-all duration-500 ease-out`}
              style={{ width: `${progressPercent}%` }}
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            ></div>
          </div>
          <div className="flex items-center justify-between text-sm text-neutral-500 mt-2">
            <span>{completedLessonCount} of {totalLessons} lessons</span>
            <span>{progressPercent}%</span>
          </div>
          {!isCompleted && remainingLessons > 0 && (
            <span className="text-xs text-neutral-500">{remainingLessons} {remainingLessons === 1 ? 'lesson' : 'lessons'} remaining</span>
          )}
        </div>

        {/* Course status and metadata */}
        <div className="space-y-2">
          {isCompleted ? (
            <div className="flex items-center text-sm text-green-600 bg-green-50 px-3 py-2 rounded-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-medium">Course Completed</p>
                <p className="text-xs text-green-700">Completed on {formatDate(progress?.completedDate)}</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between bg-blue-50 px-3 py-2 rounded-md">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium text-blue-800">In Progress</span>
                </div>
                {remainingLessons > 0 && (
                  <span className="text-xs bg-white px-2 py-1 rounded-full text-blue-700 font-medium">
                    {remainingLessons} {remainingLessons === 1 ? 'lesson' : 'lessons'} left
                  </span>
                )}
              </div>

              {/* Last Accessed */}
              {progress?.lastAccessDate && (
                <div className="flex items-center text-xs text-neutral-500 bg-neutral-50 px-3 py-1.5 rounded">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-neutral-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <span>Last accessed: {formatDate(progress.lastAccessDate)}</span>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex gap-2">
          <Link href={`/courses/${course.id}/learn`} passHref className="flex-1">
            <Button variant="primary" className="w-full">
              {isCompleted ? 'Review Course' : progressPercent > 0 ? 'Continue Learning' : 'Start Learning'}
            </Button>
          </Link>

          {isCompleted && progress?.certificateId && (
            <Link href={`/certificates/${progress.certificateId}`} passHref>
              <Button variant="outline" className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
