import React, {useState, useEffect } from 'react';
import {useRouter } from 'next/router';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import Button from '@/components/ui/Button';
import {EmailTemplate } from '@/types/notification-templates.types';
import {getEmailTemplateById, renderEmailTemplate } from '@/services/notificationTemplateService';
import dynamic from 'next/dynamic';

// Create a completely client-side only component
const ClientOnlyPreview = dynamic(() => Promise.resolve(({
  html,
  text,
  activeTab
}: {
  html: string;
  text: string;
  activeTab: 'html' | 'text'
}) => (
  <div className="w-full">
    {activeTab === 'html' ? (
      <div
        className="max-h-96 overflow-auto"
        dangerouslySetInnerHTML={{__html: html }}
      />
    ) : (
      <pre className="p-4 bg-neutral-100 rounded-md overflow-auto text-sm font-mono whitespace-pre-wrap max-h-96">
        {text}
      </pre>
    )}
  </div>
)), {ssr: false });

const PreviewEmailTemplatePage: React.FC = () => {
  const router = useRouter();
  const {id } = router.query;

  const [template, setTemplate] = useState<EmailTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewVariables, setPreviewVariables] = useState<Record<string, string>>({});
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [previewText, setPreviewText] = useState<string>('');
  const [previewSubject, setPreviewSubject] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'html' | 'text'>('html');

  // Fetch template
  useEffect(() => {
    const fetchTemplate = async () => {
      if (!id || typeof id !== 'string') return;

      try {
        setLoading(true);
        const fetchedTemplate = await getEmailTemplateById(id);

        if (fetchedTemplate) {
          setTemplate(fetchedTemplate);

          // Initialize preview variables with default values
          const initialVariables: Record<string, string> = {};
          fetchedTemplate.variables.forEach(variable => {
            initialVariables[variable.name] = variable.defaultValue || `[${variable.name}]`;
        });

          // Add some common variables if not already defined
          if (!initialVariables['firstName']) initialVariables['firstName'] = 'John';
          if (!initialVariables['lastName']) initialVariables['lastName'] = 'Doe';
          if (!initialVariables['email']) initialVariables['email'] = 'john.doe@example.com';
          if (!initialVariables['courseName']) initialVariables['courseName'] = 'Sales Mastery 101';
          if (!initialVariables['progress']) initialVariables['progress'] = '75';

          setPreviewVariables(initialVariables);

          // Generate initial preview
          const rendered = renderEmailTemplate(fetchedTemplate, initialVariables);
          setPreviewHtml(rendered.htmlContent);
          setPreviewText(rendered.textContent);
          setPreviewSubject(rendered.subject);
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

    fetchTemplate();
}, [id]);

  // Update preview when variables change
  useEffect(() => {
    if (!template) return;

    const rendered = renderEmailTemplate(template, previewVariables);
    setPreviewHtml(rendered.htmlContent);
    setPreviewText(rendered.textContent);
    setPreviewSubject(rendered.subject);
}, [previewVariables, template]);

  // Handle variable change
  const handleVariableChange = (name: string, value: string) => {
    setPreviewVariables(prev => ({
      ...prev,
      [name]: value
  }));
};

  if (loading) {
    return (
      <AdminLayout title="Preview Email Template">
        <div className="container-custom mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Preview Email Template</h1>
            <p className="text-neutral-500">Loading template...</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-neutral-200 rounded w-1/3 mb-4"></div>
              <div className="h-40 bg-neutral-200 rounded mb-4"></div>
              <div className="h-20 bg-neutral-200 rounded"></div>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
}

  if (error || !template) {
    return (
      <AdminLayout title="Preview Email Template">
        <div className="container-custom mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Preview Email Template</h1>
            <p className="text-neutral-500">Error loading template</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-red-500">{error || 'Template not found'}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/admin/notifications/templates')}
              className="mt-4"
            >
              Back to Templates
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
}

  return (
    <AdminLayout title="Preview Email Template">
      <div className="container-custom mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Preview Email Template</h1>
          <p className="text-neutral-500">
            {template.name} - {template.type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Variables Panel */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-medium mb-4">Template Variables</h2>

            <div className="space-y-4">
              {template.variables.map(variable => (
                <div key={variable.name}>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    {variable.name}
                    {variable.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <input
                    type="text"
                    value={previewVariables[variable.name] || ''}
                    onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder={variable.description}
                  />
                  <p className="text-xs text-neutral-500 mt-1">{variable.description}</p>
                </div>
              ))}

              <div className="pt-4 border-t border-neutral-200">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/admin/notifications/templates/${template.id}/edit`)}
                >
                  Edit Template
                </Button>
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 border-b border-neutral-200">
                <h2 className="text-lg font-medium">Email Preview</h2>
                <p className="text-sm text-neutral-500 mt-1">Subject: {previewSubject}</p>
              </div>

              <div className="border-b border-neutral-200">
                <div className="flex">
                  <button
                    className={`px-4 py-2 text-sm font-medium ${
                      activeTab === 'html'
                        ? 'border-b-2 border-primary text-primary'
                        : 'text-neutral-500 hover:text-neutral-700'
                  }`}
                    onClick={() => setActiveTab('html')}
                  >
                    HTML Version
                  </button>
                  <button
                    className={`px-4 py-2 text-sm font-medium ${
                      activeTab === 'text'
                        ? 'border-b-2 border-primary text-primary'
                        : 'text-neutral-500 hover:text-neutral-700'
                  }`}
                    onClick={() => setActiveTab('text')}
                  >
                    Text Version
                  </button>
                </div>
              </div>

              <div className="p-4">
                <ClientOnlyPreview
                  html={previewHtml}
                  text={previewText}
                  activeTab={activeTab}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default PreviewEmailTemplatePage;
