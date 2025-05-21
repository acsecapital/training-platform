import React, {useState, useEffect } from 'react';
import {useRouter } from 'next/router';
import {ref, getDownloadURL } from 'firebase/storage';
import {getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, getDoc } from 'firebase/firestore';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Button from '@/components/ui/Button';
import PdfTemplateFieldPlacer from '@/components/certificates/PdfTemplateFieldPlacer';
import {toast } from 'react-hot-toast';
import {storage, firestore } from '@/services/firebase';
import {uploadPdfViaProxy } from '@/utils/pdfUploader';

// Import the TemplateField type from our types file
import {TemplateField } from '@/types/certificate.types';

// Template interface for this page
interface Template {
  id: string;
  name: string;
  description: string;
  pdfUrl: string;
  storagePath: string;
  fields: TemplateField[];
  createdAt: Date;
  updatedAt: Date;
  isDefault: boolean;
  isPdfTemplate?: boolean;
}

const ManageCertificateTemplates: React.FC = () => {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingTemplate, setUploadingTemplate] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isEditingFields, setIsEditingFields] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [pdfLoadError, setPdfLoadError] = useState<string | null>(null);

  // Check if we have a template ID in the query params
  useEffect(() => {
    if (router.query.templateId) {
      const templateId = router.query.templateId as string;
      fetchTemplateById(templateId);
  }
}, [router.query]);

  // Fetch a specific template by ID
  const fetchTemplateById = async (templateId: string) => {
    try {
      setLoading(true);
      const templateDoc = await getDoc(doc(firestore, 'certificateTemplates', templateId));

      if (templateDoc.exists()) {
        const data = templateDoc.data();
        console.log('Raw template data from Firestore:', data);
        console.log('Fields from Firestore:', data.fields);

        const template: Template = {
          id: templateDoc.id,
          name: data.name,
          description: data.description || '',
          pdfUrl: data.pdfUrl,
          storagePath: data.storagePath,
          fields: data.fields || [],
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          isDefault: data.isDefault || false,
          isPdfTemplate: data.isPdfTemplate || true,
      };

        console.log('Loaded template with fields:', template.fields);
        setSelectedTemplate(template);
        setIsEditingFields(true);
    } else {
        toast.error('Template not found');
    }
  } catch (error) {
      console.error('Error fetching template:', error);
      toast.error('Failed to load template');
  } finally {
      setLoading(false);
  }
};

  // Fetch templates on component mount
  useEffect(() => {
    if (!router.query.templateId) {
      fetchTemplates();
  }
}, []);

  // Fetch all certificate templates
  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const templatesCollection = collection(firestore, 'certificateTemplates');
      const templatesSnapshot = await getDocs(templatesCollection);

      const fetchedTemplates: Template[] = [];

      for (const doc of templatesSnapshot.docs) {
        const data = doc.data();
        if (data.isPdfTemplate) {
          fetchedTemplates.push({
            id: doc.id,
            name: data.name,
            description: data.description || '',
            pdfUrl: data.pdfUrl || '',
            storagePath: data.storagePath || '',
            fields: data.fields || [],
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            isDefault: data.isDefault || false,
        });
      }
    }

      setTemplates(fetchedTemplates);
  } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load certificate templates');
  } finally {
      setLoading(false);
  }
};

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        toast.error('Please select a PDF file');
        return;
    }
      setTemplateFile(file);
  }
};

  // Upload template PDF and save to Firestore
  const handleUploadTemplate = async () => {
    if (!templateFile || !newTemplateName) {
      toast.error('Please provide a template name and select a PDF file');
      return;
  }

    try {
      setUploadingTemplate(true);

      // Show uploading toast
      toast.loading('Uploading PDF template...', {id: 'upload-toast'});

      // Upload PDF using our proxy API
      const {url: downloadUrl, path: storagePath } = await uploadPdfViaProxy(templateFile);

      // Dismiss the loading toast
      toast.dismiss('upload-toast');

      // Save template metadata to Firestore
      const templateData = {
        name: newTemplateName,
        description: newTemplateDescription,
        pdfUrl: downloadUrl,
        storagePath: storagePath,
        fields: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isDefault: templates.length === 0, // Make default if it's the first template
        isPdfTemplate: true,
    };

      const docRef = await addDoc(collection(firestore, 'certificateTemplates'), templateData);

      // Add to local state
      setTemplates([
        ...templates,
        {
          ...templateData,
          id: docRef.id,
      } as Template,
      ]);

      // Reset form
      setNewTemplateName('');
      setNewTemplateDescription('');
      setTemplateFile(null);

      toast.success('Certificate template uploaded successfully', {id: 'upload-toast'});

      // Redirect to edit fields
      router.push(`/admin/certificates/templates/manage?templateId=${docRef.id}`);
  } catch (error: any) {
      console.error('Error uploading template:', error);
      toast.error(`Failed to upload certificate template: ${error.message || 'Unknown error'}`, {id: 'upload-toast'});
  } finally {
      setUploadingTemplate(false);
  }
};

  // Set a template as default
  const setDefaultTemplate = async (templateId: string) => {
    try {
      // Update all templates to not be default
      const templatesCollection = collection(firestore, 'certificateTemplates');
      const templatesSnapshot = await getDocs(templatesCollection);

      for (const doc of templatesSnapshot.docs) {
        await updateDoc(doc.ref, {isDefault: doc.id === templateId });
    }

      // Update local state
      setTemplates(templates.map(template => ({
        ...template,
        isDefault: template.id === templateId,
    })));

      toast.success('Default template updated');
  } catch (error) {
      console.error('Error setting default template:', error);
      toast.error('Failed to update default template');
  }
};

  // Delete a template
  const deleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
  }

    try {
      const template = templates.find(t => t.id === templateId);
      if (!template) return;

      // Delete from Firestore
      await deleteDoc(doc(firestore, 'certificateTemplates', templateId));

      // Delete from Storage
      if (template.storagePath) {
        const storageRef = ref(storage, template.storagePath);
        // Note: We're not awaiting this as it's not critical for the UI flow
        // and Firebase Storage delete operations can sometimes be slow
        // deleteObject(storageRef).catch(console.error);
    }

      // Update local state
      setTemplates(templates.filter(t => t.id !== templateId));

      // If we deleted the default template, set a new one if available
      if (template.isDefault && templates.length > 1) {
        const newDefaultTemplate = templates.find(t => t.id !== templateId);
        if (newDefaultTemplate) {
          await setDefaultTemplate(newDefaultTemplate.id);
      }
    }

      toast.success('Template deleted successfully');
  } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
  }
};

  // This function is now replaced by fetchTemplateById

  // Save template fields
  const saveTemplateFields = async (fields: TemplateField[]) => {
    if (!selectedTemplate) return;

    try {
      // Update in Firestore
      await updateDoc(doc(firestore, 'certificateTemplates', selectedTemplate.id), {
        fields,
        updatedAt: new Date(),
    });

      // Update local state
      setTemplates(templates.map(template =>
        template.id === selectedTemplate.id
          ? {...template, fields, updatedAt: new Date() }
          : template
      ));

      setIsEditingFields(false);
      setSelectedTemplate(null);

      toast.success('Template fields saved successfully');

      // Redirect back to the templates list
      router.push('/admin/certificates/templates/manage');
  } catch (error) {
      console.error('Error saving template fields:', error);
      toast.error('Failed to save template fields');
  }
};

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Manage Certificate Templates</h1>
            <Button
              variant="primary"
              onClick={() => router.push('/admin/certificates/templates')}
            >
              Back to Templates
            </Button>
          </div>

          {isEditingFields && selectedTemplate ? (
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">
                Edit Fields for Template: {selectedTemplate.name}
              </h2>
              <div className="h-[800px] flex flex-col">
                <PdfTemplateFieldPlacer
                  pdfUrl={selectedTemplate.pdfUrl}
                  initialFields={selectedTemplate.fields}
                  onSave={saveTemplateFields}
                  onCancel={() => {
                    setIsEditingFields(false);
                    setSelectedTemplate(null);
                    router.push('/admin/certificates/templates/manage');
                }}
                />
              </div>
            </div>
          ) : (
            <>
              {/* Upload new template */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4">Upload New Template</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Template Name *
                    </label>
                    <input
                      type="text"
                      value={newTemplateName}
                      onChange={(e) => setNewTemplateName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="e.g., LIPS Sales System Certificate"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      value={newTemplateDescription}
                      onChange={(e) => setNewTemplateDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="e.g., Official certificate for LIPS Sales System graduates"
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PDF Template *
                  </label>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Upload a PDF file that will serve as the certificate template. You'll be able to place fields on it in the next step.
                  </p>
                </div>
                <Button
                  variant="primary"
                  onClick={handleUploadTemplate}
                  disabled={uploadingTemplate || !templateFile || !newTemplateName}
                  className="w-full md:w-auto"
                >
                  {uploadingTemplate ? 'Uploading...' : 'Upload Template'}
                </Button>
              </div>

              {/* List of templates */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Your Templates</h2>

                {loading ? (
                  <p className="text-gray-500">Loading templates...</p>
                ) : templates.length === 0 ? (
                  <p className="text-gray-500">No templates found. Upload your first template above.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates.map((template) => (
                      <div
                        key={template.id}
                        className={`border rounded-lg overflow-hidden ${
                          template.isDefault ? 'border-blue-500' : 'border-gray-200'
                      }`}
                      >
                        <div className="h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
                          {template.pdfUrl ? (
                            <object
                              data={`/api/proxy/pdf?path=${encodeURIComponent(template.storagePath)}`}
                              type="application/pdf"
                              className="w-full h-full"
                              title={template.name}
                            >
                              <div className="text-center p-4">
                                <p className="text-sm text-gray-500">PDF Preview</p>
                              </div>
                            </object>
                          ) : (
                            <div className="text-center p-4">
                              <p className="text-sm text-gray-500">No preview available</p>
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium">{template.name}</h3>
                            {template.isDefault && (
                              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                            {template.description || 'No description'}
                          </p>
                          <p className="text-xs text-gray-400 mb-3">
                            Last updated: {template.updatedAt.toLocaleDateString()}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => fetchTemplateById(template.id)}
                            >
                              <span className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                                Edit Fields
                              </span>
                            </Button>
                            {!template.isDefault && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setDefaultTemplate(template.id)}
                              >
                                Set as Default
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => deleteTemplate(template.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
};

export default ManageCertificateTemplates;
