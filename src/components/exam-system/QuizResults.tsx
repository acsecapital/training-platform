import React from 'react';
import {motion } from 'framer-motion';
import Button from '../ui/Button';
import {QuestionType } from './QuizQuestion';

type QuizResultsProps = {
  score: number;
  totalQuestions: number;
  passingScore: number;
  questions: QuestionType[];
  userAnswers: Record<string, string>;
  onRetake: () => void;
  onContinue: () => void;
  onViewCertificate?: () => void;
};

const QuizResults: React.FC<QuizResultsProps> = ({
  score,
  totalQuestions,
  passingScore,
  questions,
  userAnswers,
  onRetake,
  onContinue,
  onViewCertificate,
}) => {
  // Calculate percentage score
  const percentage = Math.round((score / totalQuestions) * 100);
  
  // Determine if passed
  const isPassed = percentage >= passingScore;
  
  // Get correct and incorrect questions
  const correctQuestions = questions.filter(q => userAnswers[q.id] === q.correctOptionId);
  const incorrectQuestions = questions.filter(q => userAnswers[q.id] !== q.correctOptionId);
  
  return (
    <motion.div
      initial={{opacity: 0, y: 20 }}
      animate={{opacity: 1, y: 0 }}
      transition={{duration: 0.5 }}
      className="bg-white rounded-xl shadow-card p-8"
    >
      {/* Result Header */}
      <div className="text-center mb-8">
        <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-4 ${
          isPassed ? 'bg-green-100' : 'bg-red-100'
      }`}>
          {isPassed ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>
        
        <h2 className="text-2xl font-bold mb-2">
          {isPassed ? 'Congratulations!' : 'Almost there!'}
        </h2>
        
        <p className="text-neutral-600 mb-4">
          {isPassed
            ? 'You have successfully passed the quiz.'
            : `You didn't reach the passing score. Keep learning and try again!`}
        </p>
        
        <div className="flex justify-center items-center space-x-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{score}</div>
            <div className="text-sm text-neutral-500">Correct</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-neutral-800">{totalQuestions}</div>
            <div className="text-sm text-neutral-500">Total</div>
          </div>
          
          <div className="text-center">
            <div className={`text-3xl font-bold ${isPassed ? 'text-green-600' : 'text-red-600'}`}>
              {percentage}%
            </div>
            <div className="text-sm text-neutral-500">Score</div>
          </div>
        </div>
        
        <div className="mt-4 text-sm text-neutral-600">
          Passing score: {passingScore}%
        </div>
      </div>
      
      {/* Question review */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Question Review</h3>
        
        {questions.map((question, index) => {
          // Use either text or question property
          const questionText = question.text || question.question || '';
          // Use either correctOptionId or correctAnswer
          const correctAnswer = question.correctOptionId || question.correctAnswer || '';
          const userAnswer = userAnswers[question.id];
          const isCorrect = userAnswer === correctAnswer;
          
          return (
            <div key={question.id} className={`p-3 rounded-lg ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className="text-sm font-medium text-neutral-800">{questionText}</p>
              <p className="text-xs text-neutral-700 mt-1">
                Your answer: {question.options.find(o => o.id === userAnswer)?.text || 'Not answered'}
              </p>
              {isCorrect ? (
                <p className="text-xs text-green-700 mt-1">Correct! Well done.</p>
              ) : (
                <div>
                  <p className="text-xs text-red-700 mt-1">Incorrect! The correct answer is:</p>
                  <p className="text-xs text-green-700 mt-1">
                    {question.options.find(o => o.id === correctAnswer)?.text}
                  </p>
                  {question.explanation && (
                    <p className="text-xs text-blue-700 mt-2 p-2 bg-blue-50 rounded">
                      {question.explanation}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
      })}
      </div>
      
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          onClick={onRetake}
          variant="outline"
          fullWidth
        >
          Retake Quiz
        </Button>
        
        {isPassed && onViewCertificate && (
          <Button
            onClick={onViewCertificate}
            variant="secondary"
            fullWidth
          >
            View Certificate
          </Button>
        )}
        
        <Button
          onClick={onContinue}
          variant="primary"
          fullWidth
        >
          {isPassed ? 'Continue to Next Module' : 'Review Material'}
        </Button>
      </div>
    </motion.div>
  );
};

export default QuizResults;


