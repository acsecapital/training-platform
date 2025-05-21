import React, {useState } from 'react';
import {motion } from 'framer-motion';
import {useMutation, useQueryClient } from '@tanstack/react-query';
import {updateQuizScore } from '@/services/courseProgressService';
import {useAuth } from '@/context/AuthContext';
import {FrontendQuizQuestion } from '@/types/quiz.types';

// Use our new type
export type QuestionType = FrontendQuizQuestion;

type QuizQuestionProps = {
  question: QuestionType;
  onAnswer: (questionId: string, selectedOptionId: string, isCorrect: boolean) => void;
  showResult?: boolean;
  userAnswer?: string;
  questionNumber: number;
  totalQuestions: number;
  courseId: string;
  lessonId: string;
};

const QuizQuestion: React.FC<QuizQuestionProps> = ({
  question,
  onAnswer,
  showResult = false,
  userAnswer,
  questionNumber,
  totalQuestions,
  courseId,
  lessonId,
}) => {
  const {user } = useAuth();
  const [selectedOption, setSelectedOption] = useState<string | null>(userAnswer || null);
  const [isAnswered, setIsAnswered] = useState<boolean>(!!userAnswer);
  const queryClient = useQueryClient();

  // For submitting quiz answers
  const submitQuizMutation = useMutation({
    mutationFn: (data: {userId: string, courseId: string, lessonId: string, score: number}) => 
      updateQuizScore(data.userId, data.courseId, data.lessonId, data.score),
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({queryKey: ['quizScores', user?.uid, courseId] });
      queryClient.invalidateQueries({queryKey: ['courseProgress', user?.uid, courseId] });
  }
});

  // Handle option selection
  const handleOptionSelect = (optionId: string) => {
    if (isAnswered || showResult) return;
    
    setSelectedOption(optionId);
    setIsAnswered(true);
    
    const isCorrect = optionId === question.correctOptionId;
    onAnswer(question.id, optionId, isCorrect);
};

  // Get option class based on state
  const getOptionClass = (optionId: string) => {
    const baseClass = 'p-4 border rounded-lg transition-all duration-200 cursor-pointer';
    
    if (!showResult && selectedOption === optionId) {
      return `${baseClass} border-primary-400 bg-primary-50`;
  }
    
    if (showResult) {
      if (optionId === question.correctOptionId) {
        return `${baseClass} border-green-400 bg-green-50`;
    }
      
      if (selectedOption === optionId && optionId !== question.correctOptionId) {
        return `${baseClass} border-red-400 bg-red-50`;
    }
  }
    
    return `${baseClass} border-neutral-200 hover:border-primary-300 hover:bg-primary-50`;
};

  return (
    <div className="bg-white rounded-xl shadow-soft p-6">
      {/* Question Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-neutral-500">
            Question {questionNumber} of {totalQuestions}
          </span>
          
          {showResult && (
            <span className={`text-sm font-medium px-2 py-1 rounded ${
              selectedOption === question.correctOptionId
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
          }`}>
              {selectedOption === question.correctOptionId ? 'Correct' : 'Incorrect'}
            </span>
          )}
        </div>
        
        <h3 className="text-xl font-semibold text-neutral-800">{question.text}</h3>
      </div>
      
      {/* Options */}
      <div className="space-y-3">
        {question.options.map((option) => (
          <motion.div
            key={option.id}
            className={getOptionClass(option.id)}
            onClick={() => handleOptionSelect(option.id)}
            whileHover={!isAnswered && !showResult ? {scale: 1.01 } : {}}
            whileTap={!isAnswered && !showResult ? {scale: 0.99 } : {}}
          >
            <div className="flex items-start">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${
                selectedOption === option.id
                  ? 'bg-primary text-white'
                  : 'bg-neutral-100 text-neutral-600'
            }`}>
                {String.fromCharCode(65 + question.options.indexOf(option))}
              </div>
              <span className="text-neutral-800">{option.text}</span>
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Explanation (shown after answering) */}
      {showResult && question.explanation && (
        <motion.div
          initial={{opacity: 0, height: 0 }}
          animate={{opacity: 1, height: 'auto'}}
          transition={{duration: 0.3 }}
          className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <h4 className="text-sm font-semibold text-blue-800 mb-1">Explanation</h4>
          <p className="text-sm text-blue-700">{question.explanation}</p>
        </motion.div>
      )}
    </div>
  );
};

export default QuizQuestion;





