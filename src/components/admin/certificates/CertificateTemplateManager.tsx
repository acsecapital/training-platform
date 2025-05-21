import React, {useState, useEffect } from 'react';
import {CertificateTemplate } from '@/types/certificate.types';
import Button from '@/components/ui/Button';
import {
  getCertificateTemplates,
  createCertificateTemplate,
  updateCertificateTemplate
} from '@/services/certificateService';
import CertificateTemplateEditor from './CertificateTemplateEditor';
import {toast } from 'react-hot-toast';

const CertificateTemplateManager: React.FC = () => {
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Partial<CertificateTemplate> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch templates
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        setError(null);

        const templatesData = await getCertificateTemplates();
        setTemplates(templatesData);
    } catch (err: any) {
        console.error('Error fetching certificate templates:', err);
        setError('Failed to load certificate templates');
    } finally {
        setLoading(false);
    }
  };

    fetchTemplates();
}, []);

  // Handle creating a new template
  const handleCreateTemplate = () => {
    setEditingTemplate({
      name: '',
      description: '',
      type: 'html' as 'html' | 'pdf',
      content: `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      color: #333;
      margin: 0;
      padding: 0;
  }
    .certificate {
      width: 100%;
      height: 100%;
      padding: 20px;
      box-sizing: border-box;
      position: relative;
      background-color: #fff;
  }
    .certificate-header {
      text-align: center;
      margin-bottom: 30px;
  }
    .certificate-title {
      font-size: 36px;
      font-weight: bold;
      margin-bottom: 10px;
      color: #1a73e8;
  }
    .certificate-subtitle {
      font-size: 24px;
      margin-bottom: 20px;
  }
    .certificate-content {
      text-align: center;
      margin-bottom: 30px;
  }
    .student-name {
      font-size: 30px;
      font-weight: bold;
      margin-bottom: 20px;
  }
    .certificate-text {
      font-size: 18px;
      line-height: 1.5;
      margin-bottom: 30px;
  }
    .certificate-footer {
      display: flex;
      justify-content: space-between;
      margin-top: 50px;
  }
    .signature {
      text-align: center;
      width: 200px;
  }
    .signature-line {
      border-top: 1px solid #333;
      margin-bottom: 5px;
  }
    .signature-name {
      font-weight: bold;
  }
    .signature-title {
      font-style: italic;
  }
    .certificate-date {
      text-align: center;
      margin-top: 20px;
  }
    .certificate-id {
      position: absolute;
      bottom: 10px;
      right: 10px;
      font-size: 12px;
      color: #666;
  }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="certificate-header">
      <div class="certificate-title">Certificate of Completion</div>
      <div class="certificate-subtitle">This is to certify that</div>
    </div>

    <div class="certificate-content">
      <div class="student-name">{{studentName}}</div>
      <div class="certificate-text">
        has successfully completed the course<br>
        <strong>{{courseName}}</strong><br>
        with all requirements fulfilled
      </div>
    </div>

    <div class="certificate-footer">
      <div class="signature">
        <div class="signature-line"></div>
        <div class="signature-name">{{issuerName}}</div>
        <div class="signature-title">{{issuerTitle}}</div>
      </div>

      <div class="certificate-date">
        Issued on: {{issueDate}}
      </div>
    </div>

    <div class="certificate-id">
      Certificate ID: {{certificateId}}<br>
      Verification Code: {{verificationCode}}
    </div>
  </div>
</body>
</html>`,
      fields: [],
      defaultValues: {
        issuerName: 'John Doe',
        issuerTitle: 'Course Instructor'
    },
      status: 'draft',
      orientation: 'landscape',
      dimensions: {
        width: 210,
        height: 297,
        unit: 'mm'
    },
      defaultFonts: ['Arial', 'Helvetica', 'sans-serif'],
      defaultColors: {
        primary: '#1a73e8',
        secondary: '#4285f4',
        text: '#202124',
        background: '#ffffff'
    },
      placeholders: [
        '{{studentName}}',
        '{{courseName}}',
        '{{issueDate}}',
        '{{certificateId}}',
        '{{verificationCode}}',
        '{{issuerName}}',
        '{{issuerTitle}}'
      ]
  });
    setShowEditor(true);
};

  // Handle editing a template
  const handleEditTemplate = (template: CertificateTemplate) => {
    setEditingTemplate(template);
    setShowEditor(true);
};

  // Handle saving a template
  const handleSaveTemplate = async (template: Partial<CertificateTemplate>) => {
    try {
      setIsSubmitting(true);

      if (template.id) {
        // Update existing template
        await updateCertificateTemplate(template.id, template);

        // Update templates list
        setTemplates(prev => prev.map(t => t.id === template.id ? {...t, ...template } as CertificateTemplate : t));

        toast.success('Template updated successfully');
    } else {
        // Create new template
        const newTemplate = await createCertificateTemplate(template as Omit<CertificateTemplate, 'id' | 'createdAt' | 'updatedAt'>);

        if (newTemplate) {
          // Add new template to list
          setTemplates(prev => [...prev, newTemplate]);

          toast.success('Template created successfully');
      } else {
          throw new Error('Failed to create template');
      }
    }

      // Reset state
      setShowEditor(false);
      setEditingTemplate(null);
  } catch (err: any) {
      console.error('Error saving template:', err);
      toast.error(err.message || 'Failed to save template');
  } finally {
      setIsSubmitting(false);
  }
};

  // Handle canceling edit
  const handleCancelEdit = () => {
    setShowEditor(false);
    setEditingTemplate(null);
};

  // Format date string
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
  });
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
      {showEditor ? (
        <CertificateTemplateEditor
          initialTemplate={editingTemplate || {}}
          onSave={handleSaveTemplate}
          onCancel={handleCancelEdit}
          isSubmitting={isSubmitting}
        />
      ) : (
        <>
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-neutral-900">Certificate Templates</h2>
            <Button
              variant="primary"
              onClick={handleCreateTemplate}
            >
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Create Template
              </span>
            </Button>
          </div>

          {templates.length === 0 ? (
            <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-neutral-200 p-8 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-neutral-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-neutral-900 mb-1">No templates found</h3>
              <p className="text-neutral-500 mb-4">
                Create your first certificate template to get started.
              </p>
              <Button
                variant="primary"
                onClick={handleCreateTemplate}
              >
                Create Template
              </Button>
            </div>
          ) : (
            <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-neutral-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Default
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Last Updated
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-200">
                    {templates.map((template) => (
                      <tr key={template.id} className="hover:bg-neutral-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-neutral-100 rounded-md flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-neutral-900">
                                {template.name}
                              </div>
                              {template.description && (
                                <div className="text-sm text-neutral-500">
                                  {template.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            (template as any).status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : (template as any).status === 'inactive'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                        }`}>
                            {((template as any).status || 'draft').charAt(0).toUpperCase() + ((template as any).status || 'draft').slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {template.isDefault ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Default
                            </span>
                          ) : (
                            <span className="text-neutral-500 text-sm">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                          {formatDate(template.updatedAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditTemplate(template)}
                          >
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CertificateTemplateManager;
