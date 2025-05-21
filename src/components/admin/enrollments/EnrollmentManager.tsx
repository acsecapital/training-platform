import React, {useState, useEffect } from 'react';
import {
  getAllEnrollments,
  updateEnrollmentStatus,
  deleteEnrollment,
  getEnrollmentStats
} from '@/services/enrollmentService';
import {getCoursesForEnrollment } from '@/services/courseService';
import {getCompanies, getDepartments, getTeams } from '@/services/companyService';
import {EnrollmentWithDetails, EnrollmentFilters, EnrollmentStats } from '@/types/enrollment.types';
import {Course, CourseLevel } from '@/types/course.types';
import {formatDate } from '@/utils/formatters';
import {downloadCSV, formatTimestampForExport } from '@/utils/exportUtils';
import Link from 'next/link';
import {
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Download,
  BarChart2,
  Plus,
  Users,
  FileText
} from 'lucide-react';
import {toast } from 'sonner';
import EnrollmentStatsCard from './EnrollmentStatsCard';

interface EnrollmentManagerProps {
  initialFilters?: EnrollmentFilters;
}

const EnrollmentManager: React.FC<EnrollmentManagerProps> = ({initialFilters }) => {
  const [enrollments, setEnrollments] = useState<EnrollmentWithDetails[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<EnrollmentFilters>(initialFilters || {});
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [location, setLocation] = useState<string>('');
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [showStats, setShowStats] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [stats, setStats] = useState<EnrollmentStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const pageSize = 20;

  // Fetch enrollments on component mount and when filters change
  useEffect(() => {
    fetchEnrollments();
}, [filters]);

  // Fetch courses, companies, and departments for the filter dropdowns
  useEffect(() => {
    fetchCourses();
    fetchCompanies();
}, []);

  // Fetch departments and teams when company changes
  useEffect(() => {
    fetchDepartments(selectedCompany);
    fetchTeams(selectedCompany);

    // Reset team selection when company changes
    if (selectedTeam !== 'all') {
      setSelectedTeam('all');
      setFilters(prev => {
        const newFilters = {...prev };
        delete newFilters.teamId;
        return newFilters;
    });
  }
}, [selectedCompany]);

  // Fetch enrollment stats
  useEffect(() => {
    if (showStats) {
      fetchEnrollmentStats();
  }
}, [showStats]);

  // Add click outside listener to close dropdown menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close enrollment action menu if clicking outside
      if (openMenuId) {
        const target = event.target as HTMLElement;
        if (!target.closest('.enrollment-menu-button') && !target.closest('.enrollment-menu')) {
          setOpenMenuId(null);
      }
    }
  };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
  };
}, [openMenuId]);

  // Fetch available courses for the filter dropdown
  const fetchCourses = async () => {
    try {
      const coursesData = await getCoursesForEnrollment(100);
      
      // Map the service Course type to the component's expected Course type
      const mappedCourses: Course[] = coursesData.map(course => {
        // Extract module IDs from syllabus if available
        let moduleIds: string[] = [];
        if (course.syllabus && Array.isArray(course.syllabus)) {
          moduleIds = course.syllabus.map(module => module.id);
      }
        
        // Map the level from service format to CourseLevel format
        let courseLevel: CourseLevel = 'Beginner';
        if (course.level === 'intermediate') {
          courseLevel = 'Intermediate';
      } else if (course.level === 'advanced') {
          courseLevel = 'Advanced';
      }
        
        return {
          id: course.id,
          title: course.title,
          description: course.description || '',
          thumbnail: course.thumbnail || '',
          duration: typeof course.duration === 'number' ? `${course.duration} min` : (course.duration || ''),
          level: courseLevel,
          status: course.status || 'draft',
          // Use instructorName or instructorId as the instructor field
          instructor: course.instructorName || course.instructorId || '',
          lastUpdated: course.updatedAt || new Date().toISOString(),
          // Use the extracted module IDs for modulesList
          modulesList: moduleIds,
          // Add the missing required properties
          createdAt: course.createdAt || new Date().toISOString(),
          updatedAt: course.updatedAt || new Date().toISOString(),
          // Add any other required properties with sensible defaults
      } as Course; // Use type assertion to ensure compatibility
    });
      
      setCourses(mappedCourses);
  } catch (err) {
      console.error('Error fetching courses:', err);
      // Don't show an error toast here as it's not critical
  }
};

  // Fetch companies for the filter dropdown
  const fetchCompanies = async () => {
    try {
      const companiesData = await getCompanies();
      setCompanies(companiesData);
  } catch (err) {
      console.error('Error fetching companies:', err);
      // Don't show an error toast here as it's not critical
  }
};

  // Fetch departments for the filter dropdown
  const fetchDepartments = async (companyId?: string) => {
    try {
      if (companyId && companyId !== 'all') {
        const departmentsData = await getDepartments(companyId);
        setDepartments(departmentsData);
    } else {
        setDepartments([]);
    }
  } catch (err) {
      console.error('Error fetching departments:', err);
      // Don't show an error toast here as it's not critical
  }
};

  // Fetch teams for the filter dropdown
  const fetchTeams = async (companyId?: string) => {
    try {
      if (companyId && companyId !== 'all') {
        const teamsData = await getTeams(companyId);
        setTeams(teamsData);
    } else {
        setTeams([]);
    }
  } catch (err) {
      console.error('Error fetching teams:', err);
      // Don't show an error toast here as it's not critical
  }
};

  const fetchEnrollments = async (isNextPage = false) => {
    try {
      setLoading(true);
      setError(null);

      const lastVisibleDoc = isNextPage ? lastVisible : null;
      const result = await getAllEnrollments(pageSize, lastVisibleDoc, filters);

      if (isNextPage) {
        setEnrollments(prev => [...prev, ...result.enrollments]);
    } else {
        setEnrollments(result.enrollments);
    }

      setLastVisible(result.lastVisible);
      setHasMore(result.enrollments.length === pageSize);
  } catch (err: any) {
      console.error('Error fetching enrollments:', err);
      setError('Failed to load enrollments. Please try again.');
  } finally {
      setLoading(false);
  }
};

  const fetchEnrollmentStats = async () => {
    try {
      setStatsLoading(true);
      const statsData = await getEnrollmentStats();
      setStats(statsData);
  } catch (err) {
      console.error('Error fetching enrollment stats:', err);
      toast.error('Failed to load enrollment statistics');
  } finally {
      setStatsLoading(false);
  }
};

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      fetchEnrollments(true);
  }
};

  const handleRefresh = () => {
    setLastVisible(null);
    setHasMore(true);
    fetchEnrollments();
};

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    // Update search filter
    setFilters(prev => ({...prev, searchTerm }));

    // Reset pagination when search changes
    setLastVisible(null);
    setHasMore(true);
};

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const {name, value } = e.target;

    // Create a new filters object to track changes
    const newFilters = {...filters };

    // Handle special cases for company and department
    if (name === 'companyId') {
      setSelectedCompany(value);

      // Update company filter
      if (value === 'all') {
        delete newFilters.companyId;
    } else {
        newFilters.companyId = value;
    }

      // Reset department and team when company changes
      setSelectedDepartment('all');
      setSelectedTeam('all');
      delete newFilters.departmentId;
      delete newFilters.teamId;

  } else if (name === 'departmentId') {
      setSelectedDepartment(value);

      // Update department filter
      if (value === 'all') {
        delete newFilters.departmentId;
    } else {
        newFilters.departmentId = value;
    }

  } else if (name === 'teamId') {
      setSelectedTeam(value);

      // Update team filter
      if (value === 'all') {
        delete newFilters.teamId;
    } else {
        newFilters.teamId = value;
    }

  } else if (name === 'status' || name === 'courseId' || name === 'userId' || name === 'location') {
      // Handle other known filters explicitly
      if (value === 'all') {
        delete newFilters[name as keyof EnrollmentFilters];
    } else {
        // Type assertion to tell TypeScript this is a valid key
        (newFilters as any)[name] = value;
    }
  }

    // Apply all filter changes at once
    setFilters(newFilters);

    // Reset pagination when filters change
    setLastVisible(null);
    setHasMore(true);
};

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {name, value } = e.target;

    if (name === 'startDate') {
      setStartDate(value);
  } else if (name === 'endDate') {
      setEndDate(value);
  }
};

  const applyDateFilter = () => {
    const updatedFilters = {...filters };

    if (startDate) {
      updatedFilters.startDate = new Date(startDate);
  } else {
      delete updatedFilters.startDate;
  }

    if (endDate) {
      // Set end date to end of day
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      updatedFilters.endDate = endDateTime;
  } else {
      delete updatedFilters.endDate;
  }

    // Apply all filter changes at once
    setFilters(updatedFilters);

    // Reset pagination when date filter changes
    setLastVisible(null);
    setHasMore(true);
};

  const clearDateFilter = () => {
    // Clear date inputs
    setStartDate('');
    setEndDate('');

    // Remove date filters
    const updatedFilters = {...filters };
    delete updatedFilters.startDate;
    delete updatedFilters.endDate;

    // Apply filter changes
    setFilters(updatedFilters);

    // Reset pagination when date filter changes
    setLastVisible(null);
    setHasMore(true);
};

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocation(e.target.value);
};

  const applyLocationFilter = () => {
    // Update location filter
    setFilters(prev => ({...prev, location }));

    // Reset pagination when location filter changes
    setLastVisible(null);
    setHasMore(true);
};

  const clearLocationFilter = () => {
    // Clear location input
    setLocation('');

    // Remove location filter
    const updatedFilters = {...filters };
    delete updatedFilters.location;
    setFilters(updatedFilters);

    // Reset pagination when location filter changes
    setLastVisible(null);
    setHasMore(true);
};

  const clearAllFilters = () => {
    // Reset all filter state variables
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setLocation('');
    setSelectedCompany('all');
    setSelectedDepartment('all');
    setSelectedTeam('all');

    // Clear all filters
    setFilters({});

    // Reset pagination
    setLastVisible(null);
    setHasMore(true);
};

  const handleStatusUpdate = async (enrollmentId: string, status: 'active' | 'completed' | 'expired' | 'suspended') => {
    try {
      await updateEnrollmentStatus(enrollmentId, status);

      // Update local state
      setEnrollments(prev =>
        prev.map(enrollment =>
          enrollment.id === enrollmentId
            ? {...enrollment, status }
            : enrollment
        )
      );

      // Close the menu
      setOpenMenuId(null);

      toast.success(`Enrollment status updated to ${status}`);
  } catch (err) {
      console.error('Error updating enrollment status:', err);
      toast.error('Failed to update enrollment status');
  }
};

  const handleDelete = async (enrollmentId: string) => {
    if (window.confirm('Are you sure you want to delete this enrollment? This action cannot be undone.')) {
      try {
        await deleteEnrollment(enrollmentId);

        // Update local state
        setEnrollments(prev => prev.filter(enrollment => enrollment.id !== enrollmentId));

        // Close the menu
        setOpenMenuId(null);

        toast.success('Enrollment deleted successfully');
    } catch (err) {
        console.error('Error deleting enrollment:', err);
        toast.error('Failed to delete enrollment');
    }
  }
};

  const toggleMenu = (enrollmentId: string) => {
    setOpenMenuId(openMenuId === enrollmentId ? null : enrollmentId);
};

  const handleExportCSV = () => {
    if (enrollments.length === 0) {
      toast.error('No enrollments to export');
      return;
  }

    // Prepare data for export
    const exportData = enrollments.map(enrollment => ({
      userName: enrollment.userName || 'Unknown User',
      userEmail: enrollment.userEmail || 'Unknown Email',
      courseTitle: enrollment.courseTitle || enrollment.courseName || 'Unknown Course',
      courseLevel: enrollment.courseLevel || 'Unknown Level',
      status: enrollment.status,
      progress: `${enrollment.progress || 0}%`,
      enrolledAt: formatTimestampForExport(enrollment.enrolledAt),
      lastAccessedAt: formatTimestampForExport(enrollment.lastAccessedAt),
      teamName: enrollment.teamName || '',
      companyName: enrollment.companyName || ''
  }));

    // Define headers for CSV
    const headers = [
      {key: 'userName' as const, label: 'User Name'},
      {key: 'userEmail' as const, label: 'Email'},
      {key: 'courseTitle' as const, label: 'Course'},
      {key: 'courseLevel' as const, label: 'Level'},
      {key: 'status' as const, label: 'Status'},
      {key: 'progress' as const, label: 'Progress'},
      {key: 'enrolledAt' as const, label: 'Enrolled Date'},
      {key: 'lastAccessedAt' as const, label: 'Last Access Date'},
      {key: 'teamName' as const, label: 'Team'},
      {key: 'companyName' as const, label: 'Company'}
    ];

    // Generate filename with current date
    const date = new Date().toISOString().split('T')[0];
    const filename = `enrollments_export_${date}.csv`;

    // Download CSV
    downloadCSV(exportData, filename, headers);

    toast.success('Export started');
};

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Expired
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Suspended
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Unknown
          </span>
        );
  }
};

  return (
    <div className="space-y-6">
      {/* Stats Toggle */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-neutral-900">Enrollment Management</h2>
        <div className="flex space-x-2">
          <Link
            href="/admin/enrollments/bulk"
            className="inline-flex items-center px-3 py-1.5 border border-neutral-300 shadow-sm text-sm font-medium rounded-md text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            <Users className="h-4 w-4 mr-1.5" />
            Bulk Enrollment
          </Link>
          <Link
            href="/admin/enrollments/agreements"
            className="inline-flex items-center px-3 py-1.5 border border-neutral-300 shadow-sm text-sm font-medium rounded-md text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            <FileText className="h-4 w-4 mr-1.5" />
            Agreements
          </Link>
          <Link
            href="/admin/enrollments/test"
            className="inline-flex items-center px-3 py-1.5 border border-neutral-300 shadow-sm text-sm font-medium rounded-md text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Test Enrollment
          </Link>
          <button
            onClick={() => setShowStats(!showStats)}
            className="inline-flex items-center px-3 py-1.5 border border-neutral-300 shadow-sm text-sm font-medium rounded-md text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            <BarChart2 className="h-4 w-4 mr-1.5" />
            {showStats ? 'Hide Stats' : 'Show Stats'}
          </button>
        </div>
      </div>

      {/* Stats Section */}
      {showStats && (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-200">
            <h3 className="text-lg font-medium text-neutral-900">Enrollment Statistics</h3>
          </div>
          <div className="p-6">
            {statsLoading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : stats ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <EnrollmentStatsCard
                  title="Total Enrollments"
                  value={stats.totalEnrollments}
                  icon={<CheckCircle className="h-6 w-6 text-primary" />}
                />
                <EnrollmentStatsCard
                  title="Active Enrollments"
                  value={stats.activeEnrollments}
                  icon={<CheckCircle className="h-6 w-6 text-green-500" />}
                />
                <EnrollmentStatsCard
                  title="Completed Enrollments"
                  value={stats.completedEnrollments}
                  icon={<CheckCircle className="h-6 w-6 text-blue-500" />}
                />
                <EnrollmentStatsCard
                  title="Average Progress"
                  value={`${Math.round(stats.averageProgress)}%`}
                  icon={<BarChart2 className="h-6 w-6 text-indigo-500" />}
                />
              </div>
            ) : (
              <div className="text-center py-8 text-neutral-500">
                No statistics available
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center">
              <h3 className="text-lg font-medium text-neutral-900">Filters</h3>
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="ml-2 text-sm text-primary-600 hover:text-primary-900 focus:outline-none"
              >
                {showAdvancedFilters ? 'Hide Advanced Filters' : 'Show Advanced Filters'}
              </button>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleRefresh}
                className="inline-flex items-center px-3 py-1.5 border border-neutral-300 shadow-sm text-sm font-medium rounded-md text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                <RefreshCw className="h-4 w-4 mr-1.5" />
                Refresh
              </button>
              <button
                onClick={handleExportCSV}
                className="inline-flex items-center px-3 py-1.5 border border-neutral-300 shadow-sm text-sm font-medium rounded-md text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                <Download className="h-4 w-4 mr-1.5" />
                Export
              </button>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-neutral-700 mb-1">
                Status
              </label>
              <select
                id="status"
                name="status"
                className="block w-full pl-3 pr-10 py-2 text-base border-neutral-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                value={filters.status || 'all'}
                onChange={handleFilterChange}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="expired">Expired</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            <div>
              <label htmlFor="courseId" className="block text-sm font-medium text-neutral-700 mb-1">
                Course
              </label>
              <select
                id="courseId"
                name="courseId"
                className="block w-full pl-3 pr-10 py-2 text-base border-neutral-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                value={filters.courseId || 'all'}
                onChange={handleFilterChange}
              >
                <option value="all">All Courses</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="companyId" className="block text-sm font-medium text-neutral-700 mb-1">
                Company
              </label>
              <select
                id="companyId"
                name="companyId"
                className="block w-full pl-3 pr-10 py-2 text-base border-neutral-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                value={selectedCompany}
                onChange={handleFilterChange}
              >
                <option value="all">All Companies</option>
                {companies.map(company => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <div>
              <label htmlFor="departmentId" className="block text-sm font-medium text-neutral-700 mb-1">
                Department
              </label>
              <select
                id="departmentId"
                name="departmentId"
                className="block w-full pl-3 pr-10 py-2 text-base border-neutral-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                value={selectedDepartment}
                onChange={handleFilterChange}
                disabled={selectedCompany === 'all'}
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="teamId" className="block text-sm font-medium text-neutral-700 mb-1">
                Team
              </label>
              <select
                id="teamId"
                name="teamId"
                className="block w-full pl-3 pr-10 py-2 text-base border-neutral-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                value={selectedTeam}
                onChange={handleFilterChange}
                disabled={selectedCompany === 'all'}
              >
                <option value="all">All Teams</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-neutral-700 mb-1">
                Search
              </label>
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  id="search"
                  placeholder="Search by name or email..."
                  className="block w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-neutral-400" />
                </div>
                <button type="submit" className="hidden">Search</button>
              </form>
            </div>
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-neutral-700 mb-1">
                Location
              </label>
              <div className="flex">
                <input
                  type="text"
                  id="location"
                  placeholder="Filter by location..."
                  className="block w-full pl-3 pr-3 py-2 border border-neutral-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  value={location}
                  onChange={handleLocationChange}
                />
                <button
                  type="button"
                  onClick={applyLocationFilter}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-r-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="mt-4 pt-4 border-t border-neutral-200">
              <h4 className="text-sm font-medium text-neutral-700 mb-3">Advanced Filters</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-neutral-700 mb-1">
                    Enrolled From
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    className="block w-full pl-3 pr-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    value={startDate}
                    onChange={handleDateChange}
                  />
                </div>
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-neutral-700 mb-1">
                    Enrolled To
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    className="block w-full pl-3 pr-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    value={endDate}
                    onChange={handleDateChange}
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={applyDateFilter}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary mr-2"
                  >
                    Apply Filters
                  </button>
                  <button
                    type="button"
                    onClick={clearDateFilter}
                    className="inline-flex items-center px-3 py-2 border border-neutral-300 text-sm leading-4 font-medium rounded-md text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Active Filters Display */}
              {(filters.startDate || filters.endDate || filters.companyId || filters.departmentId || filters.teamId || filters.location || filters.searchTerm || filters.status || filters.courseId) && (
                <div className="mt-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-xs text-neutral-500">Active filters:</div>
                    {filters.status && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 text-neutral-800">
                        Status: {filters.status.charAt(0).toUpperCase() + filters.status.slice(1)}
                      </span>
                    )}
                    {filters.courseId && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 text-neutral-800">
                        Course: {courses.find(c => c.id === filters.courseId)?.title || filters.courseId}
                      </span>
                    )}
                    {filters.startDate && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 text-neutral-800">
                        From: {filters.startDate.toLocaleDateString()}
                      </span>
                    )}
                    {filters.endDate && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 text-neutral-800">
                        To: {filters.endDate.toLocaleDateString()}
                      </span>
                    )}
                    {filters.companyId && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 text-neutral-800">
                        Company: {companies.find(c => c.id === filters.companyId)?.name || filters.companyId}
                      </span>
                    )}
                    {filters.departmentId && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 text-neutral-800">
                        Department: {departments.find(d => d.id === filters.departmentId)?.name || filters.departmentId}
                      </span>
                    )}
                    {filters.teamId && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 text-neutral-800">
                        Team: {teams.find(t => t.id === filters.teamId)?.name || filters.teamId}
                      </span>
                    )}
                    {filters.location && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 text-neutral-800">
                        Location: {filters.location}
                        <button
                          onClick={clearLocationFilter}
                          className="ml-1 text-neutral-500 hover:text-neutral-700"
                        >
                          &times;
                        </button>
                      </span>
                    )}
                    {filters.searchTerm && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 text-neutral-800">
                        Search: {filters.searchTerm}
                      </span>
                    )}

                    <button
                      onClick={clearAllFilters}
                      className="ml-2 text-xs text-primary-600 hover:text-primary-900 focus:outline-none"
                    >
                      Clear All Filters
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Enrollments Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  User
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Course
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Progress
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Enrolled
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Last Access
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {loading && enrollments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-neutral-500">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary mr-2"></div>
                      Loading enrollments...
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-red-500">
                    {error}
                  </td>
                </tr>
              ) : enrollments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-neutral-500">
                    No enrollments found
                  </td>
                </tr>
              ) : (
                enrollments.map((enrollment) => (
                  <tr key={enrollment.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-800 font-medium">
                          {enrollment.userName?.[0] || 'U'}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-neutral-900">
                            {enrollment.userName || 'Unknown User'}
                          </div>
                          <div className="text-sm text-neutral-500">
                            {enrollment.userEmail || 'No email'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-neutral-900">
                        {enrollment.courseTitle || enrollment.courseName || 'Unknown Course'}
                      </div>
                      <div className="text-xs text-neutral-500">
                        {enrollment.courseLevel || 'Unknown Level'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(enrollment.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-full bg-neutral-200 rounded-full h-2.5">
                        <div
                          className="bg-primary h-2.5 rounded-full"
                          style={{width: `${enrollment.progress || 0}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-neutral-500 mt-1">
                        {enrollment.progress || 0}% complete
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                      {enrollment.enrolledAt ? 
                        (typeof enrollment.enrolledAt === 'string' 
                          ? formatDate(enrollment.enrolledAt)
                          : 'seconds' in enrollment.enrolledAt 
                            ? formatDate(enrollment.enrolledAt.toDate().toISOString()) 
                            : formatDate(String(enrollment.enrolledAt))
                        ) 
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                      {enrollment.lastAccessedAt ? 
                        (typeof enrollment.lastAccessedAt === 'string' 
                          ? formatDate(enrollment.lastAccessedAt)
                          : 'seconds' in enrollment.lastAccessedAt 
                            ? formatDate(enrollment.lastAccessedAt.toDate().toISOString()) 
                            : formatDate(String(enrollment.lastAccessedAt))
                        ) 
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link
                          href={`/admin/enrollments/${enrollment.id}`}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          View
                        </Link>
                        <div className="relative">
                          <button
                            className="text-neutral-400 hover:text-neutral-500 enrollment-menu-button"
                            onClick={() => toggleMenu(enrollment.id)}
                          >
                            <MoreHorizontal className="h-5 w-5" />
                          </button>
                          {openMenuId === enrollment.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 enrollment-menu">
                              <button
                                onClick={() => handleStatusUpdate(enrollment.id, 'active')}
                                className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 w-full text-left"
                                disabled={enrollment.status === 'active'}
                              >
                                Mark as Active
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(enrollment.id, 'completed')}
                                className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 w-full text-left"
                                disabled={enrollment.status === 'completed'}
                              >
                                Mark as Completed
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(enrollment.id, 'suspended')}
                                className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 w-full text-left"
                                disabled={enrollment.status === 'suspended'}
                              >
                                Suspend Enrollment
                              </button>
                              <button
                                onClick={() => handleDelete(enrollment.id)}
                                className="block px-4 py-2 text-sm text-red-600 hover:bg-neutral-100 w-full text-left"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-neutral-200 flex items-center justify-between">
          <div className="text-sm text-neutral-500">
            Showing {enrollments.length} {enrollments.length === 1 ? 'enrollment' : 'enrollments'}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleLoadMore}
              disabled={!hasMore || loading}
              className={`inline-flex items-center px-3 py-1.5 border border-neutral-300 shadow-sm text-sm font-medium rounded-md ${
                hasMore && !loading
                  ? 'text-neutral-700 bg-white hover:bg-neutral-50'
                  : 'text-neutral-400 bg-neutral-50 cursor-not-allowed'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary`}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary mr-1.5"></div>
              ) : (
                <ChevronRight className="h-4 w-4 mr-1.5" />
              )}
              Load More
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnrollmentManager;









