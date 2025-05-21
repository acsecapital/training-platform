import React from 'react';
import {motion } from 'framer-motion';

type QuizProgressProps = {
  currentQuestion: number;
  totalQuestions: number;
  answeredQuestions: string[];
  onQuestionSelect?: (questionIndex: number) => void;
  showResults?: boolean;
  correctAnswers?: number;
};

const QuizProgress: React.FC<QuizProgressProps> = ({
  currentQuestion,
  totalQuestions,
  answeredQuestions,
  onQuestionSelect,
  showResults = false,
  correctAnswers = 0,
}) => {
  // Calculate progress percentage
  const progressPercentage = (answeredQuestions.length / totalQuestions) * 100;
  
  // Generate array of question numbers
  const questionNumbers = Array.from({length: totalQuestions }, (_, i) => i + 1);
  
  return (
    <div className="bg-white rounded-xl shadow-soft p-6">
      {/* Progress Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-neutral-800 mb-1">Quiz Progress</h3>
        <div className="flex justify-between items-center text-sm text-neutral-600">
          <span>{answeredQuestions.length} of {totalQuestions} questions answered</span>
          {showResults && (
            <span className="font-medium">
              Score: {correctAnswers}/{totalQuestions} ({Math.round((correctAnswers / totalQuestions) * 100)}%)
            </span>
          )}
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden mb-6">
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-primary-600"
          initial={{width: 0 }}
          animate={{width: `${progressPercentage}%` }}
          transition={{duration: 0.5, ease: "easeOut" }}
        />
      </div>
      
      {/* Question Navigation */}
      <div className="grid grid-cols-5 gap-2">
        {questionNumbers.map((num, index) => {
          const isAnswered = answeredQuestions.includes(index.toString());
          const isCurrent = currentQuestion === index;
          
          return (
            <button
              key={index}
              onClick={() => onQuestionSelect && onQuestionSelect(index)}
              className={`w-full h-10 rounded-md flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                isCurrent
                  ? 'bg-primary text-white'
                  : isAnswered
                  ? 'bg-primary-100 text-primary-800 hover:bg-primary-200'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
              disabled={!onQuestionSelect}
            >
              {num}
            </button>
          );
      })}
      </div>
      
      {/* Instructions */}
      {!showResults && (
        <div className="mt-6 text-sm text-neutral-600">
          <p className="mb-2">
            <span className="inline-block w-3 h-3 bg-primary rounded-sm mr-2"></span>
            Current question
          </p>
          <p className="mb-2">
            <span className="inline-block w-3 h-3 bg-primary-100 rounded-sm mr-2"></span>
            Answered questions
          </p>
          <p>
            <span className="inline-block w-3 h-3 bg-neutral-100 rounded-sm mr-2"></span>
            Unanswered questions
          </p>
        </div>
      )}
    </div>
  );
};

export default QuizProgress;
