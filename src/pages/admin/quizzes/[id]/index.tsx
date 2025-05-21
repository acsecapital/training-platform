import React, {useState, useEffect } from 'react';
import {useRouter } from 'next/router';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import {getQuiz, updateQuizStatus, deleteQuiz, Quiz, Question } from '@/services/quizService';
import {toast } from 'sonner';
import Link from 'next/link';
import {ArrowLeft, Edit, BarChart, Trash2, Archive, Upload } from 'lucide-react';
import {formatDate } from '@/utils/date';

// No props needed for this component
const QuizDetailPage: React.FC = () => {
  const router = useRouter();
  const {id } = router.query;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  // Fetch quiz data
  useEffect(() => {
    const fetchQuiz = async () => {
      if (!id || typeof id !== 'string') return;

      try {
        setLoading(true);
        setError(null);

        const quizData = await getQuiz(id);
        setQuiz(quizData);
      } catch (err) {
        console.error('Error fetching quiz:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';

        if (errorMessage === 'Quiz not found') {
          setError('Quiz not found. It may have been deleted or the ID is invalid.');
          toast.error('Quiz not found. It may have been deleted or the ID is invalid.');
        } else {
          setError('Failed to load quiz. Please try again.');
          toast.error('Failed to load quiz. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    void fetchQuiz(); // Use void operator to fix floating promise
  }, [id]);

  // Handle quiz deletion
  const handleDelete = async () => {
    if (!quiz) return;

    if (!window.confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeleting(true);
      await deleteQuiz(quiz.id);
      toast.success('Quiz deleted successfully!');
      void router.push('/admin/quizzes');
    } catch (err) {
      console.error('Error deleting quiz:', err);
      toast.error('Failed to delete quiz. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle quiz status change
  const handleStatusChange = async () => {
    if (!quiz) return;

    const newStatus = quiz.status === 'published' ? 'archived' : 'published';
    const statusText = newStatus === 'published' ? 'publish' : 'archive';

    if (!window.confirm(`Are you sure you want to ${statusText} this quiz?`)) {
      return;
    }

    try {
      setIsChangingStatus(true);
      await updateQuizStatus(quiz.id, newStatus);
      setQuiz({...quiz, status: newStatus });
      toast.success(`Quiz ${newStatus === 'published' ? 'published' : 'archived'} successfully!`);
    } catch (err) {
      console.error('Error updating quiz status:', err);
      toast.error(`Failed to ${statusText} quiz. Please try again.`);
    } finally {
      setIsChangingStatus(false);
    }
  };

  // Render status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Published
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Draft
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800">
            Archived
          </span>
        );
      default:
        return null;
  }
};

  return (
    <AdminLayout title="Quiz Details">
      <div className="space-y-6">
        {/* Back button */}
        <div>
          <Link
            href="/admin/quizzes"
            className="inline-flex items-center text-sm font-medium text-neutral-600 hover:text-neutral-900"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Quizzes
          </Link>
        </div>

        {loading ? (
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-neutral-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-32 bg-neutral-200 rounded"></div>
              <div className="h-32 bg-neutral-200 rounded"></div>
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
        ) : quiz ? (
          <>
            {/* Quiz header */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <h1 className="text-2xl font-bold text-neutral-900">{quiz.title}</h1>
                    <div className="ml-3">{renderStatusBadge(quiz.status)}</div>
                  </div>
                  <div className="flex space-x-2">
                    <Link
                      href={`/admin/quizzes/${quiz.id}/edit`}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Quiz
                    </Link>
                    <Link
                      href={`/admin/quizzes/${quiz.id}/results`}
                      className="inline-flex items-center px-4 py-2 border border-neutral-300 rounded-md shadow-sm text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      <BarChart className="mr-2 h-4 w-4" />
                      View Results
                    </Link>
                    <button
                      type="button"
                      onClick={() => void handleStatusChange()}
                      disabled={isChangingStatus}
                      className="inline-flex items-center px-4 py-2 border border-neutral-300 rounded-md shadow-sm text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      {quiz.status === 'published' ? (
                        <>
                          <Archive className="mr-2 h-4 w-4" />
                          Archive
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Publish
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete()}
                      disabled={isDeleting}
                      className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-neutral-500">{quiz.description}</p>
                </div>
              </div>
            </div>

            {/* Quiz details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-medium text-neutral-900 mb-4">Quiz Information</h2>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-neutral-500">Course</dt>
                    <dd className="mt-1 text-sm text-neutral-900">{quiz.courseName || 'Not assigned'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-neutral-500">Module</dt>
                    <dd className="mt-1 text-sm text-neutral-900">{quiz.moduleName || 'Not assigned'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-neutral-500">Time Limit</dt>
                    <dd className="mt-1 text-sm text-neutral-900">
                      {quiz.timeLimit ? `${quiz.timeLimit} minutes` : 'No time limit'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-neutral-500">Passing Score</dt>
                    <dd className="mt-1 text-sm text-neutral-900">{quiz.passingScore}%</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-neutral-500">Created</dt>
                    <dd className="mt-1 text-sm text-neutral-900">{formatDate(quiz.createdAt, 'medium')}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-neutral-500">Last Updated</dt>
                    <dd className="mt-1 text-sm text-neutral-900">{formatDate(quiz.updatedAt, 'medium')}</dd>
                  </div>
                </dl>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-medium text-neutral-900 mb-4">Quiz Statistics</h2>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-neutral-500">Questions</dt>
                    <dd className="mt-1 text-sm text-neutral-900">{quiz.questions?.length || 0}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-neutral-500">Attempts</dt>
                    <dd className="mt-1 text-sm text-neutral-900">{quiz.attempts || 0}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-neutral-500">Average Score</dt>
                    <dd className="mt-1 text-sm text-neutral-900">
                      {quiz.averageScore !== undefined ? `${quiz.averageScore}%` : 'No data'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-neutral-500">Status</dt>
                    <dd className="mt-1 text-sm text-neutral-900">{renderStatusBadge(quiz.status)}</dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Questions preview */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-neutral-900">Questions</h2>
                <Link
                  href={`/admin/quizzes/${quiz.id}/edit`}
                  className="text-sm font-medium text-primary hover:text-primary-700"
                >
                  Edit Questions
                </Link>
              </div>

              {quiz.questions && quiz.questions.length > 0 ? (
                <div className="space-y-4">
                  {quiz.questions.map((question, index) => (
                    <div key={index} className="border border-neutral-200 rounded-md p-4">
                      <div className="flex items-start">
                        <span className="flex-shrink-0 bg-neutral-100 text-neutral-800 px-2 py-1 rounded-md text-xs font-medium mr-3">
                          Q{index + 1}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-neutral-900">{question.text}</p>
                          {question.type === 'multiple-choice' && question.options && (
                            <ul className="mt-2 space-y-1">
                              {question.options.map((option, optIndex) => (
                                <li key={optIndex} className="text-sm text-neutral-600 flex items-center">
                                  <span className={`mr-2 ${option.id === question.correctOptionId ? 'text-green-600 font-medium' : ''}`}>
                                    {String.fromCharCode(65 + optIndex)}.
                                  </span>
                                  {option.text}
                                  {option.id === question.correctOptionId && (
                                    <span className="ml-2 text-xs text-green-600 font-medium">(Correct)</span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          )}
                          {question.type === 'true-false' && (
                            <p className="mt-2 text-sm text-neutral-600">
                              Correct answer: <span className="font-medium">
                                {question.correctOptionId === 'true' ? 'True' : 'False'}
                              </span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-neutral-500">
                  <p>No questions added to this quiz yet.</p>
                  <Link
                    href={`/admin/quizzes/${quiz.id}/edit`}
                    className="mt-2 inline-block text-sm font-medium text-primary hover:text-primary-700"
                  >
                    Add Questions
                  </Link>
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </AdminLayout>
  );
};

// Wrap the component with ProtectedRoute to ensure only admins can access it
export default function QuizDetailPageWrapper() {
  return (
    <ProtectedRoute adminOnly>
      <QuizDetailPage />
    </ProtectedRoute>
  );
}
