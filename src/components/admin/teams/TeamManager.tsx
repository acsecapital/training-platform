import React, {useState, useEffect } from 'react';
import {Team, Employee } from '@/types/company.types';
import {
  getCompanyTeams,
  getTeamById,
  updateTeam,
  deleteTeam
} from '@/services/companyService';
import {formatDate } from '@/utils/formatters';
import {
  Search,
  Filter,
  Users,
  UserPlus,
  MoreHorizontal,
  Trash2,
  Edit,
  Plus,
  X,
  Check,
  Eye,
  User
} from 'lucide-react';
import Link from 'next/link';

interface TeamManagerProps {
  companyId: string;
  onTeamSelect?: (team: Team) => void;
}

const TeamManager: React.FC<TeamManagerProps> = ({companyId, onTeamSelect }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  // No longer using modal for team creation
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  useEffect(() => {
    fetchTeams();
}, [companyId]);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      setError(null);

      const fetchedTeams = await getCompanyTeams(companyId);
      setTeams(fetchedTeams);
      setFilteredTeams(fetchedTeams);
  } catch (err) {
      console.error('Error fetching teams:', err);
      setError('Failed to load teams. Please try again.');
  } finally {
      setLoading(false);
  }
};

  useEffect(() => {
    // Apply search filter
    if (searchTerm) {
      const filtered = teams.filter(team =>
        team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTeams(filtered);
  } else {
      setFilteredTeams(teams);
  }
}, [searchTerm, teams]);

  // Team creation is now handled by the dedicated page

  const handleEditTeam = async (teamId: string, updates: Partial<Team>) => {
    try {
      setLoading(true);
      setError(null);

      await updateTeam(companyId, teamId, updates);
      setShowEditModal(false);
      setSelectedTeam(null);
      fetchTeams();
  } catch (err) {
      console.error('Error updating team:', err);
      setError('Failed to update team. Please try again.');
  } finally {
      setLoading(false);
  }
};

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('Are you sure you want to delete this team?')) {
      return;
  }

    try {
      setLoading(true);
      setError(null);

      await deleteTeam(companyId, teamId);
      fetchTeams();
  } catch (err) {
      console.error('Error deleting team:', err);
      setError('Failed to delete team. Please try again.');
  } finally {
      setLoading(false);
  }
};

  const openEditModal = (team: Team) => {
    setSelectedTeam(team);
    setShowEditModal(true);
};



  if (loading && teams.length === 0) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
}

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <div className="p-4 border-b border-neutral-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative flex-grow max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-neutral-400" />
          </div>
          <input
            type="text"
            placeholder="Search teams..."
            className="block w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Link
          href="/admin/teams/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          <Users className="h-4 w-4 mr-2" />
          Create Team
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200">
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

      {filteredTeams.length === 0 ? (
        <div className="p-8 text-center">
          <Users className="h-12 w-12 text-neutral-400 mx-auto" />
          <h3 className="mt-2 text-lg font-medium text-neutral-900">No Teams Found</h3>
          <p className="mt-1 text-neutral-500">
            {teams.length === 0
              ? 'Get started by creating your first team.'
              : 'No teams match your search criteria.'}
          </p>
          <div className="mt-6">
            <Link
              href="/admin/teams/new"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Team
            </Link>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                >
                  Team Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                >
                  Description
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                >
                  Members
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                >
                  Created
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider"
                >
                  View / Edit / Delete
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {filteredTeams.map((team) => (
                <tr key={team.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-neutral-900">
                          {team.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-neutral-500 max-w-xs truncate">
                      {team.description || 'No description'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-neutral-900">
                      {team.memberIds?.length || 0} members
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                    {formatDate(team.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end items-center space-x-2">
                      <Link
                        href={{
                          pathname: `/admin/teams/${team.id}/members`,
                          query: {companyId: team.companyId || companyId }
                      }}
                        className="text-primary-600 hover:text-primary-900"
                        title="View Team Members"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link
                        href={{
                          pathname: `/admin/teams/${team.id}/add-members`,
                          query: {companyId: team.companyId || companyId }
                      }}
                        className="text-primary-600 hover:text-primary-900"
                        title="Add Team Members"
                      >
                        <UserPlus className="h-4 w-4" />
                      </Link>
                      <Link
                        href={{
                          pathname: `/admin/teams/${team.id}/edit`,
                          query: {companyId: team.companyId || companyId }
                      }}
                        className="text-primary-600 hover:text-primary-900"
                        title="Edit Team"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDeleteTeam(team.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Team"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      {onTeamSelect && (
                        <button
                          onClick={() => onTeamSelect(team)}
                          className="text-neutral-400 hover:text-neutral-500"
                        >
                          <MoreHorizontal className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Team creation is now handled by the dedicated page */}

      {/* Edit Team Modal would go here */}
      {showEditModal && selectedTeam && (
        <div className="fixed inset-0 bg-neutral-800 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-screen overflow-y-auto">
            <div className="px-4 py-5 sm:px-6 border-b border-neutral-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-neutral-900">Edit Team</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedTeam(null);
              }}
                className="text-neutral-400 hover:text-neutral-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Team edit form would go here */}
            <div className="p-4">
              <p className="text-sm text-neutral-500">
                Team edit form would be implemented here.
              </p>
            </div>
          </div>
        </div>
      )}




    </div>
  );
};

export default TeamManager;
