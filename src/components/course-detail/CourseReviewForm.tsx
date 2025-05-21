import React, {useState } from 'react';
import {useAuth } from '@/context/AuthContext';
import StarRating from '@/components/ui/StarRating';
import Button from '@/components/ui/Button';
import {CourseReview } from '@/types/course.types';

interface CourseReviewFormProps {
  courseId: string;
  courseName: string;
  onSubmit: (review: Omit<CourseReview, 'id' | 'date'>) => Promise<void>;
  onCancel?: () => void;
  className?: string;
}

const CourseReviewForm: React.FC<CourseReviewFormProps> = ({
  courseId,
  courseName,
  onSubmit,
  onCancel,
  className = '',
}) => {
  const {user } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle rating change
  const handleRatingChange = (newRating: number) => {
    setRating(newRating);
};

  // Handle comment change
  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComment(e.target.value);
};

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to submit a review');
      return;
  }
    
    if (rating < 1) {
      setError('Please select a rating');
      return;
  }
    
    if (!comment.trim()) {
      setError('Please enter a comment');
      return;
  }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      const reviewData: Omit<CourseReview, 'id' | 'date'> = {
        courseId,
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        userAvatar: user.photoURL || undefined,
        rating,
        comment: comment.trim(),
        helpful: 0,
        reported: false,
    };
      
      await onSubmit(reviewData);
      
      // Reset form after successful submission
      setRating(5);
      setComment('');
  } catch (err: any) {
      console.error('Error submitting review:', err);
      setError(err.message || 'Failed to submit review. Please try again.');
  } finally {
      setIsSubmitting(false);
  }
};

  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Write a Review for "{courseName}"</h3>
      
      <form onSubmit={handleSubmit}>
        {/* Rating */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Your Rating
          </label>
          <StarRating
            initialRating={rating}
            onChange={handleRatingChange}
            size="lg"
          />
        </div>
        
        {/* Comment */}
        <div className="mb-4">
          <label htmlFor="comment" className="block text-sm font-medium text-neutral-700 mb-1">
            Your Review
          </label>
          <textarea
            id="comment"
            rows={4}
            value={comment}
            onChange={handleCommentChange}
            placeholder="Share your experience with this course..."
            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            disabled={isSubmitting}
          />
        </div>
        
        {/* Error message */}
        {error && (
          <div className="mb-4 text-sm text-red-600">
            {error}
          </div>
        )}
        
        {/* Form actions */}
        <div className="flex justify-end space-x-3">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            Submit Review
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CourseReviewForm;
