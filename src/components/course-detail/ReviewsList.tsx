import React, {useState } from 'react';
import {CourseReview } from '@/types/course.types';
import ReviewDisplay from './ReviewDisplay';
import Button from '@/components/ui/Button';
import StarRating from '@/components/ui/StarRating';

interface ReviewsListProps {
  reviews: CourseReview[];
  averageRating: number;
  totalReviews: number;
  onMarkHelpful?: (reviewId: string) => Promise<void>;
  onReport?: (reviewId: string) => Promise<void>;
  onWriteReview?: () => void;
  className?: string;
}

const ReviewsList: React.FC<ReviewsListProps> = ({
  reviews,
  averageRating,
  totalReviews,
  onMarkHelpful,
  onReport,
  onWriteReview,
  className = '',
}) => {
  const [filter, setFilter] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'helpful'>('recent');
  const [visibleReviews, setVisibleReviews] = useState(5);

  // Filter reviews by rating
  const filteredReviews = filter
    ? reviews.filter(review => review.rating === filter)
    : reviews;

  // Sort reviews
  const sortedReviews = [...filteredReviews].sort((a, b) => {
    if (sortBy === 'recent') {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
  } else {
      return b.helpful - a.helpful;
  }
});

  // Get displayed reviews
  const displayedReviews = sortedReviews.slice(0, visibleReviews);

  // Handle load more
  const handleLoadMore = () => {
    setVisibleReviews(prev => prev + 5);
};

  // Calculate rating distribution
  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => {
    const count = reviews.filter(review => review.rating === rating).length;
    const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
    
    return {
      rating,
      count,
      percentage,
  };
});

  return (
    <div className={className}>
      {/* Reviews header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold">Student Reviews</h2>
          <div className="flex items-center mt-2">
            <StarRating initialRating={Math.round(averageRating)} readOnly />
            <span className="ml-2 text-sm font-medium">{averageRating.toFixed(1)} out of 5</span>
            <span className="ml-2 text-sm text-neutral-500">({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})</span>
          </div>
        </div>
        
        {onWriteReview && (
          <Button
            variant="primary"
            onClick={onWriteReview}
            className="mt-4 md:mt-0"
          >
            Write a Review
          </Button>
        )}
      </div>
      
      {/* Rating distribution */}
      <div className="bg-neutral-50 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-medium mb-4">Rating Distribution</h3>
        <div className="space-y-3">
          {ratingDistribution.map(({rating, count, percentage }) => (
            <div key={rating} className="flex items-center">
              <button
                type="button"
                onClick={() => setFilter(filter === rating ? null : rating)}
                className={`flex items-center min-w-[80px] text-sm ${
                  filter === rating ? 'font-medium text-primary' : 'text-neutral-700'
              }`}
              >
                {rating} stars
              </button>
              <div className="flex-1 mx-4">
                <div className="bg-neutral-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-yellow-400 h-full rounded-full"
                    style={{width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
              <span className="text-sm text-neutral-500 min-w-[40px] text-right">
                {count}
              </span>
            </div>
          ))}
        </div>
        
        {filter && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setFilter(null)}
              className="text-sm text-primary hover:text-primary-700"
            >
              Clear filter
            </button>
          </div>
        )}
      </div>
      
      {/* Sort controls */}
      <div className="flex justify-between items-center mb-6">
        <div className="text-sm font-medium">
          {filteredReviews.length} {filteredReviews.length === 1 ? 'review' : 'reviews'}
          {filter && ` with ${filter} stars`}
        </div>
        
        <div className="flex items-center">
          <span className="text-sm text-neutral-500 mr-2">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'recent' | 'helpful')}
            className="text-sm border-none bg-transparent focus:ring-0 cursor-pointer"
          >
            <option value="recent">Most Recent</option>
            <option value="helpful">Most Helpful</option>
          </select>
        </div>
      </div>
      
      {/* Reviews list */}
      {displayedReviews.length > 0 ? (
        <div>
          {displayedReviews.map(review => (
            <ReviewDisplay
              key={review.id}
              review={review}
              onMarkHelpful={onMarkHelpful}
              onReport={onReport}
            />
          ))}
          
          {/* Load more button */}
          {visibleReviews < filteredReviews.length && (
            <div className="mt-6 text-center">
              <Button
                variant="outline"
                onClick={handleLoadMore}
              >
                Load More Reviews
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 bg-neutral-50 rounded-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 mx-auto text-neutral-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
          <p className="text-neutral-600 mb-2">No reviews yet</p>
          <p className="text-sm text-neutral-500 mb-4">
            {filter
              ? `There are no ${filter}-star reviews for this course yet.`
              : 'Be the first to review this course!'}
          </p>
          
          {onWriteReview && !filter && (
            <Button
              variant="primary"
              onClick={onWriteReview}
            >
              Write a Review
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default ReviewsList;
