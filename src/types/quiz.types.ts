// Shared quiz types for both admin and frontend
export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestionBase {
  id: string;
  explanation?: string;
}

// Admin-side question format
export interface AdminQuizQuestion extends QuizQuestionBase {
  question: string;
  options: QuizOption[];
  correctAnswer: string;
  points?: number; // Make points optional
  type?: string;
}

// Frontend-side question format
export interface FrontendQuizQuestion extends QuizQuestionBase {
  question: string;
  text: string;
  options: QuizOption[];
  correctOptionId: string;
  correctAnswer?: string; // Add this for compatibility
}

// Adapter function to convert between formats
export function adaptAdminQuestionToFrontend(adminQuestion: AdminQuizQuestion): FrontendQuizQuestion {
  return {
    id: adminQuestion.id,
    text: adminQuestion.question,
    question: adminQuestion.question,
    options: adminQuestion.options,
    correctOptionId: adminQuestion.correctAnswer,
    correctAnswer: adminQuestion.correctAnswer,
    explanation: adminQuestion.explanation
};
}

