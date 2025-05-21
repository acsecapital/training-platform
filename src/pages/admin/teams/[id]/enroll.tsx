import React from 'react';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import TeamEnrollmentTool from '@/components/admin/teams/TeamEnrollmentTool';
import {useRouter } from 'next/router';
import {useAuth } from '@/context/AuthContext';
import {NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import {ArrowLeft } from 'lucide-react';

const TeamEnrollmentPage: NextPage = () => {
  const router = useRouter();
  const {id, companyId } = router.query;
  const {user, loading } = useAuth();

  // Redirect if user is not admin
  React.useEffect(() => {
    if (!loading && user && !user.roles?.admin) {
      void router.push('/dashboard');
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
        <title>Team Enrollment | Admin</title>
      </Head>

      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex items-center mb-4">
            <Link
              href={{
                pathname: `/admin/teams/${typeof id === 'string' ? id : Array.isArray(id) ? id[0] : ''}`,
                query: {companyId: typeof companyId === 'string' ? companyId : Array.isArray(companyId) ? companyId[0] : ''}
              }}
              className="inline-flex items-center text-sm text-primary-600 hover:text-primary-900"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Team
            </Link>
          </div>

          <h1 className="text-2xl font-semibold text-neutral-900">Team Enrollment</h1>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-4">
            <TeamEnrollmentTool
              companyId={typeof companyId === 'string' ? companyId : ''}
              teamId={typeof id === 'string' ? id : ''}
            />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default TeamEnrollmentPage;
