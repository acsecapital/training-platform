import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

const AdminNotFoundPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>Page Not Found | Admin Panel</title>
      </Head>
      
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
            <h1 className="text-6xl font-extrabold text-gray-900">404</h1>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">Page Not Found</h2>
            <p className="mt-2 text-sm text-gray-600">
              The admin page you're looking for doesn't exist or you don't have permission to view it.
            </p>
            
            <div className="mt-6 flex justify-center">
              <Link
                href="/admin"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Back to Admin Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminNotFoundPage;
