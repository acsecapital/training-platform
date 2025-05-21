import React from 'react';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import CertificateVerificationLogs from '@/components/admin/certificates/CertificateVerificationLogs';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const VerificationLogsPage: React.FC = () => {
  return (
    <AdminLayout title="Certificate Verification Logs">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-neutral-500 text-xl font-semibold">Track and monitor certificate verification attempts</p>
          </div>
          <div className="flex space-x-3 mt-4 sm:mt-0">
            <Link href="/admin/certificates">
              <Button variant="outline">
                Back to Certificates
              </Button>
            </Link>
          </div>
        </div>

        {/* Verification Logs */}
        <CertificateVerificationLogs />
      </div>
    </AdminLayout>
  );
};

export default function AdminVerificationLogsPage() {
  return (
    <ProtectedRoute adminOnly>
      <VerificationLogsPage />
    </ProtectedRoute>
  );
}
