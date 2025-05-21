import React, {useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import {Team, Employee } from '@/types/company.types';
import {getTeamById, getCompanyEmployees, getTeamMembers, addTeamMember } from '@/services/companyService';
import {useRouter } from 'next/router';
import {useAuth } from '@/context/AuthContext';
import {NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import {ArrowLeft, Users, UserPlus, Search } from 'lucide-react';

const AddTeamMembersPage: NextPage = () => {
  const router = useRouter();
  const {id, companyId } = router.query;
  const {user, loading: authLoading } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [availableEmployees, setAvailableEmployees] = useState<Employee[]>([]);
  const [teamMembers, setTeamMembers] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingMember, setAddingMember] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);

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

  useEffect(() => {
    if (searchTerm) {
      const filtered = availableEmployees.filter(employee =>
        employee.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.department?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredEmployees(filtered);
  } else {
      setFilteredEmployees(availableEmployees);
  }
}, [searchTerm, availableEmployees]);

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
      const members = await getTeamMembers(companyId, id);
      setTeamMembers(members);

      // Get all employees for the company
      const allEmployees = await getCompanyEmployees(companyId);

      // Filter out employees that are already team members
      const memberIds = members.map(member => member.id);
      const available = allEmployees.filter(employee => !memberIds.includes(employee.id));

      setAvailableEmployees(available);
      setFilteredEmployees(available);
  } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again.');
  } finally {
      setLoading(false);
  }
};

  const handleAddMember = async (employeeId: string) => {
    if (!team) return;

    try {
      setAddingMember(employeeId);
      setError(null);
      setSuccess(null);

      await addTeamMember(companyId as string, id as string, employeeId);

      // Add the employee to the team members list
      const employee = availableEmployees.find(emp => emp.id === employeeId);
      if (employee) {
        setTeamMembers(prev => [...prev, employee]);
        setAvailableEmployees(prev => prev.filter(emp => emp.id !== employeeId));
        setFilteredEmployees(prev => prev.filter(emp => emp.id !== employeeId));
        setSuccess(`${employee.firstName} ${employee.lastName} added to team successfully.`);
    }
  } catch (err) {
      console.error('Error adding team member:', err);
      setError('Failed to add team member. Please try again.');
  } finally {
      setAddingMember(null);
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
                  query: {companyId }
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
        <title>Add Team Members | Admin</title>
      </Head>

      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex items-center mb-4">
            <Link
              href={{
                pathname: `/admin/teams/${typeof id === 'string' ? id : Array.isArray(id) ? id[0] : ''}`,
                query: {companyId }
            }}
              className="inline-flex items-center text-sm text-primary-600 hover:text-primary-900"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Team
            </Link>
          </div>

          <h1 className="text-2xl font-semibold text-neutral-900 mb-4">Add Members to {team?.name}</h1>

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

          <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-neutral-200">
              <h2 className="text-lg font-medium text-neutral-900">Current Team Members</h2>
            </div>

            <div className="overflow-x-auto">
              {teamMembers.length === 0 ? (
                <div className="p-6 text-center">
                  <Users className="h-12 w-12 text-neutral-400 mx-auto" />
                  <h3 className="mt-2 text-lg font-medium text-neutral-900">No Team Members</h3>
                  <p className="mt-1 text-neutral-500">
                    This team doesn't have any members yet.
                  </p>
                </div>
              ) : (
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
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-200">
                    {teamMembers.map((member) => (
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="p-4 border-b border-neutral-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-lg font-medium text-neutral-900">Available Employees</h2>
              <div className="relative flex-grow max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search employees..."
                  className="block w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              {filteredEmployees.length === 0 ? (
                <div className="p-6 text-center">
                  <Users className="h-12 w-12 text-neutral-400 mx-auto" />
                  <h3 className="mt-2 text-lg font-medium text-neutral-900">No Available Employees</h3>
                  <p className="mt-1 text-neutral-500">
                    {availableEmployees.length === 0
                      ? 'All employees are already members of this team or there are no employees in this company.'
                      : 'No employees match your search criteria.'}
                  </p>
                </div>
              ) : (
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
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-200">
                    {filteredEmployees.map((employee) => (
                      <tr key={employee.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                              {employee.photoURL ? (
                                <img
                                  className="h-8 w-8 rounded-full object-cover"
                                  src={employee.photoURL}
                                  alt={`${employee.firstName} ${employee.lastName}`}
                                />
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-800 font-medium text-xs">
                                  {employee.firstName?.[0]?.toUpperCase() || '?'}{employee.lastName?.[0]?.toUpperCase() || '?'}
                                </div>
                              )}
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-neutral-900">
                                {employee.firstName} {employee.lastName}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                          {employee.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                          {employee.department?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => { void handleAddMember(employee.id); }}
                            disabled={addingMember === employee.id}
                            className="inline-flex items-center px-3 py-1 border border-transparent rounded-md text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
                          >
                            {addingMember === employee.id ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                                Adding...
                              </>
                            ) : (
                              <>
                                <UserPlus className="h-4 w-4 mr-2" />
                                Add to Team
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AddTeamMembersPage;
