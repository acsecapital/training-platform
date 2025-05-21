import React from 'react';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import TeamForm from '@/components/admin/teams/TeamForm';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import {NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import {ArrowLeft } from 'lucide-react';

const NewTeamPage: NextPage = () => {
  return (
    <AdminLayout title="Create Team">
      <Head>
        <title>Create Team | Training Platform</title>
      </Head>
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex items-center mb-6">
            <Link
              href="/admin/teams"
              className="inline-flex items-center text-sm text-primary-600 hover:text-primary-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Teams
            </Link>
          </div>
          <h1 className="text-2xl font-semibold text-neutral-900 mb-6">Create Team</h1>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <TeamForm isCreating={true} />
        </div>
      </div>
    </AdminLayout>
  );
};

// Wrap the component with ProtectedRoute to ensure only admins can access it
export default function CreateTeamPage() {
  return (
    <ProtectedRoute adminOnly>
      <NewTeamPage />
    </ProtectedRoute>
  );
}
