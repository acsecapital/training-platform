import React from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/admin/layout/AdminLayout';

const UtilitiesIndexPage: React.FC = () => {
  return (
    <AdminLayout title="Utilities">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <p className="mb-4 text-sm text-neutral-600">
          Access various utilities to help maintain and fix data in the platform.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Fix Module Counts Card */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-primary-100 rounded-md p-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h2 className="text-lg font-medium text-neutral-900">Fix Module Counts</h2>
                  <p className="mt-1 text-sm text-neutral-600">
                    Ensure that module counts in courses match the actual number of modules.
                  </p>
                </div>
              </div>
              <div className="mt-6">
                <Link href="/admin/utilities/fix-module-counts" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                  Go to Fix Module Counts
                </Link>
              </div>
            </div>
          </div>

          {/* Fix Category Counts Card */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h2 className="text-lg font-medium text-neutral-900">Fix Category Counts</h2>
                  <p className="mt-1 text-sm text-neutral-600">
                    Ensure that category counts match the actual number of courses in each category.
                  </p>
                </div>
              </div>
              <div className="mt-6">
                <Link href="/admin/utilities/fix-category-counts" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                  Go to Fix Category Counts
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default UtilitiesIndexPage;
