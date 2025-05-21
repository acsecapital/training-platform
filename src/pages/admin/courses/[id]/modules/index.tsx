import React, {useState, useEffect } from 'react';
import {useRouter } from 'next/router';
import {doc, getDoc, collection, getDocs, query, orderBy, deleteDoc } from 'firebase/firestore';
import {firestore } from '@/services/firebase';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import ModuleList from '@/components/admin/courses/modules/ModuleList';
import Button from '@/components/ui/Button';
import {verifyAllModuleLessonCounts } from '@/services/moduleService';

interface Module {
  id: string;
  title: string;
  description: string;
  order: number;
  status: 'draft' | 'published';
  lessonCount: number;
}

const CourseModulesPage: React.FC = () => {
  const router = useRouter();
  const {id } = router.query;
  
  const [courseTitle, setCourseTitle] = useState('');
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch course and modules data
  useEffect(() => {
    const fetchData = async () => {
      if (!id || typeof id !== 'string') return;
      
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
        
        // Fetch modules
        const modulesCollection = collection(firestore, `courses/${id}/modules`);
        const modulesQuery = query(modulesCollection, orderBy('order', 'asc'));
        const modulesSnapshot = await getDocs(modulesQuery);
        
        const modulesList: Module[] = [];
        
        modulesSnapshot.forEach((doc) => {
          const data = doc.data();
          modulesList.push({
            id: doc.id,
            title: data.title || '',
            description: data.description || '',
            order: data.order || 0,
            status: data.status || 'draft',
            lessonCount: data.lessonCount || 0,
        });
      });
        
        setModules(modulesList);
    } catch (err: any) {
        console.error('Error fetching data:', err);
        setError('Failed to load course modules. Please try again.');
    } finally {
        setLoading(false);
    }
  };
    
    fetchData();
}, [id]);

  // Handle module deletion
  const handleDeleteModule = async (moduleId: string) => {
    if (!id || typeof id !== 'string' || !moduleId) return;

    if (!confirm('Are you sure you want to delete this module? This action cannot be undone.')) {
      return;
  }

    try {
      setLoading(true);

      // Delete the module from Firestore
      await deleteDoc(doc(firestore, `courses/${id}/modules`, moduleId));

      // Update the UI
      setModules(prev => prev.filter(module => module.id !== moduleId));

      // Verify all module lesson counts after deletion
      await verifyAllModuleLessonCounts(id);

      // Refresh modules list
      // No need to refetch, UI is updated directly

  } catch (err: any) {
      console.error('Error deleting module:', err);
      setError('Failed to delete module. Please try again.');
  } finally {
      setLoading(false);
  }
};

  if (loading) {
    return (
      <AdminLayout title="Course Modules">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
}

  if (error) {
    return (
      <AdminLayout title="Course Modules">
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
    <AdminLayout title={`Modules: ${courseTitle}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Course Modules</h1>
            <p className="mt-1 text-sm text-neutral-500">
              {courseTitle}
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => router.push(`/admin/courses/${id}/edit`)}
            >
              Edit Course
            </Button>
            <Button
              variant="primary"
              onClick={() => router.push(`/admin/courses/${id}/modules/create`)}
            >
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add Module
              </span>
            </Button>
          </div>
        </div>
        
        {/* Module List */}
        <ModuleList
          modules={modules}
          courseId={id as string}
          onDelete={handleDeleteModule}
        />
      </div>
    </AdminLayout>
  );
};

export default function AdminCourseModulesPage() {
  return (
    <ProtectedRoute adminOnly>
      <CourseModulesPage />
    </ProtectedRoute>
  );
}
