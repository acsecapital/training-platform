import React, {useState } from 'react';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import CertificateAnalyticsDashboard from '@/components/admin/certificates/CertificateAnalyticsDashboard';
import CertificateReporting from '@/components/admin/certificates/CertificateReporting';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

enum AnalyticsTab {
  DASHBOARD = 'dashboard',
  REPORTING = 'reporting'
}

const CertificateAnalyticsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>(AnalyticsTab.DASHBOARD);

  return (
    <AdminLayout title="Certificate Analytics">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-neutral-500 text-xl font-semibold">Track and analyze certificate usage and engagement</p>
          </div>
          <div className="flex space-x-3 mt-4 sm:mt-0">
            <Link href="/admin/certificates">
              <Button variant="outline">
                Back to Certificates
              </Button>
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-neutral-200">
          <nav className="-mb-px flex space-x-8">
            <button
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === AnalyticsTab.DASHBOARD
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
            }`}
              onClick={() => setActiveTab(AnalyticsTab.DASHBOARD)}
            >
              Dashboard
            </button>
            <button
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === AnalyticsTab.REPORTING
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
            }`}
              onClick={() => setActiveTab(AnalyticsTab.REPORTING)}
            >
              Reporting
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === AnalyticsTab.DASHBOARD && (
          <CertificateAnalyticsDashboard />
        )}

        {activeTab === AnalyticsTab.REPORTING && (
          <CertificateReporting />
        )}
      </div>
    </AdminLayout>
  );
};

export default function AdminCertificateAnalyticsPage() {
  return (
    <ProtectedRoute adminOnly>
      <CertificateAnalyticsPage />
    </ProtectedRoute>
  );
}
