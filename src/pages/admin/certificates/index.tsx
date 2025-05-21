import React, {useState, useEffect } from 'react';
import {collection, getDocs, query, orderBy, limit, startAfter, where, doc, getDoc } from 'firebase/firestore';
import {firestore } from '@/services/firebase';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import RevokeCertificateModal from '@/components/admin/certificates/RevokeCertificateModal';
import {toast } from 'react-hot-toast';

interface Certificate {
  id: string;
  certificateId: string;
  studentName: string;
  studentId: string;
  courseName: string;
  courseId: string;
  completionDate: string;
  pdfUrl: string;
  createdAt: string;
  status?: 'active' | 'expired' | 'revoked' | 'issued';
}

const CertificatesPage: React.FC = () => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchBy, setSearchBy] = useState<'studentName' | 'certificateId'>('studentName');
  const [isSearching, setIsSearching] = useState(false);
  const [certificateToRevoke, setCertificateToRevoke] = useState<Certificate | null>(null);

  // Fetch certificates
  const fetchCertificates = async (searchParams?: {field: string; value: string }) => {
    try {
      setLoading(true);
      setError(null);

      let certificatesQuery;

      if (searchParams) {
        // Search query
        certificatesQuery = query(
          collection(firestore, 'certificates'),
          where(searchParams.field, '>=', searchParams.value),
          where(searchParams.field, '<=', searchParams.value + '\uf8ff'),
          orderBy(searchParams.field),
          limit(10)
        );
    } else if (lastVisible) {
        // Pagination query
        certificatesQuery = query(
          collection(firestore, 'certificates'),
          orderBy('createdAt', 'desc'),
          startAfter(lastVisible),
          limit(10)
        );
    } else {
        // Initial query
        certificatesQuery = query(
          collection(firestore, 'certificates'),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
    }

      const certificatesSnapshot = await getDocs(certificatesQuery);

      // Set last visible for pagination
      if (!certificatesSnapshot.empty) {
        setLastVisible(certificatesSnapshot.docs[certificatesSnapshot.docs.length - 1]);
    } else {
        setHasMore(false);
    }

      // Process certificates
      const certificatesList: Certificate[] = [];

      for (const certificateDoc of certificatesSnapshot.docs) {
        const certificateData = certificateDoc.data();

        // Get student name if not available
        let studentName = certificateData.studentName;
        if (!studentName && certificateData.studentId) {
          try {
            const userDoc = await getDoc(doc(firestore, 'users', certificateData.studentId));
            if (userDoc.exists()) {
              studentName = userDoc.data().displayName || 'Unknown Student';
          }
        } catch (err) {
            console.error('Error fetching student data:', err);
        }
      }

        certificatesList.push({
          id: certificateDoc.id,
          certificateId: certificateData.certificateId || '',
          studentName: studentName || 'Unknown Student',
          studentId: certificateData.studentId || '',
          courseName: certificateData.courseName || 'Unknown Course',
          courseId: certificateData.courseId || '',
          completionDate: certificateData.completionDate ? new Date(certificateData.completionDate).toLocaleDateString() : 'Unknown',
          pdfUrl: certificateData.pdfUrl || '',
          createdAt: certificateData.createdAt ? new Date(certificateData.createdAt).toISOString() : '',
          status: certificateData.status || 'active',
      });
    }

      if (searchParams || !lastVisible) {
        // Replace certificates for search or initial load
        setCertificates(certificatesList);
    } else {
        // Append certificates for pagination
        setCertificates(prev => [...prev, ...certificatesList]);
    }
  } catch (err: any) {
      console.error('Error fetching certificates:', err);
      setError('Failed to load certificates. Please try again.');
  } finally {
      setLoading(false);
      setIsSearching(false);
  }
};

  // Initial fetch
  useEffect(() => {
    fetchCertificates();
}, []);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchTerm.trim()) return;

    setIsSearching(true);
    setLastVisible(null);
    setHasMore(true);

    fetchCertificates({
      field: searchBy,
      value: searchTerm.trim(),
  });
};

  // Handle reset search
  const handleResetSearch = () => {
    setSearchTerm('');
    setLastVisible(null);
    setHasMore(true);
    fetchCertificates();
};

  // Handle load more
  const handleLoadMore = () => {
    if (!hasMore || loading) return;
    fetchCertificates();
};

  // Handle certificate view
  const handleViewCertificate = (certificate: Certificate) => {
    if (certificate.pdfUrl) {
      window.open(certificate.pdfUrl, '_blank');
  }
};

  // Handle certificate revocation
  const handleCertificateRevoked = () => {
    setCertificateToRevoke(null);
    toast.success('Certificate revoked successfully');
    // Refresh the certificates list
    setLastVisible(null);
    fetchCertificates();
};

  return (
    <AdminLayout title="Certificates">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-neutral-500 text-xl font-semibold">Search below to find student certificates</p>
          </div>
          <div className="flex space-x-3 mt-4 sm:mt-0">
            <Link href="/admin/certificates/templates">
              <Button variant="outline">
                Manage Templates
              </Button>
            </Link>
            <Link href="/admin/certificates/verification-logs">
              <Button variant="outline">
                Verification Logs
              </Button>
            </Link>
            <Link href="/admin/certificates/batch-operations">
              <Button variant="outline">
                Batch Operations
              </Button>
            </Link>
            <Link href="/admin/certificates/analytics">
              <Button variant="outline">
                Analytics
              </Button>
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <div className="flex">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={`Search by ${searchBy === 'studentName' ? 'student name' : 'certificate ID'}`}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                      onClick={() => setSearchTerm('')}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
                <select
                  value={searchBy}
                  onChange={(e) => setSearchBy(e.target.value as 'studentName' | 'certificateId')}
                  className="px-3 py-2 border border-l-0 border-neutral-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-neutral-50"
                >
                  <option value="studentName">Student Name</option>
                  <option value="certificateId">Certificate ID</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                variant="primary"
                isLoading={isSearching}
                disabled={!searchTerm.trim() || isSearching}
              >
                Search
              </Button>
              {searchTerm && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResetSearch}
                >
                  Reset
                </Button>
              )}
            </div>
          </form>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Certificates List */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          {loading && certificates.length === 0 ? (
            <div className="p-8 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : certificates.length === 0 ? (
            <div className="p-8 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-neutral-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <h3 className="text-lg font-medium text-neutral-900 mb-1">No certificates found</h3>
              <p className="text-neutral-500">
                {searchTerm ? 'No certificates match your search criteria.' : 'No certificates have been issued yet.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Course
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Certificate ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Completion Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {certificates.map((certificate) => (
                    <tr key={certificate.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-neutral-900">
                          {certificate.studentName}
                        </div>
                        {certificate.studentId && (
                          <div className="text-xs text-neutral-500">
                            ID: {certificate.studentId}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-neutral-900">
                          {certificate.courseName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-neutral-500">
                          {certificate.certificateId}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-neutral-500">
                          {certificate.completionDate}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-3">
                          {certificate.pdfUrl && (
                            <button
                              onClick={() => handleViewCertificate(certificate)}
                              className="text-primary hover:text-primary-700"
                            >
                              <span className="sr-only">View</span>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                          )}
                          <Link
                            href={`/verify-certificate?id=${certificate.certificateId}`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <span className="sr-only">Verify</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                          </Link>
                          {certificate.status !== 'revoked' && (
                            <button
                              onClick={() => setCertificateToRevoke(certificate)}
                              className="text-red-600 hover:text-red-900 ml-3"
                            >
                              <span className="sr-only">Revoke</span>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Load More */}
              {hasMore && (
                <div className="px-6 py-4 border-t border-neutral-200 bg-neutral-50">
                  <Button
                    variant="outline"
                    onClick={handleLoadMore}
                    isLoading={loading}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? 'Loading...' : 'Load More'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Revoke Certificate Modal */}
        {certificateToRevoke && (
          <RevokeCertificateModal
            certificateId={certificateToRevoke.id}
            certificateCode={certificateToRevoke.certificateId}
            studentName={certificateToRevoke.studentName}
            courseName={certificateToRevoke.courseName}
            onClose={() => setCertificateToRevoke(null)}
            onRevoked={handleCertificateRevoked}
          />
        )}
      </div>
    </AdminLayout>
  );
};

export default function AdminCertificatesPage() {
  return (
    <ProtectedRoute adminOnly>
      <CertificatesPage />
    </ProtectedRoute>
  );
}
