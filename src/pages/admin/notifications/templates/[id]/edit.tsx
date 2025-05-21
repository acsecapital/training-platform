import React from 'react';
import {useRouter } from 'next/router';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import dynamic from 'next/dynamic';

// Dynamically import the EmailTemplateEditor with SSR disabled
const EmailTemplateEditorWithProvider = dynamic(
  () => import('../../../../../components/admin/notifications/EmailTemplateEditorWithProvider'),
  {ssr: false }
);

const EditEmailTemplatePage: React.FC = () => {
  const router = useRouter();
  const {id } = router.query;

  // Wait for router to be ready before rendering editor
  if (!router.isReady) {
    return (
      <AdminLayout title="Loading...">
        <div className="container-custom mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        </div>
      </AdminLayout>
    );
}

  return (
    <AdminLayout title={id ? `Edit Template: ${id}` : 'Create Template'}>
      <div className="container-custom mx-auto px-4 py-2">
        <div className="mb-6">
          <p className="text-neutral-500 text-xl font-semibold">
            {id ? 'Modify an existing email notification template' : 'Create a new email notification template'}
          </p>
        </div>

        <EmailTemplateEditorWithProvider templateId={id as string} />
      </div>
    </AdminLayout>
  );
};

export default EditEmailTemplatePage;

