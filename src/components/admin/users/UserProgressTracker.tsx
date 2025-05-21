import React, {useState, useEffect } from 'react';
import {UserProfile } from '@/types/user.types';
import {formatDate } from '@/utils/formatters';
import {Search, Filter, BarChart2, Clock, Award, BookOpen, CheckCircle, XCircle } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import ClientSideChart from '@/components/charts/ClientSideChart';

interface UserProgressTrackerProps {
  users?: UserProfile[];
  onUserSelect?: (user: UserProfile) => void;
}

interface UserProgress {
  userId: string;
  displayName: string;
  email: string;
  coursesEnrolled: number;
  coursesCompleted: number;
  completionRate: number;
  lastActive: string;
  totalLearningTime: number;
  averageQuizScore: number;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#00c49f'];

const UserProgressTracker: React.FC<UserProgressTrackerProps> = ({users = [], onUserSelect }) => {
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [filteredProgress, setFilteredProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [completionFilter, setCompletionFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<keyof UserProgress>('completionRate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  // Mock data for demonstration
  const mockUserProgress: UserProgress[] = [
    {
      userId: '1',
      displayName: 'John Doe',
      email: 'john@example.com',
      coursesEnrolled: 5,
      coursesCompleted: 3,
      completionRate: 60,
      lastActive: new Date().toISOString(),
      totalLearningTime: 420,
      averageQuizScore: 85,
  },
    {
      userId: '2',
      displayName: 'Jane Smith',
      email: 'jane@example.com',
      coursesEnrolled: 8,
      coursesCompleted: 7,
      completionRate: 88,
      lastActive: new Date().toISOString(),
      totalLearningTime: 680,
      averageQuizScore: 92,
  },
    {
      userId: '3',
      displayName: 'Bob Johnson',
      email: 'bob@example.com',
      coursesEnrolled: 3,
      coursesCompleted: 1,
      completionRate: 33,
      lastActive: new Date().toISOString(),
      totalLearningTime: 180,
      averageQuizScore: 75,
  },
    {
      userId: '4',
      displayName: 'Alice Williams',
      email: 'alice@example.com',
      coursesEnrolled: 6,
      coursesCompleted: 4,
      completionRate: 67,
      lastActive: new Date().toISOString(),
      totalLearningTime: 520,
      averageQuizScore: 88,
  },
    {
      userId: '5',
      displayName: 'Charlie Brown',
      email: 'charlie@example.com',
      coursesEnrolled: 4,
      coursesCompleted: 0,
      completionRate: 0,
      lastActive: new Date().toISOString(),
      totalLearningTime: 90,
      averageQuizScore: 65,
  },
  ];

  // Mock data for charts
  const completionByUserData = mockUserProgress.map(user => ({
    name: user.displayName,
    completed: user.coursesCompleted,
    enrolled: user.coursesEnrolled,
}));

  const completionRateData = [
    {name: 'Completed', value: mockUserProgress.reduce((sum, user) => sum + user.coursesCompleted, 0) },
    {
      name: 'In Progress',
      value: mockUserProgress.reduce((sum, user) => sum + (user.coursesEnrolled - user.coursesCompleted), 0)
  },
  ];

  const activityOverTimeData = [
    {month: 'Jan', users: 12, completions: 8 },
    {month: 'Feb', users: 15, completions: 10 },
    {month: 'Mar', users: 18, completions: 12 },
    {month: 'Apr', users: 20, completions: 15 },
    {month: 'May', users: 22, completions: 18 },
    {month: 'Jun', users: 25, completions: 20 },
  ];

  useEffect(() => {
    // In a real implementation, this would fetch user progress data from an API
    setLoading(true);
    setError(null);

    // Simulate API call
    setTimeout(() => {
      setUserProgress(mockUserProgress);
      setFilteredProgress(mockUserProgress);
      setLoading(false);
  }, 1000);
}, []);

  useEffect(() => {
    // Apply search and completion filter
    let filtered = userProgress;

    if (searchTerm) {
      filtered = filtered.filter(progress =>
        progress.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        progress.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }

    if (completionFilter !== 'all') {
      if (completionFilter === 'completed') {
        filtered = filtered.filter(progress => progress.completionRate === 100);
    } else if (completionFilter === 'in-progress') {
        filtered = filtered.filter(progress => progress.completionRate > 0 && progress.completionRate < 100);
    } else if (completionFilter === 'not-started') {
        filtered = filtered.filter(progress => progress.completionRate === 0);
    }
  }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc'
          ? aValue - bValue
          : bValue - aValue;
    }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
    }

      return 0;
  });

    setFilteredProgress(sorted);
}, [searchTerm, completionFilter, userProgress, sortBy, sortDirection]);

  const handleSort = (column: keyof UserProgress) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  } else {
      setSortBy(column);
      setSortDirection('desc');
  }
};

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

  return (
    <div className="space-y-6">
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="p-4 border-b border-neutral-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative flex-grow max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-neutral-400" />
            </div>
            <input
              type="text"
              placeholder="Search users..."
              className="block w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative">
              <select
                className="appearance-none block w-full pl-3 pr-10 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                value={completionFilter}
                onChange={(e) => setCompletionFilter(e.target.value)}
              >
                <option value="all">All Progress</option>
                <option value="completed">Completed</option>
                <option value="in-progress">In Progress</option>
                <option value="not-started">Not Started</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Filter className="h-5 w-5 text-neutral-400" />
              </div>
            </div>

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

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('displayName')}
                >
                  <div className="flex items-center">
                    User
                    {sortBy === 'displayName' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('coursesEnrolled')}
                >
                  <div className="flex items-center">
                    Enrolled
                    {sortBy === 'coursesEnrolled' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('coursesCompleted')}
                >
                  <div className="flex items-center">
                    Completed
                    {sortBy === 'coursesCompleted' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('completionRate')}
                >
                  <div className="flex items-center">
                    Completion
                    {sortBy === 'completionRate' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('averageQuizScore')}
                >
                  <div className="flex items-center">
                    Avg. Score
                    {sortBy === 'averageQuizScore' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('lastActive')}
                >
                  <div className="flex items-center">
                    Last Active
                    {sortBy === 'lastActive' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {filteredProgress.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-neutral-500">
                    No user progress data found
                  </td>
                </tr>
              ) : (
                filteredProgress.map((progress) => (
                  <tr key={progress.userId} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-800 font-medium">
                          {progress.displayName[0].toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-neutral-900">
                            {progress.displayName}
                          </div>
                          <div className="text-sm text-neutral-500">
                            {progress.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-900">{progress.coursesEnrolled}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-900">{progress.coursesCompleted}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-full bg-neutral-200 rounded-full h-2.5">
                          <div
                            className={`h-2.5 rounded-full ${
                              progress.completionRate >= 80
                                ? 'bg-green-500'
                                : progress.completionRate >= 40
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                          }`}
                            style={{width: `${progress.completionRate}%` }}
                          ></div>
                        </div>
                        <span className="ml-2 text-sm text-neutral-900">{progress.completionRate}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-900">{progress.averageQuizScore}%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                      {formatDate(progress.lastActive)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-neutral-200">
            <h3 className="text-lg font-medium text-neutral-900">Course Completion by User</h3>
          </div>
          <div className="p-4 h-80">
            <ClientSideChart>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={completionByUserData}
                  margin={{top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="enrolled" fill="#8884d8" name="Enrolled" />
                  <Bar dataKey="completed" fill="#82ca9d" name="Completed" />
                </BarChart>
              </ResponsiveContainer>
            </ClientSideChart>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-neutral-200">
            <h3 className="text-lg font-medium text-neutral-900">Overall Completion Rate</h3>
          </div>
          <div className="p-4 h-80">
            <ClientSideChart>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={completionRateData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {completionRateData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ClientSideChart>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg overflow-hidden lg:col-span-2">
          <div className="px-4 py-5 sm:px-6 border-b border-neutral-200">
            <h3 className="text-lg font-medium text-neutral-900">Activity Over Time</h3>
          </div>
          <div className="p-4 h-80">
            <ClientSideChart>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={activityOverTimeData}
                  margin={{top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="users" stroke="#8884d8" activeDot={{r: 8 }} name="Active Users" />
                  <Line type="monotone" dataKey="completions" stroke="#82ca9d" name="Course Completions" />
                </LineChart>
              </ResponsiveContainer>
            </ClientSideChart>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProgressTracker;
