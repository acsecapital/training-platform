import React from 'react';
import Link from 'next/link';

interface ProgressIndicatorProps {
  courseId: string;
  progress: number;
  completedLessons: number;
  totalLessons: number;
  currentLessonId?: string;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  courseId,
  progress,
  completedLessons,
  totalLessons,
  currentLessonId,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
      <h3 className="text-lg font-semibold text-neutral-900 mb-4">Your Progress</h3>
      
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm text-neutral-600 mb-1">
            <span>{progress}% complete</span>
            <span>{completedLessons}/{totalLessons} lessons</span>
          </div>
          <div className="w-full bg-neutral-200 rounded-full h-2.5">
            <div 
              className="bg-primary h-2.5 rounded-full" 
              style={{width: `${progress}%` }}
            ></div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {currentLessonId ? (
            <Link 
              href={`/courses/${courseId}/learn?lessonId=${currentLessonId}`}
              className="inline-flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              Continue Learning
            </Link>
          ) : (
            <Link 
              href={`/courses/${courseId}/learn`}
              className="inline-flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              Start Learning
            </Link>
          )}
          
          <Link 
            href={`/courses/${courseId}/certificate`}
            className={`inline-flex justify-center items-center py-2 px-4 border border-neutral-300 rounded-md text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 ${
              progress < 100 ? 'opacity-50 cursor-not-allowed' : ''
          }`}
            onClick={(e) => {
              if (progress < 100) {
                e.preventDefault();
            }
          }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            {progress < 100 ? 'Complete to Get Certificate' : 'View Certificate'}
          </Link>
        </div>
        
        {progress < 100 && (
          <p className="text-sm text-neutral-500">
            Complete all lessons to earn your certificate.
          </p>
        )}
      </div>
    </div>
  );
};

export default ProgressIndicator;
