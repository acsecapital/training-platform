import React, {useState, useEffect } from 'react';
import {useRouter } from 'next/router';
import {doc, getDoc } from 'firebase/firestore';
import {firestore } from '@/services/firebase';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import ModuleForm from '@/components/admin/courses/modules/ModuleForm';
import Button from '@/components/ui/Button';
import {Module } from '@/types/course.types';
import {createModule } from '@/services/moduleService';
import {toast } from 'sonner';

// Using Module type from course.types.ts

const CreateModulePage: React.FC = () => {
  const router = useRouter();
  const {id } = router.query;

  const [courseTitle, setCourseTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch course data
  useEffect(() => {
    const fetchCourse = async () => {
      if (!id || typeof id !== 'string') return;

      try {
        setLoading(true);
        setError(null);

        const courseDoc = await getDoc(doc(firestore, 'courses', id));

        if (!courseDoc.exists()) {
          setError('Course not found');
          return;
      }

        const courseData = courseDoc.data();
        setCourseTitle(courseData.title || 'Untitled Course');
    } catch (err: any) {
        console.error('Error fetching course:', err);
        setError('Failed to load course. Please try again.');
    } finally {
        setLoading(false);
    }
  };

    fetchCourse();
}, [id]);

  // Handle form submission
  const handleSubmit = async (moduleData: Partial<Module>) => {
    if (!id || typeof id !== 'string') return;

    try {
      setLoading(true);

      // Create the module using the shared service
      await createModule(id, moduleData);

      toast.success('Module created successfully');

      // Redirect back to the modules list
      router.push(`/admin/courses/${id}/modules`);
  } catch (err: any) {
      console.error('Error creating module:', err);
      setError(err.message || 'Failed to create module. Please try again.');
      setLoading(false);
  }
};

  if (loading) {
    return (
      <AdminLayout title="Create Module">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
}

  if (error) {
    return (
      <AdminLayout title="Create Module">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-md">
          <h3 className="text-lg font-medium mb-2">Error</h3>
          <p>{error}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push('/admin/courses')}
          >
            Back to Courses
          </Button>
        </div>
      </AdminLayout>
    );
}

  return (
    <AdminLayout title="Create Module">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Create Module</h1>
            <p className="mt-1 text-sm text-neutral-500">
              {courseTitle}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/courses/${id}/modules`)}
          >
            Cancel
          </Button>
        </div>

        <ModuleForm
          onSubmit={handleSubmit}
          courseId={id as string}
        />
      </div>
    </AdminLayout>
  );
};

export default function AdminCreateModulePage() {
  return (
    <ProtectedRoute adminOnly>
      <CreateModulePage />
    </ProtectedRoute>
  );
}
