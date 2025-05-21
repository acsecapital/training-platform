import React, {useState, useEffect } from 'react';
import {useRouter } from 'next/router';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import QuizBuilder, {Quiz } from '@/components/admin/quizzes/QuizBuilder';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import {doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import {firestore } from '@/services/firebase';
import {fetchQuizById, fetchCoursesForQuizzes, fetchModulesForCourse } from '@/services/quizService';
import {toast } from 'sonner';
import Link from 'next/link';
import {ArrowLeft } from 'lucide-react';

const EditQuizPage: React.FC = () => {
  const router = useRouter();
  const {id } = router.query;
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [courses, setCourses] = useState<Array<{id: string; title: string; modules: Array<{id: string; title: string}>}>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch quiz data and courses
  useEffect(() => {
    const fetchData = async () => {
      if (!id || typeof id !== 'string') return;

      try {
        setLoading(true);
        setError(null);

        console.log('Attempting to fetch quiz with ID:', id);

        try {
          // Fetch quiz data
          const quizData = await fetchQuizById(id);
          console.log('Successfully fetched quiz:', quizData);
          if (quizData) {
            // Ensure all required properties are present
            setQuiz({
              ...quizData,
              courseName: quizData.courseName || '',
              moduleName: quizData.moduleName || ''
          });
        } else {
            throw new Error('Quiz not found');
        }
      } catch (quizErr: any) {
          if (quizErr.message === 'Quiz not found') {
            console.error('Quiz not found with ID:', id);
            setError('Quiz not found. It may have been deleted or the ID is invalid.');
            toast.error('Quiz not found. It may have been deleted or the ID is invalid.');
            setLoading(false);
            return;
        }
          throw quizErr;
      }

        // Fetch courses for the dropdown
        const coursesData = await fetchCoursesForQuizzes();

        // For each course, fetch its modules
        const coursesWithModules = await Promise.all(
          coursesData.map(async (course) => {
            const modules = await fetchModulesForCourse(course.id);
            return {
              ...course,
              modules
          };
        })
        );

        setCourses(coursesWithModules);
    } catch (err: any) {
        console.error('Error fetching quiz:', err);
        setError('Failed to load quiz. Please try again.');
        toast.error('Failed to load quiz. Please try again.');
    } finally {
        setLoading(false);
    }
  };

    fetchData();
}, [id]);

  // Handle quiz save
  const handleSaveQuiz = async (updatedQuiz: Quiz) => {
    if (!id || typeof id !== 'string') return;

    setSaving(true);

    try {
      // Update the quiz in Firestore
      const quizRef = doc(firestore, 'quizzes', id);

      await updateDoc(quizRef, {
        title: updatedQuiz.title,
        description: updatedQuiz.description,
        courseId: updatedQuiz.courseId,
        courseName: updatedQuiz.courseName,
        moduleId: updatedQuiz.moduleId,
        moduleName: updatedQuiz.moduleName,
        timeLimit: updatedQuiz.timeLimit,
        passingScore: updatedQuiz.passingScore,
        questions: updatedQuiz.questions,
        status: updatedQuiz.status,
        updatedAt: serverTimestamp(),
        questionsCount: updatedQuiz.questions.length
    });

      toast.success('Quiz updated successfully!');

      // Redirect to quiz list
      router.push('/admin/quizzes');
  } catch (err: any) {
      console.error('Error updating quiz:', err);
      toast.error(err.message || 'Failed to update quiz. Please try again.');
  } finally {
      setSaving(false);
  }
};

  // Handle cancel
  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      router.push('/admin/quizzes');
  }
};

  return (
    <AdminLayout title="Edit Quiz">
      <div className="mb-6">
        <Link
          href="/admin/quizzes"
          className="inline-flex items-center text-sm text-primary-600 hover:text-primary-900"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Quizzes
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            <p className="mt-2 text-neutral-600">Loading quiz...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <p>{error}</p>
          <div className="mt-4">
            <Link
              href="/admin/quizzes"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Return to Quizzes
            </Link>
          </div>
        </div>
      ) : saving ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            <p className="mt-2 text-neutral-600">Saving quiz...</p>
          </div>
        </div>
      ) : quiz ? (
        <QuizBuilder
          initialQuiz={quiz}
          courses={courses}
          onSave={handleSaveQuiz}
          onCancel={handleCancel}
          isEditing={true}
        />
      ) : null}
    </AdminLayout>
  );
};

// Wrap the component with ProtectedRoute to ensure only admins can access it
export default function EditQuizPageWrapper() {
  return (
    <ProtectedRoute adminOnly>
      <EditQuizPage />
    </ProtectedRoute>
  );
}
