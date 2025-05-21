import React, {useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import CompanyList from '@/components/admin/companies/CompanyList';
import {useRouter } from 'next/router';
import {useAuth } from '@/context/AuthContext';
import {NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import {BarChart2, Building, Users } from 'lucide-react';

const CompaniesPage: NextPage = () => {
  const router = useRouter();
  const {user, loading } = useAuth();
  const {view } = router.query;
  const [activeView, setActiveView] = useState<'dashboard' | 'list'>('list');

  // Set active view based on URL query parameter
  useEffect(() => {
    if (view === 'dashboard') {
      setActiveView('dashboard');
  } else {
      setActiveView('list');
  }
}, [view]);

  // Redirect if user is not admin
  React.useEffect(() => {
    if (!loading && user && !user.roles?.admin) {
      router.push('/dashboard');
  }
}, [user, loading, router]);

  const handleCreateCompany = () => {
    router.push('/admin/companies/new');
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
        <title>Company Management | Admin</title>
      </Head>

      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-neutral-900">Company Management</h1>

          {/* View Tabs */}
          <div className="border-b border-neutral-200 mt-4 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => {
                  setActiveView('dashboard');
                  router.push('/admin/companies?view=dashboard', undefined, {shallow: true });
              }}
                className={`${
                  activeView === 'dashboard'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <BarChart2 className="h-5 w-5 mr-2" />
                Dashboard
              </button>
              <button
                onClick={() => {
                  setActiveView('list');
                  router.push('/admin/companies?view=list', undefined, {shallow: true });
              }}
                className={`${
                  activeView === 'list'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <Building className="h-5 w-5 mr-2" />
                Companies
              </button>
            </nav>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-4">
            {activeView === 'dashboard' ? (
              <div className="bg-white shadow-sm rounded-lg p-6">
                <h2 className="text-xl font-medium text-neutral-900 mb-4">Company Dashboard Overview</h2>
                <p className="text-neutral-600 mb-6">
                  Welcome to the Company Management Dashboard. From here you can manage all companies,
                  their employees, and departments.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                    <h3 className="text-lg font-medium text-neutral-800 mb-2 flex items-center">
                      <Building className="h-5 w-5 mr-2 text-primary" />
                      Companies
                    </h3>
                    <p className="text-neutral-600 mb-4">Manage all registered companies in the system.</p>
                    <Link
                      href="/admin/companies?view=list"
                      className="text-primary hover:text-primary-dark font-medium"
                    >
                      View All Companies
                    </Link>
                  </div>

                  <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                    <h3 className="text-lg font-medium text-neutral-800 mb-2 flex items-center">
                      <Users className="h-5 w-5 mr-2 text-primary" />
                      Employees
                    </h3>
                    <p className="text-neutral-600 mb-4">Manage employees across all companies.</p>
                    <Link
                      href="/admin/users"
                      className="text-primary hover:text-primary-dark font-medium"
                    >
                      View All Users
                    </Link>
                  </div>

                  <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                    <h3 className="text-lg font-medium text-neutral-800 mb-2 flex items-center">
                      <Building className="h-5 w-5 mr-2 text-primary" />
                      Departments
                    </h3>
                    <p className="text-neutral-600 mb-4">Manage departments across all companies.</p>
                    <Link
                      href="/admin/departments"
                      className="text-primary hover:text-primary-dark font-medium"
                    >
                      View All Departments
                    </Link>
                  </div>
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={handleCreateCompany}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    Create New Company
                  </button>
                </div>
              </div>
            ) : (
              <CompanyList onCreateCompany={handleCreateCompany} />
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default CompaniesPage;
