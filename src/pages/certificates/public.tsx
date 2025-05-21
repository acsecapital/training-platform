import React, {useState, useEffect } from 'react';
import {GetServerSideProps } from 'next';
import Layout from '@/components/layout/Layout';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import {formatDate } from '@/utils/formatters';
import {collection, query, where, orderBy, limit, getDocs, startAfter, Timestamp } from 'firebase/firestore';
import {firestore } from '@/services/firebase';
import {Certificate } from '@/types/certificate.types';

interface PublicCertificatesProps {
  initialCertificates?: Certificate[];
}

const PublicCertificates: React.FC<PublicCertificatesProps> = ({initialCertificates = [] }) => {
  const [certificates, setCertificates] = useState<Certificate[]>(initialCertificates);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState({
    courseName: '',
    startDate: '',
    endDate: ''
});

  // Fetch certificates
  const fetchCertificates = async (isLoadMore = false) => {
    try {
      setLoading(true);
      setError(null);

      // Build query
      let certificatesQuery = query(
        collection(firestore, 'certificates'),
        where('isPublic', '==', true),
        where('status', '==', 'active'),
        orderBy('issueDate', 'desc'),
        limit(12)
      );

      // Apply filters
      if (filters.courseName) {
        certificatesQuery = query(
          certificatesQuery,
          where('courseName', '==', filters.courseName)
        );
    }

      // Apply date range filters
      if (filters.startDate && filters.endDate) {
        const startTimestamp = Timestamp.fromDate(new Date(filters.startDate));
        const endTimestamp = Timestamp.fromDate(new Date(filters.endDate));
        certificatesQuery = query(
          certificatesQuery,
          where('issueDate', '>=', startTimestamp),
          where('issueDate', '<=', endTimestamp)
        );
    } else if (filters.startDate) {
        const startTimestamp = Timestamp.fromDate(new Date(filters.startDate));
        certificatesQuery = query(
          certificatesQuery,
          where('issueDate', '>=', startTimestamp)
        );
    } else if (filters.endDate) {
        const endTimestamp = Timestamp.fromDate(new Date(filters.endDate));
        certificatesQuery = query(
          certificatesQuery,
          where('issueDate', '<=', endTimestamp)
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
      setHasMore(certificatesSnapshot.docs.length === 12);

      // Set last visible document for pagination
      if (certificatesSnapshot.docs.length > 0) {
        setLastVisible(certificatesSnapshot.docs[certificatesSnapshot.docs.length - 1]);
    } else {
        setLastVisible(null);
    }

      // Process certificates
      const certificatesData = certificatesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    })) as Certificate[];

      // Update certificates state
      if (isLoadMore) {
        setCertificates(prev => [...prev, ...certificatesData]);
    } else {
        setCertificates(certificatesData);
    }
  } catch (err: any) {
      console.error('Error fetching certificates:', err);
      setError('Failed to load certificates');
  } finally {
      setLoading(false);
  }
};

  // Initial fetch
  useEffect(() => {
    if (initialCertificates.length === 0) {
      fetchCertificates();
  }
}, [initialCertificates]);

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
    setLastVisible(null);
    fetchCertificates();
};

  // Handle load more
  const handleLoadMore = () => {
    if (!hasMore || loading) return;
    fetchCertificates(true);
};

  // Reset filters
  const handleResetFilters = () => {
    setFilters({
      courseName: '',
      startDate: '',
      endDate: ''
  });
    setLastVisible(null);
    fetchCertificates();
};

  return (
    <Layout title="Public Certificates">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-1">Public Certificates</h1>
            <p className="text-neutral-600">
              Browse certificates earned by our students
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-neutral-200 mb-8">
          <div className="p-4 border-b border-neutral-200">
            <h2 className="text-lg font-medium text-neutral-900">Filter Certificates</h2>
          </div>
          <div className="p-6">
            <form onSubmit={handleFilterSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="courseName" className="block text-sm font-medium text-neutral-700 mb-1">
                    Course Name
                  </label>
                  <input
                    type="text"
                    id="courseName"
                    name="courseName"
                    value={filters.courseName}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter course name"
                  />
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

        {/* Certificates Grid */}
        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        ) : certificates.length === 0 ? (
          <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-neutral-200 p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-neutral-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-neutral-900 mb-1">No certificates found</h3>
            <p className="text-neutral-500 mb-4">
              No public certificates match your search criteria.
            </p>
            <Button
              variant="outline"
              onClick={handleResetFilters}
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {certificates.map((certificate) => (
                <Link key={certificate.id} href={`/certificates/${certificate.id}`}>
                  <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-neutral-200 hover:shadow-md transition-shadow duration-200">
                    {certificate.thumbnailUrl ? (
                      <div className="aspect-w-16 aspect-h-9 bg-neutral-100">
                        <img
                          src={certificate.thumbnailUrl}
                          alt={`${certificate.userName}'s certificate for ${certificate.courseName}`}
                          className="object-cover w-full h-full"
                        />
                      </div>
                    ) : (
                      <div className="aspect-w-16 aspect-h-9 bg-neutral-100 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-medium text-neutral-900 mb-1 truncate">{certificate.courseName}</h3>
                      <p className="text-sm text-neutral-500 mb-2">
                        {certificate.userName}
                      </p>
                      <div className="flex justify-between items-center text-xs text-neutral-500">
                        <span>Issued: {formatDate(certificate.issueDate)}</span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Verified
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center mt-8">
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
        )}
      </div>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    // Fetch initial certificates
    const certificatesQuery = query(
      collection(firestore, 'certificates'),
      where('isPublic', '==', true),
      where('status', '==', 'active'),
      orderBy('issueDate', 'desc'),
      limit(12)
    );

    const certificatesSnapshot = await getDocs(certificatesQuery);
    const certificates = certificatesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
  }));

    return {
      props: {
        initialCertificates: JSON.parse(JSON.stringify(certificates))
    }
  };
} catch (error) {
    console.error('Error fetching initial certificates:', error);
    return {
      props: {
        initialCertificates: []
    }
  };
}
};

export default PublicCertificates;
