import React, {useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import CompanyDashboard from '@/components/admin/companies/CompanyDashboard';
import EmployeeManager from '@/components/admin/companies/EmployeeManager';
import DepartmentManager from '@/components/admin/companies/DepartmentManager';
import {useRouter } from 'next/router';
import {useAuth } from '@/context/AuthContext';
import {NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import {ArrowLeft, ChevronDown, Users, Building, BarChart2, Edit } from 'lucide-react';

const CompanyDashboardPage: NextPage = () => {
  const router = useRouter();
  const {id, tab } = router.query;
  const {user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'employees' | 'departments'>('dashboard');

  // Set active tab based on URL query parameter
  useEffect(() => {
    if (tab === 'employees') {
      setActiveTab('employees');
  } else if (tab === 'departments') {
      setActiveTab('departments');
  } else {
      setActiveTab('dashboard');
  }
}, [tab]);

  // Redirect if user is not admin
  React.useEffect(() => {
    if (!loading && user && !user.roles?.admin) {
      router.push('/dashboard');
  }
}, [user, loading, router]);

  if (loading || !id) {
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
          <div className="flex items-center mb-4">
            <Link
              href="/admin/companies"
              className="inline-flex items-center text-sm text-primary-600 hover:text-primary-900"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Companies
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <h1 className="text-2xl font-semibold text-neutral-900 mb-2 sm:mb-0">Company Management</h1>
            <Link
              href={`/admin/companies/${id}/edit`}
              className="inline-flex items-center px-3 py-1 border border-neutral-300 rounded-md text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit Company
            </Link>
          </div>

          {/* Tabs */}
          <div className="border-b border-neutral-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => {
                  setActiveTab('dashboard');
                  router.push(`/admin/companies/${id}`, undefined, {shallow: true });
              }}
                className={`${
                  activeTab === 'dashboard'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <BarChart2 className="h-5 w-5 mr-2" />
                Dashboard
              </button>
              <button
                onClick={() => {
                  setActiveTab('employees');
                  router.push(`/admin/companies/${id}?tab=employees`, undefined, {shallow: true });
              }}
                className={`${
                  activeTab === 'employees'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <Users className="h-5 w-5 mr-2" />
                Employees
              </button>
              <button
                onClick={() => {
                  setActiveTab('departments');
                  router.push(`/admin/companies/${id}?tab=departments`, undefined, {shallow: true });
              }}
                className={`${
                  activeTab === 'departments'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <Building className="h-5 w-5 mr-2" />
                Departments
              </button>
            </nav>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-4">
            {activeTab === 'dashboard' && (
              <CompanyDashboard companyId={id as string} />
            )}

            {activeTab === 'employees' && (
              <EmployeeManager companyId={id as string} />
            )}

            {activeTab === 'departments' && (
              <DepartmentManager companyId={id as string} />
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default CompanyDashboardPage;
