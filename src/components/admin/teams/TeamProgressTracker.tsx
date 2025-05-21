import React, {useState, useEffect } from 'react';
import {Team } from '@/types/company.types';
import {TeamStats } from '@/types/company.types';
import {getTeamStats, getTeamById } from '@/services/companyService';
import {formatDate } from '@/utils/formatters';
import {
  Search, Filter, Users, BarChart2, Award,
  Clock, CheckCircle, XCircle, TrendingUp
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

interface TeamProgressTrackerProps {
  companyId: string;
  teamId?: string;
  onTeamSelect?: (team: Team) => void;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#00c49f'];

const TeamProgressTracker: React.FC<TeamProgressTrackerProps> = ({
  companyId,
  teamId,
  onTeamSelect
}) => {
  const [team, setTeam] = useState<Team | null>(null);
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  useEffect(() => {
    if (teamId) {
      fetchTeamData();
  } else {
      // If no teamId is provided, we'll use mock data for demonstration
      setLoading(true);
      setTimeout(() => {
        setStats({
          totalMembers: 8,
          activeCourses: 5,
          completedCourses: 12,
          averageProgress: 68,
          certificatesEarned: 10,
          memberProgress: [
            {name: 'John Doe', progress: 85 },
            {name: 'Jane Smith', progress: 92 },
            {name: 'Bob Johnson', progress: 75 },
            {name: 'Alice Williams', progress: 60 },
            {name: 'Charlie Brown', progress: 45 },
            {name: 'Eva Green', progress: 80 },
            {name: 'Frank White', progress: 70 },
            {name: 'Grace Lee', progress: 55 },
          ],
      });
        setLoading(false);
    }, 1000);
  }
}, [companyId, teamId, dateRange]);

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!teamId) {
        setError('Team ID is required');
        return;
    }

      try {
        // Fetch team details
        const teamData = await getTeamById(companyId, teamId);
        if (teamData) {
          setTeam(teamData);
      }
    } catch (teamErr) {
        console.error('Error fetching team details:', teamErr);
        // Continue even if team details fail to load
    }

      try {
        // Fetch team statistics
        const teamStats = await getTeamStats(companyId, teamId);
        setStats(teamStats);
    } catch (statsErr) {
        console.error('Error fetching team statistics:', statsErr);
        setError('Failed to load team statistics. Please try again.');
    }
  } catch (err) {
      console.error('Error in fetchTeamData:', err);
      setError('Failed to load team data. Please try again.');
  } finally {
      setLoading(false);
  }
};

  // Prepare chart data
  const memberProgressData = stats?.memberProgress || [];

  const progressDistributionData = [
    {name: 'Completed', value: stats?.completedCourses || 0 },
    {name: 'In Progress', value: stats?.activeCourses || 0 },
  ];

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
}

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        {error}
      </div>
    );
}

  if (!stats) {
    return (
      <div className="bg-neutral-50 border border-neutral-200 text-neutral-700 px-4 py-3 rounded-md">
        No team statistics available.
      </div>
    );
}

  return (
    <div className="space-y-6">
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="p-4 border-b border-neutral-200 flex justify-between items-center">
          <h2 className="text-lg font-medium text-neutral-900">
            {team ? team.name : 'Team Progress Overview'}
          </h2>

          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                className="appearance-none block w-full pl-3 pr-10 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
              >
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="quarter">Last Quarter</option>
                <option value="year">Last Year</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Clock className="h-5 w-5 text-neutral-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-primary-100 rounded-md p-3">
                    <Users className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-neutral-500 truncate">
                        Team Members
                      </dt>
                      <dd>
                        <div className="text-lg font-medium text-neutral-900">
                          {stats.totalMembers}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-neutral-500 truncate">
                        Courses Completed
                      </dt>
                      <dd>
                        <div className="text-lg font-medium text-neutral-900">
                          {stats.completedCourses}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                    <Award className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-neutral-500 truncate">
                        Certificates Earned
                      </dt>
                      <dd>
                        <div className="text-lg font-medium text-neutral-900">
                          {stats.certificatesEarned}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                    <TrendingUp className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-neutral-500 truncate">
                        Avg. Progress
                      </dt>
                      <dd>
                        <div className="text-lg font-medium text-neutral-900">
                          {stats.averageProgress}%
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-neutral-200">
            <h3 className="text-lg font-medium text-neutral-900">Member Progress</h3>
          </div>
          <div className="p-4">
            {memberProgressData.length > 0 ? (
              <div className="flex justify-center">
                <BarChart
                  width={500}
                  height={300}
                  data={memberProgressData}
                  layout="vertical"
                  margin={{top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="progress" fill="#8884d8" name="Progress (%)" />
                </BarChart>
              </div>
            ) : (
              <div className="flex items-center justify-center" style={{height: '300px'}}>
                <p className="text-neutral-500">No member progress data available</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-neutral-200">
            <h3 className="text-lg font-medium text-neutral-900">Course Completion</h3>
          </div>
          <div className="p-4">
            {progressDistributionData.some(item => item.value > 0) ? (
              <div className="flex justify-center">
                <PieChart width={500} height={300}>
                  <Pie
                    data={progressDistributionData}
                    cx={250}
                    cy={150}
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {progressDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </div>
            ) : (
              <div className="flex items-center justify-center" style={{height: '300px'}}>
                <p className="text-neutral-500">No course completion data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-neutral-200">
          <h3 className="text-lg font-medium text-neutral-900">Team Members</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                >
                  Member
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                >
                  Progress
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
              {stats.memberProgress.map((member, index) => (
                <tr key={index} className="hover:bg-neutral-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-800 font-medium">
                        {member.name[0].toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-neutral-900">
                          {member.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-full bg-neutral-200 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full ${
                            member.progress >= 80
                              ? 'bg-green-500'
                              : member.progress >= 40
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                        }`}
                          style={{width: `${member.progress}%` }}
                        ></div>
                      </div>
                      <span className="ml-2 text-sm text-neutral-900">{member.progress}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      member.progress >= 80
                        ? 'bg-green-100 text-green-800'
                        : member.progress >= 40
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                  }`}>
                      {member.progress >= 80
                        ? 'On Track'
                        : member.progress >= 40
                          ? 'In Progress'
                          : 'Needs Attention'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TeamProgressTracker;

