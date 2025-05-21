export interface UserRole {
  admin: boolean;
  instructor: boolean;
  student: boolean;
  manager: boolean;
}

export interface UserProviderData {
  providerId: string; // e.g., 'password', 'google.com', 'facebook.com'
  uid: string; // The provider-specific user ID
  displayName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  photoURL?: string | null;
}

export interface User {
  firstName: string;
  lastName: string;
  location?: string; // Made optional to align with UserProfile
  country: string;   // Made mandatory to align with UserProfile
  city: string;      // Made mandatory to align with UserProfile
  department?: string; // Changed from any to optional string
  departmentId: string; // Changed from any to mandatory string, aligns with UserProfile
  companyId?: string;  // Changed from boolean to optional string identifier
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  phoneNumber?: string;
  emailVerified?: boolean;
  roles?: UserRole;
  metadata?: {
    creationTime?: string;
    lastSignInTime?: string;
};
  providerData?: UserProviderData[];
}

export interface UserProfile {
  country: string;
  city: string;
  departmentId: string;
  uid: string;
  id: string;
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  photoURL?: string;
  phoneNumber?: string;
  company?: string;
  jobTitle?: string;
  department?: string;
  bio?: string;
  location?: string;
  website?: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
};
  roles: UserRole;
  createdAt: string;
  lastLoginAt: string;
  preferences?: UserPreferences;
  managerId?: string; // ID of the user's manager (if applicable)
  teamIds?: string[]; // IDs of teams the user belongs to
}

export interface UserPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  darkMode: boolean;
  language: string;
  timezone: string;
}

export interface UserStats {
  userId?: string;
  coursesEnrolled: number;
  coursesCompleted: number;
  certificatesEarned: number;
  totalLearningTime: number; // in minutes
  averageQuizScore: number;
  lastActive?: string;
  streakDays?: number;
  achievements?: UserAchievement[];
}

export interface UserAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedDate: string;
  progress?: number; // For in-progress achievements
  maxProgress?: number;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  managerId: string;
  memberIds: string[];
  createdAt: string;
  updatedAt: string;
  department?: string;
  avatarUrl?: string;
}

export interface UserNotificationSettings {
  userId: string;
  courseCompletion: boolean;
  newCourseAvailable: boolean;
  certificateIssued: boolean;
  upcomingDeadlines: boolean;
  teamUpdates: boolean;
  systemAnnouncements: boolean;
  marketingEmails: boolean;
}
