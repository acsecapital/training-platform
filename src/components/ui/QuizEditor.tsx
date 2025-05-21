import React, {useState, useEffect } from 'react';
import Button from './Button';
import {DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'matching' | 'short_answer';
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  points: number;
}

interface QuizEditorProps {
  initialQuestions: QuizQuestion[];
  onChange: (questions: QuizQuestion[]) => void;
  readOnly?: boolean;
}

const QuizEditor: React.FC<QuizEditorProps> = ({
  initialQuestions = [],
  onChange,
  readOnly = false
}) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>(initialQuestions);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  // Update questions when initialQuestions changes
  useEffect(() => {
    setQuestions(initialQuestions);
}, [initialQuestions]);

  // Generate a unique ID for a new question
  const generateQuestionId = (): string => {
    return `q_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
};

  // Add a new question
  const handleAddQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: generateQuestionId(),
      question: '',
      type: 'multiple_choice',
      options: ['', ''],
      correctAnswer: '',
      points: 1
  };

    const updatedQuestions = [...questions, newQuestion];
    setQuestions(updatedQuestions);
    onChange(updatedQuestions);
    setEditingQuestionId(newQuestion.id);
};

  // Update a question
  const handleUpdateQuestion = (updatedQuestion: QuizQuestion) => {
    const updatedQuestions = questions.map(q =>
      q.id === updatedQuestion.id ? updatedQuestion : q
    );
    setQuestions(updatedQuestions);
    onChange(updatedQuestions);
};

  // Delete a question
  const handleDeleteQuestion = (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    const updatedQuestions = questions.filter(q => q.id !== questionId);
    setQuestions(updatedQuestions);
    onChange(updatedQuestions);

    if (editingQuestionId === questionId) {
      setEditingQuestionId(null);
  }
};

  // Handle drag and drop reordering
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(questions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setQuestions(items);
    onChange(items);
};

  return (
    <div className="space-y-6">
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="questions">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-4"
            >
              {questions.length === 0 ? (
                <div className="text-center p-6 bg-neutral-50 border border-dashed border-neutral-300 rounded-md">
                  <p className="text-neutral-500">No questions added yet. Add your first question to get started.</p>
                </div>
              ) : (
                questions.map((question, index) => (
                  <Draggable
                    key={question.id}
                    draggableId={question.id}
                    index={index}
                    isDragDisabled={readOnly}
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="border border-neutral-200 rounded-md overflow-hidden"
                      >
                        {/* Question Header */}
                        <div className="bg-neutral-50 p-3 flex items-center justify-between border-b border-neutral-200">
                          <div className="flex items-center">
                            {!readOnly && (
                              <div
                                {...provided.dragHandleProps}
                                className="mr-3 cursor-move text-neutral-400 hover:text-neutral-600"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                              </div>
                            )}
                            <h3 className="text-base font-medium text-neutral-900">
                              Question {index + 1}
                              {question.type === 'multiple_choice' && ' (Multiple Choice)'}
                              {question.type === 'true_false' && ' (True/False)'}
                              {question.type === 'matching' && ' (Matching)'}
                              {question.type === 'short_answer' && ' (Short Answer)'}
                            </h3>
                          </div>

                          {!readOnly && (
                            <div className="flex space-x-2">
                              <button
                                type="button"
                                onClick={() => setEditingQuestionId(editingQuestionId === question.id ? null : question.id)}
                                className="text-sm text-neutral-600 hover:text-neutral-900"
                              >
                                {editingQuestionId === question.id ? 'Done' : 'Edit'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteQuestion(question.id)}
                                className="text-sm text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Question Content */}
                        <div className="p-4">
                          {editingQuestionId === question.id ? (
                            <QuestionEditor
                              question={question}
                              onChange={handleUpdateQuestion}
                            />
                          ) : (
                            <QuestionPreview question={question} />
                          )}
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {!readOnly && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={handleAddQuestion}
          >
            <span className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Question
            </span>
          </Button>
        </div>
      )}
    </div>
  );
};

interface QuestionEditorProps {
  question: QuizQuestion;
  onChange: (question: QuizQuestion) => void;
}

const QuestionEditor: React.FC<QuestionEditorProps> = ({question, onChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const {name, value } = e.target;

    if (name === 'type') {
      // Reset options and correctAnswer when changing question type
      const updatedQuestion: QuizQuestion = {
        ...question,
        type: value as QuizQuestion['type']
    };

      if (value === 'multiple_choice') {
        updatedQuestion.options = ['', ''];
        updatedQuestion.correctAnswer = '';
    } else if (value === 'true_false') {
        updatedQuestion.options = ['True', 'False'];
        updatedQuestion.correctAnswer = 'True';
    } else if (value === 'matching') {
        updatedQuestion.options = ['', ''];
        updatedQuestion.correctAnswer = ['', ''];
    } else if (value === 'short_answer') {
        updatedQuestion.options = undefined;
        updatedQuestion.correctAnswer = '';
    }

      onChange(updatedQuestion);
  } else if (name === 'points') {
      onChange({
        ...question,
        points: parseInt(value) || 1
    });
  } else {
      onChange({
        ...question,
        [name]: value
    });
  }
};

  const handleOptionChange = (index: number, value: string) => {
    if (!question.options) return;

    const updatedOptions = [...question.options];
    updatedOptions[index] = value;

    onChange({
      ...question,
      options: updatedOptions
  });
};

  const handleAddOption = () => {
    if (!question.options) return;

    onChange({
      ...question,
      options: [...question.options, '']
  });
};

  const handleRemoveOption = (index: number) => {
    if (!question.options || question.options.length <= 2) return;

    const updatedOptions = [...question.options];
    updatedOptions.splice(index, 1);

    // Update correctAnswer if it was the removed option
    let updatedCorrectAnswer = question.correctAnswer;
    if (typeof updatedCorrectAnswer === 'string' && updatedCorrectAnswer === question.options[index]) {
      updatedCorrectAnswer = '';
  }

    onChange({
      ...question,
      options: updatedOptions,
      correctAnswer: updatedCorrectAnswer
  });
};

  const handleCorrectAnswerChange = (value: string) => {
    onChange({
      ...question,
      correctAnswer: value
  });
};

  return (
    <div className="space-y-4">
      {/* Question Text */}
      <div>
        <label htmlFor={`question-${question.id}`} className="block text-sm font-medium text-neutral-700 mb-1">
          Question Text <span className="text-red-500">*</span>
        </label>
        <textarea
          id={`question-${question.id}`}
          name="question"
          value={question.question}
          onChange={handleChange}
          rows={2}
          className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="Enter your question here"
          required
        />
      </div>

      {/* Question Type */}
      <div>
        <label htmlFor={`type-${question.id}`} className="block text-sm font-medium text-neutral-700 mb-1">
          Question Type
        </label>
        <select
          id={`type-${question.id}`}
          name="type"
          value={question.type}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="multiple_choice">Multiple Choice</option>
          <option value="true_false">True/False</option>
          <option value="short_answer">Short Answer</option>
          <option value="matching">Matching (Coming Soon)</option>
        </select>
      </div>

      {/* Points */}
      <div>
        <label htmlFor={`points-${question.id}`} className="block text-sm font-medium text-neutral-700 mb-1">
          Points
        </label>
        <input
          type="number"
          id={`points-${question.id}`}
          name="points"
          value={question.points}
          onChange={handleChange}
          min={1}
          max={100}
          className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Options for Multiple Choice and True/False */}
      {(question.type === 'multiple_choice' || question.type === 'true_false') && question.options && (
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Options
          </label>
          <div className="space-y-2">
            {question.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="radio"
                  id={`correct-${question.id}-${index}`}
                  name={`correct-${question.id}`}
                  checked={question.correctAnswer === option}
                  onChange={() => handleCorrectAnswerChange(option)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300"
                  disabled={option === ''}
                />
                <input
                  type="text"
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder={`Option ${index + 1}`}
                  readOnly={question.type === 'true_false'}
                />
                {question.type === 'multiple_choice' && (
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(index)}
                    className="text-neutral-400 hover:text-neutral-600"
                    disabled={question.options ? question.options.length <= 2 : true}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>

          {question.type === 'multiple_choice' && (
            <button
              type="button"
              onClick={handleAddOption}
              className="mt-2 text-sm text-primary-600 hover:text-primary-900"
            >
              + Add Option
            </button>
          )}
        </div>
      )}

      {/* Correct Answer for Short Answer */}
      {question.type === 'short_answer' && (
        <div>
          <label htmlFor={`correct-${question.id}`} className="block text-sm font-medium text-neutral-700 mb-1">
            Correct Answer
          </label>
          <input
            type="text"
            id={`correct-${question.id}`}
            value={typeof question.correctAnswer === 'string' ? question.correctAnswer : ''}
            onChange={(e) => handleCorrectAnswerChange(e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Enter the correct answer"
          />
          <p className="mt-1 text-sm text-neutral-500">
            Student's answer must match exactly. Consider using lowercase and simple wording.
          </p>
        </div>
      )}

      {/* Explanation */}
      <div>
        <label htmlFor={`explanation-${question.id}`} className="block text-sm font-medium text-neutral-700 mb-1">
          Explanation (Optional)
        </label>
        <textarea
          id={`explanation-${question.id}`}
          name="explanation"
          value={question.explanation || ''}
          onChange={handleChange}
          rows={2}
          className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="Explain why the answer is correct (shown after answering)"
        />
      </div>
    </div>
  );
};

interface QuestionPreviewProps {
  question: QuizQuestion;
}

const QuestionPreview: React.FC<QuestionPreviewProps> = ({question }) => {
  return (
    <div className="space-y-3">
      <div className="font-medium">{question.question}</div>

      {question.type === 'multiple_choice' && question.options && (
        <div className="space-y-2">
          {question.options.map((option, index) => (
            <div key={index} className="flex items-center space-x-2">
              <input
                type="radio"
                checked={question.correctAnswer === option}
                readOnly
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300"
              />
              <span className={question.correctAnswer === option ? 'font-medium text-green-700' : ''}>
                {option || `(Empty option ${index + 1})`}
              </span>
            </div>
          ))}
        </div>
      )}

      {question.type === 'true_false' && (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              checked={question.correctAnswer === 'True'}
              readOnly
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300"
            />
            <span className={question.correctAnswer === 'True' ? 'font-medium text-green-700' : ''}>
              True
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              checked={question.correctAnswer === 'False'}
              readOnly
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300"
            />
            <span className={question.correctAnswer === 'False' ? 'font-medium text-green-700' : ''}>
              False
            </span>
          </div>
        </div>
      )}

      {question.type === 'short_answer' && (
        <div>
          <div className="px-3 py-2 border border-neutral-300 rounded-md bg-neutral-50">
            <span className="text-neutral-500">Correct answer: </span>
            <span className="font-medium">{question.correctAnswer}</span>
          </div>
        </div>
      )}

      {question.explanation && (
        <div className="mt-2 text-sm bg-yellow-50 border border-yellow-200 p-2 rounded-md">
          <span className="font-medium">Explanation: </span>
          {question.explanation}
        </div>
      )}

      <div className="text-sm text-neutral-500">
        Points: {question.points}
      </div>
    </div>
  );
};

export default QuizEditor;
