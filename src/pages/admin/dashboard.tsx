import React, {useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import {getUserStats } from '@/services/statsService';
import {generatePlatformStats } from '@/services/reportService';
import {formatNumber, formatPercentage } from '@/utils/formatters';
import {NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import {
  Users, BookOpen, Award, Clock,
  TrendingUp, BarChart2, PieChart,
  Globe, UserCheck, Calendar
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart as RechartsPieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import ClientSideChart from '@/components/charts/ClientSideChart';

const AdminDashboard: NextPage = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  useEffect(() => {
    fetchStats();
}, [dateRange]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use generatePlatformStats from reportService instead of getPlatformStats
      const platformStats = await generatePlatformStats(dateRange);
      setStats(platformStats);
  } catch (err) {
      console.error('Error fetching platform stats:', err);
      setError('Failed to load platform statistics. Please try again.');
  } finally {
      setLoading(false);
  }
};

  // Prepare chart data
  const userRoleData = stats ? Object.entries(stats.usersByRole).map(([role, count]) => ({
    name: role.charAt(0).toUpperCase() + role.slice(1),
    value: count as number,
})) : [];

  const userCountryData = stats ? Object.entries(stats.usersByCountry).map(([country, count]) => ({
    name: country,
    value: count as number,
})) : [];

  const courseCategoryData = stats ? Object.entries(stats.coursesByCategory).map(([category, count]) => ({
    name: category,
    value: count as number,
})) : [];

  const activityData = stats ? stats.activityByMonth : [];

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#00c49f', '#FFBB28', '#FF8042'];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
}

  return (
    <AdminLayout>
      <Head>
        <title>Admin Dashboard</title>
      </Head>

      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-neutral-900">Dashboard</h1>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-4">
            {error ? (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
                {error}
              </div>
            ) : (
              <>
                <div className="mb-6 flex justify-end">
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
                      <Calendar className="h-5 w-5 text-neutral-400" />
                    </div>
                  </div>
                </div>

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
                              Total Users
                            </dt>
                            <dd>
                              <div className="text-lg font-medium text-neutral-900">
                                {formatNumber(stats.totalUsers)}
                              </div>
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                    <div className="bg-neutral-50 px-4 py-4 sm:px-6">
                      <div className="text-sm">
                        <Link
                          href="/admin/users"
                          className="font-medium text-primary-600 hover:text-primary-500"
                        >
                          View all users
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                          <BookOpen className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-neutral-500 truncate">
                              Total Courses
                            </dt>
                            <dd>
                              <div className="text-lg font-medium text-neutral-900">
                                {formatNumber(stats.totalCourses)}
                              </div>
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                    <div className="bg-neutral-50 px-4 py-4 sm:px-6">
                      <div className="text-sm">
                        <Link
                          href="/admin/courses"
                          className="font-medium text-primary-600 hover:text-primary-500"
                        >
                          View all courses
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                          <UserCheck className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-neutral-500 truncate">
                              Active Users
                            </dt>
                            <dd>
                              <div className="text-lg font-medium text-neutral-900">
                                {formatNumber(stats.activeUsers)}
                              </div>
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                    <div className="bg-neutral-50 px-4 py-4 sm:px-6">
                      <div className="text-sm">
                        <span className="font-medium text-neutral-900">
                          {formatPercentage((stats.activeUsers / stats.totalUsers) * 100, 1)} of total
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                          <Award className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-neutral-500 truncate">
                              Course Completions
                            </dt>
                            <dd>
                              <div className="text-lg font-medium text-neutral-900">
                                {formatNumber(stats.totalCompletions)}
                              </div>
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                    <div className="bg-neutral-50 px-4 py-4 sm:px-6">
                      <div className="text-sm">
                        <span className="font-medium text-neutral-900">
                          {formatNumber(stats.totalLearningTime / 60)} hours of learning
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:px-6 border-b border-neutral-200">
                      <h3 className="text-lg leading-6 font-medium text-neutral-900">
                        User Activity
                      </h3>
                    </div>
                    <div className="p-4 h-80">
                      <ClientSideChart>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={activityData}
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

                  <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:px-6 border-b border-neutral-200">
                      <h3 className="text-lg leading-6 font-medium text-neutral-900">
                        Users by Role
                      </h3>
                    </div>
                    <div className="p-4 h-80">
                      <ClientSideChart>
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPieChart>
                            <Pie
                              data={userRoleData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              label={({name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            >
                              {userRoleData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      </ClientSideChart>
                    </div>
                  </div>

                  <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:px-6 border-b border-neutral-200">
                      <h3 className="text-lg leading-6 font-medium text-neutral-900">
                        Courses by Category
                      </h3>
                    </div>
                    <div className="p-4 h-80">
                      <ClientSideChart>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={courseCategoryData}
                            layout="vertical"
                            margin={{top: 5, right: 30, left: 100, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis type="category" dataKey="name" />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="value" fill="#8884d8" name="Courses" />
                          </BarChart>
                        </ResponsiveContainer>
                      </ClientSideChart>
                    </div>
                  </div>

                  <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:px-6 border-b border-neutral-200">
                      <h3 className="text-lg leading-6 font-medium text-neutral-900">
                        Users by Country
                      </h3>
                    </div>
                    <div className="p-4 h-80">
                      <ClientSideChart>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={userCountryData}
                            layout="vertical"
                            margin={{top: 5, right: 30, left: 100, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis type="category" dataKey="name" />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="value" fill="#82ca9d" name="Users" />
                          </BarChart>
                        </ResponsiveContainer>
                      </ClientSideChart>
                    </div>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
                  <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:px-6 border-b border-neutral-200">
                      <h3 className="text-lg leading-6 font-medium text-neutral-900">
                        Recent Activity
                      </h3>
                    </div>
                    <div className="p-4">
                      <ul className="divide-y divide-neutral-200">
                        <li className="py-4">
                          <div className="flex space-x-3">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                                <UserCheck className="h-5 w-5 text-primary-600" />
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-neutral-900">
                                New User Registration
                              </p>
                              <p className="text-sm text-neutral-500">
                                John Doe joined the platform
                              </p>
                              <p className="text-xs text-neutral-400 mt-1">
                                2 hours ago
                              </p>
                            </div>
                          </div>
                        </li>
                        <li className="py-4">
                          <div className="flex space-x-3">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                <Award className="h-5 w-5 text-green-600" />
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-neutral-900">
                                Course Completion
                              </p>
                              <p className="text-sm text-neutral-500">
                                Jane Smith completed "Advanced Sales Techniques"
                              </p>
                              <p className="text-xs text-neutral-400 mt-1">
                                5 hours ago
                              </p>
                            </div>
                          </div>
                        </li>
                        <li className="py-4">
                          <div className="flex space-x-3">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <BookOpen className="h-5 w-5 text-blue-600" />
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-neutral-900">
                                New Course Published
                              </p>
                              <p className="text-sm text-neutral-500">
                                "Customer Relationship Management" is now available
                              </p>
                              <p className="text-xs text-neutral-400 mt-1">
                                1 day ago
                              </p>
                            </div>
                          </div>
                        </li>
                      </ul>
                      <div className="mt-4">
                        <Link
                          href="/admin/activity"
                          className="w-full flex justify-center items-center px-4 py-2 border border-neutral-300 shadow-sm text-sm font-medium rounded-md text-neutral-700 bg-white hover:bg-neutral-50"
                        >
                          View all activity
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:px-6 border-b border-neutral-200">
                      <h3 className="text-lg leading-6 font-medium text-neutral-900">
                        Top Courses
                      </h3>
                    </div>
                    <div className="p-4">
                      <ul className="divide-y divide-neutral-200">
                        <li className="py-4">
                          <div className="flex justify-between">
                            <div className="text-sm font-medium text-neutral-900">
                              Sales Fundamentals
                            </div>
                            <div className="text-sm text-neutral-500">
                              125 enrollments
                            </div>
                          </div>
                          <div className="mt-2 w-full bg-neutral-200 rounded-full h-2.5">
                            <div className="bg-primary h-2.5 rounded-full" style={{width: '85%'}}></div>
                          </div>
                          <div className="mt-1 flex justify-between text-xs text-neutral-500">
                            <div>Completion rate</div>
                            <div>85%</div>
                          </div>
                        </li>
                        <li className="py-4">
                          <div className="flex justify-between">
                            <div className="text-sm font-medium text-neutral-900">
                              Advanced Negotiation
                            </div>
                            <div className="text-sm text-neutral-500">
                              98 enrollments
                            </div>
                          </div>
                          <div className="mt-2 w-full bg-neutral-200 rounded-full h-2.5">
                            <div className="bg-primary h-2.5 rounded-full" style={{width: '78%'}}></div>
                          </div>
                          <div className="mt-1 flex justify-between text-xs text-neutral-500">
                            <div>Completion rate</div>
                            <div>78%</div>
                          </div>
                        </li>
                        <li className="py-4">
                          <div className="flex justify-between">
                            <div className="text-sm font-medium text-neutral-900">
                              Customer Relationship Management
                            </div>
                            <div className="text-sm text-neutral-500">
                              87 enrollments
                            </div>
                          </div>
                          <div className="mt-2 w-full bg-neutral-200 rounded-full h-2.5">
                            <div className="bg-primary h-2.5 rounded-full" style={{width: '92%'}}></div>
                          </div>
                          <div className="mt-1 flex justify-between text-xs text-neutral-500">
                            <div>Completion rate</div>
                            <div>92%</div>
                          </div>
                        </li>
                      </ul>
                      <div className="mt-4">
                        <Link
                          href="/admin/courses"
                          className="w-full flex justify-center items-center px-4 py-2 border border-neutral-300 shadow-sm text-sm font-medium rounded-md text-neutral-700 bg-white hover:bg-neutral-50"
                        >
                          View all courses
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:px-6 border-b border-neutral-200">
                      <h3 className="text-lg leading-6 font-medium text-neutral-900">
                        Quick Actions
                      </h3>
                    </div>
                    <div className="p-4">
                      <div className="space-y-4">
                        <Link
                          href="/admin/users/create"
                          className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark"
                        >
                          Add New User
                        </Link>
                        <Link
                          href="/admin/courses/create"
                          className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark"
                        >
                          Create New Course
                        </Link>
                        <Link
                          href="/admin/companies/create"
                          className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark"
                        >
                          Add New Company
                        </Link>
                        <Link
                          href="/admin/reports"
                          className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark"
                        >
                          Generate Reports
                        </Link>
                        <Link
                          href="/admin/settings"
                          className="w-full flex justify-center items-center px-4 py-2 border border-neutral-300 shadow-sm text-sm font-medium rounded-md text-neutral-700 bg-white hover:bg-neutral-50"
                        >
                          Platform Settings
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;

