import React from 'react';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import EnrollmentDetail from '@/components/admin/enrollments/EnrollmentDetail';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import {useRouter } from 'next/router';
import {NextPage } from 'next';
import Head from 'next/head';

const EnrollmentDetailPage: NextPage = () => {
  const router = useRouter();
  const {id } = router.query;
  const enrollmentId = typeof id === 'string' ? id : '';

  if (!enrollmentId) {
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
        <title>Enrollment Details | Admin</title>
      </Head>
      
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-neutral-900">Enrollment Details</h1>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-4">
            <EnrollmentDetail enrollmentId={enrollmentId} />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

// Wrap the component with ProtectedRoute to ensure only admins can access it
export default function EnrollmentDetailPageWrapper() {
  return (
    <ProtectedRoute adminOnly>
      <EnrollmentDetailPage />
    </ProtectedRoute>
  );
}
