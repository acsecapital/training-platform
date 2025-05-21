import React from 'react';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import dynamic from 'next/dynamic';

// Dynamically import the EmailTemplateEditor with SSR disabled
const EmailTemplateEditorWithProvider = dynamic(
  () => import('../../../../components/admin/notifications/EmailTemplateEditorWithProvider'),
  {ssr: false }
);

const CreateEmailTemplatePage: React.FC = () => {
  return (
    <AdminLayout title="Create Email Template">
      <div className="container-custom mx-auto px-4 py-8">
        <div className="mb-6">
          <p className="text-neutral-500 text-xl font-semibold">Create a new email notification template</p>
        </div>

        <EmailTemplateEditorWithProvider />
      </div>
    </AdminLayout>
  );
};

export default CreateEmailTemplatePage;

