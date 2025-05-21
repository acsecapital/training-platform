import React, {useState, useEffect } from 'react';
import {collection, query, orderBy, limit, getDocs, where, startAfter, Timestamp } from 'firebase/firestore';
import {firestore } from '@/services/firebase';
import Button from '@/components/ui/Button';
import {formatDate } from '@/utils/formatters';

interface VerificationLog {
  id: string;
  certificateId: string;
  verificationCode: string;
  verifiedAt: string;
  verifiedBy?: string;
  verifiedIp?: string;
  status: 'valid' | 'invalid' | 'expired' | 'revoked';
  metadata?: Record<string, any>;
}

const CertificateVerificationLogs: React.FC = () => {
  const [logs, setLogs] = useState<VerificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
    certificateId: '',
    verificationCode: ''
});

  // Fetch verification logs
  const fetchLogs = async (isLoadMore = false) => {
    try {
      setLoading(true);
      setError(null);

      // Build query
      let logsQuery = query(
        collection(firestore, 'certificateVerifications'),
        orderBy('verifiedAt', 'desc'),
        limit(20)
      );

      // Apply filters
      if (filters.status) {
        logsQuery = query(logsQuery, where('status', '==', filters.status));
    }

      if (filters.certificateId) {
        logsQuery = query(logsQuery, where('certificateId', '==', filters.certificateId));
    }

      if (filters.verificationCode) {
        logsQuery = query(logsQuery, where('verificationCode', '==', filters.verificationCode));
    }

      // Apply date range filters
      if (filters.startDate && filters.endDate) {
        const startTimestamp = Timestamp.fromDate(new Date(filters.startDate));
        const endTimestamp = Timestamp.fromDate(new Date(filters.endDate));
        logsQuery = query(
          logsQuery,
          where('verifiedAt', '>=', startTimestamp),
          where('verifiedAt', '<=', endTimestamp)
        );
    } else if (filters.startDate) {
        const startTimestamp = Timestamp.fromDate(new Date(filters.startDate));
        logsQuery = query(logsQuery, where('verifiedAt', '>=', startTimestamp));
    } else if (filters.endDate) {
        const endTimestamp = Timestamp.fromDate(new Date(filters.endDate));
        logsQuery = query(logsQuery, where('verifiedAt', '<=', endTimestamp));
    }

      // Apply pagination
      if (isLoadMore && lastVisible) {
        logsQuery = query(logsQuery, startAfter(lastVisible));
    }

      const logsSnapshot = await getDocs(logsQuery);

      // Check if there are more logs to load
      setHasMore(logsSnapshot.docs.length === 20);

      // Set last visible document for pagination
      if (logsSnapshot.docs.length > 0) {
        setLastVisible(logsSnapshot.docs[logsSnapshot.docs.length - 1]);
    } else {
        setLastVisible(null);
    }

      // Process logs
      const logsData = logsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    })) as VerificationLog[];

      // Update logs state
      if (isLoadMore) {
        setLogs(prev => [...prev, ...logsData]);
    } else {
        setLogs(logsData);
    }
  } catch (err: any) {
      console.error('Error fetching verification logs:', err);
      setError('Failed to load verification logs');
  } finally {
      setLoading(false);
  }
};

  // Initial fetch
  useEffect(() => {
    fetchLogs();
}, []);

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
    fetchLogs();
};

  // Handle load more
  const handleLoadMore = () => {
    fetchLogs(true);
};

  // Reset filters
  const handleResetFilters = () => {
    setFilters({
      status: '',
      startDate: '',
      endDate: '',
      certificateId: '',
      verificationCode: ''
  });
    fetchLogs();
};

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-neutral-200">
        <div className="p-4 border-b border-neutral-200">
          <h2 className="text-lg font-medium text-neutral-900">Filter Verification Logs</h2>
        </div>
        <div className="p-6">
          <form onSubmit={handleFilterSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                >
                  <option value="">All Statuses</option>
                  <option value="valid">Valid</option>
                  <option value="invalid">Invalid</option>
                  <option value="expired">Expired</option>
                  <option value="revoked">Revoked</option>
                </select>
              </div>
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-neutral-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-neutral-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="certificateId" className="block text-sm font-medium text-neutral-700 mb-1">
                  Certificate ID
                </label>
                <input
                  type="text"
                  id="certificateId"
                  name="certificateId"
                  value={filters.certificateId}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter certificate ID"
                />
              </div>
              <div>
                <label htmlFor="verificationCode" className="block text-sm font-medium text-neutral-700 mb-1">
                  Verification Code
                </label>
                <input
                  type="text"
                  id="verificationCode"
                  name="verificationCode"
                  value={filters.verificationCode}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter verification code"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                type="button"
                onClick={handleResetFilters}
              >
                Reset Filters
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={loading}
              >
                Apply Filters
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-neutral-200">
        <div className="p-4 border-b border-neutral-200">
          <h2 className="text-lg font-medium text-neutral-900">Verification Logs</h2>
        </div>
        
        {error && (
          <div className="p-4">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          </div>
        )}
        
        {loading && logs.length === 0 ? (
          <div className="p-8 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-neutral-500">No verification logs found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Certificate ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Verification Code
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    IP Address
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                      {formatDate(log.verifiedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                      {log.certificateId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                      {log.verificationCode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        log.status === 'valid' 
                          ? 'bg-green-100 text-green-800' 
                          : log.status === 'invalid'
                            ? 'bg-red-100 text-red-800'
                            : log.status === 'expired'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                    }`}>
                        {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                      {log.verifiedIp || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {hasMore && (
          <div className="p-4 border-t border-neutral-200 flex justify-center">
            <Button
              variant="outline"
              onClick={handleLoadMore}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Load More'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CertificateVerificationLogs;
