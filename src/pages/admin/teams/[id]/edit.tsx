import React, {useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import {Team } from '@/types/company.types';
import {getTeamById, updateTeam } from '@/services/companyService';
import {useRouter } from 'next/router';
import {useAuth } from '@/context/AuthContext';
import {NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import {ArrowLeft, Save, X, Users, Building, User, Eye, UserPlus } from 'lucide-react';

const EditTeamPage: NextPage = () => {
  const router = useRouter();
  const {id, companyId } = router.query;
  const {user, loading: authLoading } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [formData, setFormData] = useState<Partial<Team>>({
    name: '',
    description: '',
    departmentId: '',
    managerId: '',
});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
      setFormData({
        name: teamData.name,
        description: teamData.description,
        departmentId: teamData.departmentId,
        managerId: teamData.managerId,
        companyId: teamData.companyId,
      });
    } catch (err) {
      console.error('Error fetching team data:', err);
      setError('Failed to load team data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const {name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      if (!formData.name) {
        setError('Team name is required');
        setSaving(false);
        return;
      }

      if (!formData.companyId) {
        setError('Company ID is required');
        setSaving(false);
        return;
      }

      await updateTeam(formData.companyId, id as string, formData);

      setSuccess('Team updated successfully');

      // Redirect after a short delay
      setTimeout(() => {
        void router.push({
          pathname: `/admin/teams/${typeof id === 'string' ? id : ''}`,
          query: {companyId: typeof formData.companyId === 'string' ? formData.companyId : ''}
        });
      }, 1500);
    } catch (err) {
      console.error('Error updating team:', err);
      setError('Failed to update team. Please try again.');
    } finally {
      setSaving(false);
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
                href="/admin/teams"
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
        <title>Edit Team | Admin</title>
      </Head>

      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex items-center mb-4">
            <Link
              href={{
                pathname: `/admin/teams/${typeof id === 'string' ? id : Array.isArray(id) ? id[0] : ''}`,
                query: {companyId: team?.companyId || (typeof companyId === 'string' ? companyId : Array.isArray(companyId) ? companyId[0] : '')}
              }}
              className="inline-flex items-center text-sm text-primary-600 hover:text-primary-900"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Team
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <h1 className="text-2xl font-semibold text-neutral-900 mb-4 sm:mb-0">Edit Team</h1>

            <div className="flex flex-wrap gap-3">
              <Link
                href={{
                  pathname: `/admin/teams/${typeof id === 'string' ? id : Array.isArray(id) ? id[0] : ''}`,
                  query: {companyId: team?.companyId || (typeof companyId === 'string' ? companyId : Array.isArray(companyId) ? companyId[0] : '')}
                }}
                className="inline-flex items-center px-4 py-2 border border-neutral-300 rounded-md shadow-sm text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Team Profile
              </Link>

              <Link
                href={{
                  pathname: `/admin/teams/${typeof id === 'string' ? id : Array.isArray(id) ? id[0] : ''}/add-members`,
                  query: {companyId: team?.companyId || (typeof companyId === 'string' ? companyId : Array.isArray(companyId) ? companyId[0] : '')}
                }}
                className="inline-flex items-center px-4 py-2 border border-neutral-300 rounded-md shadow-sm text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Team Members
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-4">
            <form onSubmit={(e) => { e.preventDefault(); void handleSubmit(e); }} className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-neutral-200">
                <h2 className="text-lg font-medium text-neutral-900">Team Information</h2>
              </div>

              {error && (
                <div className="px-6 py-4 bg-red-50 border-b border-red-200">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <X className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {success && (
                <div className="px-6 py-4 bg-green-50 border-b border-green-200">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <Save className="h-5 w-5 text-green-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-green-700">{success}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="px-8 py-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-2">
                        Team Name *
                      </label>
                      <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Users className="h-5 w-5 text-neutral-400" />
                        </div>
                        <input
                          type="text"
                          name="name"
                          id="name"
                          className="focus:ring-primary focus:border-primary block w-full pl-10 py-3 sm:text-sm border-neutral-300 rounded-md"
                          placeholder="Team Name"
                          value={formData.name || ''}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="departmentId" className="block text-sm font-medium text-neutral-700 mb-2">
                        Department
                      </label>
                      <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Building className="h-5 w-5 text-neutral-400" />
                        </div>
                        <input
                          type="text"
                          name="departmentId"
                          id="departmentId"
                          className="focus:ring-primary focus:border-primary block w-full pl-10 py-3 sm:text-sm border-neutral-300 rounded-md"
                          placeholder="Department ID"
                          value={formData.departmentId || ''}
                          onChange={handleInputChange}
                        />
                      </div>
                      <p className="mt-2 text-sm text-neutral-500">
                        The department this team belongs to.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-neutral-700 mb-2">
                        Description
                      </label>
                      <div>
                        <textarea
                          id="description"
                          name="description"
                          rows={6}
                          className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-neutral-300 rounded-md px-3 py-2"
                          placeholder="Team description"
                          value={formData.description || ''}
                          onChange={handleInputChange}
                        />
                      </div>
                      <p className="mt-2 text-sm text-neutral-500">
                        Brief description of the team's purpose and responsibilities.
                      </p>
                    </div>

                    <div className="mt-8">
                      <label htmlFor="managerId" className="block text-sm font-medium text-neutral-700 mb-2">
                        Team Manager ID
                      </label>
                      <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-neutral-400" />
                        </div>
                        <input
                          type="text"
                          name="managerId"
                          id="managerId"
                          className="focus:ring-primary focus:border-primary block w-full pl-10 py-3 sm:text-sm border-neutral-300 rounded-md"
                          placeholder="Manager ID"
                          value={formData.managerId || ''}
                          onChange={handleInputChange}
                        />
                      </div>
                      <p className="mt-2 text-sm text-neutral-500">
                        User ID of the team manager. Leave blank if not assigned yet.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200 flex justify-end">
                <Link
                  href={{
                    pathname: `/admin/teams/${typeof id === 'string' ? id : Array.isArray(id) ? id[0] : ''}`,
                    query: {companyId: team?.companyId || (typeof companyId === 'string' ? companyId : Array.isArray(companyId) ? companyId[0] : '')}
                  }}
                  className="inline-flex items-center px-4 py-2 border border-neutral-300 rounded-md shadow-sm text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary mr-3"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={saving}
                  onClick={(e) => { e.preventDefault(); void handleSubmit(e); }}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default EditTeamPage;
