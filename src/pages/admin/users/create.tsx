import React from 'react';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import UserForm from '@/components/admin/users/UserForm';
import {useRouter } from 'next/router';
import {useAuth } from '@/context/AuthContext';
import {NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import {ArrowLeft } from 'lucide-react';

const CreateUserPage: NextPage = () => {
  const router = useRouter();
  const {user, loading } = useAuth();

  // Redirect if user is not admin
  React.useEffect(() => {
    if (!loading && user && !user.roles?.admin) {
      void router.push('/dashboard');
  }
}, [user, loading, router]);

  const handleCancel = () => {
    void router.push('/admin/users');
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
        <title>Create User | Admin</title>
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

          <h1 className="text-2xl font-semibold text-neutral-900">Create New User</h1>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-4">
            <UserForm onCancel={handleCancel} isCreating={true} />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default CreateUserPage;
