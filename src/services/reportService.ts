import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import {firestore } from './firebase';
import {CompanyStats, Employee } from '@/types/company.types';
import {getCompanyEmployees, getCompanyDepartments } from './companyService';

// Define a simplified version of CourseProgress for company reports
interface CompanyProgressRecord {
  id: string;
  userId: string;
  courseId: string;
  progress: number;
  completed: boolean;
  completedAt?: string | Timestamp;
  updatedAt?: string | Timestamp;
}

// Define a simplified version of CourseEnrollment for company reports
interface CompanyEnrollmentRecord {
  id: string;
  userId: string;
  courseId: string;
  courseTitle: string;
  enrolledAt: string | Timestamp;
  status: string;
}

/**
 * Generate company statistics based on real data
 */
export const generateCompanyStats = async (
  companyId: string,
  timeRange: 'week' | 'month' | 'quarter' | 'year' = 'month'
): Promise<CompanyStats> => {
  try {
    // Get time range dates
    const now = new Date();
    const startDate = new Date();

    switch (timeRange) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
  }

    // Convert to Firestore timestamps
    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(now);

    // Get employees
    const employees = await getCompanyEmployees(companyId);
    const totalEmployees = employees.length;

    // Get departments
    const departments = await getCompanyDepartments(companyId);

    // Calculate department distribution
    const departmentDistribution = departments.map(dept => {
      const deptEmployees = employees.filter(emp => emp.departmentId === dept.id);
      return {
        name: dept.name,
        value: deptEmployees.length
    };
  });

    // Get enrollments
    const enrollmentsRef = collection(firestore, 'companies', companyId, 'enrollments');
    const enrollmentsQuery = query(
      enrollmentsRef,
      where('enrolledAt', '>=', startTimestamp),
      where('enrolledAt', '<=', endTimestamp),
      orderBy('enrolledAt', 'asc')
    );

    const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
    const enrollments = enrollmentsSnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
  })) as CompanyEnrollmentRecord[];

    // Get course progress
    const progressRef = collection(firestore, 'companies', companyId, 'progress');
    const progressQuery = query(
      progressRef,
      where('updatedAt', '>=', startTimestamp),
      where('updatedAt', '<=', endTimestamp)
    );

    const progressSnapshot = await getDocs(progressQuery);
    const progressRecords = progressSnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
  })) as CompanyProgressRecord[];

    // Get certificates
    const certificatesRef = collection(firestore, 'companies', companyId, 'certificates');
    const certificatesQuery = query(
      certificatesRef,
      where('issueDate', '>=', startTimestamp),
      where('issueDate', '<=', endTimestamp)
    );

    const certificatesSnapshot = await getDocs(certificatesQuery);
    const certificates = certificatesSnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
  }));

    // Calculate active users (users with progress in the time range)
    const activeUserIds = new Set(progressRecords.map(p => p.userId));
    const activeUsers = activeUserIds.size;

    // Calculate completed courses
    const completedCourses = progressRecords.filter(p => p.completed).length;

    // Calculate in-progress courses
    const inProgressCourses = progressRecords.filter(p => !p.completed).length;

    // Calculate average completion
    const averageCompletion = progressRecords.length > 0
      ? Math.round(progressRecords.reduce((sum, p) => sum + p.progress, 0) / progressRecords.length)
      : 0;

    // Calculate monthly progress
    const months = timeRange === 'week'
      ? getLast7Days()
      : getMonthsInRange(startDate, now);

    const monthlyProgress = months.map(month => {
      const monthEnrollments = enrollments.filter(e => {
        const date = e.enrolledAt instanceof Timestamp
          ? e.enrolledAt.toDate()
          : new Date(e.enrolledAt);
        return formatDateForComparison(date) === month;
    });

      const monthCompletions = progressRecords.filter(p => {
        if (!p.completedAt) return false;
        const date = p.completedAt instanceof Timestamp
          ? p.completedAt.toDate()
          : new Date(p.completedAt);
        return formatDateForComparison(date) === month && p.completed;
    });

      return {
        month: formatMonthDisplay(month),
        enrollments: monthEnrollments.length,
        completions: monthCompletions.length
    };
  });

    // Get course popularity
    const courseEnrollmentCounts = new Map<string, number>();
    enrollments.forEach(enrollment => {
      const count = courseEnrollmentCounts.get(enrollment.courseTitle) || 0;
      courseEnrollmentCounts.set(enrollment.courseTitle, count + 1);
  });

    const coursePopularity = Array.from(courseEnrollmentCounts.entries())
      .map(([name, enrollments]) => ({name, enrollments }))
      .sort((a, b) => b.enrollments - a.enrollments)
      .slice(0, 5);

    // Calculate top performers
    const userProgressMap = new Map<string, {
      userId: string,
      name: string,
      department: string,
      totalProgress: number,
      courseCount: number
  }>();

    for (const progress of progressRecords) {
      const employee = employees.find(e => e.id === progress.userId);
      if (!employee) continue;

      const key = employee.id;
      const entry = userProgressMap.get(key) || {
        userId: employee.id,
        name: `${employee.firstName} ${employee.lastName}`,
        department: employee.department?.name || 'Unknown',
        totalProgress: 0,
        courseCount: 0
    };

      entry.totalProgress += progress.progress;
      entry.courseCount += 1;
      userProgressMap.set(key, entry);
  }

    const topPerformers = Array.from(userProgressMap.values())
      .map(entry => ({
        name: entry.name,
        department: entry.department,
        score: Math.round(entry.totalProgress / entry.courseCount)
    }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return {
      totalEmployees,
      activeUsers,
      completedCourses,
      inProgressCourses,
      certificatesIssued: certificates.length,
      averageCompletion,
      departmentDistribution,
      monthlyProgress,
      coursePopularity,
      topPerformers
  };
} catch (error) {
    console.error('Error generating company stats:', error);

    // Return fallback mock data if real data fetching fails
    return {
      totalEmployees: 0,
      activeUsers: 0,
      completedCourses: 0,
      inProgressCourses: 0,
      certificatesIssued: 0,
      averageCompletion: 0,
      departmentDistribution: [],
      monthlyProgress: [],
      coursePopularity: [],
      topPerformers: []
  };
}
};

/**
 * Export company data to CSV
 */
export const exportCompanyDataToCSV = async (
  companyId: string,
  dataType: 'employees' | 'enrollments' | 'progress' | 'certificates',
  timeRange?: 'week' | 'month' | 'quarter' | 'year'
): Promise<string> => {
  try {
    let data: Record<string, unknown>[] = [];
    let headers: string[] = [];

    // Get time range dates if specified
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (timeRange) {
      endDate = new Date();
      startDate = new Date();

      switch (timeRange) {
        case 'week':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(endDate.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
    }
  }

    switch (dataType) {
      case 'employees': {
        const employees = await getCompanyEmployees(companyId);
        headers = ['ID', 'First Name', 'Last Name', 'Email', 'Department', 'Role', 'Status', 'Job Title', 'Created At'];
        data = employees.map(employee => ({
          id: employee.id,
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          department: employee.department?.name || '',
          role: employee.role,
          status: employee.status,
          jobTitle: employee.jobTitle || '',
          createdAt: formatDate(employee.createdAt as string | Date | Timestamp | undefined)
      }));
      }
        break;

      case 'enrollments': {
        const enrollmentsRef = collection(firestore, 'companies', companyId, 'enrollments');
        let enrollmentsQuery = query(enrollmentsRef, orderBy('enrolledAt', 'desc'));

        if (startDate && endDate) {
          enrollmentsQuery = query(
            enrollmentsRef,
            where('enrolledAt', '>=', Timestamp.fromDate(startDate)),
            where('enrolledAt', '<=', Timestamp.fromDate(endDate)),
            orderBy('enrolledAt', 'desc')
          );
        }

        const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
        data = enrollmentsSnapshot.docs.map(doc => {
          const docData = doc.data();
          return {
            ...docData,
            id: doc.id,
            enrolledAt: formatDate(docData.enrolledAt as string | Date | Timestamp | undefined)
          };
        });
      }

        headers = ['ID', 'User ID', 'User Name', 'Course ID', 'Course Title', 'Enrolled At'];
        break;

      case 'progress': {
        const progressRef = collection(firestore, 'companies', companyId, 'progress');
        let progressQuery = query(progressRef, orderBy('updatedAt', 'desc'));

        if (startDate && endDate) {
          progressQuery = query(
            progressRef,
            where('updatedAt', '>=', Timestamp.fromDate(startDate)),
            where('updatedAt', '<=', Timestamp.fromDate(endDate)),
            orderBy('updatedAt', 'desc')
          );
        }

        const progressSnapshot = await getDocs(progressQuery);
        data = progressSnapshot.docs.map(doc => {
          const docData = doc.data();
          return {
            ...docData,
            id: doc.id,
            updatedAt: formatDate(docData.updatedAt as string | Date | Timestamp | undefined),
            completedAt: docData.completedAt ? formatDate(docData.completedAt as string | Date | Timestamp | undefined) : ''
          };
        });
      }

        headers = ['ID', 'User ID', 'Course ID', 'Progress (%)', 'Completed', 'Completed At', 'Updated At'];
        break;

      case 'certificates': {
        const certificatesRef = collection(firestore, 'companies', companyId, 'certificates');
        let certificatesQuery = query(certificatesRef, orderBy('issueDate', 'desc'));

        if (startDate && endDate) {
          certificatesQuery = query(
            certificatesRef,
            where('issueDate', '>=', Timestamp.fromDate(startDate)),
            where('issueDate', '<=', Timestamp.fromDate(endDate)),
            orderBy('issueDate', 'desc')
          );
        }

        const certificatesSnapshot = await getDocs(certificatesQuery);
        data = certificatesSnapshot.docs.map(doc => {
          const docData = doc.data();
          return {
            ...docData,
            id: doc.id,
            issueDate: formatDate(docData.issueDate as string | Date | Timestamp | undefined),
            expiryDate: docData.expiryDate ? formatDate(docData.expiryDate as string | Date | Timestamp | undefined) : ''
          };
        });
      }

        headers = ['ID', 'UUID', 'User ID', 'User Name', 'Course ID', 'Course Title', 'Issue Date', 'Expiry Date', 'Status'];
        break;
  }

    // Convert data to CSV
    const csvContent = [
      headers.join(','),
      ...data.map(item => {
        return headers.map(header => {
          const key = header.toLowerCase().replace(/\s+/g, '');
          const value = (item)[key] || '';
          // Escape commas and quotes in values
          return typeof value === 'string' && (value.includes(',') || value.includes('"'))
            ? `"${value.replace(/"/g, '""')}"`
            : String(value);
        }).join(',');
      })
    ].join('\n');

    return csvContent;
} catch (error) {
    console.error(`Error exporting ${dataType} data:`, error);
    throw error;
}
};

// Helper functions
function formatDate(date: string | Date | Timestamp | undefined): string {
  if (!date) return '';

  let dateObj: Date;

  if (date instanceof Timestamp) {
    dateObj = date.toDate();
} else if (date instanceof Date) {
    dateObj = date;
} else {
    dateObj = new Date(date);
}

  return dateObj.toISOString().split('T')[0];
}

function formatDateForComparison(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthDisplay(dateStr: string): string {
  const [year, month] = dateStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleString('default', {month: 'short'});
}

function getMonthsInRange(startDate: Date, endDate: Date): string[] {
  const months: string[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    months.push(formatDateForComparison(currentDate));
    currentDate.setMonth(currentDate.getMonth() + 1);
}

  return months;
}

function getLast7Days(): string[] {
  const days: string[] = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    days.push(formatDateForComparison(date));
}

  return days;
}

/**
 * Generate platform-wide statistics
 */
export const generatePlatformStats = async (
  timeRange: 'week' | 'month' | 'quarter' | 'year' = 'month'
) => {
  try {
    // Get time range dates
    const now = new Date();
    const startDate = new Date();

    switch (timeRange) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
  }

    // Convert to Firestore timestamps
    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(now);

    // Get users
    const usersRef = collection(firestore, 'users');
    const usersQuery = query(
      usersRef,
      where('createdAt', '>=', startTimestamp),
      where('createdAt', '<=', endTimestamp)
    );
    const usersSnapshot = await getDocs(usersQuery);
    const users = usersSnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
  }));

    // Get courses
    const coursesRef = collection(firestore, 'courses');
    const coursesQuery = query(coursesRef);
    const coursesSnapshot = await getDocs(coursesQuery);
    const courses = coursesSnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
  }));

    // Get enrollments
    const enrollmentsRef = collection(firestore, 'enrollments');
    const enrollmentsQuery = query(
      enrollmentsRef,
      where('enrolledAt', '>=', startTimestamp),
      where('enrolledAt', '<=', endTimestamp)
    );
    const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
    const enrollments = enrollmentsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id
    };
  });

    // Get course completions
    const completionsRef = collection(firestore, 'courseCompletions');
    const completionsQuery = query(
      completionsRef,
      where('completedAt', '>=', startTimestamp),
      where('completedAt', '<=', endTimestamp)
    );
    const completionsSnapshot = await getDocs(completionsQuery);
    const completions = completionsSnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
  }));

    // Calculate user statistics
    const totalUsers = users.length;

    // Safely extract user IDs from enrollments using type checking
    const activeUserIds = new Set<string>();
    enrollments.forEach(enrollment => {
      if (typeof enrollment === 'object' && enrollment !== null) {
        // Check if userId exists and is a string
        if ('userId' in enrollment && typeof enrollment.userId === 'string') {
          activeUserIds.add(enrollment.userId);
      }
        // Check if user object exists and has an id property
        else if ('user' in enrollment &&
                 typeof enrollment.user === 'object' &&
                 enrollment.user !== null &&
                 'id' in enrollment.user &&
                 typeof enrollment.user.id === 'string') {
          activeUserIds.add(enrollment.user.id);
      }
        // Fallback to the enrollment id
        else if (typeof enrollment.id === 'string') {
          activeUserIds.add(enrollment.id);
      }
    }
  });
    const activeUsers = activeUserIds.size;

    // Calculate course statistics
    const totalCourses = courses.length;
    const totalCompletions = completions.length;

    // Calculate total learning time (in minutes)
    const totalLearningTime = completions.reduce((total, completion) => {
      // Safely access timeSpent with type checking
      if (typeof completion === 'object' && completion !== null && 'timeSpent' in completion) {
        const timeSpent = completion.timeSpent;
        // Ensure timeSpent is a number
        return total + (typeof timeSpent === 'number' ? timeSpent : 0);
    }
      return total;
  }, 0);

    // Calculate users by role
    const usersByRole = users.reduce((acc, user) => {
      // Safely access role with type checking
      if (typeof user === 'object' && user !== null) {
        const role = 'role' in user && typeof user.role === 'string'
          ? user.role
          : 'user'; // Default to 'user' if role is missing or not a string
        acc[role] = (acc[role] || 0) + 1;
    }
      return acc;
  }, {} as Record<string, number>);

    // Calculate users by country
    const usersByCountry = users.reduce((acc, user) => {
      // Safely access country with type checking
      if (typeof user === 'object' && user !== null) {
        const country = 'country' in user && typeof user.country === 'string' && user.country.trim() !== ''
          ? user.country
          : 'Unknown'; // Default to 'Unknown' if country is missing or empty
        acc[country] = (acc[country] || 0) + 1;
    }
      return acc;
  }, {} as Record<string, number>);

    // Calculate courses by category
    const coursesByCategory = courses.reduce((acc, course) => {
      // Safely access categoryIds with type checking
      if (typeof course === 'object' && course !== null) {
        // Check if categoryIds exists and is an array
        const categories = 'categoryIds' in course && Array.isArray(course.categoryIds)
          ? course.categoryIds
          : [];

        // Handle single category stored as string
        if ('categoryIds' in course && typeof course.categoryIds === 'string') {
          const categoryId = course.categoryIds.trim();
          if (categoryId) {
            acc[categoryId] = (acc[categoryId] || 0) + 1;
        } else {
            acc['Uncategorized'] = (acc['Uncategorized'] || 0) + 1;
        }
      }
        // Handle legacy 'category' field if it exists
        else if ('category' in course && typeof course.category === 'string' && course.category.trim()) {
          acc[course.category] = (acc[course.category] || 0) + 1;
      }
        // Handle array of categories
        else if (categories.length > 0) {
          categories.forEach(categoryId => {
            if (categoryId && typeof categoryId === 'string') {
              acc[categoryId] = (acc[categoryId] || 0) + 1;
          }
        });
      }
        // If no categories found, count as uncategorized
        else {
          acc['Uncategorized'] = (acc['Uncategorized'] || 0) + 1;
      }
    }
      return acc;
  }, {} as Record<string, number>);

    // Calculate activity by month
    const months = timeRange === 'week'
      ? getLast7Days()
      : getMonthsInRange(startDate, now);

    const activityByMonth = months.map(month => {
      const monthUsers = users.filter(user => {
        if (typeof user !== 'object' || user === null || !('createdAt' in user)) {
          return false;
      }

        let date: Date;
        if (user.createdAt instanceof Timestamp) {
          date = user.createdAt.toDate();
      } else if (user.createdAt instanceof Date) {
          date = user.createdAt;
      } else if (typeof user.createdAt === 'string') {
          date = new Date(user.createdAt);
      } else {
          return false; // Skip if createdAt is not a valid type
      }

        return formatDateForComparison(date) === month;
    }).length;

      const monthCompletions = completions.filter(completion => {
        if (typeof completion !== 'object' || completion === null || !('completedAt' in completion)) {
          return false;
      }

        let date: Date;
        if (completion.completedAt instanceof Timestamp) {
          date = completion.completedAt.toDate();
      } else if (completion.completedAt instanceof Date) {
          date = completion.completedAt;
      } else if (typeof completion.completedAt === 'string') {
          date = new Date(completion.completedAt);
      } else {
          return false; // Skip if completedAt is not a valid type
      }

        return formatDateForComparison(date) === month;
    }).length;

      return {
        month: formatMonthDisplay(month),
        users: monthUsers,
        completions: monthCompletions
    };
  });

    return {
      totalUsers,
      activeUsers,
      totalCourses,
      totalCompletions,
      totalLearningTime,
      usersByRole,
      usersByCountry,
      coursesByCategory,
      activityByMonth
  };
} catch (error) {
    console.error('Error generating platform stats:', error);

    // Return fallback data if real data fetching fails
    return {
      totalUsers: 0,
      activeUsers: 0,
      totalCourses: 0,
      totalCompletions: 0,
      totalLearningTime: 0,
      usersByRole: {},
      usersByCountry: {},
      coursesByCategory: {},
      activityByMonth: []
  };
}
};











