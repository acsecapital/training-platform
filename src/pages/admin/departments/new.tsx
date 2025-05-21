import React from 'react';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import DepartmentFormPage from '@/components/admin/companies/DepartmentFormPage';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import {NextPage } from 'next';
import Head from 'next/head';

const NewDepartmentPage: NextPage = () => {
  return (
    <AdminLayout title="Create Department">
      <Head>
        <title>Create Department | Training Platform</title>
      </Head>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-neutral-900">Create Department</h1>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-4">
            <DepartmentFormPage companyId="default" />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

// Wrap the component with ProtectedRoute to ensure only admins can access it
export default function CreateDepartmentPage() {
  return (
    <ProtectedRoute adminOnly>
      <NewDepartmentPage />
    </ProtectedRoute>
  );
}
