import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import {Bar, Pie } from 'react-chartjs-2';
import {TeamStats } from '@/types/company.types';
import {Users, Award, CheckCircle, TrendingUp } from 'lucide-react';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface TeamProgressChartProps {
  teamId?: string;
  teamName?: string;
  stats: TeamStats | null;
}

const TeamProgressChart: React.FC<TeamProgressChartProps> = ({
  teamId,
  teamName,
  stats
}) => {
  if (!stats) {
    return (
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="p-8 text-center">
          <div className="flex justify-center">
            <TrendingUp className="h-16 w-16 text-primary-400 mb-4" />
          </div>
          <h3 className="text-lg font-medium text-neutral-900 mb-2">No Data Available</h3>
          <p className="text-neutral-500 max-w-md mx-auto">
            There is no progress data available for this team yet.
          </p>
        </div>
      </div>
    );
}

  // Prepare member progress data for bar chart
  const memberProgressData = {
    labels: stats.memberProgress.map(member => member.name),
    datasets: [
      {
        label: 'Progress (%)',
        data: stats.memberProgress.map(member => member.progress),
        backgroundColor: 'rgba(79, 70, 229, 0.8)',
        borderColor: 'rgba(79, 70, 229, 1)',
        borderWidth: 1,
        borderRadius: 4,
        barThickness: 12,
        maxBarThickness: 18,
    },
    ],
};

  // Prepare course completion data for pie chart
  const courseCompletionData = {
    labels: ['Completed', 'In Progress'],
    datasets: [
      {
        data: [stats.completedCourses, stats.activeCourses],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
        ],
        borderColor: [
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)',
        ],
        borderWidth: 1,
        hoverOffset: 4,
    },
    ],
};

  // Bar chart options
  const barOptions = {
    indexAxis: 'y' as const,
    scales: {
      x: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          borderDash: [5, 5],
      },
        ticks: {
          font: {
            family: "'Inter', sans-serif",
            size: 11
        },
          color: '#6B7280'
      },
        title: {
          display: true,
          text: 'Progress (%)',
          font: {
            family: "'Inter', sans-serif",
            size: 12,
            weight: 'bold' as const
        },
          color: '#4B5563'
      }
    },
      y: {
        grid: {
          display: false
      },
        ticks: {
          font: {
            family: "'Inter', sans-serif",
            size: 11
        },
          color: '#6B7280'
      },
        title: {
          display: true,
          text: 'Team Member',
          font: {
            family: "'Inter', sans-serif",
            size: 12,
            weight: 'bold' as const
        },
          color: '#4B5563'
      }
    }
  },
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            family: "'Inter', sans-serif",
            size: 12
        },
          color: '#4B5563',
          boxWidth: 15,
          padding: 15
      }
    },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#111827',
        bodyColor: '#4B5563',
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        cornerRadius: 6,
        boxPadding: 6,
        titleFont: {
          family: "'Inter', sans-serif",
          size: 13,
          weight: 'bold' as const
      },
        bodyFont: {
          family: "'Inter', sans-serif",
          size: 12
      },
        displayColors: false
    }
  },
};

  // Pie chart options
  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          font: {
            family: "'Inter', sans-serif",
            size: 12
        },
          color: '#4B5563',
          boxWidth: 15,
          padding: 15
      }
    },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#111827',
        bodyColor: '#4B5563',
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        cornerRadius: 6,
        boxPadding: 6,
        titleFont: {
          family: "'Inter', sans-serif",
          size: 13,
          weight: 'bold' as const
      },
        bodyFont: {
          family: "'Inter', sans-serif",
          size: 12
      },
        displayColors: true
    }
  },
};

  return (
    <div className="space-y-6">
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="p-4 border-b border-neutral-200">
          <h2 className="text-lg font-medium text-neutral-900">
            {teamName || 'Team Progress Overview'}
          </h2>
        </div>

        <div className="p-4">
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
                        Team Members
                      </dt>
                      <dd>
                        <div className="text-lg font-medium text-neutral-900">
                          {stats.totalMembers}
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
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-neutral-500 truncate">
                        Courses Completed
                      </dt>
                      <dd>
                        <div className="text-lg font-medium text-neutral-900">
                          {stats.completedCourses}
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
                        Certificates Earned
                      </dt>
                      <dd>
                        <div className="text-lg font-medium text-neutral-900">
                          {stats.certificatesEarned}
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
                        Avg. Progress
                      </dt>
                      <dd>
                        <div className="text-lg font-medium text-neutral-900">
                          {stats.averageProgress}%
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-neutral-200">
            <h3 className="text-lg font-medium text-neutral-900">Member Progress</h3>
            <p className="mt-1 text-sm text-neutral-500">Individual progress of each team member</p>
          </div>
          <div className="p-6" style={{height: '350px'}}>
            {stats.memberProgress.length > 0 ? (
              <div className="h-full flex items-center">
                <Bar data={memberProgressData} options={barOptions} />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                  <p className="text-neutral-500 font-medium">No member progress data available</p>
                  <p className="text-neutral-400 text-sm mt-1">Data will appear when team members start courses</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-neutral-200">
            <h3 className="text-lg font-medium text-neutral-900">Course Completion</h3>
            <p className="mt-1 text-sm text-neutral-500">Distribution of completed vs. in-progress courses</p>
          </div>
          <div className="p-6" style={{height: '350px'}}>
            {(stats.completedCourses > 0 || stats.activeCourses > 0) ? (
              <div className="h-full flex items-center justify-center">
                <Pie data={courseCompletionData} options={pieOptions} />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                  <p className="text-neutral-500 font-medium">No course completion data available</p>
                  <p className="text-neutral-400 text-sm mt-1">Data will appear when courses are assigned</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-neutral-200 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium text-neutral-900">Team Members</h3>
            <p className="mt-1 text-sm text-neutral-500">Detailed progress of individual team members</p>
          </div>
          <div className="text-sm text-neutral-500">
            {stats.memberProgress.length} {stats.memberProgress.length === 1 ? 'member' : 'members'}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                >
                  Member
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                >
                  Progress
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider"
                >
                  Last Activity
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {stats.memberProgress.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center">
                    <Users className="h-10 w-10 text-neutral-300 mx-auto mb-2" />
                    <p className="text-neutral-500 font-medium">No team members with progress data</p>
                    <p className="text-neutral-400 text-sm mt-1">Add members and assign courses to see progress</p>
                  </td>
                </tr>
              ) : (
                stats.memberProgress.map((member, index) => (
                  <tr key={index} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-800 font-medium">
                          {member.name[0].toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-neutral-900">
                            {member.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-full max-w-xs bg-neutral-200 rounded-full h-2.5 overflow-hidden">
                          <div
                            className={`h-2.5 rounded-full ${
                              member.progress >= 80
                                ? 'bg-emerald-500'
                                : member.progress >= 40
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                          }`}
                            style={{width: `${member.progress}%` }}
                          ></div>
                        </div>
                        <span className="ml-3 text-sm font-medium text-neutral-900">{member.progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        member.progress >= 80
                          ? 'bg-emerald-100 text-emerald-800'
                          : member.progress >= 40
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                    }`}>
                        {member.progress >= 80
                          ? 'On Track'
                          : member.progress >= 40
                            ? 'In Progress'
                            : 'Needs Attention'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-neutral-500">
                      {/* Mock data for last activity */}
                      {index % 3 === 0 ? 'Today' : index % 3 === 1 ? 'Yesterday' : '3 days ago'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TeamProgressChart;
