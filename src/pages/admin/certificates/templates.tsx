import React from 'react';
import {GetServerSideProps } from 'next';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import CertificateTemplateManager from '@/components/admin/certificates/CertificateTemplateManager';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import {withAdminAuth } from '@/utils/withAdminAuth';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const CertificateTemplatesPage: React.FC = () => {
  return (
    <AdminLayout title="Certificate Templates">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-1">Certificate Templates</h1>
            <p className="text-neutral-600">
              Create and manage certificate templates for your courses.
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Link href="/admin/certificates" passHref>
              <Button variant="outline">
                Back to Certificates
              </Button>
            </Link>
          </div>
        </div>

        <CertificateTemplateManager />
      </div>
    </AdminLayout>
  );
};

export default function AdminCertificateTemplatesPage() {
  return (
    <ProtectedRoute adminOnly>
      <CertificateTemplatesPage />
    </ProtectedRoute>
  );
}

export const getServerSideProps: GetServerSideProps = withAdminAuth(async (context) => {
  return {
    props: {}
};
});
