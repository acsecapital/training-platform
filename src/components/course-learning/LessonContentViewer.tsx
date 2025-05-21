import React, {useState } from 'react';
import VideoPlayer from '@/components/video-player/VideoPlayer';
import QuizQuestion, {QuestionType } from '@/components/exam-system/QuizQuestion';
import QuizResults from '@/components/exam-system/QuizResults';
import {AdminQuizQuestion, adaptAdminQuestionToFrontend } from '@/types/quiz.types';

interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'text' | 'quiz';
  content: string;
  videoId?: string;
  duration: number;
  isCompleted?: boolean;
  questions?: AdminQuizQuestion[];
}

interface LessonContentViewerProps {
  lesson: Lesson;
  onComplete: () => void;
  courseId: string; // Add courseId prop
}

const LessonContentViewer: React.FC<LessonContentViewerProps> = ({
  lesson,
  onComplete,
  courseId, // Add courseId prop
}) => {
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [videoProgress, setVideoProgress] = useState(0);

  // Handle video progress update
  const handleVideoProgress = (progress: number) => {
    setVideoProgress(progress);

    // Auto-complete when video reaches 95%
    if (progress >= 95 && !lesson.isCompleted) {
      onComplete();
  }
};

  // Handle quiz answer selection
  const handleAnswerSelect = (questionId: string, optionId: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: optionId,
  }));
};

  // Handle quiz submission
  const handleQuizSubmit = () => {
    if (!lesson.questions) return;

    let score = 0;
    const totalQuestions = lesson.questions.length;

    // Calculate score
    lesson.questions.forEach(question => {
      // AdminQuizQuestion uses correctAnswer, not correctOptionId
      const correctAnswer = question.correctAnswer || '';
      if (userAnswers[question.id] === correctAnswer) {
        score++;
    }
  });

    setQuizScore(score);
    setQuizSubmitted(true);

    // Auto-complete if passing score (70%)
    const percentage = (score / totalQuestions) * 100;
    if (percentage >= 70 && !lesson.isCompleted) {
      onComplete();
  }
};

  // Render based on lesson type
  const renderContent = () => {
    switch (lesson.type) {
      case 'video':
        return (
          <div className="mb-8">
            <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4">
              <VideoPlayer
                videoId={lesson.videoId || ''}
                title={lesson.title}
                onProgress={handleVideoProgress}
                onComplete={onComplete}
              />
            </div>

            {videoProgress > 0 && videoProgress < 95 && (
              <div className="mt-4">
                <div className="w-full bg-neutral-200 rounded-full h-2 mb-1">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{width: `${videoProgress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-neutral-500">
                  <span>{Math.round(videoProgress)}% complete</span>
                  <span>Watch at least 95% to complete</span>
                </div>
              </div>
            )}

            {lesson.content && (
              <div
                className="prose max-w-none mt-6"
                dangerouslySetInnerHTML={{__html: lesson.content }}
              />
            )}
          </div>
        );

      case 'quiz':
        if (!quizSubmitted) {
          return (
            <div className="mb-8">
              {lesson.content && (
                <div
                  className="prose max-w-none mb-8"
                  dangerouslySetInnerHTML={{__html: lesson.content }}
                />
              )}

              {lesson.questions && lesson.questions.length > 0 ? (
                <div className="space-y-8">
                  {lesson.questions.map((adminQuestion, index) => {
                    // Convert admin question to frontend format
                    const question = adaptAdminQuestionToFrontend(adminQuestion);

                    return (
                      <div key={question.id} className="bg-neutral-50 rounded-lg p-6">
                        <QuizQuestion
                          question={question}
                          questionNumber={index + 1}
                          totalQuestions={lesson.questions?.length || 0}
                          userAnswer={userAnswers[question.id]}
                          onAnswer={(questionId, optionId, isCorrect) => handleAnswerSelect(questionId, optionId)}
                          courseId={courseId}
                          lessonId={lesson.id}
                        />
                      </div>
                    );
                })}

                  <div className="flex justify-end">
                    <button
                      className="px-6 py-2 bg-primary text-white rounded-md font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleQuizSubmit}
                      disabled={Object.keys(userAnswers).length < (lesson.questions?.length || 0)}
                    >
                      Submit Quiz
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md">
                  No questions available for this quiz.
                </div>
              )}
            </div>
          );
      } else {
          return (
            <div className="mb-8">
              <QuizResults
                score={quizScore}
                totalQuestions={lesson.questions?.length || 0}
                passingScore={70}
                questions={(lesson.questions || []).map(adaptAdminQuestionToFrontend)}
                userAnswers={userAnswers}
                onRetake={() => {
                  setUserAnswers({});
                  setQuizSubmitted(false);
                  setQuizScore(0);
              }}
                onContinue={() => {
                  // Already handled by auto-complete
              }}
              />
            </div>
          );
      }

      default: // text
        return (
          <div className="mb-8">
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{__html: lesson.content }}
            />
          </div>
        );
  }
};

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
      {renderContent()}
    </div>
  );
};

export default LessonContentViewer;
