import React, {useState, useEffect } from 'react';
import {useRouter } from 'next/router';
import Link from 'next/link';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import Button from '@/components/ui/Button';
import {
  getEmailTemplates,
  getNotificationTemplateByType,
  getEmailTemplateCategories
} from '@/services/notificationTemplateService';
import {
  getNotificationSchedules,
  getNotificationStats
} from '@/services/notificationSchedulerService';
import {EmailTemplate, NotificationSchedule } from '@/types/notification-templates.types';


const NotificationDashboardPage: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [schedules, setSchedules] = useState<NotificationSchedule[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [stats, setStats] = useState<{
    totalSent: number;
    totalOpened: number;
    totalClicked: number;
    totalBounced: number;
    byType: Record<string, {sent: number; opened: number }>;
}>({
    totalSent: 0,
    totalOpened: 0,
    totalClicked: 0,
    totalBounced: 0,
    byType: {}
});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch all data in parallel
        const [
          fetchedTemplates,
          fetchedSchedules,
          fetchedCategories,
          fetchedStats
        ] = await Promise.all([
          getEmailTemplates(),
          getNotificationSchedules(),
          getEmailTemplateCategories(),
          getNotificationStats()
        ]);

        setEmailTemplates(fetchedTemplates);
        setSchedules(fetchedSchedules);
        setCategories(fetchedCategories);
        setStats(fetchedStats);
    } catch (err) {
        console.error('Error fetching notification data:', err);
        setError('Failed to load notification dashboard data');
    } finally {
        setLoading(false);
    }
  };

    fetchData();
}, []);

  // Get template type label
  const getTemplateTypeLabel = (type: string | undefined | null): string => {
    if (!type) return 'Unknown';
    return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

  // Calculate open rate
  const calculateOpenRate = (opened: number, sent: number): string => {
    if (sent === 0) return '0%';
    return `${Math.round((opened / sent) * 100)}%`;
};

  // Get active templates count
  const getActiveTemplatesCount = (): number => {
    if (!emailTemplates || !Array.isArray(emailTemplates)) return 0;
    return emailTemplates.filter(template => template && template.isActive).length;
};

  // Get active schedules count
  const getActiveSchedulesCount = (): number => {
    if (!schedules || !Array.isArray(schedules)) return 0;
    return schedules.filter(schedule => schedule && schedule.isActive).length;
};

  return (
    <AdminLayout title="Notification Management">
      <div className="container-custom mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <p className="text-neutral-500 text-xl font-semibold">Manage all aspects of your notification system</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/admin/notifications/test')}
            >
              Test Notifications
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => router.push('/admin/notifications/templates/create')}
            >
              Create Template
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-500 text-sm">Email Templates</p>
                <h3 className="text-2xl font-bold mt-1">{emailTemplates?.length || 0}</h3>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="mt-2">
              <span className="text-green-600 text-sm font-medium">{getActiveTemplatesCount()} Active</span>
              <span className="text-neutral-400 mx-2">|</span>
              <span className="text-neutral-500 text-sm">{(emailTemplates ? emailTemplates.length : 0) - getActiveTemplatesCount()} Inactive</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-500 text-sm">Notification Schedules</p>
                <h3 className="text-2xl font-bold mt-1">{schedules?.length || 0}</h3>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-2">
              <span className="text-green-600 text-sm font-medium">{getActiveSchedulesCount()} Active</span>
              <span className="text-neutral-400 mx-2">|</span>
              <span className="text-neutral-500 text-sm">{(schedules ? schedules.length : 0) - getActiveSchedulesCount()} Inactive</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-500 text-sm">Notifications Sent</p>
                <h3 className="text-2xl font-bold mt-1">{stats?.totalSent?.toLocaleString() || '0'}</h3>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-2">
              <span className="text-blue-600 text-sm font-medium">{stats?.totalOpened?.toLocaleString() || '0'} Opened</span>
              <span className="text-neutral-400 mx-2">|</span>
              <span className="text-neutral-500 text-sm">{calculateOpenRate(stats?.totalOpened || 0, stats?.totalSent || 0)} Open Rate</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-500 text-sm">Template Categories</p>
                <h3 className="text-2xl font-bold mt-1">{categories?.length || 0}</h3>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
            </div>
            <div className="mt-2">
              <span className="text-neutral-500 text-sm">
                {categories && categories.length > 0
                  ? <>
                      {categories.slice(0, 3).join(', ')}
                      {categories.length > 3 ? ` +${categories.length - 3} more` : ''}
                    </>
                  : 'No categories found'
              }
              </span>
            </div>
          </div>
        </div>

        {/* Quick Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link
            href="/admin/notifications/templates"
            className="bg-white rounded-lg shadow-sm p-6 border border-neutral-200 hover:border-primary hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 p-3 rounded-full mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold">Email Templates</h3>
            </div>
            <p className="text-neutral-600 mb-4">
              Create and manage email notification templates with a rich editor, variable support, and design customization.
            </p>
            <div className="text-primary font-medium">
              Manage Templates →
            </div>
          </Link>

          <Link
            href="/admin/notifications/schedules"
            className="bg-white rounded-lg shadow-sm p-6 border border-neutral-200 hover:border-primary hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center mb-4">
              <div className="bg-purple-100 p-3 rounded-full mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold">Notification Schedules</h3>
            </div>
            <p className="text-neutral-600 mb-4">
              Set up automated notification schedules with advanced timing options, conditions, and recurring notifications.
            </p>
            <div className="text-primary font-medium">
              Manage Schedules →
            </div>
          </Link>

          <Link
            href="/admin/notifications/test"
            className="bg-white rounded-lg shadow-sm p-6 border border-neutral-200 hover:border-primary hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center mb-4">
              <div className="bg-green-100 p-3 rounded-full mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold">Test Notifications</h3>
            </div>
            <p className="text-neutral-600 mb-4">
              Preview and test notifications before sending them to users. Customize test data and delivery channels.
            </p>
            <div className="text-primary font-medium">
              Test Notifications →
            </div>
          </Link>
        </div>

        {/* Recent Templates */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-neutral-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold">Recent Email Templates</h2>
            <Link href="/admin/notifications/templates" className="text-primary text-sm hover:underline">
              View All
            </Link>
          </div>

          {loading ? (
            <div className="p-6">
              <div className="animate-pulse">
                <div className="h-6 bg-neutral-200 rounded w-1/4 mb-4"></div>
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-12 bg-neutral-200 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          ) : emailTemplates.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-neutral-500">No email templates found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {emailTemplates.slice(0, 5).map((template, index) => (
                    <tr key={`template-${template.id || template.type || index}-${index}`} className="hover:bg-neutral-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-neutral-900">{template.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-neutral-500">{getTemplateTypeLabel(template.type)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-neutral-500">{template.category}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          template.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-neutral-100 text-neutral-800'
                      }`}>
                          {template.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/admin/notifications/templates/${template.id}/edit`}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          Edit
                        </Link>
                        <Link
                          href={`/admin/notifications/templates/${template.id}/preview`}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          Preview
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Schedules */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold">Recent Notification Schedules</h2>
            <Link href="/admin/notifications/schedules" className="text-primary text-sm hover:underline">
              View All
            </Link>
          </div>

          {loading ? (
            <div className="p-6">
              <div className="animate-pulse">
                <div className="h-6 bg-neutral-200 rounded w-1/4 mb-4"></div>
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-12 bg-neutral-200 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          ) : schedules.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-neutral-500">No notification schedules found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Frequency
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {schedules.slice(0, 5).map((schedule, index) => (
                    <tr key={`schedule-${schedule.id || schedule.templateType || index}-${index}`} className="hover:bg-neutral-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-neutral-900">{schedule.name || 'Unnamed Schedule'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-neutral-500">{getTemplateTypeLabel(schedule.templateType)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-neutral-500">
                          {schedule.frequency === 'recurring' ? 'Recurring' : 'One-time'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          schedule.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-neutral-100 text-neutral-800'
                      }`}>
                          {schedule.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/admin/notifications/schedules/${schedule.id}/edit`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default NotificationDashboardPage;
