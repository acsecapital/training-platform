import React, {useState } from 'react';
import {QuestionType } from '@/components/exam-system/QuizQuestion';
import QuizQuestion from '@/components/exam-system/QuizQuestion';
import QuizResults from '@/components/exam-system/QuizResults';

interface QuizComponentProps {
  quiz: {
    questions: QuestionType[];
    passingScore?: number;
};
  onComplete: () => void;
  courseId: string;
  lessonId: string;
}

const QuizComponent: React.FC<QuizComponentProps> = ({
  quiz, 
  onComplete,
  courseId,
  lessonId
}) => {
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  
  const handleAnswerSelect = (questionId: string, optionId: string, isCorrect: boolean) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: optionId
  }));
};
  
  const handleSubmitQuiz = () => {
    const questions = quiz.questions || [];
    let score = 0;
    
    questions.forEach(question => {
      if (userAnswers[question.id] === question.correctOptionId) {
        score++;
    }
  });
    
    setQuizScore(score);
    setQuizSubmitted(true);
};
  
  const handleRetake = () => {
    setUserAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
};
  
  // Use a default passing score of 70% only if not provided
  const passingScore = quiz.passingScore ?? 70;
  const questions = quiz.questions || [];
  const allQuestionsAnswered = questions.length > 0 && 
    questions.every(q => userAnswers[q.id]);
  
  if (!quizSubmitted) {
    return (
      <div className="space-y-8">
        {questions.map((question, index) => (
          <div key={question.id} className="bg-white rounded-lg shadow-sm p-6">
            <QuizQuestion
              question={question}
              questionNumber={index + 1}
              totalQuestions={questions.length}
              userAnswer={userAnswers[question.id]}
              onAnswer={handleAnswerSelect}
              courseId={courseId}
              lessonId={lessonId}
            />
          </div>
        ))}
        
        <div className="flex justify-end mt-6">
          <button
            onClick={handleSubmitQuiz}
            disabled={!allQuestionsAnswered}
            className={`px-6 py-2 rounded-md font-medium ${
              allQuestionsAnswered 
                ? 'bg-primary text-white hover:bg-primary-dark' 
                : 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
          }`}
          >
            Submit Quiz
          </button>
        </div>
      </div>
    );
} else {
    return (
      <QuizResults
        score={quizScore}
        totalQuestions={questions.length}
        passingScore={passingScore}
        questions={questions}
        userAnswers={userAnswers}
        onRetake={handleRetake}
        onContinue={onComplete}
      />
    );
}
};

export default QuizComponent;


