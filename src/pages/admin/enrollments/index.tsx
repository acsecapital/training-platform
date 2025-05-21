import React from 'react';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import EnrollmentManager from '@/components/admin/enrollments/EnrollmentManager';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import {NextPage } from 'next';
import Head from 'next/head';

const EnrollmentsPage: NextPage = () => {
  return (
    <AdminLayout>
      <Head>
        <title>Enrollment Management | Admin</title>
      </Head>
      
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-neutral-900">Enrollment Management</h1>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-4">
            <EnrollmentManager />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

// Wrap the component with ProtectedRoute to ensure only admins can access it
export default function EnrollmentManagementPage() {
  return (
    <ProtectedRoute adminOnly>
      <EnrollmentsPage />
    </ProtectedRoute>
  );
}
