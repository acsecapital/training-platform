import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {useAuth } from '@/context/AuthContext';

const DebugAdminPage: React.FC = () => {
  const {user, loading, initialized } = useAuth();

  return (
    <>
      <Head>
        <title>Debug Admin Access</title>
      </Head>

      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Debug Admin Access</h1>

          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg font-medium text-gray-900">Authentication Status</h2>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Loading</dt>
                  <dd className="mt-1 text-sm text-gray-900">{loading ? 'True' : 'False'}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Initialized</dt>
                  <dd className="mt-1 text-sm text-gray-900">{initialized ? 'True' : 'False'}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Authenticated</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user ? 'Yes' : 'No'}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Admin Access</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user?.roles?.admin ? 'Yes' : 'No'}</dd>
                </div>
              </dl>
            </div>
          </div>

          {user && (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
              <div className="px-4 py-5 sm:px-6">
                <h2 className="text-lg font-medium text-gray-900">User Information</h2>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">User ID</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user.id}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Display Name</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user.displayName}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Roles</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      <pre className="bg-gray-100 p-2 rounded">
                        {JSON.stringify(user.roles, null, 2)}
                      </pre>
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          )}

          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg font-medium text-gray-900">Actions</h2>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <div className="space-y-4">
                <Link
                  href="/login"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Go to Login Page
                </Link>
                <Link
                  href="/admin"
                  className="ml-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Go to Admin Panel
                </Link>
                <Link
                  href="/promote-to-admin"
                  className="ml-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Promote to Admin
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DebugAdminPage;
