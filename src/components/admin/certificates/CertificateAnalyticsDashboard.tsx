import React, {useState, useEffect } from 'react';
import {collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import {firestore } from '@/services/firebase';
import {getTopViewedCertificates } from '@/services/certificateAnalyticsService';
import {formatDate } from '@/utils/formatters';
import {Chart } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface CertificateAnalyticsDashboardProps {
  // Add any props if needed
}

const CertificateAnalyticsDashboard: React.FC<CertificateAnalyticsDashboardProps> = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [topCertificates, setTopCertificates] = useState<any[]>([]);
  const [certificateStats, setCertificateStats] = useState<{
    total: number;
    active: number;
    revoked: number;
    expired: number;
}>({
    total: 0,
    active: 0,
    revoked: 0,
    expired: 0
});
  const [viewsData, setViewsData] = useState<{
    totalViews: number;
    uniqueViews: number;
    viewsByDate: ChartData<'line'>;
    viewsByCountry: ChartData<'pie'>;
    viewsByDevice: ChartData<'doughnut'>;
}>({
    totalViews: 0,
    uniqueViews: 0,
    viewsByDate: {
      labels: [],
      datasets: []
  },
    viewsByCountry: {
      labels: [],
      datasets: []
  },
    viewsByDevice: {
      labels: [],
      datasets: []
  }
});

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch certificate stats
        const certificatesQuery = query(
          collection(firestore, 'certificates')
        );
        const certificatesSnapshot = await getDocs(certificatesQuery);
        
        let total = 0;
        let active = 0;
        let revoked = 0;
        let expired = 0;
        
        certificatesSnapshot.forEach(doc => {
          const data = doc.data();
          total++;
          
          if (data.status === 'revoked') {
            revoked++;
        } else if (data.status === 'expired' || (data.expiryDate && new Date(data.expiryDate) < new Date())) {
            expired++;
        } else {
            active++;
        }
      });
        
        setCertificateStats({
          total,
          active,
          revoked,
          expired
      });

        // Fetch top viewed certificates
        const topCerts = await getTopViewedCertificates(5);
        
        // Fetch additional certificate details for each top certificate
        const topCertsWithDetails = await Promise.all(
          topCerts.map(async (cert) => {
            try {
              const certificateRef = await getDocs(
                query(
                  collection(firestore, 'certificates'),
                  orderBy('createdAt', 'desc'),
                  limit(1)
                )
              );
              
              if (!certificateRef.empty) {
                const certificateData = certificateRef.docs[0].data();
                return {
                  ...cert,
                  studentName: certificateData.userName || 'Unknown',
                  courseName: certificateData.courseName || 'Unknown'
              };
            }
              
              return cert;
          } catch (error) {
              console.error('Error fetching certificate details:', error);
              return cert;
          }
        })
        );
        
        setTopCertificates(topCertsWithDetails);

        // Prepare views by date chart data
        const last30Days = Array.from({length: 30 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (29 - i));
          return date.toISOString().split('T')[0];
      });
        
        // Simulate views data for now
        // In a real implementation, this would come from aggregated analytics data
        const viewsCountByDate = last30Days.map(() => Math.floor(Math.random() * 50));
        
        setViewsData({
          totalViews: viewsCountByDate.reduce((sum, count) => sum + count, 0),
          uniqueViews: Math.floor(viewsCountByDate.reduce((sum, count) => sum + count, 0) * 0.7),
          viewsByDate: {
            labels: last30Days.map(date => {
              const d = new Date(date);
              return `${d.getMonth() + 1}/${d.getDate()}`;
          }),
            datasets: [
              {
                label: 'Certificate Views',
                data: viewsCountByDate,
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                tension: 0.3
            }
            ]
        },
          viewsByCountry: {
            labels: ['United States', 'United Kingdom', 'Canada', 'Australia', 'Other'],
            datasets: [
              {
                label: 'Views by Country',
                data: [45, 25, 15, 10, 5],
                backgroundColor: [
                  'rgba(255, 99, 132, 0.5)',
                  'rgba(54, 162, 235, 0.5)',
                  'rgba(255, 206, 86, 0.5)',
                  'rgba(75, 192, 192, 0.5)',
                  'rgba(153, 102, 255, 0.5)'
                ],
                borderColor: [
                  'rgba(255, 99, 132, 1)',
                  'rgba(54, 162, 235, 1)',
                  'rgba(255, 206, 86, 1)',
                  'rgba(75, 192, 192, 1)',
                  'rgba(153, 102, 255, 1)'
                ],
                borderWidth: 1
            }
            ]
        },
          viewsByDevice: {
            labels: ['Desktop', 'Mobile', 'Tablet'],
            datasets: [
              {
                label: 'Views by Device',
                data: [60, 30, 10],
                backgroundColor: [
                  'rgba(54, 162, 235, 0.5)',
                  'rgba(255, 99, 132, 0.5)',
                  'rgba(255, 206, 86, 0.5)'
                ],
                borderColor: [
                  'rgba(54, 162, 235, 1)',
                  'rgba(255, 99, 132, 1)',
                  'rgba(255, 206, 86, 1)'
                ],
                borderWidth: 1
            }
            ]
        }
      });
    } catch (err: any) {
        console.error('Error fetching analytics data:', err);
        setError('Failed to load analytics data');
    } finally {
        setLoading(false);
    }
  };

    fetchAnalyticsData();
}, []);

  // Chart options
  const lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
    },
      title: {
        display: true,
        text: 'Certificate Views (Last 30 Days)'
    }
  },
    scales: {
      y: {
        beginAtZero: true
    }
  }
};

  const pieChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
    },
      title: {
        display: true,
        text: 'Views by Country'
    }
  }
};

  const doughnutChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
    },
      title: {
        display: true,
        text: 'Views by Device'
    }
  }
};

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      ) : (
        <>
          {/* Certificate Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-neutral-200 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-primary-100 rounded-full p-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-neutral-900">{certificateStats.total}</h3>
                  <p className="text-sm text-neutral-500">Total Certificates</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-neutral-200 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 rounded-full p-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-neutral-900">{certificateStats.active}</h3>
                  <p className="text-sm text-neutral-500">Active Certificates</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-neutral-200 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-red-100 rounded-full p-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-neutral-900">{certificateStats.revoked}</h3>
                  <p className="text-sm text-neutral-500">Revoked Certificates</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-neutral-200 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-100 rounded-full p-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-neutral-900">{certificateStats.expired}</h3>
                  <p className="text-sm text-neutral-500">Expired Certificates</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Views Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-neutral-200 p-4">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 bg-blue-100 rounded-full p-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-neutral-900">{viewsData.totalViews}</h3>
                  <p className="text-sm text-neutral-500">Total Views</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-100 rounded-full p-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-neutral-900">{viewsData.uniqueViews}</h3>
                  <p className="text-sm text-neutral-500">Unique Viewers</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-neutral-200 p-4">
              <h3 className="text-lg font-medium text-neutral-900 mb-4">Top Viewed Certificates</h3>
              
              {topCertificates.length === 0 ? (
                <p className="text-neutral-500">No certificate views recorded yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-neutral-200">
                    <thead className="bg-neutral-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          Certificate
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          Views
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-neutral-200">
                      {topCertificates.map((cert, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-neutral-900">
                              {cert.studentName || 'Unknown Student'}
                            </div>
                            <div className="text-sm text-neutral-500">
                              {cert.courseName || 'Unknown Course'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-neutral-900">{cert.totalViews || 0}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
          
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-neutral-200 p-4">
              <div className="h-80">
                <Chart type="line" data={viewsData.viewsByDate} options={lineChartOptions} />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-neutral-200 p-4">
                <div className="h-64">
                  <Chart type="pie" data={viewsData.viewsByCountry} options={pieChartOptions} />
                </div>
              </div>
              
              <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-neutral-200 p-4">
                <div className="h-64">
                  <Chart type="doughnut" data={viewsData.viewsByDevice} options={doughnutChartOptions} />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CertificateAnalyticsDashboard;
