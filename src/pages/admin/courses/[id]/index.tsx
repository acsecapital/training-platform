import React from 'react';
import {useRouter } from 'next/router';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import CourseDetail from '@/components/admin/courses/CourseDetail';
import Head from 'next/head';

const CourseDetailPage: React.FC = () => {
  const router = useRouter();
  const {id } = router.query;
  const courseId = typeof id === 'string' ? id : '';

  if (!courseId) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
}

  return (
    <AdminLayout>
      <Head>
        <title>Course Details | Admin</title>
      </Head>
      
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-neutral-900">Course Details</h1>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-4">
            <CourseDetail courseId={courseId} />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

// Wrap the component with ProtectedRoute to ensure only admins can access it
export default function CourseDetailPageWrapper() {
  return (
    <ProtectedRoute adminOnly>
      <CourseDetailPage />
    </ProtectedRoute>
  );
}
