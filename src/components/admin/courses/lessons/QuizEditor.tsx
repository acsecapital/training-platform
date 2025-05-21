import React, {useState, useEffect } from 'react';
import {v4 as uuidv4 } from 'uuid';
import Button from '@/components/ui/Button';

export interface QuizQuestion {
  question: string;
  correctAnswer: string;
  id: string;
  text: string;
  options: {
    id: string;
    text: string;
}[];
  correctOptionId: string;
  explanation?: string;
}

interface QuizEditorProps {
  initialQuestions?: QuizQuestion[];
  onChange: (questions: QuizQuestion[]) => void;
  readOnly?: boolean;
}

const QuizEditor: React.FC<QuizEditorProps> = ({
  initialQuestions = [],
  onChange,
  readOnly = false,
}) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>(initialQuestions);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number | null>(
    initialQuestions.length > 0 ? 0 : null
  );

  // Update parent component when questions change
  useEffect(() => {
    onChange(questions);
}, [questions, onChange]);

  // Add a new question
  const handleAddQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: uuidv4(),
      text: '',
      options: [
        {id: uuidv4(), text: ''},
        {id: uuidv4(), text: ''},
        {id: uuidv4(), text: ''},
        {id: uuidv4(), text: ''},
      ],
      correctOptionId: '',
      explanation: '',
      question: '',
      correctAnswer: ''
  };

    setQuestions([...questions, newQuestion]);
    setActiveQuestionIndex(questions.length);
};

  // Delete a question
  const handleDeleteQuestion = (index: number) => {
    if (readOnly) return;
    
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    setQuestions(newQuestions);

    // Update active question index
    if (activeQuestionIndex === index) {
      setActiveQuestionIndex(index < newQuestions.length ? index : newQuestions.length - 1);
  } else if (activeQuestionIndex !== null && activeQuestionIndex > index) {
      setActiveQuestionIndex(activeQuestionIndex - 1);
  }
};

  // Update question text
  const handleQuestionTextChange = (index: number, text: string) => {
    if (readOnly) return;
    
    const newQuestions = [...questions];
    newQuestions[index].text = text;
    setQuestions(newQuestions);
};

  // Update option text
  const handleOptionTextChange = (questionIndex: number, optionIndex: number, text: string) => {
    if (readOnly) return;
    
    const newQuestions = [...questions];
    newQuestions[questionIndex].options[optionIndex].text = text;
    setQuestions(newQuestions);
};

  // Set correct option
  const handleSetCorrectOption = (questionIndex: number, optionId: string) => {
    if (readOnly) return;
    
    const newQuestions = [...questions];
    newQuestions[questionIndex].correctOptionId = optionId;
    setQuestions(newQuestions);
};

  // Update explanation
  const handleExplanationChange = (index: number, explanation: string) => {
    if (readOnly) return;
    
    const newQuestions = [...questions];
    newQuestions[index].explanation = explanation;
    setQuestions(newQuestions);
};

  // Add a new option to a question
  const handleAddOption = (questionIndex: number) => {
    if (readOnly) return;
    
    const newQuestions = [...questions];
    newQuestions[questionIndex].options.push({
      id: uuidv4(),
      text: '',
  });
    setQuestions(newQuestions);
};

  // Delete an option from a question
  const handleDeleteOption = (questionIndex: number, optionIndex: number) => {
    if (readOnly) return;
    
    const newQuestions = [...questions];
    const optionId = newQuestions[questionIndex].options[optionIndex].id;
    
    // Remove the option
    newQuestions[questionIndex].options.splice(optionIndex, 1);
    
    // If the deleted option was the correct one, reset the correct option
    if (newQuestions[questionIndex].correctOptionId === optionId) {
      newQuestions[questionIndex].correctOptionId = '';
  }
    
    setQuestions(newQuestions);
};

  return (
    <div className="space-y-6">
      {/* Question List */}
      <div className="flex flex-wrap gap-2 mb-4">
        {questions.map((question, index) => (
          <button
            key={question.id}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              activeQuestionIndex === index
                ? 'bg-primary text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
          }`}
            onClick={() => setActiveQuestionIndex(index)}
          >
            Question {index + 1}
          </button>
        ))}
        
        {!readOnly && (
          <button
            className="px-3 py-1 rounded-md text-sm font-medium bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
            onClick={handleAddQuestion}
          >
            <span className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Question
            </span>
          </button>
        )}
      </div>

      {/* Active Question Editor */}
      {activeQuestionIndex !== null && activeQuestionIndex < questions.length ? (
        <div className="bg-white border border-neutral-200 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Question {activeQuestionIndex + 1}</h3>
            {!readOnly && (
              <button
                className="text-red-600 hover:text-red-800"
                onClick={() => handleDeleteQuestion(activeQuestionIndex)}
              >
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Delete Question
                </span>
              </button>
            )}
          </div>

          {/* Question Text */}
          <div className="mb-6">
            <label htmlFor={`question-${activeQuestionIndex}`} className="block text-sm font-medium text-neutral-700 mb-1">
              Question Text <span className="text-red-500">*</span>
            </label>
            <textarea
              id={`question-${activeQuestionIndex}`}
              value={questions[activeQuestionIndex].text}
              onChange={(e) => handleQuestionTextChange(activeQuestionIndex, e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter your question here"
              rows={3}
              disabled={readOnly}
              required
            />
          </div>

          {/* Options */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-neutral-700">
                Answer Options <span className="text-red-500">*</span>
              </label>
              {!readOnly && questions[activeQuestionIndex].options.length < 8 && (
                <button
                  className="text-primary hover:text-primary-700 text-sm font-medium"
                  onClick={() => handleAddOption(activeQuestionIndex)}
                >
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Add Option
                  </span>
                </button>
              )}
            </div>

            <div className="space-y-3">
              {questions[activeQuestionIndex].options.map((option, optionIndex) => (
                <div key={option.id} className="flex items-center">
                  <input
                    type="radio"
                    id={`option-${activeQuestionIndex}-${optionIndex}`}
                    name={`correct-option-${activeQuestionIndex}`}
                    checked={questions[activeQuestionIndex].correctOptionId === option.id}
                    onChange={() => handleSetCorrectOption(activeQuestionIndex, option.id)}
                    className="h-4 w-4 text-primary focus:ring-primary-500 border-neutral-300"
                    disabled={readOnly}
                  />
                  <div className="ml-2 flex-1">
                    <input
                      type="text"
                      value={option.text}
                      onChange={(e) => handleOptionTextChange(activeQuestionIndex, optionIndex, e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder={`Option ${optionIndex + 1}`}
                      disabled={readOnly}
                      required
                    />
                  </div>
                  {!readOnly && questions[activeQuestionIndex].options.length > 2 && (
                    <button
                      className="ml-2 text-red-600 hover:text-red-800"
                      onClick={() => handleDeleteOption(activeQuestionIndex, optionIndex)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            {questions[activeQuestionIndex].correctOptionId === '' && (
              <p className="mt-2 text-sm text-red-600">
                Please select the correct answer option.
              </p>
            )}
          </div>

          {/* Explanation */}
          <div>
            <label htmlFor={`explanation-${activeQuestionIndex}`} className="block text-sm font-medium text-neutral-700 mb-1">
              Explanation (Optional)
            </label>
            <textarea
              id={`explanation-${activeQuestionIndex}`}
              value={questions[activeQuestionIndex].explanation || ''}
              onChange={(e) => handleExplanationChange(activeQuestionIndex, e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Explain why this answer is correct (shown after answering)"
              rows={3}
              disabled={readOnly}
            />
          </div>
        </div>
      ) : (
        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-6 text-center">
          {questions.length === 0 ? (
            <div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-neutral-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-medium text-neutral-700 mb-2">No Questions Yet</h3>
              <p className="text-neutral-500 mb-4">
                Start by adding your first question to this quiz.
              </p>
              {!readOnly && (
                <Button
                  variant="primary"
                  onClick={handleAddQuestion}
                >
                  Add First Question
                </Button>
              )}
            </div>
          ) : (
            <div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-neutral-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-medium text-neutral-700 mb-2">Select a Question</h3>
              <p className="text-neutral-500">
                Click on a question above to edit its details.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuizEditor;
