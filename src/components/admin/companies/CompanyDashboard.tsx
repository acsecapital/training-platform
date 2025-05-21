import React, {useState, useEffect } from 'react';
import {Company } from '@/types/company.types';
import {getCompanyById } from '@/services/companyService';
import {generateCompanyStats, exportCompanyDataToCSV } from '@/services/reportService';
import {formatDate } from '@/utils/formatters';
import Link from 'next/link';
import {
  Building, Users, CreditCard, Calendar, BarChart2,
  PieChart, TrendingUp, Award, Edit, Download,
  FileText, UserCheck, GraduationCap, AlertCircle
} from 'lucide-react';
import NoSSR from '@/components/common/NoSSR';
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

interface CompanyDashboardProps {
  companyId: string;
}

interface CompanyStats {
  totalEmployees: number;
  activeUsers: number;
  completedCourses: number;
  inProgressCourses: number;
  certificatesIssued: number;
  averageCompletion: number;
  departmentDistribution: Array<{
    name: string;
    value: number;
}>;
  monthlyProgress: Array<{
    month: string;
    enrollments: number;
    completions: number;
}>;
  coursePopularity: Array<{
    name: string;
    enrollments: number;
}>;
  topPerformers: Array<{
    name: string;
    department: string;
    score: number;
}>;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#00c49f'];

const CompanyDashboard: React.FC<CompanyDashboardProps> = ({companyId }) => {
  const [company, setCompany] = useState<Company | null>(null);
  const [stats, setStats] = useState<CompanyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  useEffect(() => {
    fetchCompanyData();
}, [companyId, dateRange]);

  const fetchCompanyData = async () => {
    try {
      setLoading(true);
      setError(null);

      const companyData = await getCompanyById(companyId);

      if (!companyData) {
        setError('Company not found');
        return;
    }

      setCompany(companyData);

      // Fetch company stats using real data
      try {
        const companyStats = await generateCompanyStats(companyId, dateRange);
        setStats(companyStats);
    } catch (statsErr) {
        console.error('Error generating company stats:', statsErr);
        // Don't set error for stats, just log it
    }
  } catch (err) {
      console.error('Error fetching company data:', err);
      setError('Failed to load company data. Please try again.');
  } finally {
      setLoading(false);
  }
};

  const [exportLoading, setExportLoading] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = React.useRef<HTMLDivElement>(null);

  // Handle click outside to close export menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
    }
  }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
  };
}, []);

  const handleExportData = async (dataType: 'employees' | 'enrollments' | 'progress' | 'certificates') => {
    try {
      setExportLoading(true);

      // Generate CSV data
      const csvData = await exportCompanyDataToCSV(companyId, dataType, dateRange);

      // Create a blob and download link
      const blob = new Blob([csvData], {type: 'text/csv;charset=utf-8;'});
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      // Set up download attributes
      link.setAttribute('href', url);
      link.setAttribute('download', `${company?.name || 'company'}_${dataType}_${dateRange}.csv`);
      link.style.visibility = 'hidden';

      // Add to document, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Hide export menu
      setShowExportMenu(false);
  } catch (err) {
      console.error(`Error exporting ${dataType} data:`, err);
      alert(`Failed to export ${dataType} data. Please try again.`);
  } finally {
      setExportLoading(false);
  }
};

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
}

  if (error || !company) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        {error || 'Company not found'}
      </div>
    );
}

  return (
    <div className="space-y-6">
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-neutral-200 flex justify-between items-center">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-12 w-12">
              {company.logo ? (
                <img
                  className="h-12 w-12 rounded-full object-cover"
                  src={company.logo}
                  alt={company.name}
                />
              ) : (
                <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-800 font-medium text-xl">
                  {company.name[0].toUpperCase()}
                </div>
              )}
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-medium text-neutral-900">{company.name}</h2>
              <div className="flex items-center text-sm text-neutral-500">
                <Building className="h-4 w-4 mr-1" />
                {company.industry} · {company.size} · {company.country}
              </div>
            </div>
          </div>

          <div className="flex space-x-2">
            <Link
              href={`/admin/companies/${companyId}/edit`}
              className="inline-flex items-center px-3 py-1 border border-neutral-300 rounded-md text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Link>
            <div className="relative" ref={exportMenuRef}>
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="inline-flex items-center px-3 py-1 border border-neutral-300 rounded-md text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                disabled={exportLoading}
              >
                <Download className="h-4 w-4 mr-1" />
                {exportLoading ? 'Exporting...' : 'Export'}
              </button>

              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                  <div className="py-1" role="menu" aria-orientation="vertical">
                    <button
                      onClick={() => handleExportData('employees')}
                      className="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 flex items-center"
                      role="menuitem"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Employees
                    </button>
                    <button
                      onClick={() => handleExportData('enrollments')}
                      className="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 flex items-center"
                      role="menuitem"
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      Enrollments
                    </button>
                    <button
                      onClick={() => handleExportData('progress')}
                      className="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 flex items-center"
                      role="menuitem"
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Progress Data
                    </button>
                    <button
                      onClick={() => handleExportData('certificates')}
                      className="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 flex items-center"
                      role="menuitem"
                    >
                      <GraduationCap className="h-4 w-4 mr-2" />
                      Certificates
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-primary-100 rounded-md p-3">
                    <Users className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-neutral-500 truncate">
                        Total Employees
                      </dt>
                      <dd>
                        <div className="text-lg font-medium text-neutral-900">
                          {stats?.totalEmployees || company.currentUsers || 0}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                    <CreditCard className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-neutral-500 truncate">
                        Subscription
                      </dt>
                      <dd>
                        <div className="text-lg font-medium text-neutral-900 capitalize">
                          {company.subscriptionTier}
                        </div>
                        <div className="text-sm text-neutral-500 capitalize">
                          {company.subscriptionStatus}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                    <Award className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-neutral-500 truncate">
                        Certificates Issued
                      </dt>
                      <dd>
                        <div className="text-lg font-medium text-neutral-900">
                          {stats?.certificatesIssued || 0}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                    <TrendingUp className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-neutral-500 truncate">
                        Avg. Completion Rate
                      </dt>
                      <dd>
                        <div className="text-lg font-medium text-neutral-900">
                          {stats?.averageCompletion || 0}%
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-3 bg-neutral-50 border-t border-neutral-200 sm:px-6">
          <div className="flex justify-between items-center">
            <div className="text-sm text-neutral-500">
              <Calendar className="h-4 w-4 inline mr-1" />
              Created on {formatDate(company.createdAt)}
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-neutral-500 mr-2">Time Range:</span>
              <select
                className="text-sm border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
              >
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="quarter">Last Quarter</option>
                <option value="year">Last Year</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {stats ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 border-b border-neutral-200">
              <h3 className="text-lg font-medium text-neutral-900">Monthly Progress</h3>
            </div>
            <div className="p-4 h-80">
              <NoSSR
                fallback={
                  <div className="w-full h-full bg-neutral-50 rounded-md flex items-center justify-center" style={{height: 300 }}>
                    <div className="text-neutral-400">Loading chart...</div>
                  </div>
              }
              >
                <Chart
                  type="line"
                  data={{
                    labels: stats.monthlyProgress.map(item => item.month),
                    datasets: [
                      {
                        label: 'Enrollments',
                        data: stats.monthlyProgress.map(item => item.enrollments),
                        borderColor: '#8884d8',
                        backgroundColor: 'rgba(136, 132, 216, 0.2)',
                        tension: 0.1
                    },
                      {
                        label: 'Completions',
                        data: stats.monthlyProgress.map(item => item.completions),
                        borderColor: '#82ca9d',
                        backgroundColor: 'rgba(130, 202, 157, 0.2)',
                        tension: 0.1
                    }
                    ]
                }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top',
                    },
                      title: {
                        display: false
                    }
                  }
                }}
                />
              </NoSSR>
            </div>
          </div>

          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 border-b border-neutral-200">
              <h3 className="text-lg font-medium text-neutral-900">Department Distribution</h3>
            </div>
            <div className="p-4 h-80">
              <NoSSR
                fallback={
                  <div className="w-full h-full bg-neutral-50 rounded-md flex items-center justify-center" style={{height: 300 }}>
                    <div className="text-neutral-400">Loading chart...</div>
                  </div>
              }
              >
                <Chart
                  type="pie"
                  data={{
                    labels: stats.departmentDistribution.map(item => item.name),
                    datasets: [
                      {
                        data: stats.departmentDistribution.map(item => item.value),
                        backgroundColor: [
                          '#FF6384',
                          '#36A2EB',
                          '#FFCE56',
                          '#4BC0C0',
                          '#9966FF',
                          '#FF9F40',
                          '#8884d8'
                        ],
                        hoverBackgroundColor: [
                          '#FF6384',
                          '#36A2EB',
                          '#FFCE56',
                          '#4BC0C0',
                          '#9966FF',
                          '#FF9F40',
                          '#8884d8'
                        ]
                    }
                    ]
                }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'right',
                    },
                      tooltip: {
                        callbacks: {
                          label: function(context: any) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                      }
                    }
                  }
                }}
                />
              </NoSSR>
            </div>
          </div>

          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 border-b border-neutral-200">
              <h3 className="text-lg font-medium text-neutral-900">Course Popularity</h3>
            </div>
            <div className="p-4 h-80">
              <NoSSR
                fallback={
                  <div className="w-full h-full bg-neutral-50 rounded-md flex items-center justify-center" style={{height: 300 }}>
                    <div className="text-neutral-400">Loading chart...</div>
                  </div>
              }
              >
                <Chart
                  type="bar"
                  data={{
                    labels: stats.coursePopularity.map(item => item.name),
                    datasets: [
                      {
                        label: 'Enrollments',
                        data: stats.coursePopularity.map(item => item.enrollments),
                        backgroundColor: '#8884d8',
                        borderColor: '#8884d8',
                        borderWidth: 1
                    }
                    ]
                }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top',
                    },
                      title: {
                        display: false
                    }
                  },
                    scales: {
                      y: {
                        beginAtZero: true
                    }
                  }
                }}
                />
              </NoSSR>
            </div>
          </div>

          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 border-b border-neutral-200">
              <h3 className="text-lg font-medium text-neutral-900">Top Performers</h3>
            </div>
            <div className="p-4">
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-neutral-200">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Department
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Score
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-200">
                    {stats.topPerformers.map((performer, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                          {performer.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                          {performer.department}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                          {performer.score}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg p-8 text-center">
          <BarChart2 className="h-12 w-12 text-neutral-400 mx-auto" />
          <h3 className="mt-2 text-lg font-medium text-neutral-900">No Analytics Data Available</h3>
          <p className="mt-1 text-neutral-500">
            There isn't enough data to display analytics for this company yet.
          </p>
          <div className="mt-6">
            <Link
              href={`/admin/companies/${companyId}?tab=employees`}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Manage Employees
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyDashboard;
