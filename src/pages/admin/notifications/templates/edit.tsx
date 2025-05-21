import React, {useState } from 'react';
import {useRouter } from 'next/router';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import dynamic from 'next/dynamic';

// Dynamically import the EmailTemplateEditor with SSR disabled
const EmailTemplateEditorWithProvider = dynamic(
  () => import('../../../../components/admin/notifications/EmailTemplateEditorWithProvider'),
  {ssr: false }
);

const EditEmailTemplatePage: React.FC = () => {
  const router = useRouter();
  const {id } = router.query;
  const templateId = typeof id === 'string' ? id : undefined;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  return (
    <AdminLayout>
      <div className="container-custom mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">
          {templateId ? 'Edit Email Template' : 'Create New Email Template'}
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-md mb-4">
            Template saved successfully! Redirecting...
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-lg shadow-sm p-8 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <EmailTemplateEditorWithProvider
            templateId={templateId}
          />
        )}
      </div>
    </AdminLayout>
  );
};

export default EditEmailTemplatePage;
