import React, {useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import {Team, Employee } from '@/types/company.types';
import {getTeamById, getTeamMembers, removeTeamMember } from '@/services/companyService';
import {useRouter } from 'next/router';
import {useAuth } from '@/context/AuthContext';
import {NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import {ArrowLeft, Users, UserPlus, Trash2 } from 'lucide-react';

const TeamMembersPage: NextPage = () => {
  const router = useRouter();
  const {id, companyId } = router.query;
  const {user, loading: authLoading } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [removingMember, setRemovingMember] = useState<string | null>(null);

  // Redirect if user is not admin
  useEffect(() => {
    if (!authLoading && user && !user.roles?.admin) {
      void router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (id && companyId && typeof id === 'string' && typeof companyId === 'string') {
      void fetchData();
    }
  }, [id, companyId]);

  const fetchData = async () => {
    if (!id || !companyId || typeof id !== 'string' || typeof companyId !== 'string') {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get team data
      const teamData = await getTeamById(companyId, id);

      if (!teamData) {
        setError('Team not found');
        return;
      }

      setTeam(teamData);

      // Get team members
      const teamMembers = await getTeamMembers(companyId, id);
      setMembers(teamMembers);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!team || !id || !companyId || typeof id !== 'string' || typeof companyId !== 'string') return;

    if (!confirm(`Remove ${memberName} from this team?`)) {
      return;
    }

    try {
      setRemovingMember(memberId);
      setError(null);
      setSuccess(null);

      await removeTeamMember(companyId, id, memberId);

      setMembers(prev => prev.filter(member => member.id !== memberId));
      setSuccess(`${memberName} has been removed from the team.`);
    } catch (err) {
      console.error('Error removing team member:', err);
      setError('Failed to remove team member. Please try again.');
    } finally {
      setRemovingMember(null);
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

  if (error && !team) {
    return (
      <AdminLayout>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="flex items-center mb-4">
              <Link
                href={{
                  pathname: "/admin/teams",
                  query: {companyId: typeof companyId === 'string' ? companyId : '' }
                }}
                className="inline-flex items-center text-sm text-primary-600 hover:text-primary-900"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Teams
              </Link>
            </div>

            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Head>
        <title>Team Members | Admin</title>
      </Head>

      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex items-center mb-4">
            <Link
              href={{
                pathname: `/admin/teams/${typeof id === 'string' ? id : ''}`,
                query: {companyId: typeof companyId === 'string' ? companyId : Array.isArray(companyId) ? companyId[0] : ''}
              }}
              className="inline-flex items-center text-sm text-primary-600 hover:text-primary-900"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Team
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <h1 className="text-2xl font-semibold text-neutral-900 mb-4 sm:mb-0">
              {team?.name} - Team Members
            </h1>

            <Link
              href={{
                pathname: `/admin/teams/${typeof id === 'string' ? id : ''}/add-members`,
                query: {companyId: typeof companyId === 'string' ? companyId : Array.isArray(companyId) ? companyId[0] : ''}
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Members
            </Link>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-6">
              {success}
            </div>
          )}

          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            {members.length === 0 ? (
              <div className="p-8 text-center">
                <Users className="h-12 w-12 text-neutral-400 mx-auto" />
                <h3 className="mt-2 text-lg font-medium text-neutral-900">No Team Members</h3>
                <p className="mt-1 text-neutral-500">
                  This team doesn't have any members yet.
                </p>
                <div className="mt-6">
                  <Link
                    href={{
                      pathname: `/admin/teams/${typeof id === 'string' ? id : ''}/add-members`,
                      query: {companyId: typeof companyId === 'string' ? companyId : Array.isArray(companyId) ? companyId[0] : ''}
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Members
                  </Link>
                </div>
              </div>
            ) : (
              <div>
                <div className="px-6 py-4 border-b border-neutral-200">
                  <h2 className="text-lg font-medium text-neutral-900">
                    {members.length} {members.length === 1 ? 'Member' : 'Members'}
                  </h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-neutral-200">
                    <thead className="bg-neutral-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          Department
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-neutral-200">
                      {members.map((member) => (
                        <tr key={member.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8">
                                {member.photoURL ? (
                                  <img
                                    className="h-8 w-8 rounded-full object-cover"
                                    src={member.photoURL}
                                    alt={`${member.firstName} ${member.lastName}`}
                                  />
                                ) : (
                                  <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-800 font-medium text-xs">
                                    {member.firstName?.[0]?.toUpperCase() || '?'}{member.lastName?.[0]?.toUpperCase() || '?'}
                                  </div>
                                )}
                              </div>
                              <div className="ml-3">
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
                            {member.department?.name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 capitalize">
                            {member.role || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => {
                                void handleRemoveMember(member.id, `${member.firstName} ${member.lastName}`);
                              }}
                              disabled={removingMember === member.id}
                              className="inline-flex items-center text-red-600 hover:text-red-900 disabled:opacity-50"
                            >
                              {removingMember === member.id ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-red-600 mr-2"></div>
                                  Removing...
                                </>
                              ) : (
                                <>
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Remove
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default TeamMembersPage;
