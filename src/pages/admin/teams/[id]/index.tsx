import React, {useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import {Team, Employee } from '@/types/company.types';
import {getTeamById, getTeamMembers } from '@/services/companyService';
import {useRouter } from 'next/router';
import {useAuth } from '@/context/AuthContext';
import {NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import {ArrowLeft, Edit, Users, BarChart2, BookOpen, UserPlus } from 'lucide-react';
import {formatDate } from '@/utils/formatters';

const TeamDetailPage: NextPage = () => {
  const router = useRouter();
  const {id, companyId } = router.query;
  const {user, loading: authLoading } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if user is not admin
  React.useEffect(() => {
    if (!authLoading && user && !user.roles?.admin) {
      void router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (id && companyId) {
      void fetchTeamData();
    }
  }, [id, companyId]);

  const fetchTeamData = async () => {
    try {
      if (!id || !companyId || typeof id !== 'string' || typeof companyId !== 'string') {
        setError('Invalid team or company ID');
        return;
      }

      setLoading(true);
      setError(null);

      const teamData = await getTeamById(companyId, id);

      if (!teamData) {
        setError('Team not found');
        return;
      }

      setTeam(teamData);

      const teamMembers = await getTeamMembers(companyId, id);
      setMembers(teamMembers);
    } catch (err) {
      console.error('Error fetching team data:', err);
      setError('Failed to load team data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
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

  if (error || !team) {
    return (
      <AdminLayout>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="flex items-center mb-4">
              <Link
                href={{
                  pathname: "/admin/teams",
                  query: {companyId: team?.companyId || (typeof companyId === 'string' ? companyId : Array.isArray(companyId) ? companyId[0] : '') }
                }}
                className="inline-flex items-center text-sm text-primary-600 hover:text-primary-900"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Teams
              </Link>
            </div>

            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error || 'Team not found'}
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Head>
        <title>{team.name} | Team Details</title>
      </Head>

      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex items-center mb-4">
            <Link
              href="/admin/teams"
              className="inline-flex items-center text-sm text-primary-600 hover:text-primary-900"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Teams
            </Link>
          </div>

          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-neutral-200 flex justify-between items-center">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary-600" />
                </div>
                <div className="ml-4">
                  <h1 className="text-2xl font-semibold text-neutral-900">{team.name}</h1>
                  <p className="text-sm text-neutral-500">
                    Created on {formatDate(team.createdAt)}
                  </p>
                </div>
              </div>

              <Link
                href={{
                  pathname: `/admin/teams/${typeof id === 'string' ? id : Array.isArray(id) ? id[0] : ''}/edit`,
                  query: {companyId: team.companyId || (typeof companyId === 'string' ? companyId : Array.isArray(companyId) ? companyId[0] : '')}
                }}
                className="inline-flex items-center px-4 py-2 border border-neutral-300 rounded-md shadow-sm text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary mr-3"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Team
              </Link>

              <Link
                href={{
                  pathname: `/admin/teams/${typeof id === 'string' ? id : Array.isArray(id) ? id[0] : ''}/add-members`,
                  query: {companyId: team.companyId || (typeof companyId === 'string' ? companyId : Array.isArray(companyId) ? companyId[0] : '')}
                }}
                className="inline-flex items-center px-4 py-2 border border-neutral-300 rounded-md shadow-sm text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Members
              </Link>
            </div>

            <div className="px-6 py-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h2 className="text-lg font-medium text-neutral-900 mb-4">Team Details</h2>

                  <div className="bg-neutral-50 rounded-lg p-4">
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <dt className="text-sm font-medium text-neutral-500">Description</dt>
                        <dd className="mt-1 text-sm text-neutral-900">
                          {team.description || 'No description provided.'}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-sm font-medium text-neutral-500">Department ID</dt>
                        <dd className="mt-1 text-sm text-neutral-900">
                          {team.departmentId || 'Not assigned'}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-sm font-medium text-neutral-500">Manager ID</dt>
                        <dd className="mt-1 text-sm text-neutral-900">
                          {team.managerId || 'Not assigned'}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-sm font-medium text-neutral-500">Members</dt>
                        <dd className="mt-1 text-sm text-neutral-900">
                          {members.length}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-sm font-medium text-neutral-500">Last Updated</dt>
                        <dd className="mt-1 text-sm text-neutral-900">
                          {formatDate(team.updatedAt)}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-medium text-neutral-900 mb-4">Quick Actions</h2>

                  <div className="grid grid-cols-1 gap-4">
                    <Link
                      href={{
                        pathname: `/admin/teams/${typeof id === 'string' ? id : Array.isArray(id) ? id[0] : ''}/members`,
                        query: {companyId: team.companyId || (typeof companyId === 'string' ? companyId : Array.isArray(companyId) ? companyId[0] : '')}
                      }}
                      className="inline-flex items-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                      <Users className="h-5 w-5 mr-2" />
                      View Team Members
                    </Link>

                    <Link
                      href={{
                        pathname: `/admin/teams/${typeof id === 'string' ? id : Array.isArray(id) ? id[0] : ''}/progress`,
                        query: {companyId: team.companyId || (typeof companyId === 'string' ? companyId : Array.isArray(companyId) ? companyId[0] : '')}
                      }}
                      className="inline-flex items-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                      <BarChart2 className="h-5 w-5 mr-2" />
                      View Team Progress
                    </Link>

                    <Link
                      href={{
                        pathname: `/admin/teams/${typeof id === 'string' ? id : Array.isArray(id) ? id[0] : ''}/enroll`,
                        query: {companyId: team.companyId || (typeof companyId === 'string' ? companyId : Array.isArray(companyId) ? companyId[0] : '')}
                      }}
                      className="inline-flex items-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                      <BookOpen className="h-5 w-5 mr-2" />
                      Enroll Team in Courses
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-200">
              <h2 className="text-lg font-medium text-neutral-900">Team Members</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                    >
                      Name
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                    >
                      Email
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                    >
                      Job Title
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                    >
                      Department
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {members.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-neutral-500">
                        No team members yet.
                      </td>
                    </tr>
                  ) : (
                    members.map((member) => (
                      <tr key={member.id} className="hover:bg-neutral-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-800 font-medium">
                              {member.firstName[0].toUpperCase()}{member.lastName[0].toUpperCase()}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-neutral-900">
                                {member.firstName} {member.lastName}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                          {member.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                          {member.jobTitle || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                          {member.department?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            member.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}>
                            {member.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default TeamDetailPage;
