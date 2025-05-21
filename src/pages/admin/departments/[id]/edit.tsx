import React from 'react';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import DepartmentFormPage from '@/components/admin/companies/DepartmentFormPage';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import {NextPage } from 'next';
import Head from 'next/head';
import {useRouter } from 'next/router';

const EditDepartmentPage: NextPage = () => {
  const router = useRouter();
  const {id } = router.query;
  const departmentId = id as string;

  return (
    <AdminLayout title="Edit Department">
      <Head>
        <title>Edit Department | Training Platform</title>
      </Head>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-neutral-900">Edit Department</h1>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-4">
            {departmentId && <DepartmentFormPage companyId="default" departmentId={departmentId} />}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

// Wrap the component with ProtectedRoute to ensure only admins can access it
export default function EditDepartmentPageWrapper() {
  return (
    <ProtectedRoute adminOnly>
      <EditDepartmentPage />
    </ProtectedRoute>
  );
}
