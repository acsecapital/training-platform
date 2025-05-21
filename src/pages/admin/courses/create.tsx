import React, {useState } from 'react';
import {useRouter } from 'next/router';
import {serverTimestamp } from 'firebase/firestore';
import {firestore } from '@/services/firebase';
import {CourseRepository } from '@/repositories/courseRepository';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import CourseForm from '@/components/admin/courses/CourseForm';
import {AdminCourse } from '@/types/course.types';
import {toast } from 'sonner';

const CreateCoursePage: React.FC = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initial empty course data
  const initialCourseData: Partial<AdminCourse> = {
    title: '',
    description: '',
    thumbnail: '',
    duration: '',
    level: 'Beginner',
    status: 'draft',
    categoryIds: [],
};

  // Handle form submission
  const handleSubmit = async (courseData: Partial<AdminCourse>, publish: boolean) => {
    try {
      setIsSubmitting(true);

      // Show loading toast
      toast.loading('Creating course...', {id: 'create-course'});

      // Prepare course data for Firestore
      const now = new Date().toISOString();
      const courseToSave = {
        ...courseData,
        status: publish ? 'published' : 'draft',
        createdAt: now,
        updatedAt: now,
        lessons: courseData.lessons || 0, // Add lessons count (assuming it's passed or calculated)
        // Ensure price is stored as a number (0 if not valid)
        price: typeof courseData.price === 'number' ? courseData.price :
               (typeof courseData.price === 'string' && !isNaN(parseFloat(courseData.price))) ? 
               parseFloat(courseData.price) : 0,
        isFree: courseData.isFree || false,
        trialPeriod: courseData.trialPeriod || '',
        // Include instructor fields - use empty string instead of null
        instructor: courseData.instructor || '',
        instructorTitle: courseData.instructorTitle || '',
        instructorBio: courseData.instructorBio || '',
        instructorAvatar: courseData.instructorAvatar || '',
    };

      // Add the course to Firestore using CourseRepository
      const courseId = await CourseRepository.createCourse(courseToSave as Partial<AdminCourse>);

      // Success toast
      toast.success(`Course ${publish ? 'published' : 'saved as draft'}!`, {id: 'create-course'});

      // Redirect to the course list or edit page
      if (publish) {
        router.push('/admin/courses');
    } else {
        router.push(`/admin/courses/${courseId}/edit`);
    }
  } catch (error: any) {
      console.error('Error creating course:', error);
      toast.error(`Failed to create course: ${error.message || 'Unknown error'}`, {id: 'create-course'});
  } finally {
      setIsSubmitting(false);
  }
};

  return (
    <AdminLayout title="Create Course">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-neutral-900">Start Building</h1>
        </div>

        <CourseForm
          initialData={initialCourseData}
          onSubmit={handleSubmit}
          isCreating={true}
          isSubmitting={isSubmitting}
        />
      </div>
    </AdminLayout>
  );
};

export default function AdminCreateCoursePage() {
  return (
    <ProtectedRoute adminOnly>
      <CreateCoursePage />
    </ProtectedRoute>
  );
}

