import React, {useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import EnrollmentAgreementTemplate from '@/components/admin/enrollments/EnrollmentAgreementTemplate';
import EnrollmentAgreementPreview from '@/components/admin/enrollments/EnrollmentAgreementPreview';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import {NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import {ArrowLeft, Plus, FileText } from 'lucide-react';
import Button from '@/components/ui/Button';
import {toast } from 'sonner';

// This would be replaced with actual Firebase functionality in a future step
const mockTemplates = [
  {
    id: 'template1',
    name: 'Standard Enrollment Agreement',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    content: `
      <h1>Course Enrollment Agreement</h1>
      <p>This Enrollment Agreement ("Agreement") is entered into on {{enrollmentDate}} between {{companyName}} ("Provider") and {{studentName}} ("Student").</p>
      
      <h2>1. Course Details</h2>
      <p>The Student agrees to enroll in {{courseName}} ("Course") provided by the Provider.</p>
      
      <h2>2. Student Responsibilities</h2>
      <p>The Student agrees to:</p>
      <ul>
        <li>Complete all required coursework</li>
        <li>Participate in course activities</li>
        <li>Adhere to the code of conduct</li>
        <li>Complete the course within the specified timeframe</li>
      </ul>
      
      <h2>3. Provider Responsibilities</h2>
      <p>The Provider agrees to:</p>
      <ul>
        <li>Provide access to all course materials</li>
        <li>Offer support throughout the duration of the course</li>
        <li>Issue a certificate upon successful completion</li>
      </ul>
      
      <h2>4. Term and Termination</h2>
      <p>This Agreement shall remain in effect until the Student completes the Course or the Agreement is terminated in accordance with its terms.</p>
      
      <h2>5. Signatures</h2>
      <p>By enrolling in this course, the Student acknowledges that they have read, understood, and agreed to the terms of this Agreement.</p>
      
      <p>Student: {{studentName}}</p>
      <p>Date: {{currentDate}}</p>
      
      <p>Provider: {{companyName}}</p>
      <p>Date: {{currentDate}}</p>
    `
}
];

const EnrollmentAgreementsPage: NextPage = () => {
  const [templates, setTemplates] = useState(mockTemplates);
  const [selectedTemplate, setSelectedTemplate] = useState<typeof mockTemplates[0] | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading templates
    const timer = setTimeout(() => {
      setLoading(false);
  }, 1000);
    
    return () => clearTimeout(timer);
}, []);

  const handleCreateTemplate = () => {
    setSelectedTemplate({
      id: `template${Date.now()}`,
      name: 'New Agreement Template',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      content: '<h1>New Enrollment Agreement</h1><p>Enter your agreement content here...</p>'
  });
};

  const handleSelectTemplate = (template: typeof mockTemplates[0]) => {
    setSelectedTemplate(template);
};

  const handleSaveTemplate = async (content: string) => {
    // This would be replaced with actual Firebase functionality
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        if (selectedTemplate) {
          const updatedTemplate = {
            ...selectedTemplate,
            content,
            updatedAt: new Date().toISOString()
        };
          
          setTemplates(prev => 
            prev.map(t => t.id === updatedTemplate.id ? updatedTemplate : t)
          );
          
          setSelectedTemplate(updatedTemplate);
      } else {
          const newTemplate = {
            id: `template${Date.now()}`,
            name: 'New Agreement Template',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            content
        };
          
          setTemplates(prev => [...prev, newTemplate]);
          setSelectedTemplate(newTemplate);
      }
        
        resolve();
    }, 1000);
  });
};

  const handleDeleteTemplate = async () => {
    // This would be replaced with actual Firebase functionality
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        if (selectedTemplate) {
          setTemplates(prev => prev.filter(t => t.id !== selectedTemplate.id));
          setSelectedTemplate(null);
      }
        
        resolve();
    }, 1000);
  });
};

  const handlePreview = (content: string) => {
    setPreviewContent(content);
    setShowPreview(true);
};

  return (
    <AdminLayout>
      <Head>
        <title>Enrollment Agreements | Admin</title>
      </Head>
      
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex items-center mb-4">
            <Link
              href="/admin/enrollments"
              className="inline-flex items-center text-sm text-primary-600 hover:text-primary-900 mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Enrollments
            </Link>
            <h1 className="text-2xl font-semibold text-neutral-900">Enrollment Agreements</h1>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Templates Sidebar */}
              <div className="md:col-span-1">
                <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                  <div className="px-6 py-4 border-b border-neutral-200 flex justify-between items-center">
                    <h3 className="text-lg font-medium text-neutral-900">Templates</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCreateTemplate}
                    >
                      <Plus className="h-4 w-4 mr-1.5" />
                      New
                    </Button>
                  </div>
                  <div className="p-6">
                    {loading ? (
                      <div className="flex justify-center items-center h-40">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                      </div>
                    ) : templates.length === 0 ? (
                      <div className="text-center py-8 text-neutral-500">
                        <FileText className="h-12 w-12 mx-auto text-neutral-300 mb-2" />
                        <p>No templates found</p>
                        <p className="text-sm mt-1">Create your first template to get started</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {templates.map(template => (
                          <div
                            key={template.id}
                            className={`p-3 rounded-md cursor-pointer ${
                              selectedTemplate?.id === template.id
                                ? 'bg-primary-50 border border-primary-200'
                                : 'hover:bg-neutral-50 border border-transparent'
                          }`}
                            onClick={() => handleSelectTemplate(template)}
                          >
                            <div className="flex items-start">
                              <FileText className="h-5 w-5 text-neutral-400 mt-0.5 mr-2" />
                              <div>
                                <div className="text-sm font-medium text-neutral-900">
                                  {template.name}
                                </div>
                                <div className="text-xs text-neutral-500">
                                  Updated: {new Date(template.updatedAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Template Editor */}
              <div className="md:col-span-3">
                {selectedTemplate ? (
                  <EnrollmentAgreementTemplate
                    initialContent={selectedTemplate.content}
                    onSave={handleSaveTemplate}
                    onPreview={handlePreview}
                    onDelete={handleDeleteTemplate}
                  />
                ) : (
                  <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                    <div className="p-6 text-center">
                      <FileText className="h-12 w-12 mx-auto text-neutral-300 mb-2" />
                      <h3 className="text-lg font-medium text-neutral-900 mb-1">No Template Selected</h3>
                      <p className="text-neutral-500 mb-4">
                        Select a template from the sidebar or create a new one to get started.
                      </p>
                      <Button
                        variant="primary"
                        onClick={handleCreateTemplate}
                      >
                        <Plus className="h-4 w-4 mr-1.5" />
                        Create New Template
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Preview Modal */}
      {showPreview && (
        <EnrollmentAgreementPreview
          content={previewContent}
          onClose={() => setShowPreview(false)}
          sampleData={{
            studentName: 'John Doe',
            courseName: 'Advanced Sales Techniques',
            enrollmentDate: new Date().toLocaleDateString(),
            companyName: 'Acme Corporation',
            teamName: 'Sales Team'
        }}
        />
      )}
    </AdminLayout>
  );
};

// Wrap the component with ProtectedRoute to ensure only admins can access it
export default function EnrollmentAgreementsPageWrapper() {
  return (
    <ProtectedRoute adminOnly>
      <EnrollmentAgreementsPage />
    </ProtectedRoute>
  );
}
