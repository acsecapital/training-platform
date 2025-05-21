import React, {useState } from 'react';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import BatchCertificateIssuance from '@/components/admin/certificates/BatchCertificateIssuance';
import BatchCertificateRevocation from '@/components/admin/certificates/BatchCertificateRevocation';
import BatchCertificateVerification from '@/components/admin/certificates/BatchCertificateVerification';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

enum BatchOperation {
  ISSUANCE = 'issuance',
  REVOCATION = 'revocation',
  VERIFICATION = 'verification'
}

const BatchOperationsPage: React.FC = () => {
  const [activeOperation, setActiveOperation] = useState<BatchOperation>(BatchOperation.ISSUANCE);

  return (
    <AdminLayout title="Batch Certificate Operations">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-neutral-500 text-xl font-semibold">Issue, revoke, or verify certificates in bulk</p>
          </div>
          <div className="flex space-x-3 mt-4 sm:mt-0">
            <Link href="/admin/certificates">
              <Button variant="outline">
                Back to Certificates
              </Button>
            </Link>
          </div>
        </div>

        {/* Operation Tabs */}
        <div className="border-b border-neutral-200">
          <nav className="-mb-px flex space-x-8">
            <button
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeOperation === BatchOperation.ISSUANCE
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
            }`}
              onClick={() => setActiveOperation(BatchOperation.ISSUANCE)}
            >
              Certificate Issuance
            </button>
            <button
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeOperation === BatchOperation.REVOCATION
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
            }`}
              onClick={() => setActiveOperation(BatchOperation.REVOCATION)}
            >
              Certificate Revocation
            </button>
            <button
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeOperation === BatchOperation.VERIFICATION
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
            }`}
              onClick={() => setActiveOperation(BatchOperation.VERIFICATION)}
            >
              Certificate Verification
            </button>
          </nav>
        </div>

        {/* Operation Content */}
        <div className="mt-6">
          {activeOperation === BatchOperation.ISSUANCE && (
            <BatchCertificateIssuance />
          )}

          {activeOperation === BatchOperation.REVOCATION && (
            <BatchCertificateRevocation />
          )}

          {activeOperation === BatchOperation.VERIFICATION && (
            <BatchCertificateVerification />
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default function AdminBatchOperationsPage() {
  return (
    <ProtectedRoute adminOnly>
      <BatchOperationsPage />
    </ProtectedRoute>
  );
}
