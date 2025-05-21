import React, {useState, useEffect } from 'react';
import {useRouter } from 'next/router';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import Link from 'next/link';

import {getEmailTemplateById } from '../../../../services/notificationTemplateService';
import {EmailTemplate } from '../../../../types/notification-templates.types';

const ViewEmailTemplatePage: React.FC = () => {
  const router = useRouter();
  const {id } = router.query;
  const templateId = typeof id === 'string' ? id : undefined;

  const [template, setTemplate] = useState<EmailTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('preview');

  useEffect(() => {
    const fetchTemplate = async () => {
      if (!templateId) return;

      try {
        setLoading(true);
        const fetchedTemplate = await getEmailTemplateById(templateId);

        if (fetchedTemplate) {
          setTemplate(fetchedTemplate);
      } else {
          setError('Template not found');
      }
    } catch (err) {
        console.error('Error fetching template:', err);
        setError('Failed to load template');
    } finally {
        setLoading(false);
    }
  };

    if (router.isReady && templateId) {
      fetchTemplate();
  }
}, [router.isReady, templateId]);

  const handleBack = () => {
    router.push('/admin/notifications/templates');
};

  const handleEdit = () => {
    if (templateId) {
      router.push(`/admin/notifications/templates/edit?id=${templateId}`);
  }
};

  const handleDuplicate = () => {
    if (template) {
      // Create a duplicate template with a new name
      const duplicateTemplate = {
        ...template,
        name: `${template.name} (Copy)`,
        id: undefined,
        createdAt: undefined,
        updatedAt: undefined
    };

      // Store in session storage and navigate to create page
      sessionStorage.setItem('duplicateTemplate', JSON.stringify(duplicateTemplate));
      router.push('/admin/notifications/templates/edit');
  }
};

  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
};

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
};

  if (loading) {
    return (
      <AdminLayout>
        <div className="container-custom mx-auto px-4 py-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        </div>
      </AdminLayout>
    );
}

  if (error || !template) {
    return (
      <AdminLayout>
        <div className="container-custom mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-4">
            {error || 'Template not found'}
          </div>
          <button
            onClick={handleBack}
            className="inline-flex items-center px-4 py-2 border border-neutral-300 text-sm font-medium rounded-md text-neutral-700 bg-white hover:bg-neutral-50"
          >
            Back to Templates
          </button>
        </div>
      </AdminLayout>
    );
}

  return (
    <AdminLayout>
      <div className="container-custom mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <button
              onClick={handleBack}
              className="inline-flex items-center px-3 py-1 text-sm text-primary hover:underline mb-2"
            >
              ← Back to Templates
            </button>
            <h1 className="text-2xl font-bold">
              {template.name}
            </h1>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleDuplicate}
              className="inline-flex items-center px-4 py-2 border border-neutral-300 text-sm font-medium rounded-md text-neutral-700 bg-white hover:bg-neutral-50"
            >
              Duplicate
            </button>
            <button
              onClick={handleEdit}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark"
            >
              Edit Template
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm mb-6 overflow-hidden">
          <div className="border-b border-neutral-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-4 py-3 text-sm font-medium ${activeTab === 'preview' ? 'text-primary border-b-2 border-primary' : 'text-neutral-600 hover:text-primary'}`}
              >
                Preview
              </button>
              <button
                onClick={() => setActiveTab('details')}
                className={`px-4 py-3 text-sm font-medium ${activeTab === 'details' ? 'text-primary border-b-2 border-primary' : 'text-neutral-600 hover:text-primary'}`}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-3 text-sm font-medium ${activeTab === 'history' ? 'text-primary border-b-2 border-primary' : 'text-neutral-600 hover:text-primary'}`}
              >
                History
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`px-4 py-3 text-sm font-medium ${activeTab === 'stats' ? 'text-primary border-b-2 border-primary' : 'text-neutral-600 hover:text-primary'}`}
              >
                Stats
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'preview' && (
              <div className="bg-neutral-50 border border-neutral-200 rounded-md p-6">
                <div className="mb-4 border-b border-neutral-200 pb-4">
                  <div className="text-sm text-neutral-500 mb-1">Subject:</div>
                  <div className="font-medium">{template.subject}</div>

                  {template.previewText && (
                    <div className="mt-2">
                      <div className="text-sm text-neutral-500 mb-1">Preview Text:</div>
                      <div className="text-sm text-neutral-600">{template.previewText}</div>
                    </div>
                  )}
                </div>

                <div className="prose max-w-none" dangerouslySetInnerHTML={{__html: template.htmlContent || ''}}></div>
              </div>
            )}

            {activeTab === 'details' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    Basic Information
                  </h3>
                  <div className="bg-white border border-neutral-200 rounded-md overflow-hidden">
                    <table className="min-w-full divide-y divide-neutral-200">
                      <tbody className="divide-y divide-neutral-200">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-neutral-700 w-1/3">
                            Name
                          </th>
                          <td className="px-4 py-2 text-sm text-neutral-900">{template.name}</td>
                        </tr>
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-neutral-700">
                            Type
                          </th>
                          <td className="px-4 py-2 text-sm text-neutral-900">
                            {template.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </td>
                        </tr>
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-neutral-700">
                            Category
                          </th>
                          <td className="px-4 py-2 text-sm text-neutral-900">{template.category || 'Uncategorized'}</td>
                        </tr>
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-neutral-700">
                            Version
                          </th>
                          <td className="px-4 py-2 text-sm text-neutral-900">{template.version || 1}</td>
                        </tr>
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-neutral-700">
                            Status
                          </th>
                          <td className="px-4 py-2 text-sm text-neutral-900">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              template.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-neutral-100 text-neutral-800'
                          }`}>
                              {template.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-neutral-700">
                            Created
                          </th>
                          <td className="px-4 py-2 text-sm text-neutral-900">{formatDate(template.createdAt)}</td>
                        </tr>
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-neutral-700">
                            Last Updated
                          </th>
                          <td className="px-4 py-2 text-sm text-neutral-900">{formatDate(template.updatedAt)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    Email Settings
                  </h3>
                  <div className="bg-white border border-neutral-200 rounded-md overflow-hidden">
                    <table className="min-w-full divide-y divide-neutral-200">
                      <tbody className="divide-y divide-neutral-200">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-neutral-700 w-1/3">
                            Subject
                          </th>
                          <td className="px-4 py-2 text-sm text-neutral-900">{template.subject}</td>
                        </tr>
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-neutral-700">
                            Preview Text
                          </th>
                          <td className="px-4 py-2 text-sm text-neutral-900">{template.previewText || '(None)'}</td>
                        </tr>
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-neutral-700">
                            Sender
                          </th>
                          <td className="px-4 py-2 text-sm text-neutral-900">
                            {template.metadata?.sender ? (
                              <>
                                {template.metadata.senderName && (
                                  <span>{template.metadata.senderName} </span>
                                )}
                                &lt;{template.metadata.sender}&gt;
                              </>
                            ) : (
                              '(Default System Sender)'
                            )}
                          </td>
                        </tr>
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-neutral-700">
                            Reply-To
                          </th>
                          <td className="px-4 py-2 text-sm text-neutral-900">
                            {template.metadata?.replyTo || '(Same as Sender)'}
                          </td>
                        </tr>
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-neutral-700">
                            Priority
                          </th>
                          <td className="px-4 py-2 text-sm text-neutral-900">
                            {template.metadata?.priority ? (
                              template.metadata.priority.charAt(0).toUpperCase() + template.metadata.priority.slice(1)
                            ) : (
                              'Normal'
                            )}
                          </td>
                        </tr>
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-neutral-700">
                            Tracking
                          </th>
                          <td className="px-4 py-2 text-sm text-neutral-900">
                            {template.metadata?.trackingEnabled !== false ? 'Enabled' : 'Disabled'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <h3 className="text-lg font-semibold mb-3 mt-6">
                    Design Settings
                  </h3>
                  <div className="bg-white border border-neutral-200 rounded-md overflow-hidden">
                    <table className="min-w-full divide-y divide-neutral-200">
                      <tbody className="divide-y divide-neutral-200">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-neutral-700 w-1/3">
                            Template Type
                          </th>
                          <td className="px-4 py-2 text-sm text-neutral-900">
                            {template.design?.templateType === 'responsive' ? 'Responsive' : 'Fixed Width'}
                          </td>
                        </tr>
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-neutral-700">
                            Primary Color
                          </th>
                          <td className="px-4 py-2 text-sm text-neutral-900">
                            <div className="flex items-center">
                              <div
                                className="w-5 h-5 rounded mr-2"
                                style={{backgroundColor: template.design?.primaryColor || '#3f51b5'}}
                              ></div>
                              {template.design?.primaryColor || '#3f51b5'}
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-neutral-700">
                            Secondary Color
                          </th>
                          <td className="px-4 py-2 text-sm text-neutral-900">
                            <div className="flex items-center">
                              <div
                                className="w-5 h-5 rounded mr-2"
                                style={{backgroundColor: template.design?.secondaryColor || '#f50057'}}
                              ></div>
                              {template.design?.secondaryColor || '#f50057'}
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-neutral-700">
                            Font Family
                          </th>
                          <td className="px-4 py-2 text-sm text-neutral-900">
                            {template.design?.fontFamily || 'Arial, sans-serif'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="col-span-1 md:col-span-2 mt-6">
                  <h3 className="text-lg font-semibold mb-3">
                    Template Variables
                  </h3>
                  <div className="bg-white border border-neutral-200 rounded-md overflow-hidden">
                    <table className="min-w-full divide-y divide-neutral-200">
                      <thead className="bg-neutral-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Variable</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Description</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Required</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Default Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200">
                        {template.variables && template.variables.length > 0 ? (
                          template.variables.map((variable, index) => (
                            <tr key={index}>
                              <td className="px-4 py-2 text-sm text-neutral-900">
                                <code className="bg-neutral-100 px-1 py-0.5 rounded text-neutral-800">{`{{${variable.name}}}`}</code>
                              </td>
                              <td className="px-4 py-2 text-sm text-neutral-900">{variable.description}</td>
                              <td className="px-4 py-2 text-sm text-neutral-900">{variable.required ? 'Yes' : 'No'}</td>
                              <td className="px-4 py-2 text-sm text-neutral-900">{variable.defaultValue || '(None)'}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="px-4 py-4 text-sm text-center text-neutral-500">
                              No variables defined
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {template.tags && template.tags.length > 0 && (
                  <div className="col-span-1 md:col-span-2 mt-6">
                    <h3 className="text-lg font-semibold mb-3">
                      Tags
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {template.tags.map((tag, index) => (
                        <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Version History
                </h3>

                {template.history && template.history.length > 0 ? (
                  <div className="bg-white border border-neutral-200 rounded-md overflow-hidden">
                    <table className="min-w-full divide-y divide-neutral-200">
                      <thead className="bg-neutral-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Version</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Changed By</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Date</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200">
                        {template.history.map((entry, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm text-neutral-900">{entry.versionNumber}</td>
                            <td className="px-4 py-2 text-sm text-neutral-900">{entry.changedBy}</td>
                            <td className="px-4 py-2 text-sm text-neutral-900">{formatDate(entry.changedAt)}</td>
                            <td className="px-4 py-2 text-sm text-neutral-900">{entry.changeDescription || 'No description'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-md">
                    No version history available for this template.
                  </div>
                )}
              </div>
            )}

            {activeTab === 'stats' && (
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Usage Statistics
                </h3>

                {template.stats ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="bg-white border border-neutral-200 rounded-md overflow-hidden">
                        <table className="min-w-full divide-y divide-neutral-200">
                          <tbody className="divide-y divide-neutral-200">
                            <tr>
                              <th className="px-4 py-2 text-left text-sm font-medium text-neutral-700">
                                Total Sent
                              </th>
                              <td className="px-4 py-2 text-sm text-neutral-900">{template.stats.sent || 0}</td>
                            </tr>
                            <tr>
                              <th className="px-4 py-2 text-left text-sm font-medium text-neutral-700">
                                Opened
                              </th>
                              <td className="px-4 py-2 text-sm text-neutral-900">
                                {template.stats.opened || 0}
                                {template.stats.sent > 0 && (
                                  <span className="ml-1 text-xs text-neutral-500">
                                    ({Math.round((template.stats.opened / template.stats.sent) * 100)}%)
                                  </span>
                                )}
                              </td>
                            </tr>
                            <tr>
                              <th className="px-4 py-2 text-left text-sm font-medium text-neutral-700">
                                Clicked
                              </th>
                              <td className="px-4 py-2 text-sm text-neutral-900">
                                {template.stats.clicked || 0}
                                {template.stats.sent > 0 && (
                                  <span className="ml-1 text-xs text-neutral-500">
                                    ({Math.round((template.stats.clicked / template.stats.sent) * 100)}%)
                                  </span>
                                )}
                              </td>
                            </tr>
                            <tr>
                              <th className="px-4 py-2 text-left text-sm font-medium text-neutral-700">
                                Bounced
                              </th>
                              <td className="px-4 py-2 text-sm text-neutral-900">
                                {template.stats.bounced || 0}
                                {template.stats.sent > 0 && (
                                  <span className="ml-1 text-xs text-neutral-500">
                                    ({Math.round((template.stats.bounced / template.stats.sent) * 100)}%)
                                  </span>
                                )}
                              </td>
                            </tr>
                            <tr>
                              <th className="px-4 py-2 text-left text-sm font-medium text-neutral-700">
                                Last Sent
                              </th>
                              <td className="px-4 py-2 text-sm text-neutral-900">
                                {template.stats.lastSent ? formatDate(template.stats.lastSent) : 'Never'}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-md">
                    No statistics available for this template.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default ViewEmailTemplatePage;
