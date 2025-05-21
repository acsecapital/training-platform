import React, {useState, useEffect } from 'react';
import {v4 as uuidv4 } from 'uuid';
import QuestionEditor, {Question } from './QuestionEditor';

export interface Quiz {
  courseName: unknown;
  moduleName: unknown;
  id: string;
  title: string;
  description: string;
  courseId?: string;
  moduleId?: string;
  timeLimit?: number;
  passingScore: number;
  questions: Question[];
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
}

interface Course {
  id: string;
  title: string;
  modules: {
    id: string;
    title: string;
}[];
}

interface QuizBuilderProps {
  initialQuiz?: Quiz;
  courses: Course[];
  onSave: (quiz: Quiz) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

const QuizBuilder: React.FC<QuizBuilderProps> = ({
  initialQuiz,
  courses,
  onSave,
  onCancel,
  isEditing = false,
}) => {
  // Initialize quiz state
  const [quizData, setQuizData] = useState<Quiz>(
    initialQuiz || {
      id: uuidv4(),
      title: '',
      description: '',
      passingScore: 70,
      questions: [],
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      courseName: '', // Add missing required property
      moduleName: '', // Add missing required property
  }
  );

  // State for editing questions
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [showQuestionEditor, setShowQuestionEditor] = useState(false);

  // State for available modules
  const [availableModules, setAvailableModules] = useState<{id: string; title: string }[]>([]);

  // Update available modules when course changes
  useEffect(() => {
    if (quizData.courseId) {
      const selectedCourse = courses.find(course => course.id === quizData.courseId);
      setAvailableModules(selectedCourse?.modules || []);

      // Clear module selection if the selected module is not in the new course
      if (quizData.moduleId && !selectedCourse?.modules.some(module => module.id === quizData.moduleId)) {
        setQuizData(prev => ({...prev, moduleId: undefined }));
    }
  } else {
      setAvailableModules([]);
      setQuizData(prev => ({...prev, moduleId: undefined }));
  }
}, [quizData.courseId, courses]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const {name, value } = e.target;
    setQuizData(prev => ({...prev, [name]: value }));
};

  // Handle number input changes
  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {name, value } = e.target;
    const numberValue = parseInt(value);

    if (!isNaN(numberValue)) {
      setQuizData(prev => ({...prev, [name]: numberValue }));
  }
};

  // Add a new question
  const handleAddQuestion = (type: Question['type']) => {
    let newQuestion: Question;

    if (type === 'multiple-choice') {
      newQuestion = {
        id: uuidv4(),
        text: '',
        type: 'multiple-choice',
        options: [
          {id: uuidv4(), text: ''},
          {id: uuidv4(), text: ''},
        ],
        correctOptionId: '',
        points: 1,
    };
  } else if (type === 'true-false') {
      newQuestion = {
        id: uuidv4(),
        text: '',
        type: 'true-false',
        options: [
          {id: uuidv4(), text: 'True'},
          {id: uuidv4(), text: 'False'},
        ],
        correctOptionId: '',
        points: 1,
    };
  } else {
      newQuestion = {
        id: uuidv4(),
        text: '',
        type: 'text',
        options: [],
        correctOptionId: '',
        points: 1,
    };
  }

    setEditingQuestion(newQuestion);
    setEditingQuestionIndex(null);
    setShowQuestionEditor(true);
};

  // Edit an existing question
  const handleEditQuestion = (index: number) => {
    console.log(`Editing question at index ${index}`);
    const questionToEdit = {...quizData.questions[index] };
    console.log('Question to edit:', questionToEdit);

    // Force a reset of the editor state before setting new values
    setShowQuestionEditor(false);
    setEditingQuestion(null);
    setEditingQuestionIndex(null);

    // Use setTimeout to ensure state updates have been processed
    setTimeout(() => {
      setEditingQuestion(questionToEdit);
      setEditingQuestionIndex(index);
      setShowQuestionEditor(true);

      // Scroll to the editor
      const editorElement = document.getElementById('question-editor');
      if (editorElement) {
        editorElement.scrollIntoView({behavior: 'smooth', block: 'start'});
    }
  }, 50);
};

  // Delete a question
  const handleDeleteQuestion = (index: number) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      const updatedQuestions = [...quizData.questions];
      updatedQuestions.splice(index, 1);
      setQuizData(prev => ({...prev, questions: updatedQuestions }));
  }
};

  // Save a question
  const handleSaveQuestion = (question: Question) => {
    let updatedQuestions: Question[];

    if (editingQuestionIndex !== null) {
      // Update existing question
      updatedQuestions = [...quizData.questions];
      updatedQuestions[editingQuestionIndex] = question;
  } else {
      // Add new question
      updatedQuestions = [...quizData.questions, question];
  }

    setQuizData(prev => ({...prev, questions: updatedQuestions }));
    setEditingQuestion(null);
    setEditingQuestionIndex(null);
    setShowQuestionEditor(false);
};

  // Cancel question editing
  const handleCancelQuestion = () => {
    setEditingQuestion(null);
    setEditingQuestionIndex(null);
    setShowQuestionEditor(false);
};

  // Save the quiz
  const handleSaveQuiz = () => {
    // Validate quiz
    if (!quizData.title.trim()) {
      alert('Please enter a quiz title.');
      return;
  }

    if (quizData.questions.length === 0) {
      alert('Please add at least one question to the quiz.');
      return;
  }

    // Update timestamps
    const updatedQuiz: Quiz = {
      ...quizData,
      updatedAt: new Date().toISOString(),
  };

    onSave(updatedQuiz);
};

  // Calculate total points
  const totalPoints = quizData.questions.reduce((sum, question) => sum + question.points, 0);

  return (
    <div className="space-y-6">
      {/* Quiz Details */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Quiz Details</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Quiz Title
            </label>
            <input
              type="text"
              name="title"
              value={quizData.title}
              onChange={handleInputChange}
              className="block w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300"
              placeholder="Enter quiz title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Passing Score (%)
            </label>
            <input
              type="number"
              name="passingScore"
              value={quizData.passingScore}
              onChange={handleNumberInputChange}
              min="0"
              max="100"
              className="block w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={quizData.description}
            onChange={handleInputChange}
            rows={3}
            className="block w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300"
            placeholder="Enter quiz description"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Time Limit (minutes, 0 for no limit)
            </label>
            <input
              type="number"
              name="timeLimit"
              value={quizData.timeLimit || 0}
              onChange={handleNumberInputChange}
              min="0"
              className="block w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Course
            </label>
            <select
              name="courseId"
              value={quizData.courseId || ''}
              onChange={handleInputChange}
              className="block w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300"
            >
              <option value="">Select a course</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Module
            </label>
            <select
              name="moduleId"
              value={quizData.moduleId || ''}
              onChange={handleInputChange}
              disabled={!quizData.courseId || availableModules.length === 0}
              className="block w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300"
            >
              <option value="">Select a module</option>
              {availableModules.map(module => (
                <option key={module.id} value={module.id}>{module.title}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-neutral-900">
            Questions ({quizData.questions.length})
          </h2>

          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => handleAddQuestion('multiple-choice')}
              className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Multiple Choice
            </button>

            <button
              type="button"
              onClick={() => handleAddQuestion('true-false')}
              className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              True/False
            </button>

            <button
              type="button"
              onClick={() => handleAddQuestion('text')}
              className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Text Answer
            </button>
          </div>
        </div>

        {quizData.questions.length === 0 ? (
          <div className="text-center py-8 text-neutral-500">
            No questions added yet. Use the buttons above to add questions.
          </div>
        ) : (
          <div className="space-y-4">
            {quizData.questions.map((question, index) => (
              <div key={question.id} className="border border-neutral-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-neutral-500 mr-2">
                        Question {index + 1}
                      </span>
                      <span className="text-xs font-medium text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                        {question.type === 'multiple-choice'
                          ? 'Multiple Choice'
                          : question.type === 'true-false'
                          ? 'True/False'
                          : 'Text Answer'}
                      </span>
                      <span className="ml-2 text-xs font-medium text-primary-700 bg-primary-50 px-2 py-0.5 rounded">
                        {question.points} {question.points === 1 ? 'point' : 'points'}
                      </span>
                    </div>
                    <p className="mt-1 text-neutral-900">{question.text}</p>

                    {question.type !== 'text' && (
                      <div className="mt-2 space-y-1">
                        {question.options.map(option => (
                          <div key={option.id} className="flex items-center">
                            <span className={`inline-block w-4 h-4 rounded-full mr-2 ${
                              option.id === question.correctOptionId
                                ? 'bg-green-500'
                                : 'bg-neutral-200'
                          }`}></span>
                            <span className={`text-sm ${
                              option.id === question.correctOptionId
                                ? 'font-medium'
                                : ''
                          }`}>
                              {option.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {question.explanation && (
                      <div className="mt-2 text-sm text-neutral-500">
                        <span className="font-medium">Explanation:</span> {question.explanation}
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => handleEditQuestion(index)}
                      className="flex items-center px-3 py-1 rounded-md text-white bg-primary hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm transition-all duration-200"
                      aria-label="Edit question"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteQuestion(index)}
                      className="flex items-center px-3 py-1 rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 shadow-sm transition-all duration-200"
                      aria-label="Delete question"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {quizData.questions.length > 0 && (
          <div className="mt-4 pt-4 border-t border-neutral-200 flex justify-between items-center">
            <div className="text-sm text-neutral-500">
              Total: {quizData.questions.length} questions, {totalPoints} points
            </div>

            <button
              type="button"
              onClick={() => handleAddQuestion('multiple-choice')}
              className="inline-flex items-center px-3 py-2 border border-transparent rounded-md text-sm font-medium text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Question
            </button>
          </div>
        )}
      </div>

      {/* Question Editor */}
      <div id="question-editor">
        {showQuestionEditor && (
          <div className="border-2 border-primary-300 rounded-xl animate-fadeIn">
            <QuestionEditor
              question={editingQuestion}
              onSave={handleSaveQuestion}
              onCancel={handleCancelQuestion}
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center px-4 py-2 border border-neutral-300 rounded-md shadow-sm text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSaveQuiz}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          {isEditing ? 'Update Quiz' : 'Save Quiz'}
        </button>
      </div>
    </div>
  );
};

export default QuizBuilder;

