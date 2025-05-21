import React from 'react';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import BulkEnrollmentTool from '@/components/admin/enrollments/BulkEnrollmentTool';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import {NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import {ArrowLeft } from 'lucide-react';

const BulkEnrollmentPage: NextPage = () => {
  return (
    <AdminLayout>
      <Head>
        <title>Bulk Enrollment | Admin</title>
      </Head>
      
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex items-center mb-4">
            <Link
              href="/admin/enrollments"
              className="inline-flex items-center text-sm text-primary-600 hover:text-primary-900 mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Enrollments
            </Link>
            <h1 className="text-2xl font-semibold text-neutral-900">Bulk Enrollment</h1>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-4">
            <BulkEnrollmentTool />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

// Wrap the component with ProtectedRoute to ensure only admins can access it
export default function BulkEnrollmentPageWrapper() {
  return (
    <ProtectedRoute adminOnly>
      <BulkEnrollmentPage />
    </ProtectedRoute>
  );
}
