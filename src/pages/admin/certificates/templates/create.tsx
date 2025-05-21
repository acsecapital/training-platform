import React, {useState } from 'react';
import {useRouter } from 'next/router';
import {collection, addDoc } from 'firebase/firestore';
import {getAuth } from 'firebase/auth';
import {firestore } from '@/services/firebase';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Button from '@/components/ui/Button';
import {CertificateTemplate } from '@/types/certificate.types';
import Link from 'next/link';

const CreateCertificateTemplatePage: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPdfTemplate, setIsPdfTemplate] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [templateData, setTemplateData] = useState<Partial<CertificateTemplate>>({
    name: '',
    description: '',
    orientation: 'landscape',
    dimensions: {
      width: 297,
      height: 210,
      unit: 'mm'
  },
    defaultFonts: ['Helvetica', 'Arial', 'sans-serif'],
    defaultColors: {
      primary: '#0e0e4f',
      secondary: '#8a0200',
      text: '#3c3c3c',
      background: '#f0f0ff'
  },
    placeholders: [
      '{{studentName}}',
      '{{courseName}}',
      '{{completionDate}}',
      '{{certificateId}}',
      '{{issuerName}}',
      '{{issuerTitle}}'
    ],
    htmlTemplate: `
      <div class="certificate">
        <h1 class="certificate-title">Certificate of Completion</h1>
        <p class="certificate-text">This is to certify that</p>
        <h2 class="student-name">{{studentName}}</h2>
        <p class="certificate-text">has successfully completed the course</p>
        <h3 class="course-name">{{courseName}}</h3>
        <p class="completion-date">Completed on: {{completionDate}}</p>
        <p class="certificate-id">Certificate ID: {{certificateId}}</p>
        <div class="signature">
          <p class="issuer-name">{{issuerName}}</p>
          <p class="issuer-title">{{issuerTitle}}</p>
        </div>
      </div>
    `,
    cssStyles: `
      .certificate {
        font-family: Helvetica, Arial, sans-serif;
        color: #3c3c3c;
        text-align: center;
        padding: 20mm;
        background-color: #f0f0ff;
        border: 5mm solid #0e0e4f;
        position: relative;
        height: 100%;
    }
      .certificate-title {
        font-size: 36pt;
        color: #0e0e4f;
        margin-bottom: 10mm;
    }
      .certificate-text {
        font-size: 14pt;
        margin: 5mm 0;
    }
      .student-name {
        font-size: 28pt;
        color: #8a0200;
        margin: 10mm 0;
    }
      .course-name {
        font-size: 24pt;
        color: #0e0e4f;
        margin: 10mm 0;
    }
      .completion-date {
        font-size: 14pt;
        margin-top: 15mm;
    }
      .certificate-id {
        font-size: 10pt;
        margin-top: 5mm;
    }
      .signature {
        margin-top: 20mm;
    }
      .issuer-name {
        font-size: 16pt;
        margin-bottom: 2mm;
    }
      .issuer-title {
        font-size: 12pt;
        color: #666;
    }
    `
});

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const {name, value } = e.target;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');

      setTemplateData(prev => {
        // Create a safe copy of the parent object with proper defaults
        let parentObj: Record<string, any> = {};

        // Handle specific parent objects based on their expected structure
        if (parent === 'dimensions') {
          parentObj = prev.dimensions || {width: 297, height: 210, unit: 'mm'};
      } else if (parent === 'defaultColors') {
          parentObj = prev.defaultColors || {primary: '#0e0e4f', secondary: '#8a0200', text: '#3c3c3c', background: '#f0f0ff'};
      } else {
          // For any other parent, use what exists or an empty object
          const existingParent = prev[parent as keyof typeof prev];
          parentObj = (existingParent && typeof existingParent === 'object') ? existingParent : {};
      }

        return {
          ...prev,
          [parent]: {
            ...parentObj,
            [child]: value
        }
      };
    });
  } else {
      setTemplateData(prev => ({
        ...prev,
        [name]: value
    }));
  }
};

  // Handle PDF file upload
  const handlePdfFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        setError('Please upload a PDF file');
        return;
    }
      setPdfFile(file);
  }
};

  // Handle preview image upload
  const handlePreviewImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
    }
      setPreviewImage(file);
      setPreviewUrl(URL.createObjectURL(file));
  }
};

  // Upload file using server API
  const uploadFile = async (file: File, fileType: 'pdf' | 'preview') => {
    // Get the current user's ID token
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('You must be logged in to upload files');
  }

    const idToken = await user.getIdToken();

    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileType', fileType);

    // Upload using our secure API endpoint
    const response = await fetch('/api/admin/certificates/upload-template', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
    },
      body: formData,
  });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to upload file');
  }

    const data = await response.json();
    return data.url;
};

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Upload PDF template if selected
      let pdfTemplateUrl = '';
      if (isPdfTemplate && pdfFile) {
        pdfTemplateUrl = await uploadFile(pdfFile, 'pdf');
    }

      // Upload preview image if provided
      let previewImageUrl = '';
      if (previewImage) {
        previewImageUrl = await uploadFile(previewImage, 'preview');
    }

      // Create template document in Firestore
      // Ensure we're only using valid object properties
      const templateDataToSave = {
        name: templateData.name || '',
        description: templateData.description || '',
        orientation: templateData.orientation || 'landscape',
        dimensions: templateData.dimensions || {width: 297, height: 210, unit: 'mm'},
        defaultFonts: templateData.defaultFonts || ['Helvetica', 'Arial', 'sans-serif'],
        defaultColors: templateData.defaultColors || {
          primary: '#0e0e4f',
          secondary: '#8a0200',
          text: '#3c3c3c',
          background: '#f0f0ff'
      },
        placeholders: templateData.placeholders || [],
        htmlTemplate: templateData.htmlTemplate || '',
        cssStyles: templateData.cssStyles || '',
        isPdfTemplate,
        pdfTemplateUrl: isPdfTemplate ? pdfTemplateUrl : '',
        previewUrl: previewImageUrl || '/assets/certificate-default.jpg',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

      await addDoc(collection(firestore, 'certificateTemplates'), templateDataToSave);

      setSuccess(true);

      // Redirect to template list after a short delay
      setTimeout(() => {
        router.push('/admin/certificates/templates');
    }, 2000);
  } catch (err: any) {
      console.error('Error creating certificate template:', err);
      setError(err.message || 'Failed to create certificate template. Please try again.');
  } finally {
      setLoading(false);
  }
};

  return (
    <AdminLayout title="Create Certificate Template">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Initiate Design</h1>
            <p className="text-neutral-500 mt-1">
              Design a new certificate template for course completion
            </p>
          </div>
          <Link href="/admin/certificates/templates">
            <Button variant="outline" className="mt-4 sm:mt-0">
              Back to Templates
            </Button>
          </Link>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Success message */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
            Certificate template created successfully! Redirecting...
          </div>
        )}

        {/* Template Form */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h2 className="text-lg font-medium text-neutral-900 border-b border-neutral-200 pb-2">Basic Information</h2>

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-1">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={templateData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-neutral-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={templateData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="orientation" className="block text-sm font-medium text-neutral-700 mb-1">
                    Orientation
                  </label>
                  <select
                    id="orientation"
                    name="orientation"
                    value={templateData.orientation}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="landscape">Landscape</option>
                    <option value="portrait">Portrait</option>
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="dimensions.width" className="block text-sm font-medium text-neutral-700 mb-1">
                      Width
                    </label>
                    <input
                      type="number"
                      id="dimensions.width"
                      name="dimensions.width"
                      value={templateData.dimensions?.width}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="dimensions.height" className="block text-sm font-medium text-neutral-700 mb-1">
                      Height
                    </label>
                    <input
                      type="number"
                      id="dimensions.height"
                      name="dimensions.height"
                      value={templateData.dimensions?.height}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="dimensions.unit" className="block text-sm font-medium text-neutral-700 mb-1">
                      Unit
                    </label>
                    <select
                      id="dimensions.unit"
                      name="dimensions.unit"
                      value={templateData.dimensions?.unit}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="mm">mm</option>
                      <option value="in">inches</option>
                      <option value="px">pixels</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Template Type and Preview */}
              <div className="space-y-4">
                <h2 className="text-lg font-medium text-neutral-900 border-b border-neutral-200 pb-2">Template Type</h2>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="html-template"
                      name="template-type"
                      checked={!isPdfTemplate}
                      onChange={() => setIsPdfTemplate(false)}
                      className="h-4 w-4 text-primary focus:ring-primary border-neutral-300"
                    />
                    <label htmlFor="html-template" className="ml-2 block text-sm text-neutral-700">
                      HTML Template
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="pdf-template"
                      name="template-type"
                      checked={isPdfTemplate}
                      onChange={() => setIsPdfTemplate(true)}
                      className="h-4 w-4 text-primary focus:ring-primary border-neutral-300"
                    />
                    <label htmlFor="pdf-template" className="ml-2 block text-sm text-neutral-700">
                      PDF Template
                    </label>
                  </div>
                </div>

                {isPdfTemplate ? (
                  <div>
                    <label htmlFor="pdf-file" className="block text-sm font-medium text-neutral-700 mb-1">
                      Upload PDF Template *
                    </label>
                    <input
                      type="file"
                      id="pdf-file"
                      accept="application/pdf"
                      onChange={handlePdfFileChange}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required={isPdfTemplate}
                    />
                    <p className="text-xs text-neutral-500 mt-1">
                      Upload a PDF file with placeholders for dynamic content. Supported placeholders: {templateData.placeholders?.join(', ')}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-neutral-500">
                    You'll be able to customize the HTML template in the next step.
                  </p>
                )}

                <div>
                  <label htmlFor="preview-image" className="block text-sm font-medium text-neutral-700 mb-1">
                    Preview Image
                  </label>
                  <input
                    type="file"
                    id="preview-image"
                    accept="image/*"
                    onChange={handlePreviewImageChange}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    Upload an image to use as a preview for this template.
                  </p>
                </div>

                {previewUrl && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-neutral-700 mb-1">Preview</p>
                    <div className="relative h-48 bg-neutral-100 rounded-md overflow-hidden">
                      <img
                        src={previewUrl}
                        alt="Template Preview"
                        className="object-cover w-full h-full"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Colors and Fonts */}
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-neutral-900 border-b border-neutral-200 pb-2">Colors and Fonts</h2>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label htmlFor="defaultColors.primary" className="block text-sm font-medium text-neutral-700 mb-1">
                    Primary Color
                  </label>
                  <div className="flex">
                    <input
                      type="color"
                      id="defaultColors.primary"
                      name="defaultColors.primary"
                      value={templateData.defaultColors?.primary}
                      onChange={handleInputChange}
                      className="h-10 w-10 border border-neutral-300 rounded-l-md"
                    />
                    <input
                      type="text"
                      name="defaultColors.primary"
                      value={templateData.defaultColors?.primary}
                      onChange={handleInputChange}
                      className="flex-1 px-3 py-2 border border-l-0 border-neutral-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="defaultColors.secondary" className="block text-sm font-medium text-neutral-700 mb-1">
                    Secondary Color
                  </label>
                  <div className="flex">
                    <input
                      type="color"
                      id="defaultColors.secondary"
                      name="defaultColors.secondary"
                      value={templateData.defaultColors?.secondary}
                      onChange={handleInputChange}
                      className="h-10 w-10 border border-neutral-300 rounded-l-md"
                    />
                    <input
                      type="text"
                      name="defaultColors.secondary"
                      value={templateData.defaultColors?.secondary}
                      onChange={handleInputChange}
                      className="flex-1 px-3 py-2 border border-l-0 border-neutral-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="defaultColors.text" className="block text-sm font-medium text-neutral-700 mb-1">
                    Text Color
                  </label>
                  <div className="flex">
                    <input
                      type="color"
                      id="defaultColors.text"
                      name="defaultColors.text"
                      value={templateData.defaultColors?.text}
                      onChange={handleInputChange}
                      className="h-10 w-10 border border-neutral-300 rounded-l-md"
                    />
                    <input
                      type="text"
                      name="defaultColors.text"
                      value={templateData.defaultColors?.text}
                      onChange={handleInputChange}
                      className="flex-1 px-3 py-2 border border-l-0 border-neutral-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="defaultColors.background" className="block text-sm font-medium text-neutral-700 mb-1">
                    Background Color
                  </label>
                  <div className="flex">
                    <input
                      type="color"
                      id="defaultColors.background"
                      name="defaultColors.background"
                      value={templateData.defaultColors?.background}
                      onChange={handleInputChange}
                      className="h-10 w-10 border border-neutral-300 rounded-l-md"
                    />
                    <input
                      type="text"
                      name="defaultColors.background"
                      value={templateData.defaultColors?.background}
                      onChange={handleInputChange}
                      className="flex-1 px-3 py-2 border border-l-0 border-neutral-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4 border-t border-neutral-200">
              <Button
                type="submit"
                variant="primary"
                isLoading={loading}
                disabled={loading || (isPdfTemplate && !pdfFile)}
              >
                Create Template
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};

export default function CreateCertificateTemplateAdminPage() {
  return (
    <ProtectedRoute adminOnly>
      <CreateCertificateTemplatePage />
    </ProtectedRoute>
  );
}
