import React, {useState, useEffect } from 'react';
import {CertificateTemplate } from '@/types/certificate.types';
import Button from '@/components/ui/Button';
import {v4 as uuidv4 } from 'uuid';
import {formatDate } from '@/utils/formatters';

interface CertificateTemplatePreviewProps {
  template: Partial<CertificateTemplate>;
  sampleData?: Record<string, string>;
  onDownload?: () => void;
  isGenerating?: boolean;
}

const CertificateTemplatePreview: React.FC<CertificateTemplatePreviewProps> = ({
  template,
  sampleData,
  onDownload,
  isGenerating = false
}) => {
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Default sample data
  const defaultSampleData: Record<string, string> = {
    studentName: 'John Doe',
    courseName: 'Advanced Sales Techniques',
    issueDate: formatDate(new Date().toISOString()),
    completionDate: formatDate(new Date().toISOString()),
    certificateId: uuidv4().substring(0, 8).toUpperCase(),
    verificationCode: 'ABC123XYZ',
    issuerName: 'Jane Smith',
    issuerTitle: 'Director of Training',
    companyName: 'Closer College'
};

  // Merge default sample data with provided sample data
  const mergedSampleData = {...defaultSampleData, ...sampleData };

  // Generate preview HTML
  useEffect(() => {
    if (!template.content && !template.htmlTemplate) {
      setError('No template content available');
      return;
  }

    try {
      // Get the HTML content
      let html = template.content || template.htmlTemplate || '';

      // Replace placeholders with sample data
      Object.entries(mergedSampleData).forEach(([key, value]) => {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
        html = html.replace(regex, value);
    });

      // Add CSS styles if available
      if (template.cssStyles) {
        html = `
          <style>
            ${template.cssStyles}
          </style>
          ${html}
        `;
    }

      setPreviewHtml(html);
      setError(null);
  } catch (err: any) {
      console.error('Error generating preview:', err);
      setError(err.message || 'Failed to generate preview');
  }
}, [template, mergedSampleData]);

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-neutral-200">
        <div className="p-4 border-b border-neutral-200 flex justify-between items-center">
          <h2 className="text-lg font-medium text-neutral-900">Certificate Preview</h2>
          {onDownload && (
            <Button
              variant="primary"
              size="sm"
              onClick={onDownload}
              disabled={isGenerating}
            >
              {isGenerating ? 'Generating PDF...' : 'Download PDF Preview'}
            </Button>
          )}
        </div>
        <div className="p-4">
          <div className="bg-neutral-100 border border-neutral-200 rounded-lg overflow-hidden">
            <div className="relative" style={{
              paddingTop: template.orientation === 'portrait' ? '141.4%' : '70.7%', // A4 aspect ratio
              backgroundColor: '#fff'
          }}>
              {previewHtml ? (
                <iframe
                  srcDoc={previewHtml}
                  className="absolute top-0 left-0 w-full h-full"
                  style={{border: 'none'}}
                  title="Certificate Preview"
                />
              ) : (
                <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                  <p className="text-neutral-500">No preview available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-neutral-200">
        <div className="p-4 border-b border-neutral-200">
          <h2 className="text-lg font-medium text-neutral-900">Sample Data</h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(mergedSampleData).map(([key, value]) => (
              <div key={key} className="flex flex-col">
                <span className="text-sm font-medium text-neutral-500">{key}</span>
                <span className="text-sm text-neutral-900">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateTemplatePreview;
