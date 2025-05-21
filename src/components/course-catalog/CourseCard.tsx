// src\components\course-catalog\CourseCard.tsx
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CourseWithProgress } from '@/types/course.types';
import ProgressBar from '@/components/ui/ProgressBar';
import { formatDuration } from '@/utils/durationUtils';

interface CourseCardProps {
  course: CourseWithProgress;
  isEnrolled?: boolean;
}

const CourseCard: React.FC<CourseCardProps> = ({
  course,
  isEnrolled = false,
}) => {
  const { id, title, description, thumbnail, duration, durationDetails, modulesList, level, enrolledCount = 0, reviewCount = 0, rating = 0, progress } = course;
  const moduleCount = modulesList?.length || 0;
  const lessonCount = course.lessons ?? 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
      <div className="aspect-video relative">
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
            priority={false}
          />
        ) : (
          <div className="absolute inset-0 bg-neutral-200 flex items-center justify-center">
            <span className="text-neutral-400">No image</span>
          </div>
        )}
        <div className="absolute top-2 left-2 bg-white/90 text-xs font-medium px-2 py-1 rounded">
          {level}
        </div>
        {isEnrolled && typeof progress === 'number' && (
          <div className="absolute bottom-0 left-0 right-0 px-2 pb-2">
            <ProgressBar progress={progress} height="h-2" showPercentage={false} />
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-medium text-lg mb-2 line-clamp-2">{title}</h3>
        <p className="text-neutral-600 text-sm mb-3 line-clamp-2">{description}</p>

        <div className="text-xs text-neutral-500 mb-4 space-y-1.5">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {durationDetails ? formatDuration(durationDetails) : formatDuration(duration)}
          </div>

          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            {moduleCount} {moduleCount === 1 ? 'Module' : 'Modules'}
          </div>

          {lessonCount > 0 && (
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 4v12l-4-2-4 2V4M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {lessonCount} {lessonCount === 1 ? 'Lesson' : 'Lessons'}
            </div>
          )}

          {enrolledCount > 0 && (
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              {enrolledCount} {enrolledCount === 1 ? 'Student' : 'Students'}
            </div>
          )}
        </div>

        {reviewCount > 0 && (
          <div className="flex items-center mb-4">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-4 w-4 ${star <= Math.round(rating) ? 'text-yellow-400' : 'text-neutral-300'}`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8-2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-xs text-neutral-500 ml-1">
              ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
            </span>
          </div>
        )}

        <Link
          href={`/courses/${id}`}
          className="block w-full text-center py-2 px-4 bg-primary text-white rounded hover:bg-gradient-to-r hover:from-success-600 hover:to-success hover:text-white hover:shadow-lg transition-all duration-300"
        >
          {isEnrolled ? 'Continue Learning' : 'View Course'}
        </Link>
      </div>
    </div>
  );
};

export default CourseCard;