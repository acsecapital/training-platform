import React, {useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import QuizList from '@/components/admin/quizzes/QuizList';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import {fetchQuizzes, deleteQuiz, updateQuizStatus, Quiz } from '@/services/quizService';
import {toast } from 'sonner';

const QuizzesPage: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch quizzes on component mount
  useEffect(() => {
    const loadQuizzes = async () => {
      try {
        setLoading(true);
        setError(null);

        const quizzesData = await fetchQuizzes();
        console.log('Quizzes loaded in index page:', quizzesData.map(q => ({id: q.id, title: q.title })));
        setQuizzes(quizzesData);
    } catch (err: any) {
        console.error('Error fetching quizzes:', err);
        setError('Failed to load quizzes. Please try again.');
        toast.error('Failed to load quizzes. Please try again.');
    } finally {
        setLoading(false);
    }
  };

    loadQuizzes();
}, []);

  // Handle quiz deletion
  const handleDeleteQuiz = async (id: string) => {
    if (!confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
      return;
  }

    try {
      await deleteQuiz(id);
      setQuizzes(quizzes.filter(quiz => quiz.id !== id));
      toast.success('Quiz deleted successfully!');
  } catch (err: any) {
      console.error('Error deleting quiz:', err);
      toast.error('Failed to delete quiz. Please try again.');
  }
};

  // Handle quiz status change
  const handleStatusChange = async (id: string, status: 'published' | 'draft' | 'archived') => {
    try {
      await updateQuizStatus(id, status);

      setQuizzes(quizzes.map(quiz => {
        if (quiz.id === id) {
          return {...quiz, status } as Quiz;
      }
        return quiz;
    }));

      toast.success(`Quiz ${status === 'published' ? 'published' : status === 'draft' ? 'unpublished' : 'archived'} successfully!`);
  } catch (err: any) {
      console.error('Error updating quiz status:', err);
      toast.error('Failed to update quiz status. Please try again.');
  }
};

  return (
    <AdminLayout title="Quizzes">
      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
          {error}
        </div>
      ) : (
        <QuizList
          quizzes={quizzes}
          loading={loading}
          onDelete={handleDeleteQuiz}
          onStatusChange={handleStatusChange}
        />
      )}
    </AdminLayout>
  );
};

// Wrap the component with ProtectedRoute to ensure only admins can access it
export default function QuizzesPageWrapper() {
  return (
    <ProtectedRoute adminOnly>
      <QuizzesPage />
    </ProtectedRoute>
  );
}
