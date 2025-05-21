import React, {useState, useEffect } from 'react';
import {useRouter } from 'next/router';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import ResultsViewer from '@/components/admin/quizzes/ResultsViewer';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import {doc, getDoc, collection, query, where, getDocs, DocumentData, Timestamp } from 'firebase/firestore';
import {firestore } from '@/services/firebase';
import {exportToCsv } from '@/utils/export';
import {toast } from 'sonner';
import Link from 'next/link';
import {ArrowLeft } from 'lucide-react';

// Interface for Firestore quiz document data
interface FirestoreQuizData extends DocumentData {
  title?: string;
  passingScore?: number;
  // Add other quiz fields as needed
}

// Interface for Firestore quiz result document data
interface FirestoreQuizResultData extends DocumentData {
  userId?: string;
  userName?: string;
  userEmail?: string;
  quizId?: string;
  quizTitle?: string;
  score?: number;
  passingScore?: number;
  passed?: boolean;
  timeSpent?: number;
  startedAt?: Timestamp | string;
  completedAt?: Timestamp | string;
  answers?: Array<{
    questionId?: string;
    questionText?: string;
    userAnswer?: string;
    correctAnswer?: string;
    isCorrect?: boolean;
    points?: number;
    earnedPoints?: number;
  }>;
}

interface QuizResult {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  quizId: string;
  quizTitle: string;
  score: number;
  passingScore: number;
  passed: boolean;
  timeSpent: number; // in seconds
  startedAt: string;
  completedAt: string;
  answers: {
    questionId: string;
    questionText: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    points: number;
    earnedPoints: number;
  }[];
}

const QuizResultsPage: React.FC = () => {
  const router = useRouter();
  const {id } = router.query;
  const [quizTitle, setQuizTitle] = useState('');
  const [results, setResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log('Quiz ID from router:', id);

  // Fetch quiz and results data
  useEffect(() => {
    const fetchData = async () => {
      if (!id || typeof id !== 'string') {
        console.log('No valid quiz ID found');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log('Fetching quiz with ID:', id);

        // Fetch quiz data to get the title
        const quizDoc = await getDoc(doc(firestore, 'quizzes', id));

        if (!quizDoc.exists()) {
          console.error('Quiz not found with ID:', id);
          setError('Quiz not found. It may have been deleted or the ID is invalid.');
          toast.error('Quiz not found. It may have been deleted or the ID is invalid.');
          setLoading(false);
          return;
        }

        const quizData = quizDoc.data() as FirestoreQuizData;
        setQuizTitle(quizData.title || 'Untitled Quiz');

        // Fetch quiz results
        const resultsRef = collection(firestore, 'quiz_results');
        const q = query(resultsRef, where('quizId', '==', id));
        const querySnapshot = await getDocs(q);

        const fetchedResults: QuizResult[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data() as FirestoreQuizResultData;

          // Helper function to safely convert Firestore timestamp to ISO string
          const convertTimestampToISOString = (
            timestamp: Timestamp | string | undefined
          ): string => {
            if (!timestamp) {
              return new Date().toISOString();
            }

            if (
              typeof timestamp === 'object' &&
              'toDate' in timestamp &&
              typeof timestamp.toDate === 'function'
            ) {
              return timestamp.toDate().toISOString();
            }

            if (typeof timestamp === 'string') {
              return timestamp;
            }

            return new Date().toISOString();
          };

          fetchedResults.push({
            id: doc.id,
            userId: data.userId || '',
            userName: data.userName || 'Unknown User',
            userEmail: data.userEmail || '',
            quizId: data.quizId || '',
            quizTitle: data.quizTitle || quizData.title || 'Untitled Quiz',
            score: data.score || 0,
            passingScore: data.passingScore || quizData.passingScore || 70,
            passed: data.passed || false,
            timeSpent: data.timeSpent || 0,
            startedAt: convertTimestampToISOString(data.startedAt),
            completedAt: convertTimestampToISOString(data.completedAt),
            answers: data.answers?.map(answer => ({
              questionId: answer.questionId || '',
              questionText: answer.questionText || '',
              userAnswer: answer.userAnswer || '',
              correctAnswer: answer.correctAnswer || '',
              isCorrect: answer.isCorrect || false,
              points: answer.points || 0,
              earnedPoints: answer.earnedPoints || 0
            })) || [],
          });
        });

        setResults(fetchedResults);
      } catch (err) {
        console.error('Error fetching quiz results:', err);
        setError('Failed to load quiz results. Please try again.');
        toast.error('Failed to load quiz results. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    void fetchData(); // Use void operator to fix floating promise
  }, [id]);

  // Handle export
  const handleExport = () => {
    if (results.length === 0) {
      toast.error('No results to export');
      return;
  }

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

    // Ensure id is a string before using it in template literal
    const safeId = typeof id === 'string' ? id : 'unknown';
    exportToCsv(exportData, `quiz_results_${safeId}.csv`);
    toast.success('Results exported successfully');
};

  return (
    <AdminLayout title={`Quiz Results: ${quizTitle}`}>
      <div className="mb-6">
        <Link
          href="/admin/quizzes"
          className="inline-flex items-center text-sm text-primary-600 hover:text-primary-900"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Quizzes
        </Link>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <p>{error}</p>
          {error.includes('Quiz not found') && (
            <div className="mt-4">
              <Link
                href="/admin/quizzes"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Return to Quizzes
              </Link>
            </div>
          )}
        </div>
      ) : (
        <ResultsViewer
          quizId={id as string}
          quizTitle={quizTitle}
          results={results}
          loading={loading}
          onExport={handleExport}
        />
      )}
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
