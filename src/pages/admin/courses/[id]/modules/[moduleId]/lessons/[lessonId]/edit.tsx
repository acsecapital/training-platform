import React, {useState, useEffect } from 'react';
import {useRouter } from 'next/router';
import {doc, getDoc } from 'firebase/firestore';
import {firestore } from '@/services/firebase';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import LessonForm from '@/components/admin/courses/lessons/LessonForm';
import Button from '@/components/ui/Button';
import {LessonType, QuizQuestion, Lesson } from '@/types/course.types';
import {updateModuleLessonCount, updateCourseLessonCount, updateLesson } from '@/services/moduleService';
import {toast } from 'sonner';

interface LessonData {
  id: string;
  title: string;
  type: 'video' | 'text' | 'quiz';
  content: string;
  videoId?: string;
  duration?: number;
  status: 'draft' | 'published';
  order: number;
  quizQuestions?: QuizQuestion[];
}

const EditLessonPage: React.FC = () => {
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
          order: lessonDocData.order || 0,
          quizQuestions: lessonDocData.quizQuestions || [],
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

  // Handle form submission
  const handleSubmit = async (lessonData: Partial<Lesson> & {questions?: QuizQuestion[] }) => {
    if (!id || typeof id !== 'string' || !moduleId || typeof moduleId !== 'string' || !lessonId || typeof lessonId !== 'string') return;

    try {
      setLoading(true);

      // Show loading toast
      toast.loading('Updating lesson...', {id: 'update-lesson'});

      // Create the lesson update data
      const lessonUpdateData: Record<string, any> = {
        title: lessonData.title,
        type: lessonData.type,
        status: lessonData.status,
        duration: lessonData.duration || 0, // Always include duration for all lesson types
        updatedAt: new Date().toISOString(),
    };

      // Add content if provided
      if (lessonData.content) {
        lessonUpdateData.content = lessonData.content;
    }

      // Add type-specific fields
      if (lessonData.type === 'video') {
        Object.assign(lessonUpdateData, {
          videoId: lessonData.videoId,
      });
    } else if (lessonData.type === 'quiz' && lessonData.questions) {
        Object.assign(lessonUpdateData, {
          quizQuestions: lessonData.questions,
      });
    }

      // Update the lesson using the service function
      await updateLesson(id, moduleId, lessonId, lessonUpdateData);

      // Update the module's lesson count
      await updateModuleLessonCount(id, moduleId);

      // Update the course's total lesson count
      await updateCourseLessonCount(id);

      // Success toast
      toast.success('Lesson updated successfully!', {id: 'update-lesson'});

      // Redirect to the lessons list
      router.push(`/admin/courses/${id}/modules/${moduleId}/lessons`);
  } catch (err: any) {
      console.error('Error updating lesson:', err);
      setError(err.message || 'Failed to update lesson. Please try again.');
      toast.error(`Failed to update lesson: ${err.message || 'Unknown error'}`, {id: 'update-lesson'});
      setLoading(false);
  }
};

  if (loading) {
    return (
      <AdminLayout title="Edit Lesson">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
}

  if (error || !lesson) {
    return (
      <AdminLayout title="Edit Lesson">
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
    <AdminLayout title={`Edit Lesson: ${lesson.title}`}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-neutral-500">
              <span>{courseTitle}</span>
              <span className="mx-2">›</span>
              <span>{moduleTitle}</span>
            </div>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => router.push(`/admin/courses/${id}/modules/${moduleId}/lessons`)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => router.push(`/admin/courses/${id}/modules/${moduleId}/lessons/${lessonId}/preview`)}
            >
              Preview
            </Button>
          </div>
        </div>

        <LessonForm
          initialData={{
            title: lesson.title,
            type: lesson.type,
            content: lesson.content,
            videoId: lesson.videoId,
            duration: lesson.duration,
            status: lesson.status,
            questions: lesson.quizQuestions || [], // Map quizQuestions to questions for LessonForm with fallback
        }}
          onSubmit={handleSubmit}
          courseId={id as string}
          moduleId={moduleId as string}
          isEditing={true}
        />
      </div>
    </AdminLayout>
  );
};

export default function AdminEditLessonPage() {
  return (
    <ProtectedRoute adminOnly>
      <EditLessonPage />
    </ProtectedRoute>
  );
}
