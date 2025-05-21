import React from 'react';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import BulkUserOperations from '@/components/admin/users/BulkUserOperations';
import {useRouter } from 'next/router';
import {useAuth } from '@/context/AuthContext';
import {NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import {ArrowLeft } from 'lucide-react';
import {UserProfile } from '@/types/user.types';

const BulkUserOperationsPage: NextPage = () => {
  const router = useRouter();
  const {user, loading } = useAuth();

  // Redirect if user is not admin
  React.useEffect(() => {
    if (!loading && user && !user.roles?.admin) {
      void router.push('/dashboard');
  }
}, [user, loading, router]);

  const handleBulkImport = async (users: Partial<UserProfile>[]) => {
    // This would be implemented to call the appropriate API endpoint
    console.log('Bulk importing users:', users);
    // Mock implementation for demo purposes
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
    }, 1500);
  });
};

  const handleBulkExport = async () => {
    // This would be implemented to call the appropriate API endpoint
    console.log('Exporting users');
    // Mock implementation for demo purposes
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
    }, 1500);
  });
};

  const handleBulkUpdate = async (updates: Partial<UserProfile>, userIds: string[]) => {
    // This would be implemented to call the appropriate API endpoint
    console.log('Bulk updating users:', {updates, userIds });
    // Mock implementation for demo purposes
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
    }, 1500);
  });
};

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
}

  if (!user || !user.roles?.admin) {
    return null; // Will redirect
}

  return (
    <AdminLayout>
      <Head>
        <title>Bulk User Operations | Admin</title>
      </Head>

      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex items-center mb-4">
            <Link
              href="/admin/users"
              className="inline-flex items-center text-sm text-primary-600 hover:text-primary-900"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Users
            </Link>
          </div>

          <h1 className="text-2xl font-semibold text-neutral-900">Bulk User Operations</h1>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-4">
            <BulkUserOperations
              onBulkImport={handleBulkImport}
              onBulkExport={handleBulkExport}
              onBulkUpdate={handleBulkUpdate}
            />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default BulkUserOperationsPage;
