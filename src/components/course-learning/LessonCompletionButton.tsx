import React from 'react';

interface LessonCompletionButtonProps {
  isCompleted: boolean;
  onChange: (completed: boolean) => void;
  isUpdating: boolean;
}

const LessonCompletionButton: React.FC<LessonCompletionButtonProps> = ({
  isCompleted,
  onChange,
  isUpdating,
}) => {
  return (
    <button
      className={`flex items-center px-4 py-2 rounded-md font-medium transition-colors ${
        isCompleted
          ? 'bg-green-100 text-green-800 hover:bg-green-200'
          : 'bg-primary-100 text-primary-800 hover:bg-primary-200'
    } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={() => onChange(!isCompleted)}
      disabled={isUpdating}
    >
      {isUpdating ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : isCompleted ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )}
      {isCompleted ? 'Completed' : 'Mark as Completed'}
    </button>
  );
};

export default LessonCompletionButton;
