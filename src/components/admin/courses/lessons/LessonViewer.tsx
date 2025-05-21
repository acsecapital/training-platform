import React from 'react';
import {QuizQuestion as QuizQuestionType } from './QuizEditor';

interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'text' | 'quiz';
  content: string;
  videoId?: string;
  duration?: number;
  status: 'draft' | 'published';
  questions?: QuizQuestionType[];
}

interface LessonViewerProps {
  lesson: Lesson;
}

const LessonViewer: React.FC<LessonViewerProps> = ({lesson }) => {
  // Render video player for video lessons
  const renderVideoPlayer = () => {
    if (!lesson.videoId) {
      return (
        <div className="bg-neutral-100 rounded-md p-6 text-center">
          <p className="text-neutral-500">No video ID provided</p>
        </div>
      );
  }

    return (
      <div className="aspect-video bg-black rounded-md overflow-hidden">
        <iframe
          src={`https://cloudflarestream.com/${lesson.videoId}/iframe`}
          className="w-full h-full"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    );
};

  // Render quiz for quiz lessons
  const renderQuiz = () => {
    if (!lesson.questions || lesson.questions.length === 0) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md">
          <p className="font-medium">No questions added to this quiz</p>
          <p className="text-sm mt-1">
            Add questions to this quiz in the lesson editor.
          </p>
        </div>
      );
  }

    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md">
          <p className="font-medium">Quiz Preview</p>
          <p className="text-sm mt-1">
            This is a preview of how the quiz will appear to students. They will need to answer these questions correctly to complete the lesson.
          </p>
        </div>

        {lesson.questions.map((question, index) => (
          <div key={question.id} className="bg-white border border-neutral-200 rounded-lg p-6 shadow-sm">
            <div className="mb-4">
              <span className="text-sm font-medium text-neutral-500">
                Question {index + 1} of {lesson.questions?.length}
              </span>
              <h3 className="text-lg font-medium mt-1">{question.text}</h3>
            </div>

            <div className="space-y-3">
              {question.options.map((option) => (
                <div
                  key={option.id}
                  className={`p-3 border rounded-md ${option.id === question.correctOptionId ? 'border-green-300 bg-green-50' : 'border-neutral-300'}`}
                >
                  <div className="flex items-center">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center mr-3 ${option.id === question.correctOptionId ? 'bg-green-500 text-white' : 'border border-neutral-300'}`}>
                      {option.id === question.correctOptionId && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className={option.id === question.correctOptionId ? 'font-medium' : ''}>{option.text}</span>
                  </div>
                </div>
              ))}
            </div>

            {question.explanation && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <h4 className="font-medium text-blue-800 mb-1">Explanation</h4>
                <p className="text-blue-700 text-sm">{question.explanation}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    );
};

  return (
    <div className="space-y-6">
      {/* Render video player for video lessons */}
      {lesson.type === 'video' && renderVideoPlayer()}

      {/* Render quiz for quiz lessons */}
      {lesson.type === 'quiz' && renderQuiz()}

      {/* Render content for all lesson types */}
      {lesson.content && (
        <div
          className="prose max-w-none"
          dangerouslySetInnerHTML={{__html: lesson.content }}
        />
      )}

      {/* Show message if no content */}
      {!lesson.content && lesson.type !== 'quiz' && (
        <div className="bg-neutral-100 rounded-md p-6 text-center">
          <p className="text-neutral-500">No content provided</p>
        </div>
      )}
    </div>
  );
};

export default LessonViewer;
