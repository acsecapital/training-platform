import React, {useState, useEffect } from 'react';
import {useRouter } from 'next/router';
import {doc, getDoc } from 'firebase/firestore';
import {firestore } from '@/services/firebase';
import Button from '@/components/ui/Button';
import {CertificateTemplate } from '@/types/certificate.types';
import Link from 'next/link';
import ClientSideCertificateGenerator from '@/components/certificates/ClientSideCertificateGenerator';
import {useSettings } from '@/context/SettingsContext';
import {DEFAULT_CERTIFICATE_COLORS, DEFAULT_CERTIFICATE_FONTS } from '@/config/certificateConfig';
import {generateCertificateId } from '@/utils/certificateUtils';

interface CertificateTemplatePreviewContentProps {
  id: string;
  templateData?: CertificateTemplate | null;
  templateError?: string | null;
}

const CertificateTemplatePreviewContent: React.FC<CertificateTemplatePreviewContentProps> = ({
  id,
  templateData: initialTemplateData,
  templateError: initialError
}) => {
  const router = useRouter();
  const {settings, loading: settingsLoading } = useSettings();
  const [loading, setLoading] = useState(!initialTemplateData);
  const [error, setError] = useState<string | null>(initialError || null);
  const [template, setTemplate] = useState<CertificateTemplate | null>(initialTemplateData || null);
  const [previewData, setPreviewData] = useState({
    studentName: '',
    courseName: '',
    completionDate: new Date().toLocaleDateString(),
    certificateId: generateCertificateId(),
    issuerName: '',
    issuerTitle: ''
});

  // Update preview data when settings are loaded
  useEffect(() => {
    if (!settingsLoading && settings) {
      setPreviewData(prev => ({
        ...prev,
        studentName: settings.defaultStudentName || prev.studentName,
        courseName: settings.defaultCourseName || prev.courseName,
        issuerName: settings.organizationName || prev.issuerName,
        issuerTitle: settings.defaultIssuerTitle || prev.issuerTitle
    }));
  }
}, [settings, settingsLoading]);

  // Fetch template if not provided initially
  useEffect(() => {
    if (initialTemplateData) {
      return; // Skip fetching if data was provided
  }

    const fetchTemplate = async () => {
      try {
        setLoading(true);
        setError(null);

        const templateDoc = await getDoc(doc(firestore, 'certificateTemplates', id));

        if (!templateDoc.exists()) {
          setError('Template not found');
          return;
      }

        const data = templateDoc.data();
        setTemplate({
          ...data,
          id: templateDoc.id,
      } as CertificateTemplate);

        // Update preview data with template defaults if available
        if (data.defaultValues) {
          setPreviewData(prev => ({
            ...prev,
            ...data.defaultValues
        }));
      }
    } catch (err: any) {
        console.error('Error fetching template:', err);
        setError(err.message || 'Failed to load template. Please try again.');
    } finally {
        setLoading(false);
    }
  };

    fetchTemplate();
}, [id, initialTemplateData]);

  const handlePreviewDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {name, value } = e.target;
    setPreviewData(prev => ({
      ...prev,
      [name]: value
  }));
};

  const handleCertificateGenerated = async (pdfUrl: string) => {
    try {
      // Handle the generated certificate URL according to your business logic
      if (settings && typeof settings.certificateHandler === 'function') {
        await settings.certificateHandler(pdfUrl);
    }
  } catch (error) {
      console.error('Error handling generated certificate:', error);
  }
};

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-neutral-500 mt-1">
            {(settings && settings.previewDescription) || 'Preview how the certificate will look with sample data'}
          </p>
        </div>
        <div className="flex space-x-3 mt-4 sm:mt-0">
          {id && (
            <Link href={`/admin/certificates/templates/${id}/edit`}>
              <Button variant="primary">
                Edit Template
              </Button>
            </Link>
          )}
          <Link href="/admin/certificates/templates">
            <Button variant="outline">
              Back to Templates
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white shadow-sm rounded-lg p-8 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : template ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="p-6 border-b border-neutral-200">
                <h2 className="text-lg font-medium text-neutral-900 mb-4">
                  {(settings && settings.previewDataTitle) || 'Preview Data'}
                </h2>
                <div className="space-y-4">
                  {Object.entries(previewData).map(([key, value]) => (
                    <div key={key}>
                      <label
                        htmlFor={key}
                        className="block text-sm font-medium text-neutral-700 mb-1"
                      >
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </label>
                      <input
                        type="text"
                        id={key}
                        name={key}
                        value={value}
                        onChange={handlePreviewDataChange}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="p-6">
                {template && (
                  <ClientSideCertificateGenerator
                    template={{
                      id: template.id,
                      name: template.name || 'Template',
                      primaryColor: template.defaultColors?.primary || DEFAULT_CERTIFICATE_COLORS.primary,
                      secondaryColor: template.defaultColors?.secondary || DEFAULT_CERTIFICATE_COLORS.secondary,
                      fontFamily: template.defaultFonts?.[0] || DEFAULT_CERTIFICATE_FONTS[0],
                      backgroundUrl: template.previewUrl
                  }}
                    userName={previewData.studentName}
                    courseName={previewData.courseName}
                    completionDate={new Date(previewData.completionDate)}
                    certificateId={previewData.certificateId}
                    onGenerate={handleCertificateGenerated}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default CertificateTemplatePreviewContent;
