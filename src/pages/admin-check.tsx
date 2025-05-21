import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {useAuth } from '@/context/AuthContext';

const AdminCheckPage: React.FC = () => {
  const {user, loading, initialized } = useAuth();

  return (
    <>
      <Head>
        <title>Admin Access Check</title>
      </Head>

      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Access Check</h1>
          
          {loading || !initialized ? (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
              <p className="text-center mt-4 text-gray-600">Checking authentication status...</p>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h2 className="text-lg font-medium text-gray-900">Authentication Status</h2>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                {user ? (
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
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Admin Access</dt>
                      <dd className="mt-1 text-sm">
                        {user.roles?.admin ? (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            Yes
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                            No
                          </span>
                        )}
                      </dd>
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
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-600">You are not logged in.</p>
                    <Link href="/login" className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
                      Go to Login
                    </Link>
                  </div>
                )}
              </div>
              
              <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Actions</h3>
                <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex">
                  {user?.roles?.admin ? (
                    <Link href="/admin" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
                      Go to Admin Panel
                    </Link>
                  ) : (
                    <button 
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-400 cursor-not-allowed"
                      disabled
                    >
                      Admin Panel (No Access)
                    </button>
                  )}
                  
                  {user ? (
                    <button 
                      onClick={async () => {
                        try {
                          await fetch('/api/admin/grant-admin', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                          },
                            body: JSON.stringify({userId: user.id }),
                        });
                          alert('Admin access request sent. Please refresh the page.');
                      } catch (error) {
                          console.error('Error:', error);
                          alert('Failed to request admin access.');
                      }
                    }}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                    >
                      Request Admin Access
                    </button>
                  ) : null}
                  
                  <Link href="/" className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50">
                    Back to Home
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminCheckPage;
