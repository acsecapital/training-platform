import React, {useState } from 'react';
import Image from 'next/image';
import {formatDistanceToNow } from 'date-fns';
import {CourseReview } from '@/types/course.types';
import StarRating from '@/components/ui/StarRating';
import {useAuth } from '@/context/AuthContext';

interface ReviewDisplayProps {
  review: CourseReview;
  onMarkHelpful?: (reviewId: string) => Promise<void>;
  onReport?: (reviewId: string) => Promise<void>;
  className?: string;
}

const ReviewDisplay: React.FC<ReviewDisplayProps> = ({
  review,
  onMarkHelpful,
  onReport,
  className = '',
}) => {
  const {user } = useAuth();
  const [isHelpfulLoading, setIsHelpfulLoading] = useState(false);
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [helpfulCount, setHelpfulCount] = useState(review.helpful);
  const [isReported, setIsReported] = useState(review.reported);

  // Format date
  const formattedDate = formatDistanceToNow(new Date(review.date), {addSuffix: true });

  // Handle mark as helpful
  const handleMarkHelpful = async () => {
    if (!user) {
      setError('You must be logged in to mark a review as helpful');
      return;
  }
    
    if (!onMarkHelpful) return;
    
    try {
      setIsHelpfulLoading(true);
      setError(null);
      
      await onMarkHelpful(review.id);
      setHelpfulCount(prev => prev + 1);
  } catch (err: any) {
      console.error('Error marking review as helpful:', err);
      setError(err.message || 'Failed to mark review as helpful');
  } finally {
      setIsHelpfulLoading(false);
  }
};

  // Handle report
  const handleReport = async () => {
    if (!user) {
      setError('You must be logged in to report a review');
      return;
  }
    
    if (!onReport) return;
    
    try {
      setIsReportLoading(true);
      setError(null);
      
      await onReport(review.id);
      setIsReported(true);
  } catch (err: any) {
      console.error('Error reporting review:', err);
      setError(err.message || 'Failed to report review');
  } finally {
      setIsReportLoading(false);
  }
};

  return (
    <div className={`border-b border-neutral-200 py-6 ${className}`}>
      <div className="flex items-start">
        {/* User avatar */}
        <div className="flex-shrink-0 mr-4">
          {review.userAvatar ? (
            <Image
              src={review.userAvatar}
              alt={review.userName}
              width={'40'}
              height={'40'}
              className="rounded-full"
            />
          ) : (
            <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center">
              {review.userName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        
        {/* Review content */}
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
            <div>
              <h4 className="text-sm font-medium text-neutral-900">{review.userName}</h4>
              <div className="flex items-center mt-1">
                <StarRating initialRating={review.rating} readOnly size="sm" />
                <span className="ml-2 text-xs text-neutral-500">{formattedDate}</span>
              </div>
            </div>
          </div>
          
          <p className="text-sm text-neutral-700 mt-2 mb-4">{review.comment}</p>
          
          {/* Actions */}
          <div className="flex items-center text-xs text-neutral-500">
            {onMarkHelpful && (
              <button
                type="button"
                onClick={handleMarkHelpful}
                disabled={isHelpfulLoading}
                className="flex items-center mr-4 hover:text-neutral-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                  />
                </svg>
                {isHelpfulLoading ? 'Marking...' : `Helpful (${helpfulCount})`}
              </button>
            )}
            
            {onReport && !isReported && (
              <button
                type="button"
                onClick={handleReport}
                disabled={isReportLoading}
                className="flex items-center hover:text-neutral-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
                  />
                </svg>
                {isReportLoading ? 'Reporting...' : 'Report'}
              </button>
            )}
            
            {isReported && (
              <span className="text-xs text-red-500 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                Reported
              </span>
            )}
          </div>
          
          {/* Error message */}
          {error && (
            <div className="mt-2 text-xs text-red-600">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewDisplay;
