import React, {useState, useEffect } from 'react';
import {useRouter } from 'next/router';
import {doc, getDoc } from 'firebase/firestore';
import {firestore } from '@/services/firebase';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import LessonForm from '@/components/admin/courses/lessons/LessonForm';
import Button from '@/components/ui/Button';
import {QuizQuestion } from '@/components/admin/courses/lessons/QuizEditor';
import {Lesson } from '@/types/course.types';
import {createLesson, updateModuleLessonCount, updateCourseLessonCount } from '@/services/moduleService';
import {toast } from 'sonner';

// Using Lesson type from course.types.ts

const CreateLessonPage: React.FC = () => {
  const router = useRouter();
  const {id, moduleId } = router.query;

  const [courseTitle, setCourseTitle] = useState('');
  const [moduleTitle, setModuleTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch course and module data
  useEffect(() => {
    const fetchData = async () => {
      if (!id || typeof id !== 'string' || !moduleId || typeof moduleId !== 'string') return;

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
    } catch (err: any) {
        console.error('Error fetching data:', err);
        setError('Failed to load course and module data. Please try again.');
    } finally {
        setLoading(false);
    }
  };

    fetchData();
}, [id, moduleId]);

  // Handle form submission
  const handleSubmit = async (formData: Partial<Lesson>) => {
    if (!id || typeof id !== 'string' || !moduleId || typeof moduleId !== 'string') return;

    try {
      setLoading(true);

      // Create the lesson using the shared service
      await createLesson(id, moduleId, formData);

      // Update the lesson count for the module
      await updateModuleLessonCount(id, moduleId);

      // Update the course's total lesson count
      await updateCourseLessonCount(id);

      toast.success('Lesson created successfully');

      // Redirect to the lessons list
      router.push(`/admin/courses/${id}/modules/${moduleId}/lessons`);
  } catch (err: any) {
      console.error('Error creating lesson:', err);
      setError(err.message || 'Failed to create lesson. Please try again.');
      setLoading(false);
  }
};

  if (loading) {
    return (
      <AdminLayout title="Create Lesson">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
}

  if (error) {
    return (
      <AdminLayout title="Create Lesson">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-md">
          <h3 className="text-lg font-medium mb-2">Error</h3>
          <p>{error}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push(`/admin/courses/${id}/modules`)}
          >
            Back to Modules
          </Button>
        </div>
      </AdminLayout>
    );
}

  return (
    <AdminLayout title="Create Lesson">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Create Lesson</h1>
            <div className="mt-1 text-sm text-neutral-500">
              <span>{courseTitle}</span>
              <span className="mx-2">›</span>
              <span>{moduleTitle}</span>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/courses/${id}/modules/${moduleId}/lessons`)}
          >
            Cancel
          </Button>
        </div>

        <LessonForm
          onSubmit={handleSubmit}
          courseId={id as string}
          moduleId={moduleId as string}
        />
      </div>
    </AdminLayout>
  );
};

export default function AdminCreateLessonPage() {
  return (
    <ProtectedRoute adminOnly>
      <CreateLessonPage />
    </ProtectedRoute>
  );
}
