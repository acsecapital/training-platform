import React, {useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import TeamManager from '@/components/admin/teams/TeamManager';
import DepartmentEditor from '@/components/admin/teams/DepartmentEditor';
import {useRouter } from 'next/router';
import {useAuth } from '@/context/AuthContext';
import {NextPage } from 'next';
import Head from 'next/head';
import {Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {getAllCompanies } from '@/services/companyService';
import {Company } from '@/types/company.types';
import {Briefcase } from 'lucide-react';

const TeamsPage: NextPage = () => {
  const router = useRouter();
  const {tab, companyId: companyIdParam } = router.query;
  const {user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('teams');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  // Fetch companies on component mount
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoadingCompanies(true);
        const fetchedCompanies = await getAllCompanies();
        setCompanies(fetchedCompanies);

        // If there are companies, select the first one by default
        // or use the one from URL params if available
        if (fetchedCompanies.length > 0) {
          if (companyIdParam && typeof companyIdParam === 'string') {
            setSelectedCompanyId(companyIdParam);
        } else {
            setSelectedCompanyId(fetchedCompanies[0].id);
        }
      }
    } catch (error) {
        console.error('Error fetching companies:', error);
    } finally {
        setLoadingCompanies(false);
    }
  };

    void fetchCompanies();
}, [companyIdParam]);

  // Set active tab based on URL query parameter
  useEffect(() => {
    if (tab === 'departments') {
      setActiveTab('departments');
  }
}, [tab]);

  // Redirect if user is not admin
  useEffect(() => {
    if (!loading && user && !user.roles?.admin) {
      void router.push('/dashboard');
  }
}, [user, loading, router]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    void router.push({
      pathname: router.pathname,
      query: {
        ...(value === 'departments' ? {tab: 'departments'} : {}),
        ...(selectedCompanyId ? {companyId: selectedCompanyId } : {})
    }
  }, undefined, {shallow: true });
};

  const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCompanyId = e.target.value;
    setSelectedCompanyId(newCompanyId);

    void router.push({
      pathname: router.pathname,
      query: {
        ...(activeTab === 'departments' ? {tab: 'departments'} : {}),
        ...(newCompanyId ? {companyId: newCompanyId } : {})
    }
  }, undefined, {shallow: true });
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
        <title>Teams & Departments | Admin</title>
      </Head>

      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <h1 className="text-2xl font-semibold text-neutral-900 mb-4 sm:mb-0">Teams & Departments</h1>

            <div className="w-full sm:w-auto">
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Briefcase className="h-5 w-5 text-neutral-400" />
                </div>
                <select
                  id="companyId"
                  name="companyId"
                  className="focus:ring-primary focus:border-primary block w-full pl-10 py-2 sm:text-sm border-neutral-300 rounded-md"
                  value={selectedCompanyId}
                  onChange={handleCompanyChange}
                  disabled={loadingCompanies || companies.length === 0}
                >
                  {loadingCompanies ? (
                    <option value="">Loading companies...</option>
                  ) : companies.length === 0 ? (
                    <option value="">No companies available</option>
                  ) : (
                    companies.map(company => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-4">
            {!selectedCompanyId ? (
              <div className="bg-white shadow-sm rounded-lg p-8 text-center">
                <Briefcase className="h-12 w-12 text-neutral-400 mx-auto" />
                <h3 className="mt-2 text-lg font-medium text-neutral-900">No Company Selected</h3>
                <p className="mt-1 text-neutral-500">
                  {companies.length === 0
                    ? 'No companies available. Please create a company first.'
                    : 'Please select a company to view its teams and departments.'}
                </p>
              </div>
            ) : (
              <Tabs defaultValue={activeTab} className="w-full" onValueChange={handleTabChange}>
                <TabsList className="mb-6">
                  <TabsTrigger value="teams">
                    Teams
                  </TabsTrigger>
                  <TabsTrigger value="departments">
                    Departments
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="teams">
                  <TeamManager companyId={selectedCompanyId} />
                </TabsContent>

                <TabsContent value="departments">
                  <DepartmentEditor companyId={selectedCompanyId} />
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default TeamsPage;
