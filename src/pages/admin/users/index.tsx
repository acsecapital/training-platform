import React from 'react';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import UserList from '@/components/admin/users/UserList';
import {useRouter } from 'next/router';
import {useAuth } from '@/context/AuthContext';
import {NextPage } from 'next';
import Head from 'next/head';

const UsersPage: NextPage = () => {
  const router = useRouter();
  const {user, loading } = useAuth();

  // Redirect if user is not admin
  React.useEffect(() => {
    if (!loading && user && !user.roles?.admin) {
      void router.push('/dashboard');
  }
}, [user, loading, router]);

  const handleCreateUser = () => {
    void router.push('/admin/users/create');
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
        <title>User Management | Admin</title>
      </Head>

      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-neutral-900">User Management</h1>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-4">
            <UserList onCreateUser={handleCreateUser} />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default UsersPage;
