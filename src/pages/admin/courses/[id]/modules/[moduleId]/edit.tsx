import React, {useState, useEffect } from 'react';
import {useRouter } from 'next/router';
import {doc, getDoc } from 'firebase/firestore';
import {firestore } from '@/services/firebase';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import ModuleForm from '@/components/admin/courses/modules/ModuleForm';
import Button from '@/components/ui/Button';
import {Module } from '@/types/course.types'; // Import Module type
import {updateModule, updateCourseModuleCount, updateCourseLessonCount } from '@/services/moduleService';
import {toast } from 'sonner';

interface ModuleData {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'published';
  order: number;
}

const EditModulePage: React.FC = () => {
  const router = useRouter();
  const {id, moduleId } = router.query;

  const [courseTitle, setCourseTitle] = useState('');
  const [module, setModule] = useState<ModuleData | null>(null);
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
        setModule({
          id: moduleDoc.id,
          title: moduleData.title || '',
          description: moduleData.description || '',
          status: moduleData.status || 'draft',
          order: moduleData.order || 0,
      });
    } catch (err: any) {
        console.error('Error fetching data:', err);
        setError('Failed to load module. Please try again.');
    } finally {
        setLoading(false);
    }
  };

    fetchData();
}, [id, moduleId]);

  // Handle form submission
  const handleSubmit = async (moduleData: Partial<Module>) => {
    if (!id || typeof id !== 'string' || !moduleId || typeof moduleId !== 'string') return;

    try {
      setLoading(true);
      setError(null);

      // Show loading toast
      toast.loading('Updating module...', {id: 'update-module'});

      // Update the module using the service function
      await updateModule(id, moduleId, moduleData);

      // Update the course's module count and lesson count to ensure consistency
      await updateCourseModuleCount(id);
      await updateCourseLessonCount(id);

      // Success toast
      toast.success('Module updated successfully!', {id: 'update-module'});

      // Redirect back to the modules list
      router.push(`/admin/courses/${id}/modules`);
  } catch (err: any) {
      console.error('Error updating module:', err);
      setError(err.message || 'Failed to update module. Please try again.');
      toast.error(`Failed to update module: ${err.message || 'Unknown error'}`, {id: 'update-module'});
      setLoading(false);
  }
};

  if (loading) {
    return (
      <AdminLayout title="Edit Module">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
}

  if (error || !module) {
    return (
      <AdminLayout title="Edit Module">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-md">
          <h3 className="text-lg font-medium mb-2">Error</h3>
          <p>{error || 'Failed to load module'}</p>
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
    <AdminLayout title={`Edit Module: ${module.title}`}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Edit Module</h1>
            <p className="mt-1 text-sm text-neutral-500">
              {courseTitle}
            </p>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => router.push(`/admin/courses/${id}/modules`)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => router.push(`/admin/courses/${id}/modules/${moduleId}/lessons`)}
            >
              Manage Lessons
            </Button>
          </div>
        </div>

        <ModuleForm
          initialData={{
            title: module.title,
            description: module.description,
            status: module.status,
        }}
          onSubmit={handleSubmit}
          courseId={id as string}
          isEditing={true}
        />
      </div>
    </AdminLayout>
  );
};

export default function AdminEditModulePage() {
  return (
    <ProtectedRoute adminOnly>
      <EditModulePage />
    </ProtectedRoute>
  );
}
