import React, {useState, useEffect } from 'react';
import {CertificateTemplate, TemplateField } from '@/types/certificate.types';
import Button from '@/components/ui/Button';
import dynamic from 'next/dynamic';
import {v4 as uuidv4 } from 'uuid';
import CertificateTemplatePreview from './CertificateTemplatePreview';
import {toast } from 'react-hot-toast';

// Import CodeMirror dynamically to avoid SSR issues
const CodeMirror = dynamic(
  () => import('@uiw/react-codemirror'),
  {ssr: false }
);

// We'll handle the extensions directly in the component

interface CertificateTemplateEditorProps {
  initialTemplate: Partial<CertificateTemplate>;
  onSave: (template: Partial<CertificateTemplate>) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const CertificateTemplateEditor: React.FC<CertificateTemplateEditorProps> = ({
  initialTemplate,
  onSave,
  onCancel,
  isSubmitting = false
}) => {
  const [template, setTemplate] = useState<Partial<CertificateTemplate>>(initialTemplate);
  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'preview'>('html');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availablePlaceholders, setAvailablePlaceholders] = useState<string[]>([
    '{{studentName}}',
    '{{courseName}}',
    '{{completionDate}}',
    '{{certificateId}}',
    '{{issueDate}}',
    '{{expiryDate}}',
    '{{verificationCode}}',
    '{{issuerName}}',
    '{{issuerTitle}}'
  ]);

  // Extract placeholders from HTML content
  useEffect(() => {
    if (template.htmlTemplate) {
      const regex = /{{([^{}]+)}}/g;
      const matches = template.htmlTemplate.match(regex) || [];
      const placeholders = matches.map(match => match.trim());

      // Add any new placeholders to the available list
      const newPlaceholders = placeholders.filter(p => !availablePlaceholders.includes(p));
      if (newPlaceholders.length > 0) {
        setAvailablePlaceholders(prev => [...prev, ...newPlaceholders]);
    }
  }
}, [template.htmlTemplate, availablePlaceholders]);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const {name, value } = e.target;
    setTemplate(prev => ({
      ...prev,
      [name]: value
  }));
};

  // Handle HTML content change
  const handleHtmlChange = (value: string) => {
    setTemplate(prev => ({
      ...prev,
      htmlTemplate: value
  }));
};

  // Handle CSS content change
  const handleCssChange = (value: string) => {
    setTemplate(prev => ({
      ...prev,
      cssStyles: value
  }));
};

  // Generate preview
  const handleGeneratePreview = async () => {
    try {
      setPreviewLoading(true);
      setError(null);

      // No need to generate an image preview anymore since we're using the CertificateTemplatePreview component
      setActiveTab('preview');
  } catch (err: any) {
      console.error('Error generating preview:', err);
      setError(err.message || 'Failed to generate preview');
  } finally {
      setPreviewLoading(false);
  }
};

  // Download PDF preview
  const handleDownloadPdfPreview = async () => {
    try {
      setIsGeneratingPdf(true);
      setError(null);

      // Call API to generate PDF preview
      const response = await fetch('/api/certificates/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
      },
        body: JSON.stringify({
          template: {
            content: template.htmlTemplate || template.content,
            cssStyles: template.cssStyles,
            orientation: template.orientation || 'landscape'
        }
      }),
    });

      if (!response.ok) {
        throw new Error('Failed to generate PDF preview');
    }

      // Convert response to blob and create URL
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      // Create a temporary link and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `${template.name || 'certificate'}-preview.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      toast.success('PDF preview downloaded successfully');
  } catch (err: any) {
      console.error('Error generating PDF preview:', err);
      setError(err.message || 'Failed to generate PDF preview');
      toast.error('Failed to generate PDF preview');
  } finally {
      setIsGeneratingPdf(false);
  }
};

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setError(null);

      // Validate required fields
      if (!template.name) {
        setError('Template name is required');
        return;
    }

      if (!template.htmlTemplate) {
        setError('HTML content is required');
        return;
    }

      // Extract placeholders for storage
      const regex = /{{([^{}]+)}}/g;
      const matches = template.htmlTemplate.match(regex) || [];
      const placeholders = matches.map(match => match.trim());

      // Remove duplicates
      const uniquePlaceholders = Array.from(new Set(placeholders));

      // Prepare template for saving
      const templateToSave: Partial<CertificateTemplate> = {
        ...template,
        placeholders: uniquePlaceholders,
        orientation: template.orientation || 'landscape',
        dimensions: template.dimensions || {
          width: 210,
          height: 297,
          unit: 'mm'
      },
        defaultFonts: template.defaultFonts || ['Arial', 'Helvetica', 'sans-serif'],
        defaultColors: template.defaultColors || {
          primary: '#1a73e8',
          secondary: '#4285f4',
          text: '#202124',
          background: '#ffffff'
      }
    };

      await onSave(templateToSave);
  } catch (err: any) {
      console.error('Error saving template:', err);
      setError(err.message || 'Failed to save template');
  }
};

  // Add a placeholder to the HTML content
  const handleAddPlaceholder = (placeholder: string) => {
    if (!template.htmlTemplate) return;

    // Get cursor position in CodeMirror (not implemented here)
    // For simplicity, we'll just append to the end
    const newHtml = template.htmlTemplate + ` ${placeholder}`;

    setTemplate(prev => ({
      ...prev,
      htmlTemplate: newHtml
  }));
};

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Basic Information */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-neutral-200">
          <div className="p-4 border-b border-neutral-200">
            <h2 className="text-lg font-medium text-neutral-900">Basic Information</h2>
          </div>
          <div className="p-6 space-y-4">
            {/* Template Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-1">
                Template Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={template.name || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter template name"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-neutral-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={template.description || ''}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter template description"
              />
            </div>

            {/* Orientation */}
            <div>
              <label htmlFor="orientation" className="block text-sm font-medium text-neutral-700 mb-1">
                Orientation
              </label>
              <select
                id="orientation"
                name="orientation"
                value={template.orientation || 'landscape'}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="landscape">Landscape</option>
                <option value="portrait">Portrait</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-neutral-700 mb-1">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={(template as any).status || 'draft'}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Default Template */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isDefault"
                name="isDefault"
                checked={template.isDefault || false}
                onChange={(e) => setTemplate(prev => ({
                  ...prev,
                  isDefault: e.target.checked
              }))}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
              />
              <label htmlFor="isDefault" className="ml-2 block text-sm text-neutral-700">
                Set as default template
              </label>
            </div>
          </div>
        </div>

        {/* Template Editor */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-neutral-200">
          <div className="p-4 border-b border-neutral-200">
            <h2 className="text-lg font-medium text-neutral-900">Template Editor</h2>
          </div>

          {/* Tabs */}
          <div className="border-b border-neutral-200">
            <nav className="-mb-px flex space-x-8 px-4">
              <button
                type="button"
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'html'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
              }`}
                onClick={() => setActiveTab('html')}
              >
                HTML
              </button>
              <button
                type="button"
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'css'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
              }`}
                onClick={() => setActiveTab('css')}
              >
                CSS
              </button>
              <button
                type="button"
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'preview'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
              }`}
                onClick={() => setActiveTab('preview')}
              >
                Preview
              </button>
            </nav>
          </div>

          {/* Editor Content */}
          <div className="p-6">
            {activeTab === 'html' && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="text-sm font-medium text-neutral-700">Available Placeholders:</span>
                  {availablePlaceholders.map((placeholder) => (
                    <button
                      key={placeholder}
                      type="button"
                      onClick={() => handleAddPlaceholder(placeholder)}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800 hover:bg-neutral-200"
                    >
                      {placeholder}
                    </button>
                  ))}
                </div>

                <div className="border border-neutral-300 rounded-md overflow-hidden" style={{height: '400px'}}>
                  {typeof window !== 'undefined' && (
                    <CodeMirror
                      value={template.htmlTemplate || template.content || ''}
                      height="400px"
                      onChange={handleHtmlChange}
                      theme="light"
                    />
                  )}
                </div>

                <p className="text-sm text-neutral-500">
                  Use HTML to design your certificate template. Use placeholders like {'{{'} studentName {'}}'}  to include dynamic content.
                </p>
              </div>
            )}

            {activeTab === 'css' && (
              <div className="space-y-4">
                <div className="border border-neutral-300 rounded-md overflow-hidden" style={{height: '400px'}}>
                  {typeof window !== 'undefined' && (
                    <CodeMirror
                      value={template.cssStyles || ''}
                      height="400px"
                      onChange={handleCssChange}
                      theme="light"
                    />
                  )}
                </div>

                <p className="text-sm text-neutral-500">
                  Use CSS to style your certificate template. The styles will be applied to the HTML content.
                </p>
              </div>
            )}

            {activeTab === 'preview' && (
              <CertificateTemplatePreview
                template={template}
                onDownload={handleDownloadPdfPreview}
                isGenerating={isGeneratingPdf}
              />
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Template'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CertificateTemplateEditor;
