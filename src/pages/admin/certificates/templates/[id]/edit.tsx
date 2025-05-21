import React, {useState, useEffect } from 'react';
import {useRouter } from 'next/router';
import {doc, getDoc, updateDoc } from 'firebase/firestore';
import {ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {firestore, storage } from '@/services/firebase';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Button from '@/components/ui/Button';
import {CertificateTemplate } from '@/types/certificate.types';
import Link from 'next/link';
import CertificateFieldPlacer from '@/components/certificates/CertificateFieldPlacer';

const EditCertificateTemplatePage: React.FC = () => {
  const router = useRouter();
  const {id } = router.query;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
    placeholders: [],
    htmlTemplate: '',
    cssStyles: ''
});
  const [fields, setFields] = useState<any[]>([]);

  // Fetch template data
  useEffect(() => {
    const fetchTemplate = async () => {
      if (!id || typeof id !== 'string') return;

      try {
        setLoading(true);
        setError(null);

        const templateDoc = await getDoc(doc(firestore, 'certificateTemplates', id));

        if (!templateDoc.exists()) {
          setError('Template not found');
          return;
      }

        const data = templateDoc.data() as CertificateTemplate;
        setTemplateData({
          id: templateDoc.id,
          name: data.name,
          description: data.description || '',
          previewUrl: data.previewUrl,
          htmlTemplate: data.htmlTemplate,
          cssStyles: data.cssStyles || '',
          placeholders: data.placeholders || [],
          orientation: data.orientation || 'landscape',
          dimensions: data.dimensions || {
            width: 297,
            height: 210,
            unit: 'mm'
        },
          defaultFonts: data.defaultFonts || ['Helvetica', 'Arial', 'sans-serif'],
          defaultColors: data.defaultColors || {
            primary: '#0e0e4f',
            secondary: '#8a0200',
            text: '#3c3c3c',
            background: '#f0f0ff'
        },
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
      });

        // Set preview URL if available
        setPreviewUrl(data.previewUrl || '');

        // Load fields if they exist
        if (data.fields) {
          setFields(data.fields);
      } else {
          // Create default fields if none exist
          setFields([
            {
              id: 'title',
              type: 'text',
              x: 50,
              y: 20,
              width: 80,
              height: 10,
              fontFamily: 'Helvetica',
              fontSize: 24,
              fontWeight: 'bold',
              fontColor: '#0e0e4f',
              alignment: 'center',
              content: 'Certificate of Completion'
          },
            {
              id: 'studentName',
              type: 'placeholder',
              x: 50,
              y: 40,
              width: 80,
              height: 10,
              fontFamily: 'Helvetica',
              fontSize: 28,
              fontWeight: 'bold',
              fontColor: '#8a0200',
              alignment: 'center',
              content: '{{studentName}}'
          },
            {
              id: 'courseName',
              type: 'placeholder',
              x: 50,
              y: 55,
              width: 80,
              height: 10,
              fontFamily: 'Helvetica',
              fontSize: 20,
              fontWeight: 'normal',
              fontColor: '#0e0e4f',
              alignment: 'center',
              content: '{{courseName}}'
          },
            {
              id: 'completionDate',
              type: 'placeholder',
              x: 50,
              y: 70,
              width: 80,
              height: 5,
              fontFamily: 'Helvetica',
              fontSize: 14,
              fontWeight: 'normal',
              fontColor: '#3c3c3c',
              alignment: 'center',
              content: '{{completionDate}}'
          },
            {
              id: 'certificateId',
              type: 'placeholder',
              x: 50,
              y: 75,
              width: 80,
              height: 5,
              fontFamily: 'Helvetica',
              fontSize: 10,
              fontWeight: 'normal',
              fontColor: '#3c3c3c',
              alignment: 'center',
              content: '{{certificateId}}'
          },
            {
              id: 'signature',
              type: 'image',
              x: 50,
              y: 85,
              width: 20,
              height: 10,
              fontFamily: 'Helvetica',
              fontSize: 12,
              fontWeight: 'normal',
              fontColor: '#000000',
              alignment: 'center'
          }
          ]);
      }
    } catch (err: any) {
        console.error('Error fetching template:', err);
        setError(err.message || 'Failed to load template. Please try again.');
    } finally {
        setLoading(false);
    }
  };

    fetchTemplate();
}, [id]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const {name, value } = e.target;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setTemplateData(prev => {
        const parentObj = prev[parent as keyof typeof prev] as Record<string, any> || {};
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

  // Handle field updates from the field placer component
  const handleFieldsUpdate = (updatedFields: any[]) => {
    setFields(updatedFields);
};

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || typeof id !== 'string') return;

    setSaving(true);
    setError(null);

    try {


      // Upload preview image if provided
      let previewImageUrl = templateData.previewUrl || '';
      if (previewImage) {
        const imageRef = ref(storage, `certificate-templates/previews/${Date.now()}_${previewImage.name}`);
        await uploadBytes(imageRef, previewImage);
        previewImageUrl = await getDownloadURL(imageRef);
    }

      // Update template document in Firestore
      await updateDoc(doc(firestore, 'certificateTemplates', id), {
        ...templateData,

        previewUrl: previewImageUrl,
        fields,
        updatedAt: new Date().toISOString(),
    });

      setSuccess(true);

      // Clear success message after a short delay
      setTimeout(() => {
        setSuccess(false);
    }, 3000);
  } catch (err: any) {
      console.error('Error updating certificate template:', err);
      setError(err.message || 'Failed to update certificate template. Please try again.');
  } finally {
      setSaving(false);
  }
};

  return (
    <AdminLayout title="Edit Certificate Template">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-neutral-500 mt-1">
              Customize your certificate template design
            </p>
          </div>
          <div className="flex space-x-3 mt-4 sm:mt-0">
            <Link href={`/admin/certificates/templates/${id}`}>
              <Button variant="outline">
                Preview
              </Button>
            </Link>
            <Link href="/admin/certificates/templates">
              <Button variant="outline">
                Back to Templates
              </Button>
            </Link>
          </div>
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
            Certificate template updated successfully!
          </div>
        )}

        {loading ? (
          <div className="bg-white shadow-sm rounded-lg p-8 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="p-6 border-b border-neutral-200">
                <h2 className="text-lg font-medium text-neutral-900 mb-4">Basic Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
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

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-neutral-700 mb-1">
                        <span className="font-medium">Note:</span> For PDF-based certificate templates, please use the <Link href="/admin/certificates/templates/manage" className="text-primary-600 hover:text-primary-800">Manage PDF Templates</Link> page.
                      </p>
                    </div>

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
              </div>

              <div className="p-6 border-b border-neutral-200">
                <h2 className="text-lg font-medium text-neutral-900 mb-4">Colors and Fonts</h2>
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

              <div className="p-6 border-b border-neutral-200">
                <h2 className="text-lg font-medium text-neutral-900 mb-4">Field Placement</h2>
                <p className="text-sm text-neutral-500 mb-4">
                  Drag and drop fields to position them on the certificate. Resize fields by dragging the corners.
                </p>

                <CertificateFieldPlacer
                  fields={fields}
                  onFieldsUpdate={handleFieldsUpdate}
                  orientation={templateData.orientation || 'landscape'}
                  dimensions={templateData.dimensions || {width: 297, height: 210, unit: 'mm'}}
                  colors={templateData.defaultColors || {
                    primary: '#0e0e4f',
                    secondary: '#8a0200',
                    text: '#3c3c3c',
                    background: '#f0f0ff'
                }}
                />
              </div>

              <div className="p-6 border-b border-neutral-200">
                <h2 className="text-lg font-medium text-neutral-900 mb-4">HTML Template Editor</h2>
                <p className="text-sm text-neutral-500 mb-4">
                  Edit your HTML template and CSS styles. The preview will update as you type.
                </p>

                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Left side: Code editor */}
                  <div className="lg:w-1/2 space-y-4">
                    <div className="bg-neutral-50 rounded-md p-4">
                      <div className="flex justify-between items-center mb-2">
                        <label htmlFor="htmlTemplate" className="block text-sm font-medium text-neutral-700">
                          HTML Template
                        </label>
                        <div className="text-xs text-neutral-500">
                          Use <code className="bg-neutral-200 px-1 rounded">&#123;&#123;placeholderName&#125;&#125;</code> for dynamic content
                        </div>
                      </div>
                      <div className="relative">
                        <textarea
                          id="htmlTemplate"
                          name="htmlTemplate"
                          value={templateData.htmlTemplate}
                          onChange={handleInputChange}
                          rows={15}
                          className="w-full px-3 py-2 border border-neutral-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                        />
                      </div>

                      {/* Placeholder Helper */}
                      <div className="mt-3 border-t border-neutral-200 pt-3">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-xs font-medium text-neutral-700">Available Placeholders</h4>
                          <div className="flex space-x-2">
                            <button
                              type="button"
                              className="text-xs text-primary-600 hover:text-primary-800"
                              onClick={() => {
                                // Insert basic HTML template
                                const textarea = document.getElementById('htmlTemplate') as HTMLTextAreaElement;
                                if (textarea) {
                                  const htmlTemplate = `<div class="certificate">
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
</div>`;

                                  setTemplateData(prev => ({
                                    ...prev,
                                    htmlTemplate: htmlTemplate
                                }));

                                  // Set cursor position at the beginning
                                  setTimeout(() => {
                                    textarea.focus();
                                    textarea.setSelectionRange(0, 0);
                                }, 0);
                              }
                            }}
                            >
                              Insert Template
                            </button>
                            <button
                              type="button"
                              className="text-xs text-primary-600 hover:text-primary-800"
                              onClick={() => {
                                // Insert placeholder at cursor position
                                const textarea = document.getElementById('htmlTemplate') as HTMLTextAreaElement;
                                if (textarea) {
                                  const start = textarea.selectionStart;
                                  const end = textarea.selectionEnd;
                                  const selectedPlaceholder = '{{studentName}}';
                                  const newValue = textarea.value.substring(0, start) +
                                    selectedPlaceholder +
                                    textarea.value.substring(end);

                                  setTemplateData(prev => ({
                                    ...prev,
                                    htmlTemplate: newValue
                                }));

                                  // Set cursor position after the inserted placeholder
                                  setTimeout(() => {
                                    textarea.focus();
                                    textarea.setSelectionRange(start + selectedPlaceholder.length, start + selectedPlaceholder.length);
                                }, 0);
                              }
                            }}
                            >
                              Insert at Cursor
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {[
                            {name: 'studentName', description: 'Student\'s full name'},
                            {name: 'courseName', description: 'Name of the completed course'},
                            {name: 'completionDate', description: 'Date of completion'},
                            {name: 'certificateId', description: 'Unique certificate ID'},
                            {name: 'issuerName', description: 'Name of certificate issuer'},
                            {name: 'issuerTitle', description: 'Title of certificate issuer'}
                          ].map(placeholder => (
                            <div
                              key={placeholder.name}
                              className="flex items-center justify-between p-2 border border-neutral-200 rounded bg-white hover:bg-neutral-50 cursor-pointer"
                              onClick={() => {
                                // Insert this placeholder at cursor position
                                const textarea = document.getElementById('htmlTemplate') as HTMLTextAreaElement;
                                if (textarea) {
                                  const start = textarea.selectionStart;
                                  const end = textarea.selectionEnd;
                                  const selectedPlaceholder = `{{${placeholder.name}}}`;
                                  const newValue = textarea.value.substring(0, start) +
                                    selectedPlaceholder +
                                    textarea.value.substring(end);

                                  setTemplateData(prev => ({
                                    ...prev,
                                    htmlTemplate: newValue
                                }));

                                  // Set cursor position after the inserted placeholder
                                  setTimeout(() => {
                                    textarea.focus();
                                    textarea.setSelectionRange(start + selectedPlaceholder.length, start + selectedPlaceholder.length);
                                }, 0);
                              }
                            }}
                            >
                              <div>
                                <code className="text-xs bg-neutral-100 px-1 rounded">&#123;&#123;{placeholder.name}&#125;&#125;</code>
                                <span className="text-xs text-neutral-500 ml-2">{placeholder.description}</span>
                              </div>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="bg-neutral-50 rounded-md p-4">
                      <div className="flex justify-between items-center mb-2">
                        <label htmlFor="cssStyles" className="block text-sm font-medium text-neutral-700">
                          CSS Styles
                        </label>
                        <div className="text-xs text-neutral-500">
                          Define styles for your certificate elements
                        </div>
                      </div>
                      <div className="relative">
                        <textarea
                          id="cssStyles"
                          name="cssStyles"
                          value={templateData.cssStyles}
                          onChange={handleInputChange}
                          rows={15}
                          className="w-full px-3 py-2 border border-neutral-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                        />
                      </div>

                      {/* CSS Helper */}
                      <div className="mt-3 border-t border-neutral-200 pt-3">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-xs font-medium text-neutral-700">Common CSS Snippets</h4>
                          <button
                            type="button"
                            className="text-xs text-primary-600 hover:text-primary-800"
                            onClick={() => {
                              // Insert CSS template at cursor position
                              const textarea = document.getElementById('cssStyles') as HTMLTextAreaElement;
                              if (textarea) {
                                const start = textarea.selectionStart;
                                const end = textarea.selectionEnd;
                                const cssTemplate = `.certificate {
  font-family: Helvetica, Arial, sans-serif;
  color: ${templateData.defaultColors?.text || '#3c3c3c'};
  text-align: center;
  padding: 20mm;
  background-color: ${templateData.defaultColors?.background || '#f0f0ff'};
  border: 5mm solid ${templateData.defaultColors?.primary || '#0e0e4f'};
  position: relative;
}`;
                                const newValue = textarea.value.substring(0, start) +
                                  cssTemplate +
                                  textarea.value.substring(end);

                                setTemplateData(prev => ({
                                  ...prev,
                                  cssStyles: newValue
                              }));

                                // Set cursor position after the inserted template
                                setTimeout(() => {
                                  textarea.focus();
                                  textarea.setSelectionRange(start + cssTemplate.length, start + cssTemplate.length);
                              }, 0);
                            }
                          }}
                          >
                            Insert Basic Template
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {[
                            {
                              name: 'Certificate Title',
                              selector: '.certificate-title',
                              styles: `font-size: 32px;
font-weight: bold;
color: ${templateData.defaultColors?.primary || '#0e0e4f'};
margin-bottom: 20px;`
                          },
                            {
                              name: 'Student Name',
                              selector: '.student-name',
                              styles: `font-size: 28px;
font-weight: bold;
color: ${templateData.defaultColors?.secondary || '#8a0200'};
margin: 15px 0;`
                          },
                            {
                              name: 'Course Name',
                              selector: '.course-name',
                              styles: `font-size: 24px;
font-weight: normal;
color: ${templateData.defaultColors?.primary || '#0e0e4f'};
margin: 15px 0;`
                          },
                            {
                              name: 'Signature Area',
                              selector: '.signature',
                              styles: `margin-top: 40px;
text-align: center;`
                          },
                            {
                              name: 'Certificate Border',
                              selector: '.certificate::after',
                              styles: `content: '';
position: absolute;
top: 5mm;
right: 5mm;
bottom: 5mm;
left: 5mm;
border: 1mm solid ${templateData.defaultColors?.secondary || '#8a0200'};
pointer-events: none;`
                          },
                            {
                              name: 'Certificate ID',
                              selector: '.certificate-id',
                              styles: `font-size: 12px;
color: #666;
margin-top: 30px;`
                          }
                          ].map(snippet => (
                            <div
                              key={snippet.name}
                              className="flex items-center justify-between p-2 border border-neutral-200 rounded bg-white hover:bg-neutral-50 cursor-pointer"
                              onClick={() => {
                                // Insert this CSS snippet at cursor position
                                const textarea = document.getElementById('cssStyles') as HTMLTextAreaElement;
                                if (textarea) {
                                  const start = textarea.selectionStart;
                                  const end = textarea.selectionEnd;
                                  const cssSnippet = `${snippet.selector} {
  ${snippet.styles}
}`;
                                  const newValue = textarea.value.substring(0, start) +
                                    cssSnippet +
                                    textarea.value.substring(end);

                                  setTemplateData(prev => ({
                                    ...prev,
                                    cssStyles: newValue
                                }));

                                  // Set cursor position after the inserted snippet
                                  setTimeout(() => {
                                    textarea.focus();
                                    textarea.setSelectionRange(start + cssSnippet.length, start + cssSnippet.length);
                                }, 0);
                              }
                            }}
                            >
                              <div>
                                <code className="text-xs bg-neutral-100 px-1 rounded">{snippet.selector}</code>
                                <span className="text-xs text-neutral-500 ml-2">{snippet.name}</span>
                              </div>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right side: Preview */}
                  <div className="lg:w-1/2">
                    <div className="bg-neutral-50 rounded-md p-4 h-full">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-medium text-neutral-700">Live Preview</h3>
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            className="text-xs bg-neutral-200 hover:bg-neutral-300 text-neutral-700 px-2 py-1 rounded flex items-center"
                            onClick={() => {
                              // Toggle preview mode between raw template and sample data
                              const previewDiv = document.querySelector('.certificate-preview') as HTMLDivElement;
                              if (previewDiv) {
                                const sampleData = {
                                  studentName: 'John Doe',
                                  courseName: 'LIPS Sales System',
                                  completionDate: new Date().toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                }),
                                  certificateId: 'CERT-12345-6789',
                                  issuerName: 'Jane Smith',
                                  issuerTitle: 'CEO, Closer College'
                              };

                                let html = templateData.htmlTemplate || '';

                                // Replace placeholders with sample data
                                Object.entries(sampleData).forEach(([key, value]) => {
                                  const placeholder = `{{${key}}}`;
                                  html = html.replace(new RegExp(placeholder, 'g'), value);
                              });

                                previewDiv.innerHTML = `<style>${templateData.cssStyles}</style>${html}`;
                            }
                          }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Preview with Sample Data
                          </button>
                          <button
                            type="button"
                            className="text-xs bg-neutral-200 hover:bg-neutral-300 text-neutral-700 px-2 py-1 rounded flex items-center"
                            onClick={() => window.open(`/admin/certificates/templates/${id}`, '_blank')}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            Open Full Preview
                          </button>
                        </div>
                      </div>

                      <div className="border border-neutral-300 rounded-md bg-white overflow-hidden h-[600px]">
                        <div className="w-full h-full overflow-auto p-4">
                          <div
                            className="certificate-preview"
                            dangerouslySetInnerHTML={{
                              __html: `<style>${templateData.cssStyles}</style>${templateData.htmlTemplate}`
                          }}
                          />
                        </div>
                      </div>

                      <div className="mt-4 text-xs text-neutral-500 flex justify-between items-center">
                        <p><strong>Note:</strong> Preview shows the template with placeholders. Use the "Preview with Sample Data" button to see how it will look with real data.</p>
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            className="text-xs text-primary-600 hover:text-primary-800 flex items-center"
                            onClick={() => {
                              // Reset preview to show raw template
                              const previewDiv = document.querySelector('.certificate-preview') as HTMLDivElement;
                              if (previewDiv) {
                                previewDiv.innerHTML = `<style>${templateData.cssStyles}</style>${templateData.htmlTemplate}`;
                            }
                          }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Reset Preview
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>


              <div className="p-6 flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={saving}
                  disabled={saving}
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default function EditCertificateTemplateAdminPage() {
  return (
    <ProtectedRoute adminOnly>
      <EditCertificateTemplatePage />
    </ProtectedRoute>
  );
}
