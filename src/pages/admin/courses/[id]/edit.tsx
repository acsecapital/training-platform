import React, {useState, useEffect, useCallback } from 'react';
import {useRouter } from 'next/router';
import {doc, getDoc, collection, query, orderBy, getDocs } from 'firebase/firestore';
import {firestore } from '@/services/firebase';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import CourseForm from '@/components/admin/courses/CourseForm';
import ModuleManager from '@/components/admin/modules/ModuleManager';
import LessonManager from '@/components/admin/lessons/LessonManager';
import {AdminCourse, Module } from '@/types/course.types';
import Button from '@/components/ui/Button';
import {toast } from 'sonner';
import {verifyAllModuleLessonCounts } from '@/services/moduleService';
import {CourseRepository } from '@/repositories/courseRepository';

const EditCoursePage: React.FC = () => {
  const router = useRouter();
  const {id } = router.query;

  const [course, setCourse] = useState<Partial<AdminCourse> | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modulesError, setModulesError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'modules' | 'lessons'>('details');
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

  // Define fetchModules function outside of useEffect to ensure consistent hook order
  const fetchModules = useCallback(async () => {
    if (!id || typeof id !== 'string') return;

    try {
      setModulesLoading(true);
      setModulesError(null);

      const modulesRef = collection(firestore, `courses/${id}/modules`);
      const q = query(modulesRef, orderBy('order', 'asc'));
      const querySnapshot = await getDocs(q);

      const modulesList: Module[] = [];
      const modulesWithLessonCounts: Module[] = [];

      // First, collect all modules
      querySnapshot.forEach((doc) => {
        modulesList.push({
          id: doc.id,
          ...doc.data() as Omit<Module, 'id'>
      });
    });

      // Then, fetch lesson counts for each module
      for (const module of modulesList) {
        try {
          const lessonsRef = collection(firestore, `courses/${id}/modules/${module.id}/lessons`);
          const lessonsSnapshot = await getDocs(lessonsRef);
          const lessonCount = lessonsSnapshot.size;

          modulesWithLessonCounts.push({
            ...module,
            lessonCount: lessonCount
        });
      } catch (error) {
          // Log only the error message and module ID, not the full objects
          console.error(`Error fetching lessons for module ${module.id}`);
          modulesWithLessonCounts.push({
            ...module,
            lessonCount: 0
        });
      }
    }

      setModules(modulesWithLessonCounts);
  } catch (err: any) {
      console.error('Error fetching modules');
      setModulesError('Failed to load modules. Please try again.');
  } finally {
      setModulesLoading(false);
  }
}, [id]);

  // Fetch course data
  useEffect(() => {
    const fetchCourse = async () => {
      if (!id || typeof id !== 'string') return;

      try {
        setLoading(true);
        setError(null);

        // Verify all module lesson counts and update course lesson count
        // This ensures the counts are accurate before displaying the course
        await verifyAllModuleLessonCounts(id);

        // Get course document with updated counts
        const courseDoc = await getDoc(doc(firestore, 'courses', id));

        if (!courseDoc.exists()) {
          setError('Course not found');
          return;
      }

        const courseData = courseDoc.data();
        
        // Create a complete course object with all fields
        const completeData = {
          id: courseDoc.id,
          title: courseData.title || '',
          description: courseData.description || '',
          thumbnail: courseData.thumbnail || '',
          duration: courseData.duration || '',
          level: courseData.level || 'Beginner',
          status: courseData.status || 'draft',
          modules: courseData.modules || 0,
          lessons: courseData.lessons || 0, // Make sure to include lessons count
          createdAt: courseData.createdAt || new Date().toISOString(),
          updatedAt: courseData.updatedAt || new Date().toISOString(),
          categoryIds: courseData.categoryIds || [],
          // Add missing fields for pricing and categories
          price: courseData.price !== undefined ? courseData.price : null,
          isFree: courseData.isFree || false,
          trialPeriod: courseData.trialPeriod || '',
          modulesList: courseData.modulesList || [],
          durationDetails: courseData.durationDetails || null,
          // Add instructor fields
          instructor: courseData.instructor || '',
          instructorTitle: courseData.instructorTitle || '',
          instructorBio: courseData.instructorBio || '',
          instructorAvatar: courseData.instructorAvatar || '',
      };

        // Set the course state
        setCourse(completeData);
    } catch (err: any) {
        console.error('Error fetching course');
        setError('Failed to load course. Please try again.');
    } finally {
        setLoading(false);
    }
  };

    fetchCourse();
}, [id]);

  // Call fetchModules in useEffect - Moved to top level
  useEffect(() => {
    if (id && typeof id === 'string') {
      fetchModules();
  }
}, [id, fetchModules]); // Added fetchModules to dependency array


  // Handle form submission
  const handleSubmit = async (courseData: Partial<AdminCourse>, publish: boolean) => {
    if (!id || typeof id !== 'string') return;

    try {
      setIsSubmitting(true);

      // Show loading toast
      toast.loading('Updating course...', {id: 'update-course'});

      // First, verify all module lesson counts to ensure they're accurate
      await verifyAllModuleLessonCounts(id);

      // Get the updated course with accurate counts - single read operation
      const updatedCourseDoc = await getDoc(doc(firestore, 'courses', id));
      const updatedCourseData = updatedCourseDoc.exists() ? updatedCourseDoc.data() : {};

      // Prepare course data for Firestore
      const now = new Date().toISOString();

      const courseToUpdate = {
        ...courseData,
        status: publish ? 'published' as const : 'draft' as const,
        updatedAt: now,
        // Use the verified counts from the database
        // Note: 'modules' field is removed as it's derived from modulesList.length
        lessons: updatedCourseData.lessons || 0,
        // Ensure price is stored as a number (0 if not valid)
        price: typeof courseData.price === 'number' ? courseData.price :
               (typeof courseData.price === 'string' && !isNaN(parseFloat(courseData.price))) ? 
               parseFloat(courseData.price) : 0,
        isFree: courseData.isFree === true,
        trialPeriod: courseData.trialPeriod || '',
        // Ensure modulesList is preserved
        modulesList: updatedCourseData.modulesList || [],
        // Ensure categoryIds is properly handled
        categoryIds: Array.isArray(courseData.categoryIds) ? courseData.categoryIds : [],
        // Include instructor fields - use empty string instead of null/undefined
        instructor: courseData.instructor || '',
        instructorTitle: courseData.instructorTitle || '',
        instructorBio: courseData.instructorBio || '',
        instructorAvatar: courseData.instructorAvatar || '',
    };

      // Remove id from the data to be updated
      delete courseToUpdate.id;

      // Update the course using CourseRepository to maintain data integrity
      await CourseRepository.updateCourse(id, courseToUpdate as Partial<AdminCourse>);

      // Success toast
      toast.success(`Course ${publish ? 'published' : 'saved as draft'}!`, {id: 'update-course'});

      // Redirect based on action
      if (publish) {
        router.push('/admin/courses');
    } else {
        // Stay on the edit page but refresh the data
        setCourse(prev => {
          if (!prev) return null;
          return {
            ...prev,
            ...courseToUpdate,
            id,
            status: courseToUpdate.status
        } as Partial<AdminCourse>;
      });
    }
  } catch (error: any) {
      console.error('Error updating course');
      toast.error(`Failed to update course: ${error.message || 'Unknown error'}`, {id: 'update-course'});
  } finally {
      setIsSubmitting(false);
  }
};

  if (loading) {
    return (
      <AdminLayout title="Edit Course">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
}

  if (error || !course) {
    return (
      <AdminLayout title="Edit Course">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-md">
          <h3 className="text-lg font-medium mb-2">Error</h3>
          <p>{error || 'Failed to load course'}</p>
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


  // Handle tab change
  const handleTabChange = (tab: 'details' | 'modules' | 'lessons') => {
    setActiveTab(tab);
    if (tab === 'details') {
      setSelectedModuleId(null);
  }
    // The fetchModules call is handled by the useEffect
};

  // Handle module selection for lessons tab
  const handleModuleSelect = (moduleId: string) => {
    setSelectedModuleId(moduleId);
    setActiveTab('lessons');
};

  return (
    <AdminLayout title={`Edit Course: ${course.title}`}>
      <div className="space-y-6">
        {/* Course Header */}
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/courses')}
          >
            Back to Courses
          </Button>
        </div>

        {/* Tabs */}
        <div className="border-b border-neutral-200">
          <nav className="-mb-px flex space-x-8">
            <button
              className={`${activeTab === 'details' ? 'border-primary-500 text-primary-600' : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              onClick={() => handleTabChange('details')}
            >
              Course Details
            </button>
            <button
              className={`${activeTab === 'modules' ? 'border-primary-500 text-primary-600' : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              onClick={() => handleTabChange('modules')}
            >
              Modules
            </button>
            {selectedModuleId && (
              <button
                className={`${activeTab === 'lessons' ? 'border-primary-500 text-primary-600' : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                onClick={() => handleTabChange('lessons')}
              >
                Lessons
              </button>
            )}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'details' && (
          <CourseForm
            initialData={course}
            onSubmit={handleSubmit}
            isCreating={false}
            isSubmitting={isSubmitting}
          />
        )}

        {activeTab === 'modules' && id && typeof id === 'string' && (
          <div className="bg-white shadow-sm rounded-lg overflow-hidden p-6">
            <ModuleManager
              courseId={id}
            />
          </div>
        )}

        {activeTab === 'lessons' && id && selectedModuleId && typeof id === 'string' && (
          <div className="bg-white shadow-sm rounded-lg overflow-hidden p-6">
            <LessonManager
              courseId={id}
              moduleId={selectedModuleId}
            />
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default function AdminEditCoursePage() {
  return (
    <ProtectedRoute adminOnly>
      <EditCoursePage />
    </ProtectedRoute>
  );
}





