import React, {useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import DepartmentManager from '@/components/admin/companies/DepartmentManager';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import {NextPage } from 'next';
import Head from 'next/head';
import {getCompanies } from '@/services/companyService';
import {Company } from '@/types/company.types';
import {Building, Search } from 'lucide-react';

const DepartmentsPage: NextPage = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true);
        const fetchedCompanies = await getCompanies();
        setCompanies(fetchedCompanies);

        // Set the first company as selected by default if available
        if (fetchedCompanies.length > 0) {
          setSelectedCompanyId(fetchedCompanies[0].id);
      }
    } catch (err) {
        console.error('Error fetching companies:', err);
        setError('Failed to load companies. Please try again.');
    } finally {
        setLoading(false);
    }
  };

    fetchCompanies();
}, []);

  return (
    <AdminLayout title="Department Management">
      <Head>
        <title>Department Management | Training Platform</title>
      </Head>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-neutral-900">Department Management</h1>

          {loading ? (
            <div className="mt-4 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="mt-4 bg-red-50 p-4 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          ) : companies.length === 0 ? (
            <div className="mt-4 bg-yellow-50 p-4 rounded-md">
              <p className="text-sm text-yellow-700">No companies found. Please create a company first.</p>
            </div>
          ) : (
            <div className="mt-4 bg-white shadow-sm rounded-lg p-4 border border-neutral-200">
              <div className="flex items-center">
                <Building className="h-5 w-5 text-neutral-400 mr-2" />
                <label htmlFor="company-select" className="block text-sm font-medium text-neutral-700 mr-4">
                  Select Company:
                </label>
                <select
                  id="company-select"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-neutral-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                  value={selectedCompanyId}
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                >
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {selectedCompanyId && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="py-4">
              <DepartmentManager companyId={selectedCompanyId} />
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

// Wrap the component with ProtectedRoute to ensure only admins can access it
export default function DepartmentManagementPage() {
  return (
    <ProtectedRoute adminOnly>
      <DepartmentsPage />
    </ProtectedRoute>
  );
}
