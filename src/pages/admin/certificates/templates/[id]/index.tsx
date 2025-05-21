import React from 'react';
import {GetServerSideProps } from 'next';
import {doc, getDoc } from 'firebase/firestore';
import {firestore } from '@/services/firebase';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import {CertificateTemplate } from '@/types/certificate.types';
import dynamic from 'next/dynamic';
import ClientSideCourseWrapper from '@/components/courses/ClientSideCourseWrapper';

// Use dynamic import with SSR disabled for the component that uses context
const CertificateTemplatePreviewContent = dynamic<{
  id: string;
  templateData?: CertificateTemplate | null;
  templateError?: string | null;
}>(
  () => import('../../../../../components/certificates/CertificateTemplatePreviewContent'),
  {ssr: false }
);

interface CertificateTemplatePreviewPageProps {
  id: string;
  templateData?: CertificateTemplate | null;
  templateError?: string | null;
}

function CertificateTemplatePreviewPage({id, templateData, templateError }: CertificateTemplatePreviewPageProps) {
  return (
    <AdminLayout title="Certificate Template Preview">
      <ClientSideCourseWrapper>
        <CertificateTemplatePreviewContent
          id={id}
          templateData={templateData}
          templateError={templateError}
        />
      </ClientSideCourseWrapper>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps<CertificateTemplatePreviewPageProps> = async (context) => {
  const {id } = context.params || {};

  if (!id || typeof id !== 'string') {
    return {
      notFound: true,
  };
}

  // Pre-fetch template data to improve initial load experience
  try {
    const templateDoc = await getDoc(doc(firestore, 'certificateTemplates', id));

    if (!templateDoc.exists()) {
      return {
        props: {
          id,
          templateData: null,
          templateError: 'Template not found'
      }
    };
  }

    const data = templateDoc.data();
    const templateData = {
      ...data,
      id: templateDoc.id,
  } as CertificateTemplate;

    return {
      props: {
        id,
        templateData: JSON.parse(JSON.stringify(templateData)), // Serialize for SSR
        templateError: null
    }
  };
} catch (error) {
    console.error('Error fetching template:', error);
    return {
      props: {
        id,
        templateData: null,
        templateError: 'Failed to load template. Please try again.'
    }
  };
}
};

export default function Page(props: CertificateTemplatePreviewPageProps) {
  return (
    <ProtectedRoute adminOnly>
      <CertificateTemplatePreviewPage {...props} />
    </ProtectedRoute>
  );
}



