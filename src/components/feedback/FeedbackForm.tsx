import React, {useState } from 'react';
import {useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';
import StarRating from '@/components/ui/StarRating';

export interface FeedbackFormData {
  userId: string;
  userName: string;
  userEmail?: string;
  rating: number;
  feedback: string;
  category: string;
  source: string;
  metadata?: Record<string, any>;
}

interface FeedbackFormProps {
  title?: string;
  description?: string;
  categories?: {value: string; label: string }[];
  source: string;
  metadata?: Record<string, any>;
  onSubmit: (data: Omit<FeedbackFormData, 'userId' | 'userName' | 'userEmail'>) => Promise<void>;
  onCancel?: () => void;
  className?: string;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({
  title = 'We Value Your Feedback',
  description = 'Please share your thoughts to help us improve our platform.',
  categories = [
    {value: 'general', label: 'General Feedback'},
    {value: 'bug', label: 'Bug Report'},
    {value: 'feature', label: 'Feature Request'},
    {value: 'content', label: 'Content Feedback'},
    {value: 'usability', label: 'Usability Feedback'},
  ],
  source,
  metadata = {},
  onSubmit,
  onCancel,
  className = '',
}) => {
  const {user } = useAuth();
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [category, setCategory] = useState(categories[0].value);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Handle rating change
  const handleRatingChange = (newRating: number) => {
    setRating(newRating);
};

  // Handle feedback change
  const handleFeedbackChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFeedback(e.target.value);
};

  // Handle category change
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategory(e.target.value);
};

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to submit feedback');
      return;
  }
    
    if (rating < 1) {
      setError('Please select a rating');
      return;
  }
    
    if (!feedback.trim()) {
      setError('Please enter your feedback');
      return;
  }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      const feedbackData = {
        rating,
        feedback: feedback.trim(),
        category,
        source,
        metadata,
    };
      
      await onSubmit(feedbackData);
      
      // Reset form after successful submission
      setRating(5);
      setFeedback('');
      setCategory(categories[0].value);
      setIsSubmitted(true);
  } catch (err: any) {
      console.error('Error submitting feedback:', err);
      setError(err.message || 'Failed to submit feedback. Please try again.');
  } finally {
      setIsSubmitting(false);
  }
};

  // If feedback has been submitted, show a thank you message
  if (isSubmitted) {
    return (
      <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">Thank You for Your Feedback!</h3>
          <p className="text-neutral-600 mb-6">
            We appreciate you taking the time to share your thoughts with us.
            Your feedback helps us improve our platform.
          </p>
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Close
            </Button>
          )}
        </div>
      </div>
    );
}

  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-neutral-600 mb-6">{description}</p>
      
      <form onSubmit={handleSubmit}>
        {/* Rating */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            How would you rate your experience?
          </label>
          <StarRating
            initialRating={rating}
            onChange={handleRatingChange}
            size="lg"
          />
        </div>
        
        {/* Category */}
        <div className="mb-4">
          <label htmlFor="category" className="block text-sm font-medium text-neutral-700 mb-1">
            Feedback Category
          </label>
          <select
            id="category"
            value={category}
            onChange={handleCategoryChange}
            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            disabled={isSubmitting}
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
        
        {/* Feedback */}
        <div className="mb-4">
          <label htmlFor="feedback" className="block text-sm font-medium text-neutral-700 mb-1">
            Your Feedback
          </label>
          <textarea
            id="feedback"
            rows={4}
            value={feedback}
            onChange={handleFeedbackChange}
            placeholder="Please share your thoughts, suggestions, or report any issues you've encountered..."
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
            Submit Feedback
          </Button>
        </div>
      </form>
    </div>
  );
};

export default FeedbackForm;
