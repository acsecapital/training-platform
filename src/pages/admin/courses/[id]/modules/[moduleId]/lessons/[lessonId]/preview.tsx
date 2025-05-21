import React, {useState, useEffect } from 'react';
import {useRouter } from 'next/router';
import {doc, getDoc } from 'firebase/firestore';
import {firestore } from '@/services/firebase';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import LessonViewer from '@/components/admin/courses/lessons/LessonViewer';
import Button from '@/components/ui/Button';
import {QuizQuestion } from '@/components/admin/courses/lessons/QuizEditor';

interface LessonData {
  id: string;
  title: string;
  type: 'video' | 'text' | 'quiz';
  content: string;
  videoId?: string;
  duration?: number;
  status: 'draft' | 'published';
  questions?: QuizQuestion[];
}

const PreviewLessonPage: React.FC = () => {
  const router = useRouter();
  const {id, moduleId, lessonId } = router.query;

  const [courseTitle, setCourseTitle] = useState('');
  const [moduleTitle, setModuleTitle] = useState('');
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch course, module, and lesson data
  useEffect(() => {
    const fetchData = async () => {
      if (!id || typeof id !== 'string' || !moduleId || typeof moduleId !== 'string' || !lessonId || typeof lessonId !== 'string') return;

      try {
        setLoading(true);
        setError(null);

        // Fetch course data
        const courseDoc = await getDoc(doc(firestore, 'courses', id));

        if (!courseDoc.exists()) {
          setError('Course not found');
          return;
      }

        const courseData = courseDoc.data();
        setCourseTitle(courseData.title || 'Untitled Course');

        // Fetch module data
        const moduleDoc = await getDoc(doc(firestore, `courses/${id}/modules`, moduleId));

        if (!moduleDoc.exists()) {
          setError('Module not found');
          return;
      }

        const moduleData = moduleDoc.data();
        setModuleTitle(moduleData.title || 'Untitled Module');

        // Fetch lesson data
        const lessonDoc = await getDoc(doc(firestore, `courses/${id}/modules/${moduleId}/lessons`, lessonId));

        if (!lessonDoc.exists()) {
          setError('Lesson not found');
          return;
      }

        const lessonDocData = lessonDoc.data();
        setLesson({
          id: lessonDoc.id,
          title: lessonDocData.title || '',
          type: lessonDocData.type || 'text',
          content: lessonDocData.content || '',
          videoId: lessonDocData.videoId,
          duration: lessonDocData.duration,
          status: lessonDocData.status || 'draft',
          questions: lessonDocData.questions || [],
      });
    } catch (err: any) {
        console.error('Error fetching data:', err);
        setError('Failed to load lesson. Please try again.');
    } finally {
        setLoading(false);
    }
  };

    fetchData();
}, [id, moduleId, lessonId]);

  if (loading) {
    return (
      <AdminLayout title="Preview Lesson">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
}

  if (error || !lesson) {
    return (
      <AdminLayout title="Preview Lesson">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-md">
          <h3 className="text-lg font-medium mb-2">Error</h3>
          <p>{error || 'Failed to load lesson'}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push(`/admin/courses/${id}/modules/${moduleId}/lessons`)}
          >
            Back to Lessons
          </Button>
        </div>
      </AdminLayout>
    );
}

  return (
    <AdminLayout title={`Preview: ${lesson.title}`}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Lesson Preview</h1>
            <div className="mt-1 text-sm text-neutral-500">
              <span>{courseTitle}</span>
              <span className="mx-2">›</span>
              <span>{moduleTitle}</span>
              <span className="mx-2">›</span>
              <span>{lesson.title}</span>
            </div>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => router.push(`/admin/courses/${id}/modules/${moduleId}/lessons`)}
            >
              Back to Lessons
            </Button>
            <Button
              variant="primary"
              onClick={() => router.push(`/admin/courses/${id}/modules/${moduleId}/lessons/${lessonId}/edit`)}
            >
              Edit Lesson
            </Button>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <h2 className="text-xl font-semibold text-neutral-900">{lesson.title}</h2>
              <span className={`ml-3 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                lesson.status === 'published'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
            }`}>
                {lesson.status === 'published' ? 'Published' : 'Draft'}
              </span>
              <span className="ml-3 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-neutral-100 text-neutral-800">
                {lesson.type.charAt(0).toUpperCase() + lesson.type.slice(1)}
              </span>
            </div>

            <LessonViewer lesson={lesson} />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default function AdminPreviewLessonPage() {
  return (
    <ProtectedRoute adminOnly>
      <PreviewLessonPage />
    </ProtectedRoute>
  );
}
