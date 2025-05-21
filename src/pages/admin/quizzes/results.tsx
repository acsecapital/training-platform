import React, {useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import ResultsViewer from '@/components/admin/quizzes/ResultsViewer';
import {exportToCsv } from '@/utils/export';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// Mock quiz results data for demonstration
const mockQuizResults = [
  {
    id: 'result1',
    userId: 'user1',
    userName: 'John Doe',
    userEmail: 'john.doe@example.com',
    quizId: 'quiz1',
    quizTitle: 'LIPS Sales System Fundamentals Quiz',
    score: 85,
    passingScore: 70,
    passed: true,
    timeSpent: 720, // 12 minutes
    startedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 minutes ago
    completedAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(), // 3 minutes ago
    answers: [
      {
        questionId: 'q1',
        questionText: 'What does the "L" in LIPS stand for?',
        userAnswer: 'Lock',
        correctAnswer: 'Lock',
        isCorrect: true,
        points: 1,
        earnedPoints: 1,
    },
      {
        questionId: 'q2',
        questionText: 'Which of the following is NOT a component of the LIPS Sales System?',
        userAnswer: 'Negotiate',
        correctAnswer: 'Negotiate',
        isCorrect: true,
        points: 1,
        earnedPoints: 1,
    },
      {
        questionId: 'q3',
        questionText: 'What is the primary purpose of the LIPS Sales System?',
        userAnswer: 'To provide a structured approach to the sales process',
        correctAnswer: 'To provide a structured approach to the sales process',
        isCorrect: true,
        points: 1,
        earnedPoints: 1,
    },
    ],
},
  {
    id: 'result2',
    userId: 'user2',
    userName: 'Jane Smith',
    userEmail: 'jane.smith@example.com',
    quizId: 'quiz1',
    quizTitle: 'LIPS Sales System Fundamentals Quiz',
    score: 67,
    passingScore: 70,
    passed: false,
    timeSpent: 540, // 9 minutes
    startedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 1.85).toISOString(), // 1.85 hours ago
    answers: [
      {
        questionId: 'q1',
        questionText: 'What does the "L" in LIPS stand for?',
        userAnswer: 'Lock',
        correctAnswer: 'Lock',
        isCorrect: true,
        points: 1,
        earnedPoints: 1,
    },
      {
        questionId: 'q2',
        questionText: 'Which of the following is NOT a component of the LIPS Sales System?',
        userAnswer: 'Present',
        correctAnswer: 'Negotiate',
        isCorrect: false,
        points: 1,
        earnedPoints: 0,
    },
      {
        questionId: 'q3',
        questionText: 'What is the primary purpose of the LIPS Sales System?',
        userAnswer: 'To provide a structured approach to the sales process',
        correctAnswer: 'To provide a structured approach to the sales process',
        isCorrect: true,
        points: 1,
        earnedPoints: 1,
    },
    ],
},
  {
    id: 'result3',
    userId: 'user3',
    userName: 'Robert Johnson',
    userEmail: 'robert.johnson@example.com',
    quizId: 'quiz1',
    quizTitle: 'LIPS Sales System Fundamentals Quiz',
    score: 100,
    passingScore: 70,
    passed: true,
    timeSpent: 480, // 8 minutes
    startedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 4.92).toISOString(), // 4.92 hours ago
    answers: [
      {
        questionId: 'q1',
        questionText: 'What does the "L" in LIPS stand for?',
        userAnswer: 'Lock',
        correctAnswer: 'Lock',
        isCorrect: true,
        points: 1,
        earnedPoints: 1,
    },
      {
        questionId: 'q2',
        questionText: 'Which of the following is NOT a component of the LIPS Sales System?',
        userAnswer: 'Negotiate',
        correctAnswer: 'Negotiate',
        isCorrect: true,
        points: 1,
        earnedPoints: 1,
    },
      {
        questionId: 'q3',
        questionText: 'What is the primary purpose of the LIPS Sales System?',
        userAnswer: 'To provide a structured approach to the sales process',
        correctAnswer: 'To provide a structured approach to the sales process',
        isCorrect: true,
        points: 1,
        earnedPoints: 1,
    },
    ],
},
  {
    id: 'result4',
    userId: 'user4',
    userName: 'Emily Davis',
    userEmail: 'emily.davis@example.com',
    quizId: 'quiz1',
    quizTitle: 'LIPS Sales System Fundamentals Quiz',
    score: 33,
    passingScore: 70,
    passed: false,
    timeSpent: 900, // 15 minutes
    startedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1.99).toISOString(), // 1.99 days ago
    answers: [
      {
        questionId: 'q1',
        questionText: 'What does the "L" in LIPS stand for?',
        userAnswer: 'Learn',
        correctAnswer: 'Lock',
        isCorrect: false,
        points: 1,
        earnedPoints: 0,
    },
      {
        questionId: 'q2',
        questionText: 'Which of the following is NOT a component of the LIPS Sales System?',
        userAnswer: 'Present',
        correctAnswer: 'Negotiate',
        isCorrect: false,
        points: 1,
        earnedPoints: 0,
    },
      {
        questionId: 'q3',
        questionText: 'What is the primary purpose of the LIPS Sales System?',
        userAnswer: 'To provide a structured approach to the sales process',
        correctAnswer: 'To provide a structured approach to the sales process',
        isCorrect: true,
        points: 1,
        earnedPoints: 1,
    },
    ],
},
  {
    id: 'result5',
    userId: 'user5',
    userName: 'Michael Wilson',
    userEmail: 'michael.wilson@example.com',
    quizId: 'quiz1',
    quizTitle: 'LIPS Sales System Fundamentals Quiz',
    score: 67,
    passingScore: 70,
    passed: false,
    timeSpent: 600, // 10 minutes
    startedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2.99).toISOString(), // 2.99 days ago
    answers: [
      {
        questionId: 'q1',
        questionText: 'What does the "L" in LIPS stand for?',
        userAnswer: 'Lock',
        correctAnswer: 'Lock',
        isCorrect: true,
        points: 1,
        earnedPoints: 1,
    },
      {
        questionId: 'q2',
        questionText: 'Which of the following is NOT a component of the LIPS Sales System?',
        userAnswer: 'Present',
        correctAnswer: 'Negotiate',
        isCorrect: false,
        points: 1,
        earnedPoints: 0,
    },
      {
        questionId: 'q3',
        questionText: 'What is the primary purpose of the LIPS Sales System?',
        userAnswer: 'To provide a structured approach to the sales process',
        correctAnswer: 'To provide a structured approach to the sales process',
        isCorrect: true,
        points: 1,
        earnedPoints: 1,
    },
    ],
},
];

// Import exportToCsv from utils/export.ts is already at the top of the file

const QuizResultsPage: React.FC = () => {
  const [results, setResults] = useState(mockQuizResults);
  const [loading, setLoading] = useState(true);

  // Simulate loading data
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
  }, 1000);

    return () => clearTimeout(timer);
}, []);

  // Handle export
  const handleExport = () => {
    // Format data for CSV export
    const exportData = results.map(result => ({
      'User Name': result.userName,
      'User Email': result.userEmail,
      'Quiz Title': result.quizTitle,
      'Score': `${result.score}%`,
      'Passing Score': `${result.passingScore}%`,
      'Status': result.passed ? 'Passed' : 'Failed',
      'Time Spent (seconds)': result.timeSpent,
      'Completed At': new Date(result.completedAt).toLocaleString(),
  }));

    exportToCsv(exportData, 'quiz_results.csv');
};

  return (
    <AdminLayout title="Quiz Results">
      <ResultsViewer
        quizId="quiz1"
        quizTitle="LIPS Sales System Fundamentals Quiz"
        results={results}
        loading={loading}
        onExport={handleExport}
      />
    </AdminLayout>
  );
};

// Wrap the component with ProtectedRoute to ensure only admins can access it
export default function QuizResultsPageWrapper() {
  return (
    <ProtectedRoute adminOnly>
      <QuizResultsPage />
    </ProtectedRoute>
  );
}
