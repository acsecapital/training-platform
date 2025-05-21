import React, {useState, useEffect } from 'react';
import {useRouter } from 'next/router';
import {doc, getDoc, collection, getDocs, query, orderBy, deleteDoc } from 'firebase/firestore';
import {verifyAllModuleLessonCounts } from '@/services/moduleService';
import {firestore } from '@/services/firebase';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import LessonList from '@/components/admin/courses/lessons/LessonList';
import Button from '@/components/ui/Button';

interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'text' | 'quiz';
  content: string;
  videoId?: string;
  duration: number;
  order: number;
  status: 'draft' | 'published';
}

const ModuleLessonsPage: React.FC = () => {
  const router = useRouter();
  const {id, moduleId } = router.query;
  
  const [courseTitle, setCourseTitle] = useState('');
  const [moduleTitle, setModuleTitle] = useState('');
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch course, module, and lessons data
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
        
        // Fetch lessons
        const lessonsCollection = collection(firestore, `courses/${id}/modules/${moduleId}/lessons`);
        const lessonsQuery = query(lessonsCollection, orderBy('order', 'asc'));
        const lessonsSnapshot = await getDocs(lessonsQuery);
        
        const lessonsList: Lesson[] = [];
        
        lessonsSnapshot.forEach((doc) => {
          const data = doc.data();
          lessonsList.push({
            id: doc.id,
            title: data.title || '',
            type: data.type || 'text',
            content: data.content || '',
            videoId: data.videoId,
            duration: data.duration || 0,
            order: data.order || 0,
            status: data.status || 'draft',
        });
      });
        
        setLessons(lessonsList);
    } catch (err: any) {
        console.error('Error fetching data:', err);
        setError('Failed to load lessons. Please try again.');
    } finally {
        setLoading(false);
    }
  };
    
    fetchData();
}, [id, moduleId]);

  // Handle lesson deletion
  const handleDeleteLesson = async (lessonId: string) => {
    if (!id || typeof id !== 'string' || !moduleId || typeof moduleId !== 'string' || !lessonId) return;

    if (!confirm('Are you sure you want to delete this lesson? This action cannot be undone.')) {
      return;
  }

    try {
      setLoading(true);

      // Delete the lesson from Firestore
      await deleteDoc(doc(firestore, `courses/${id}/modules/${moduleId}/lessons`, lessonId));

      // Update the UI
      setLessons(prev => prev.filter(lesson => lesson.id !== lessonId));

      // Verify all module lesson counts after deletion
      // This will also update the course's total lesson count
      await verifyAllModuleLessonCounts(id);

  } catch (err: any) {
      console.error('Error deleting lesson:', err);
      setError('Failed to delete lesson. Please try again.');
  } finally {
      setLoading(false);
  }
};

  if (loading) {
    return (
      <AdminLayout title="Module Lessons">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
}

  if (error) {
    return (
      <AdminLayout title="Module Lessons">
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
    <AdminLayout title={`Lessons: ${moduleTitle}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Module Lessons</h1>
            <div className="mt-1 text-sm text-neutral-500">
              <span>{courseTitle}</span>
              <span className="mx-2">›</span>
              <span>{moduleTitle}</span>
            </div>
          </div>
          <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => router.push(`/admin/courses/${id}/modules/${moduleId}/edit`)}
            >
              Edit Module
            </Button>
            <Button
              variant="primary"
              onClick={() => router.push(`/admin/courses/${id}/modules/${moduleId}/lessons/create`)}
            >
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add Lesson
              </span>
            </Button>
          </div>
        </div>
        
        {/* Lesson List */}
        <LessonList
          lessons={lessons}
          courseId={id as string}
          moduleId={moduleId as string}
          onDelete={handleDeleteLesson}
        />
      </div>
    </AdminLayout>
  );
};

export default function AdminModuleLessonsPage() {
  return (
    <ProtectedRoute adminOnly>
      <ModuleLessonsPage />
    </ProtectedRoute>
  );
}
