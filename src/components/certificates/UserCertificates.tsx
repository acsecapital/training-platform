import React, {useState, useEffect } from 'react';
import {Certificate } from '@/types/certificate.types';
import {getUserCertificates } from '@/services/certificateService';
import Button from '@/components/ui/Button';
import {formatDate } from '@/utils/formatters';
import {useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import ShareCertificateModal from './ShareCertificateModal';

interface UserCertificatesProps {
  userId?: string; // Optional: if not provided, will use the current user
}

const UserCertificates: React.FC<UserCertificatesProps> = ({
  userId
}) => {
  const {user } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [certificateToShare, setCertificateToShare] = useState<Certificate | null>(null);

  // Fetch user certificates
  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        setLoading(true);
        setError(null);

        const uid = userId || (user ? user.uid : null);

        if (!uid) {
          setError('User not authenticated');
          return;
      }

        const certificatesData = await getUserCertificates(uid);
        setCertificates(certificatesData);
    } catch (err: any) {
        console.error('Error fetching certificates:', err);
        setError('Failed to load certificates');
    } finally {
        setLoading(false);
    }
  };

    fetchCertificates();
}, [userId, user]);

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
}

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        {error}
      </div>
    );
}

  if (certificates.length === 0) {
    return (
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-neutral-200 p-8 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-neutral-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="text-lg font-medium text-neutral-900 mb-1">No certificates found</h3>
        <p className="text-neutral-500 mb-4">
          Complete courses to earn certificates.
        </p>
        <Link href="/courses" passHref>
          <Button variant="primary">
            Browse Courses
          </Button>
        </Link>
      </div>
    );
}

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {certificates.map((certificate) => (
          <div key={certificate.id} className="bg-white shadow-sm rounded-lg overflow-hidden border border-neutral-200 flex flex-col">
            <div className="p-4 border-b border-neutral-200 flex justify-between items-center">
              <h3 className="text-md font-medium text-neutral-900 truncate">
                {certificate.courseName}
              </h3>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                certificate.status === 'active' || certificate.status === 'issued'
                  ? 'bg-green-100 text-green-800'
                  : certificate.status === 'revoked'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
            }`}>
                {certificate.status.charAt(0).toUpperCase() + certificate.status.slice(1)}
              </span>
            </div>

            <div className="p-4 flex-grow">
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-neutral-500">Issue Date:</span>
                  <span className="text-sm text-neutral-900 ml-2">{formatDate(certificate.issueDate)}</span>
                </div>
                {certificate.expiryDate && (
                  <div>
                    <span className="text-sm font-medium text-neutral-500">Expiry Date:</span>
                    <span className="text-sm text-neutral-900 ml-2">{formatDate(certificate.expiryDate)}</span>
                  </div>
                )}
                <div>
                  <span className="text-sm font-medium text-neutral-500">Verification Code:</span>
                  <span className="text-sm text-neutral-900 ml-2">{certificate.verificationCode}</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-neutral-200 bg-neutral-50">
              <div className="flex space-x-2">
                {(certificate.downloadUrl || certificate.pdfUrl) && (
                  <a
                    href={certificate.downloadUrl || certificate.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download
                  </a>
                )}
                <Link href={`/verify-certificate/${certificate.verificationCode}`} passHref>
                  <Button variant="outline" size="sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Verify
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCertificateToShare(certificate)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Share Certificate Modal */}
      {certificateToShare && (
        <ShareCertificateModal
          certificateId={certificateToShare.id}
          certificateCode={certificateToShare.verificationCode || ''}
          studentName={certificateToShare.userName || ''}
          courseName={certificateToShare.courseName || ''}
          pdfUrl={certificateToShare.pdfUrl || certificateToShare.downloadUrl || ''}
          verificationUrl={certificateToShare.verificationUrl || ''}
          onClose={() => setCertificateToShare(null)}
        />
      )}
    </div>
  );
};

export default UserCertificates;
