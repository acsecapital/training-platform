import React, {useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import StatCard from '@/components/admin/dashboard/StatCard';
import RecentActivity from '@/components/admin/dashboard/RecentActivity';
import QuickActions from '@/components/admin/dashboard/QuickActions';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// Mock data for demonstration
const mockStats = {
  totalUsers: 256,
  totalCourses: 18,
  activeEnrollments: 423,
  completionRate: 68,
};

const mockActivities = [
  {
    id: '1',
    type: 'enrollment' as const,
    user: {
      id: 'user1',
      name: 'John Doe',
  },
    course: {
      id: 'course1',
      title: 'LIPS Sales System Fundamentals',
  },
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 minutes ago
},
  {
    id: '2',
    type: 'completion' as const,
    user: {
      id: 'user2',
      name: 'Jane Smith',
  },
    course: {
      id: 'course2',
      title: 'Sales Communication',
  },
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 minutes ago
},
  {
    id: '3',
    type: 'quiz' as const,
    user: {
      id: 'user3',
      name: 'Robert Johnson',
  },
    quiz: {
      id: 'quiz1',
      title: 'Sales Investigation Techniques Quiz',
      score: 92,
  },
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
},
  {
    id: '4',
    type: 'certificate' as const,
    user: {
      id: 'user4',
      name: 'Emily Davis',
  },
    course: {
      id: 'course3',
      title: 'Mastering Objection Handling',
  },
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3 hours ago
},
  {
    id: '5',
    type: 'login' as const,
    user: {
      id: 'user5',
      name: 'Michael Wilson',
  },
    timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(), // 4 hours ago
},
];

const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);

  // Simulate loading data
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
  }, 1000);

    return () => clearTimeout(timer);
}, []);

  return (
    <AdminLayout title="Dashboard">
      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Total Users"
          value={loading ? '...' : mockStats.totalUsers}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
        }
          change={{value: 12, isPositive: true }}
        />

        <StatCard
          title="Total Courses"
          value={loading ? '...' : mockStats.totalCourses}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
        }
          change={{value: 3, isPositive: true }}
        />

        <StatCard
          title="Active Enrollments"
          value={loading ? '...' : mockStats.activeEnrollments}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
        }
          change={{value: 8, isPositive: true }}
        />

        <StatCard
          title="Completion Rate"
          value={loading ? '...' : `${mockStats.completionRate}%`}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        }
          change={{value: 5, isPositive: true }}
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <QuickActions />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentActivity activities={mockActivities} loading={loading} />
        </div>

        <div>
          {/* Upcoming Events or System Status */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">System Status</h2>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  <span className="text-sm text-neutral-700">Video Streaming</span>
                </div>
                <span className="text-sm text-green-600 font-medium">Operational</span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  <span className="text-sm text-neutral-700">Authentication</span>
                </div>
                <span className="text-sm text-green-600 font-medium">Operational</span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  <span className="text-sm text-neutral-700">Database</span>
                </div>
                <span className="text-sm text-green-600 font-medium">Operational</span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  <span className="text-sm text-neutral-700">Storage</span>
                </div>
                <span className="text-sm text-green-600 font-medium">Operational</span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  <span className="text-sm text-neutral-700">Payment Processing</span>
                </div>
                <span className="text-sm text-green-600 font-medium">Operational</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-200">
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-500">Last updated</span>
                <span className="text-sm text-neutral-700">5 minutes ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

// Wrap the component with ProtectedRoute to ensure only admins can access it
export default function AdminDashboardPage() {
  return (
    <ProtectedRoute adminOnly>
      <AdminDashboard />
    </ProtectedRoute>
  );
}
