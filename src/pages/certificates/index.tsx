import React, {useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import CertificateCard, {Certificate } from '@/components/certificates/CertificateCard';
import CertificateViewer from '@/components/certificates/CertificateViewer';

// Mock certificates data
const certificatesData: Certificate[] = [
  {
    id: 'cert-001',
    title: 'LIPS Sales System Fundamentals',
    courseName: 'LIPS Sales System Fundamentals',
    issueDate: '2023-10-15',
    thumbnailUrl: '/assets/placeholder-image.svg',
    pdfUrl: '#',
},
  {
    id: 'cert-002',
    title: 'Mastering Objection Handling',
    courseName: 'Mastering Objection Handling',
    issueDate: '2023-09-20',
    expiryDate: '2025-09-20',
    thumbnailUrl: '/assets/placeholder-image.svg',
    pdfUrl: '#',
},
];

export default function CertificatesPage() {
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  // Handle view certificate
  const handleViewCertificate = (certificate: Certificate) => {
    setSelectedCertificate(certificate);
    setIsViewerOpen(true);
};

  // Handle download certificate
  const handleDownloadCertificate = (certificate: Certificate) => {
    // In a real implementation, this would trigger the download of the PDF
    alert(`This is a mock certificate. In a real implementation, you would download: ${certificate.title}`);

    // Don't try to open a non-existent PDF
    // window.open(certificate.pdfUrl, '_blank');
};

  // Handle share certificate
  const handleShareCertificate = (certificate: Certificate) => {
    // In a real implementation, this would open a share dialog
    alert(`Sharing certificate: ${certificate.title}`);
};

  // Close certificate viewer
  const handleCloseViewer = () => {
    setIsViewerOpen(false);
};

  return (
    <MainLayout title="My Certificates | Closer College Training Platform">
      {/* Header */}
      <div className="bg-gradient-primary py-20 text-white">
        <div className="container mx-auto px-6 sm:px-12 lg:px-24 xl:px-32">
          <h1 className="text-3xl font-bold mt-6 mb-4">My Certificates</h1>
          <p className="text-lg opacity-90 max-w-3xl">
            View, download, and share your earned certificates to showcase your skills and achievements.
          </p>
        </div>
      </div>

      {/* Certificates Section */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-6 sm:px-12 lg:px-24 xl:px-32">
          {certificatesData.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {certificatesData.map((certificate) => (
                  <CertificateCard
                    key={certificate.id}
                    certificate={certificate}
                    onView={handleViewCertificate}
                    onDownload={handleDownloadCertificate}
                    onShare={handleShareCertificate}
                  />
                ))}
              </div>

              {/* Certificate Verification Info */}
              <div className="mt-12 bg-neutral-50 rounded-xl p-6 border border-neutral-200">
                <h2 className="text-xl font-semibold mb-4">Certificate Verification</h2>
                <p className="text-neutral-600 mb-4">
                  All certificates issued by Closer College include a unique verification ID that can be used to confirm their authenticity.
                  Employers and other third parties can verify your certificates by visiting our verification portal.
                </p>
                <div className="flex items-center text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <a href="#" className="font-medium hover:underline">Visit Certificate Verification Portal</a>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl shadow-soft p-8 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-neutral-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <h3 className="text-xl font-semibold mb-2">No certificates yet</h3>
              <p className="text-neutral-600 mb-4">
                Complete courses to earn certificates that showcase your skills and achievements.
              </p>
              <button
                onClick={() => window.location.href = '/courses'}
                className="px-4 py-2 bg-primary text-white rounded-md font-medium hover:bg-primary-600 transition-colors duration-200"
              >
                Browse Courses
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Certificate Viewer Modal */}
      {selectedCertificate && (
        <CertificateViewer
          certificate={selectedCertificate}
          isOpen={isViewerOpen}
          onClose={handleCloseViewer}
          onDownload={handleDownloadCertificate}
          onShare={handleShareCertificate}
        />
      )}
    </MainLayout>
  );
}
