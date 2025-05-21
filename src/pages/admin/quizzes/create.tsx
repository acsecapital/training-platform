import React, {useState, useEffect } from 'react';
import {useRouter } from 'next/router';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import QuizBuilder, {Quiz as QuizBuilderType } from '@/components/admin/quizzes/QuizBuilder';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import {fetchCoursesForQuizzes, fetchModulesForCourse, createQuiz, Quiz as QuizServiceType } from '@/services/quizService';
import {toast } from 'sonner';

const CreateQuizPage: React.FC = () => {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Array<{id: string; title: string; modules: Array<{id: string; title: string}>}>>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch courses on component mount
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all published courses
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
        console.error('Error fetching courses:', err);
        setError('Failed to load courses. Please try again.');
        toast.error('Failed to load courses. Please try again.');
    } finally {
        setLoading(false);
    }
  };

    fetchCourses();
}, []);

  // Handle quiz save
  const handleSaveQuiz = async (quiz: QuizBuilderType) => {
    setSaving(true);

    try {
      // Create a properly typed object that conforms to the quizService Quiz type
      // with additional properties used by the application
      const quizToSave = {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        courseId: quiz.courseId,
        courseName: typeof quiz.courseName === 'string' ? quiz.courseName : '',
        moduleId: quiz.moduleId,
        moduleName: typeof quiz.moduleName === 'string' ? quiz.moduleName : '',
        timeLimit: quiz.timeLimit,
        passingScore: quiz.passingScore,
        questions: quiz.questions,
        status: quiz.status,
        createdAt: quiz.createdAt,
        updatedAt: quiz.updatedAt,
        // Include additional fields used by the application
        attempts: 0,
        questionsCount: quiz.questions.length
    } as QuizServiceType & {questionsCount: number };

      // Save the quiz to Firestore and get the Firestore-generated ID
      await createQuiz(quizToSave);

      // Show success message
      toast.success('Quiz created successfully!');

      // Redirect to quiz list
      router.push('/admin/quizzes');
  } catch (error: any) {
      console.error('Error saving quiz:', error);
      toast.error(error.message || 'Failed to save quiz. Please try again.');
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
    <AdminLayout title="Create Quiz">
      {saving ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            <p className="mt-2 text-neutral-600">Saving quiz...</p>
          </div>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            <p className="mt-2 text-neutral-600">Loading courses...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      ) : (
        <QuizBuilder
          courses={courses}
          onSave={handleSaveQuiz}
          onCancel={handleCancel}
        />
      )}
    </AdminLayout>
  );
};

// Wrap the component with ProtectedRoute to ensure only admins can access it
export default function CreateQuizPageWrapper() {
  return (
    <ProtectedRoute adminOnly>
      <CreateQuizPage />
    </ProtectedRoute>
  );
}
