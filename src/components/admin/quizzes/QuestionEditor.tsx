import React, {useState, useEffect } from 'react';
import {v4 as uuidv4 } from 'uuid';

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  text: string;
  type: 'multiple-choice' | 'true-false' | 'text';
  options: QuestionOption[];
  correctOptionId: string;
  explanation?: string;
  points: number;
}

interface QuestionEditorProps {
  question: Question | null;
  onSave: (question: Question) => void;
  onCancel: () => void;
}

const QuestionEditor: React.FC<QuestionEditorProps> = ({
  question,
  onSave,
  onCancel,
}) => {
  console.log('QuestionEditor rendered with question:', question);

  const [currentQuestion, setCurrentQuestion] = useState<Question>(
    question || {
      id: uuidv4(),
      text: '',
      type: 'multiple-choice',
      options: [
        {id: uuidv4(), text: ''},
        {id: uuidv4(), text: ''},
      ],
      correctOptionId: '',
      points: 1,
  }
  );

  // Log when the component mounts or updates
  useEffect(() => {
    console.log('QuestionEditor mounted/updated with currentQuestion:', currentQuestion);
}, [currentQuestion]);

  // Handle question text change
  const handleQuestionTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentQuestion({
      ...currentQuestion,
      text: e.target.value,
  });
};

  // Handle question type change
  const handleQuestionTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as Question['type'];

    // Create default options based on question type
    let newOptions: QuestionOption[] = [];

    if (newType === 'multiple-choice') {
      newOptions = [
        {id: uuidv4(), text: ''},
        {id: uuidv4(), text: ''},
      ];
  } else if (newType === 'true-false') {
      newOptions = [
        {id: uuidv4(), text: 'True'},
        {id: uuidv4(), text: 'False'},
      ];
  }

    setCurrentQuestion({
      ...currentQuestion,
      type: newType,
      options: newOptions,
      correctOptionId: '',
  });
};

  // Handle option text change
  const handleOptionTextChange = (optionId: string, text: string) => {
    setCurrentQuestion({
      ...currentQuestion,
      options: currentQuestion.options.map(option =>
        option.id === optionId ? {...option, text } : option
      ),
  });
};

  // Handle correct option selection
  const handleCorrectOptionChange = (optionId: string) => {
    setCurrentQuestion({
      ...currentQuestion,
      correctOptionId: optionId,
  });
};

  // Add a new option
  const handleAddOption = () => {
    if (currentQuestion.type !== 'multiple-choice') return;

    setCurrentQuestion({
      ...currentQuestion,
      options: [
        ...currentQuestion.options,
        {id: uuidv4(), text: ''},
      ],
  });
};

  // Remove an option
  const handleRemoveOption = (optionId: string) => {
    if (currentQuestion.options.length <= 2) return;

    setCurrentQuestion({
      ...currentQuestion,
      options: currentQuestion.options.filter(option => option.id !== optionId),
      correctOptionId: currentQuestion.correctOptionId === optionId
        ? ''
        : currentQuestion.correctOptionId,
  });
};

  // Handle explanation change
  const handleExplanationChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentQuestion({
      ...currentQuestion,
      explanation: e.target.value,
  });
};

  // Handle points change
  const handlePointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const points = parseInt(e.target.value) || 1;
    setCurrentQuestion({
      ...currentQuestion,
      points: Math.max(1, points), // Ensure at least 1 point
  });
};

  // Save the question
  const handleSave = () => {
    // Validate question
    if (!currentQuestion.text.trim()) {
      alert('Please enter a question text.');
      return;
  }

    if (currentQuestion.type !== 'text' && !currentQuestion.correctOptionId) {
      alert('Please select a correct answer.');
      return;
  }

    if (currentQuestion.type === 'multiple-choice') {
      const emptyOptions = currentQuestion.options.some(option => !option.text.trim());
      if (emptyOptions) {
        alert('Please fill in all options.');
        return;
    }
  }

    onSave(currentQuestion);
};

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-semibold text-neutral-900 mb-4">
        {question ? 'Edit Question' : 'Add Question'}
      </h2>

      <div className="space-y-4">
        {/* Question Type */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Question Type
          </label>
          <select
            value={currentQuestion.type}
            onChange={handleQuestionTypeChange}
            className="block w-full pl-3 pr-10 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300"
          >
            <option value="multiple-choice">Multiple Choice</option>
            <option value="true-false">True/False</option>
            <option value="text">Text Answer</option>
          </select>
        </div>

        {/* Question Text */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Question Text
          </label>
          <textarea
            value={currentQuestion.text}
            onChange={handleQuestionTextChange}
            rows={3}
            className="block w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300"
            placeholder="Enter your question here..."
          />
        </div>

        {/* Options (for multiple-choice and true-false) */}
        {currentQuestion.type !== 'text' && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-neutral-700">
                Answer Options
              </label>
              {currentQuestion.type === 'multiple-choice' && (
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="-ml-0.5 mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Option
                </button>
              )}
            </div>

            <div className="space-y-2">
              {currentQuestion.options.map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id={`option-${option.id}`}
                    name="correctOption"
                    checked={currentQuestion.correctOptionId === option.id}
                    onChange={() => handleCorrectOptionChange(option.id)}
                    className="h-4 w-4 text-primary focus:ring-primary-500 border-neutral-300"
                  />
                  <input
                    type="text"
                    value={option.text}
                    onChange={(e) => handleOptionTextChange(option.id, e.target.value)}
                    className="flex-1 block w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300"
                    placeholder="Option text"
                    readOnly={currentQuestion.type === 'true-false'}
                  />
                  {currentQuestion.type === 'multiple-choice' && currentQuestion.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(option.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Explanation */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Explanation (Optional)
          </label>
          <textarea
            value={currentQuestion.explanation || ''}
            onChange={handleExplanationChange}
            rows={2}
            className="block w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300"
            placeholder="Explain the correct answer..."
          />
        </div>

        {/* Points */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Points
          </label>
          <input
            type="number"
            value={currentQuestion.points}
            onChange={handlePointsChange}
            min="1"
            className="block w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center px-4 py-2 border border-neutral-300 rounded-md shadow-sm text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Save Question
        </button>
      </div>
    </div>
  );
};

export default QuestionEditor;
