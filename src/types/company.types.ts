export interface Company {
  id: string;
  name: string;
  industry: string;
  size: string;
  phoneNumber: string;
  address: string;
  country: string;
  billingEmail: string;
  subscriptionStatus: 'active' | 'inactive' | 'pending';
  subscriptionTier: 'basic' | 'apprentice' | 'enterprise';
  maxUsers: number;
  currentUsers: number;
  createdAt: string;
  updatedAt: string;
  website?: string;
  logo?: string;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  companyId: string;
  managerId?: string;
  createdAt: string;
  updatedAt: string;
  employeeCount?: number;
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  companyId: string;
  departmentId?: string;
  department?: Department;
  role: 'admin' | 'hr_manager' | 'sales_staff' | 'employee' | 'instructor' | 'student' | 'manager';
  status: 'active' | 'pending' | 'inactive' | 'suspended';
  createdAt: string;
  updatedAt: string;
  jobTitle?: string;
  phoneNumber?: string;
  photoURL?: string;
  bio?: string;
  location?: string;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  companyId: string;
  departmentId?: string;
  managerId: string;
  createdAt: string;
  updatedAt: string;
  memberIds: string[];
}

export interface TeamMember {
  id: string;
  teamId: string;
  employeeId: string;
  role: 'member' | 'leader';
  joinedAt: string;
}

export interface CompanyStats {
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

export interface TeamStats {
  totalMembers: number;
  activeCourses: number;
  completedCourses: number;
  averageProgress: number;
  certificatesEarned: number;
  memberProgress: Array<{
    name: string;
    progress: number;
}>;
}

export interface LearningPath {
  id: string;
  name: string;
  description: string;
  companyId: string;
  departmentId?: string;
  teamId?: string;
  courseIds: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  isRequired: boolean;
  dueDate?: string;
}
