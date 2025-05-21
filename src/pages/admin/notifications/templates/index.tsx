import React, {useState, useEffect } from 'react';
import Link from 'next/link';
import {useRouter } from 'next/router';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import Button from '@/components/ui/Button';
import {EmailTemplate, NotificationTemplateType } from '@/types/notification-templates.types';
import {getEmailTemplates, deleteEmailTemplate } from '@/services/notificationTemplateService';
import {initializeNotificationSystem } from '@/scripts/initializeNotificationSystem';

const EmailTemplatesPage: React.FC = () => {
  const router = useRouter();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<NotificationTemplateType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [initializing, setInitializing] = useState(false);

  // Fetch templates
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        const fetchedTemplates = await getEmailTemplates();
        setTemplates(fetchedTemplates);
    } catch (err) {
        console.error('Error fetching templates:', err);
        setError('Failed to load email templates');
    } finally {
        setLoading(false);
    }
  };

    fetchTemplates();
}, []);

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    // Filter by type
    if (activeType && template.type !== activeType) {
      return false;
  }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        template.name.toLowerCase().includes(query) ||
        template.subject.toLowerCase().includes(query)
      );
  }

    return true;
});

  // Get unique template types
  const templateTypes = Array.from(new Set(templates.map(template => template.type)));

  // Handle template deletion
  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      return;
  }

    try {
      await deleteEmailTemplate(templateId);
      setTemplates(prev => prev.filter(template => template.id !== templateId));
  } catch (err) {
      console.error('Error deleting template:', err);
      alert('Failed to delete template');
  }
};

  // Initialize default templates
  const handleInitializeTemplates = async () => {
    try {
      setInitializing(true);
      await initializeNotificationSystem();

      // Refresh templates
      const fetchedTemplates = await getEmailTemplates();
      setTemplates(fetchedTemplates);

      alert('Default templates initialized successfully');
  } catch (err) {
      console.error('Error initializing templates:', err);
      alert('Failed to initialize default templates');
  } finally {
      setInitializing(false);
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

  return (
    <AdminLayout title="Email Templates">
      <div className="container-custom mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <p className="text-neutral-500 text-xl font-semibold">Manage email notification templates</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleInitializeTemplates}
              disabled={initializing}
              isLoading={initializing}
            >
              Initialize Default Templates
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

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-neutral-700 mb-1">
                Search Templates
              </label>
              <input
                type="text"
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or subject..."
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

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
        </div>

        {/* Templates List */}
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
        ) : filteredTemplates.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-neutral-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-medium text-neutral-900 mb-2">No templates found</h3>
            <p className="text-neutral-500 max-w-md mx-auto mb-6">
              {searchQuery || activeType
                ? 'No templates match your current filters. Try adjusting your search or filter criteria.'
                : 'You haven\'t created any email templates yet. Create your first template or initialize the default templates.'}
            </p>
            <div className="flex justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleInitializeTemplates}
                disabled={initializing}
                isLoading={initializing}
              >
                Initialize Default Templates
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
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Template Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Subject
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
                  {filteredTemplates.map(template => (
                    <tr key={template.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-neutral-900">{template.name}</div>
                        <div className="text-xs text-neutral-500">ID: {template.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTemplateTypeColor(template.type)}`}>
                          {getTemplateTypeLabel(template.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-neutral-900 max-w-xs truncate">{template.subject}</div>
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
                        <div className="flex justify-end space-x-3">
                          <Link
                            href={`/admin/notifications/templates/${template.id}/preview`}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            Preview
                          </Link>
                          <Link
                            href={`/admin/notifications/templates/${template.id}/edit`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDeleteTemplate(template.id)}
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

export default EmailTemplatesPage;
