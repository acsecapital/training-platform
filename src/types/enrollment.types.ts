import {Timestamp } from 'firebase/firestore';

export interface EnrollmentBase {
  id: string;
  courseId: string;
  courseName: string;
  userId: string;
  enrolledAt: Timestamp | string;
  lastAccessedAt: Timestamp | string;
  status: EnrollmentStatus;
  progress: number;
  completedLessons: string[];
}

export interface UserEnrollment extends EnrollmentBase {
  // User-specific enrollment data
  enrolledBy?: {
    method: EnrollmentMethod;
    teamId?: string;
    companyId?: string;
    timestamp: Timestamp | string;
};
}

export interface TeamEnrollment {
  id: string;
  companyId: string;
  teamId: string;
  courseIds: string[];
  memberIds: string[];
  enrolledAt: Timestamp | string;
  enrolledUsers: number;
  enrolledCourses: number;
  status: 'completed' | 'partial' | 'failed';
  errors: string[];
}

export interface EnrollmentWithDetails extends UserEnrollment {
  // Additional details joined from other collections
  userName?: string;
  userEmail?: string;
  courseTitle?: string;
  courseThumbnail?: string;
  courseLevel?: string;
  teamName?: string;
  companyName?: string;
  companyId?: string;
  departmentName?: string;
  departmentId?: string;
  teamId?: string;
  country?: string;
  city?: string;
  location?: string;
}

export type EnrollmentStatus = 'active' | 'completed' | 'expired' | 'suspended';
export type EnrollmentMethod = 'self' | 'team_enrollment' | 'admin' | 'bulk_import';

export interface EnrollmentFilters {
  status?: EnrollmentStatus;
  courseId?: string;
  userId?: string;
  teamId?: string;
  companyId?: string;
  departmentId?: string;
  country?: string;
  city?: string;
  location?: string;
  startDate?: Date;
  endDate?: Date;
  searchTerm?: string;
}

export interface EnrollmentStats {
  totalEnrollments: number;
  activeEnrollments: number;
  completedEnrollments: number;
  expiredEnrollments: number;
  averageProgress: number;
  enrollmentsByDay: {
    date: string;
    count: number;
}[];
  enrollmentsByCourse: {
    courseId: string;
    courseName: string;
    count: number;
}[];
}
