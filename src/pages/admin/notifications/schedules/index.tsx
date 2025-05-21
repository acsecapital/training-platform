import React, {useState, useEffect } from 'react';
import {useRouter } from 'next/router';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import Button from '@/components/ui/Button';
import {NotificationSchedule, NotificationTemplateType } from '@/types/notification-templates.types';
import {getNotificationSchedules, updateNotificationSchedule, deleteNotificationSchedule } from '@/services/notificationSchedulerService';

const NotificationSchedulesPage: React.FC = () => {
  const router = useRouter();
  const [schedules, setSchedules] = useState<NotificationSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<NotificationTemplateType | null>(null);

  // Fetch schedules
  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        setLoading(true);
        const fetchedSchedules = await getNotificationSchedules();
        setSchedules(fetchedSchedules);
    } catch (err) {
        console.error('Error fetching schedules:', err);
        setError('Failed to load notification schedules');
    } finally {
        setLoading(false);
    }
  };

    fetchSchedules();
}, []);

  // Filter schedules
  const filteredSchedules = schedules.filter(schedule => {
    // Filter by type
    if (activeType && schedule.templateType !== activeType) {
      return false;
  }

    return true;
});

  // Get unique template types
  const templateTypes = Array.from(new Set(schedules.map(schedule => schedule.templateType)));

  // Handle schedule activation/deactivation
  const handleToggleActive = async (scheduleId: string, isActive: boolean) => {
    try {
      await updateNotificationSchedule(scheduleId, {isActive });

      // Update local state
      setSchedules(prev =>
        prev.map(schedule =>
          schedule.id === scheduleId
            ? {...schedule, isActive }
            : schedule
        )
      );
  } catch (err) {
      console.error('Error updating schedule:', err);
      alert('Failed to update schedule');
  }
};

  // Handle schedule deletion
  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm('Are you sure you want to delete this schedule? This action cannot be undone.')) {
      return;
  }

    try {
      await deleteNotificationSchedule(scheduleId);
      setSchedules(prev => prev.filter(schedule => schedule.id !== scheduleId));
  } catch (err) {
      console.error('Error deleting schedule:', err);
      alert('Failed to delete schedule');
  }
};

  // Get template type label
  const getTemplateTypeLabel = (type: NotificationTemplateType | undefined | null): string => {
    if (!type) return 'Unknown';

    switch (type) {
      case 'course_progress':
        return 'Course Progress';
      case 'course_completion':
        return 'Course Completion';
      case 'certificate_expiration':
        return 'Certificate Expiration';
      case 'new_course_available':
        return 'New Course Available';
      case 'inactivity_reminder':
        return 'Inactivity Reminder';
      case 'enrollment_confirmation':
        return 'Enrollment Confirmation';
      case 'quiz_completion':
        return 'Quiz Completion';
      case 'achievement_unlocked':
        return 'Achievement Unlocked';
      case 'welcome_message':
        return 'Welcome Message';
      default:
        // Safely handle the string conversion
        return String(type).replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
  }
};

  // Get template type color
  const getTemplateTypeColor = (type: NotificationTemplateType | undefined | null): string => {
    if (!type) return 'bg-neutral-100 text-neutral-800';

    switch (type) {
      case 'course_progress':
        return 'bg-blue-100 text-blue-800';
      case 'course_completion':
        return 'bg-green-100 text-green-800';
      case 'certificate_expiration':
        return 'bg-yellow-100 text-yellow-800';
      case 'new_course_available':
        return 'bg-purple-100 text-purple-800';
      case 'inactivity_reminder':
        return 'bg-orange-100 text-orange-800';
      case 'enrollment_confirmation':
        return 'bg-indigo-100 text-indigo-800';
      case 'quiz_completion':
        return 'bg-teal-100 text-teal-800';
      case 'achievement_unlocked':
        return 'bg-pink-100 text-pink-800';
      case 'welcome_message':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-neutral-100 text-neutral-800';
  }
};

  // Get frequency label
  const getFrequencyLabel = (frequency: string | undefined | null): string => {
    if (!frequency) return 'Unknown';

    switch (frequency) {
      case 'immediately':
        return 'Immediately';
      case 'daily':
        return 'Daily';
      case 'weekly':
        return 'Weekly';
      case 'monthly':
        return 'Monthly';
      case 'custom':
        return 'Custom Schedule';
      case 'recurring':
        return 'Recurring';
      default:
        return String(frequency).charAt(0).toUpperCase() + String(frequency).slice(1);
  }
};

  // Format conditions
  const formatConditions = (schedule: NotificationSchedule): string => {
    if (!schedule.conditions) return 'No conditions';

    const conditions: string[] = [];

    if (schedule.conditions.courseProgress !== undefined) {
      conditions.push(`Progress: ${schedule.conditions.courseProgress}%`);
  }

    if (schedule.conditions.daysSinceLastActivity !== undefined) {
      conditions.push(`Inactivity: ${schedule.conditions.daysSinceLastActivity} days`);
  }

    if (schedule.conditions.daysSinceCertificateIssued !== undefined) {
      conditions.push(`Certificate Age: ${schedule.conditions.daysSinceCertificateIssued} days`);
  }

    if (schedule.conditions.courseCategories?.length) {
      conditions.push(`Categories: ${schedule.conditions.courseCategories.join(', ')}`);
  }

    return conditions.length ? conditions.join(', ') : 'No conditions';
};

  return (
    <AdminLayout title="Notification Schedules">
      <div className="container-custom mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <p className="text-neutral-500 text-xl font-semibold">Manage automated notification schedules</p>
          </div>

          <div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => router.push('/admin/notifications/schedules/create')}
            >
              Create Schedule
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Filter by Type
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                className={`px-3 py-1 text-xs rounded-full ${
                  activeType === null
                    ? 'bg-primary text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
                onClick={() => setActiveType(null)}
              >
                All
              </button>
              {templateTypes.map(type => (
                <button
                  key={type}
                  className={`px-3 py-1 text-xs rounded-full ${
                    activeType === type
                      ? 'bg-primary text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
                  onClick={() => setActiveType(type)}
                >
                  {getTemplateTypeLabel(type)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Schedules List */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-neutral-200 rounded w-1/4 mb-4"></div>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-20 bg-neutral-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-red-500">{error}</p>
          </div>
        ) : filteredSchedules.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-neutral-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-neutral-900 mb-2">No schedules found</h3>
            <p className="text-neutral-500 max-w-md mx-auto mb-6">
              {activeType
                ? `No ${getTemplateTypeLabel(activeType)} notification schedules found. Try selecting a different type or create a new schedule.`
                : 'You haven\'t created any notification schedules yet. Create your first schedule to start automating notifications.'}
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => router.push('/admin/notifications/schedules/create')}
            >
              Create Schedule
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Notification Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Frequency
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Conditions
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
                  {filteredSchedules.map(schedule => (
                    <tr key={schedule.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTemplateTypeColor(schedule.templateType)}`}>
                          {getTemplateTypeLabel(schedule.templateType)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-neutral-900">{getFrequencyLabel(schedule.frequency)}</div>
                        {schedule.customSchedule && (
                          <div className="text-xs text-neutral-500">
                            {schedule.customSchedule.days?.length ? `Days: ${schedule.customSchedule.days.join(', ')}` : ''}
                            {schedule.customSchedule.hours?.length ? ` Hours: ${schedule.customSchedule.hours.join(', ')}` : ''}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-neutral-500">{formatConditions(schedule)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={schedule.isActive}
                            onChange={() => handleToggleActive(schedule.id, !schedule.isActive)}
                          />
                          <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                          <span className="ml-3 text-sm font-medium text-neutral-700">
                            {schedule.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </label>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-3">
                          <button
                            onClick={() => router.push(`/admin/notifications/schedules/${schedule.id}/edit`)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteSchedule(schedule.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default NotificationSchedulesPage;
