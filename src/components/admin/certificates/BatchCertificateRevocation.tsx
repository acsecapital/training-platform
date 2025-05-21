import React, {useState, useEffect } from 'react';
import {collection, query, where, getDocs, orderBy, limit, startAfter } from 'firebase/firestore';
import {firestore } from '@/services/firebase';
import Button from '@/components/ui/Button';
import {toast } from 'react-hot-toast';
import {Certificate } from '@/types/certificate.types';
import {formatDate } from '@/utils/formatters';
import {revokeCertificatesInBatch } from '@/services/batchCertificateService';

interface BatchCertificateRevocationProps {
  onComplete?: () => void;
}

const BatchCertificateRevocation: React.FC<BatchCertificateRevocationProps> = ({onComplete }) => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [selectedCertificates, setSelectedCertificates] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingCertificates, setLoadingCertificates] = useState<boolean>(false);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [revocationReason, setRevocationReason] = useState<string>('');
  const [filters, setFilters] = useState({
    courseId: '',
    studentName: '',
    status: 'active'
});
  const [revocationStatus, setRevocationStatus] = useState<{
    total: number;
    processed: number;
    success: number;
    failed: number;
} | null>(null);

  // Fetch certificates
  const fetchCertificates = async (isLoadMore = false) => {
    try {
      setLoadingCertificates(true);

      // Build query
      let certificatesQuery = query(
        collection(firestore, 'certificates'),
        where('status', '==', filters.status || 'active'),
        orderBy('issueDate', 'desc'),
        limit(20)
      );

      // Apply course filter
      if (filters.courseId) {
        certificatesQuery = query(
          certificatesQuery,
          where('courseId', '==', filters.courseId)
        );
    }

      // Apply pagination
      if (isLoadMore && lastVisible) {
        certificatesQuery = query(
          certificatesQuery,
          startAfter(lastVisible)
        );
    }

      const certificatesSnapshot = await getDocs(certificatesQuery);

      // Check if there are more certificates to load
      setHasMore(certificatesSnapshot.docs.length === 20);

      // Set last visible document for pagination
      if (certificatesSnapshot.docs.length > 0) {
        setLastVisible(certificatesSnapshot.docs[certificatesSnapshot.docs.length - 1]);
    } else {
        setLastVisible(null);
    }

      // Process certificates
      const certificatesList = certificatesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    })) as Certificate[];

      // Filter by student name if provided
      const filteredCertificates = filters.studentName
        ? certificatesList.filter(cert => 
            cert.userName?.toLowerCase().includes(filters.studentName.toLowerCase())
          )
        : certificatesList;

      // Update certificates state
      if (isLoadMore) {
        setCertificates(prev => [...prev, ...filteredCertificates]);
    } else {
        setCertificates(filteredCertificates);
    }
  } catch (error) {
      console.error('Error fetching certificates:', error);
      toast.error('Failed to load certificates');
  } finally {
      setLoadingCertificates(false);
  }
};

  // Initial fetch
  useEffect(() => {
    fetchCertificates();
}, [filters.status]);

  // Handle filter change
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const {name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
  }));
};

  // Handle filter submit
  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSelectedCertificates([]);
    setLastVisible(null);
    fetchCertificates();
};

  // Handle load more
  const handleLoadMore = () => {
    if (!hasMore || loadingCertificates) return;
    fetchCertificates(true);
};

  // Handle certificate selection
  const handleCertificateChange = (e: React.ChangeEvent<HTMLInputElement>, certificateId: string) => {
    if (e.target.checked) {
      setSelectedCertificates(prev => [...prev, certificateId]);
  } else {
      setSelectedCertificates(prev => prev.filter(id => id !== certificateId));
  }
};

  // Handle select all certificates
  const handleSelectAllCertificates = () => {
    if (selectedCertificates.length === certificates.length) {
      setSelectedCertificates([]);
  } else {
      setSelectedCertificates(certificates.map(cert => cert.id));
  }
};

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedCertificates.length === 0) {
      toast.error('Please select at least one certificate');
      return;
  }
    
    if (!revocationReason.trim()) {
      toast.error('Please provide a reason for revocation');
      return;
  }
    
    // Confirm revocation
    if (!window.confirm(`Are you sure you want to revoke ${selectedCertificates.length} certificate(s)? This action cannot be undone.`)) {
      return;
  }
    
    try {
      setLoading(true);
      setRevocationStatus({
        total: selectedCertificates.length,
        processed: 0,
        success: 0,
        failed: 0
    });
      
      // Revoke certificates in batch
      const result = await revokeCertificatesInBatch({
        certificateIds: selectedCertificates,
        reason: revocationReason,
        onProgress: (processed, success, failed) => {
          setRevocationStatus({
            total: selectedCertificates.length,
            processed,
            success,
            failed
        });
      }
    });
      
      toast.success(`Successfully revoked ${result.success} certificates`);
      
      if (result.failed > 0) {
        toast.error(`Failed to revoke ${result.failed} certificates`);
    }
      
      // Reset form
      setSelectedCertificates([]);
      setRevocationReason('');
      
      // Refresh certificates
      setLastVisible(null);
      fetchCertificates();
      
      if (onComplete) {
        onComplete();
    }
  } catch (error) {
      console.error('Error revoking certificates:', error);
      toast.error('Failed to revoke certificates');
  } finally {
      setLoading(false);
  }
};

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-neutral-200">
      <div className="p-4 border-b border-neutral-200">
        <h2 className="text-lg font-medium text-neutral-900">Batch Certificate Revocation</h2>
      </div>
      
      <div className="p-6">
        {/* Filters */}
        <form onSubmit={handleFilterSubmit} className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="courseId" className="block text-sm font-medium text-neutral-700 mb-1">
                Course ID
              </label>
              <input
                type="text"
                id="courseId"
                name="courseId"
                value={filters.courseId}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Filter by course ID"
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="studentName" className="block text-sm font-medium text-neutral-700 mb-1">
                Student Name
              </label>
              <input
                type="text"
                id="studentName"
                name="studentName"
                value={filters.studentName}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Filter by student name"
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-neutral-700 mb-1">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="active">Active</option>
                <option value="issued">Issued</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              type="submit"
              variant="outline"
              disabled={loading || loadingCertificates}
            >
              Apply Filters
            </Button>
          </div>
        </form>
        
        {/* Certificate Selection */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-neutral-700">
              Certificates <span className="text-red-500">*</span>
            </label>
            
            <div className="flex items-center">
              <span className="text-sm text-neutral-500 mr-3">
                {selectedCertificates.length} of {certificates.length} selected
              </span>
              
              <button
                type="button"
                onClick={handleSelectAllCertificates}
                className="text-sm text-primary-600 hover:text-primary-800"
                disabled={loading || certificates.length === 0}
              >
                {selectedCertificates.length === certificates.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
          </div>
          
          {loadingCertificates && certificates.length === 0 ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
            </div>
          ) : certificates.length === 0 ? (
            <div className="bg-neutral-50 border border-neutral-200 rounded-md p-4 text-center">
              <p className="text-neutral-500">No certificates found matching your criteria</p>
            </div>
          ) : (
            <div className="border border-neutral-300 rounded-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectedCertificates.length === certificates.length && certificates.length > 0}
                          onChange={handleSelectAllCertificates}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                          disabled={loading || certificates.length === 0}
                        />
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Course
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Issue Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-200">
                    {certificates.map(certificate => (
                      <tr key={certificate.id} className="hover:bg-neutral-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedCertificates.includes(certificate.id)}
                            onChange={(e) => handleCertificateChange(e, certificate.id)}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                            disabled={loading}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-neutral-900">{certificate.userName}</div>
                          <div className="text-xs text-neutral-500">{certificate.userId}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-neutral-900">{certificate.courseName}</div>
                          <div className="text-xs text-neutral-500">{certificate.courseId}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-neutral-500">{formatDate(certificate.issueDate)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            certificate.status === 'active' || certificate.status === 'issued'
                              ? 'bg-green-100 text-green-800'
                              : certificate.status === 'revoked'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                        }`}>
                            {certificate.status?.charAt(0).toUpperCase() + certificate.status?.slice(1) || 'Unknown'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {hasMore && (
                <div className="px-6 py-3 border-t border-neutral-200 bg-neutral-50">
                  <Button
                    variant="outline"
                    onClick={handleLoadMore}
                    disabled={loading || loadingCertificates}
                    className="w-full"
                  >
                    {loadingCertificates ? 'Loading...' : 'Load More'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Revocation Reason */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="revocationReason" className="block text-sm font-medium text-neutral-700 mb-1">
              Revocation Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              id="revocationReason"
              name="revocationReason"
              value={revocationReason}
              onChange={(e) => setRevocationReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Provide a reason for revoking these certificates"
              disabled={loading}
              required
            />
          </div>
          
          {/* Revocation Status */}
          {revocationStatus && (
            <div className="bg-neutral-50 border border-neutral-200 rounded-md p-4">
              <h3 className="text-sm font-medium text-neutral-900 mb-2">Revocation Progress</h3>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress:</span>
                  <span>{revocationStatus.processed} of {revocationStatus.total} processed</span>
                </div>
                
                <div className="w-full bg-neutral-200 rounded-full h-2.5">
                  <div
                    className="bg-primary-600 h-2.5 rounded-full"
                    style={{width: `${(revocationStatus.processed / revocationStatus.total) * 100}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-green-600">{revocationStatus.success} successful</span>
                  <span className="text-red-600">{revocationStatus.failed} failed</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              variant="danger"
              disabled={loading || selectedCertificates.length === 0 || !revocationReason.trim()}
            >
              {loading ? 'Revoking Certificates...' : 'Revoke Certificates'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BatchCertificateRevocation;
