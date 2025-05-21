import React, {useState, useEffect } from 'react';
import {useRouter } from 'next/router';
import {collection, getDocs, query, where } from 'firebase/firestore';
import {firestore } from '@/services/firebase';
import {useAuth } from '@/context/AuthContext';
import LessonContentViewer from '@/components/course-learning/LessonContentViewer';
import {useCourseProgress } from '@/hooks/useCourseProgress';
import LearningLayout from '@/components/layout/LearningLayout';
import {AdminQuizQuestion } from '@/types/quiz.types';
import {
  updateLessonProgress,
  syncCourseProgress
} from '@/services/courseProgressService';

// Use the same Lesson interface as in LessonContentViewer
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

export default function LessonPage() {
  const router = useRouter();
  const {id, lessonId } = router.query;
  const courseId = Array.isArray(id) ? id[0] : id || '';
  const lessonIdStr = Array.isArray(lessonId) ? lessonId[0] : lessonId || '';
  const {user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [moduleId, setModuleId] = useState<string>('');

  // Use the course progress hook - we're using updateLessonProgress directly instead
  const {} = useCourseProgress(courseId);

  // Fetch the lesson data
  useEffect(() => {
    const fetchLessonData = async () => {
      if (!courseId || !lessonIdStr || !user) return;

      try {
        setLoading(true);
        setError(null);

        // First, find which module contains this lesson
        const modulesRef = collection(firestore, `courses/${courseId}/modules`);
        const modulesSnapshot = await getDocs(modulesRef);

        let foundLesson: Lesson | null = null;
        let foundModuleId: string = '';

        // Loop through modules to find the lesson
        for (const moduleDoc of modulesSnapshot.docs) {
          const moduleId = moduleDoc.id;
          const lessonsRef = collection(firestore, `courses/${courseId}/modules/${moduleId}/lessons`);
          const lessonsQuery = query(lessonsRef, where('status', '==', 'published'));
          const lessonsSnapshot = await getDocs(lessonsQuery);

          // Check if this module contains the lesson
          const lessonDoc = lessonsSnapshot.docs.find(doc => doc.id === lessonIdStr);

          if (lessonDoc) {
            const lessonData = lessonDoc.data();

            // Map the questions to ensure they have the required properties
            const rawQuestions = lessonData.questions || lessonData.quizQuestions || [];
            const questions = rawQuestions.map((q: Record<string, unknown>) => ({
              id: typeof q.id === 'string' ? q.id : '',
              question: typeof q.question === 'string' ? q.question :
                        typeof q.text === 'string' ? q.text : '',
              options: Array.isArray(q.options) ? q.options : [],
              correctAnswer: typeof q.correctAnswer === 'string' ? q.correctAnswer :
                            typeof q.correctOptionId === 'string' ? q.correctOptionId : '',
              explanation: typeof q.explanation === 'string' ? q.explanation : '',
              // Add any missing required properties with default values
              points: typeof q.points === 'number' ? q.points : 1,
              type: typeof q.type === 'string' ? q.type : 'multiple_choice'
          }));

            foundLesson = {
              id: lessonDoc.id,
              title: typeof lessonData.title === 'string' ? lessonData.title : '',
              type: typeof lessonData.type === 'string' ?
                    (lessonData.type === 'video' || lessonData.type === 'text' || lessonData.type === 'quiz' ?
                     lessonData.type : 'text') : 'text',
              content: typeof lessonData.content === 'string' ? lessonData.content : '',
              videoId: typeof lessonData.videoId === 'string' ? lessonData.videoId : undefined,
              duration: typeof lessonData.duration === 'number' ? lessonData.duration : 0,
              questions: questions
          };

            foundModuleId = moduleId;
            break;
        }
      }

        if (foundLesson) {
          setCurrentLesson(foundLesson);
          setModuleId(foundModuleId);
      } else {
          setError('Lesson not found');
      }
    } catch (err) {
        console.error('Error fetching lesson:', err);
        setError('Failed to load lesson. Please try again.');
    } finally {
        setLoading(false);
    }
  };

    void fetchLessonData();
}, [courseId, lessonIdStr, user]);

  // Handle lesson completion
  const handleLessonComplete = async () => {
    if (!user?.id || !moduleId || !currentLesson || !courseId) return;

    try {
      // Get total lessons count for progress calculation
      // This should be fetched from course data if available
      const totalLessons = 1; // Default to 1 if we don't know the total

      // Use the optimized service instead of direct Firestore writes
      await updateLessonProgress(
        user.id, // Now we know this is defined
        courseId, // Now we know this is defined
        '', // Course name (ideally should be passed in)
        currentLesson.id,
        true,
        totalLessons
      );
  } catch (error) {
      console.error('Error marking lesson as completed:', error);
  }
};

  // Add cleanup to sync progress when leaving the page
  useEffect(() => {
    return () => {
      // Sync progress when component unmounts
      if (user?.id && courseId) {
        Promise.resolve()
          .then(() => syncCourseProgress(user.id, courseId)) // user.id and courseId are confirmed non-null by the if condition
          .catch(console.error);
    }
  };
}, [user?.id, courseId]);

  if (loading) {
    return (
      <LearningLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </LearningLayout>
    );
}

  if (error || !currentLesson) {
    return (
      <LearningLayout>
        <div className="flex flex-col items-center justify-center h-screen">
          <div className="text-xl font-medium text-red-600 mb-2">
            {error || 'Lesson not found'}
          </div>
          <button
            onClick={() => void router.push(`/courses/${courseId}`)}
            className="px-4 py-2 bg-primary text-white rounded-md"
          >
            Back to Course
          </button>
        </div>
      </LearningLayout>
    );
}

  return (
    <LearningLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">{currentLesson.title}</h1>

        <LessonContentViewer
          lesson={currentLesson}
          onComplete={() => void handleLessonComplete()}
          courseId={courseId}
        />
      </div>
    </LearningLayout>
  );
}











