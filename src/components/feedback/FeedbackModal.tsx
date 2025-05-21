import React, {useState } from 'react';
import {useAuth } from '@/context/AuthContext';
import FeedbackForm, {FeedbackFormData } from './FeedbackForm';
import * as feedbackService from '@/services/feedbackService';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  source: string;
  metadata?: Record<string, any>;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  source,
  metadata = {},
}) => {
  const {user } = useAuth();
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle feedback submission
  const handleSubmitFeedback = async (
    data: Omit<FeedbackFormData, 'userId' | 'userName' | 'userEmail'>
  ) => {
    if (!user) {
      setError('You must be logged in to submit feedback');
      return;
  }

    try {
      const feedbackData: FeedbackFormData = {
        ...data,
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        userEmail: user.email || undefined,
    };

      await feedbackService.submitFeedback(feedbackData);
  } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
  }
};

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-neutral-200 flex justify-between items-center">
          <h2 className="text-lg font-medium">Provide Feedback</h2>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-auto p-4">
          <FeedbackForm
            source={source}
            metadata={metadata}
            onSubmit={handleSubmitFeedback}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
