export type CourseLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export type LessonType = 'video' | 'quiz' | 'text' | 'assignment';

export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'matching' | 'short_answer';
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  points: number;
}

export interface LessonResource {
  id: string;
  title: string;
  type: string; // e.g., 'pdf', 'doc', 'video'
  url: string;
  size?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Lesson {
  id: string;
  title: string;
  description?: string;
  type: LessonType;
  content?: string;
  videoId?: string;
  duration: number;
  order: number;
  status: 'draft' | 'published';
  quizQuestions?: QuizQuestion[]; // This might be the field name in your database
  questions?: QuizQuestion[]; // Add this alias for compatibility
  passingScore?: number;
  resources?: LessonResource[];
  createdAt?: string;
  updatedAt?: string;
  completed?: boolean; // Add this property for compatibility with UI
  instructor?: string; // Optional instructor for this specific lesson
  instructorTitle?: string; // Optional instructor title for this specific lesson
  instructorBio?: string; // Optional instructor bio for this specific lesson
  instructorAvatar?: string; // Optional instructor avatar for this specific lesson
}

export interface Module {
  id: string;
  title: string;
  description?: string;
  order: number;
  lessons?: Lesson[];
  status: 'draft' | 'published';
  isRequired?: boolean;
  availableFrom?: string;
  availableTo?: string;
  prerequisites?: string[];
  completionPercentageRequired?: number;
  sectionId?: string;
  createdAt?: string;
  updatedAt?: string;
  lessonCount?: number; // Added for UI display purposes
  instructor?: string; // Optional instructor for this specific module
  instructorTitle?: string; // Optional instructor title for this specific module
  instructorBio?: string; // Optional instructor bio for this specific module
  instructorAvatar?: string; // Optional instructor avatar for this specific module
}

export interface CourseDuration {
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number; // For easy calculations
}

export interface Course {
  id: string;
  title: string;
  description: string;
  longDescription?: string;
  thumbnail: string;
  duration: string; // Kept for backward compatibility
  durationDetails?: CourseDuration; // New structured duration
  // modules field removed - use modulesList.length instead
  lessons?: number; // Added: Total lesson count
  level: CourseLevel;
  instructor: string;
  instructorTitle?: string;
  instructorBio?: string;
  instructorAvatar?: string;
  price?: number; // Made optional to align with AdminCourse and allow free/trial
  isFree?: boolean; // Added: Flag for free courses
  trialPeriod?: string; // Added: e.g., '7 days', '1 month'
  rating?: number;
  reviewCount?: number;
  enrolledCount?: number;
  lastUpdated: string;
  introVideoId?: string;
  modulesList: string[]; // Required array of module IDs - single source of truth for module count
  whatYouWillLearn?: string[];
  requirements?: string[];
  tags?: string[];
  category?: string;
  featured?: boolean;
  progress?: number;
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
  categoryIds?: string[];
  hasFinalQuiz?: boolean; // Added: Flag to indicate if the course has a final quiz
  // Note: module count should be derived from modulesList.length
}

// Type-safe course with progress for UI components
export type CourseWithProgress = Course & { progress: number };

// Enhanced course interface with computed properties
export interface EnhancedCourse extends Course {
  computedModuleCount: number; // Computed from modulesList.length
  computedLessonCount: number; // Computed from all lessons in all modules
  modules?: Module[]; // Optional array of full module objects
}

export interface CourseProgress {
  courseId: string;
  userId: string;
  startDate: string;
  lastAccessDate: string;
  completedLessons: string[]; // Array of lesson IDs in format "moduleId_lessonId"
  completedModules: string[]; // Array of module IDs
  quizScores: Record<string, number>; // Quiz ID to score mapping in format "moduleId_lessonId"
  quizAttempts: Record<string, number>; // Number of attempts per quiz
  lessonProgress: Record<string, LessonProgress>; // Detailed progress per lesson
  moduleProgress: Record<string, ModuleProgress>; // Detailed progress per module
  overallProgress: number; // Percentage (0-100)
  completed: boolean;
  completedDate?: string; // Date when the course was completed
  certificateId?: string;
  certificateIssueDate?: string;
  timeSpent: number; // Total time spent in seconds
  lastPosition?: {
    moduleId: string;
    lessonId: string;
    position: number; // For videos, position in seconds
};
}

export interface LessonProgress {
  lessonId: string;
  moduleId: string;
  startDate?: string;
  lastAccessDate: string;
  completed: boolean;
  completedDate?: string | null; // Allow null value
  timeSpent: number; // Time spent in seconds
  progress: number; // Percentage (0-100)
  position?: number; // For videos, position in seconds
  notes?: string[];
  bookmarks?: {
    id: string;
    position: number; // For videos, position in seconds
    note: string;
    createdAt: string;
}[];
  adminOverride?: {
    action: string;
    adminId: string;
    timestamp: string;
    note: string;
};
}

export interface ModuleProgress {
  moduleId?: string;
  startDate?: string;
  lastAccessDate?: string;
  completed: boolean;
  completedDate?: string | null;
  progress: number; // Percentage (0-100)
  timeSpent?: number; // Time spent in seconds
  completedLessons?: number; // Number of completed lessons
  totalLessons?: number; // Total number of lessons
  adminOverride?: {
    action: string;
    adminId: string;
    timestamp: string;
    note: string;
};
}

export interface CourseEnrollment {
  id: string;
  courseId: string;
  courseName: string;
  enrolledAt: string;
  expiryDate?: string;
  paymentId?: string;
  status: 'active' | 'completed' | 'expired' | 'inactive' | 'suspended';
  progress: number;
  completedLessons: string[];
  lastAccessedAt: string;
  updatedAt?: string;
  enrolledBy?: {
    teamId?: string;
    companyId?: string;
    userId?: string;
};
}

export interface CourseReview {
  id: string;
  courseId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  date: string;
  helpful: number;
  reported: boolean;
}

export interface CourseCategory {
  id: string;
  name: string;
  description?: string;
  slug: string;
  courseCount: number;
  parentCategoryId?: string;
  order?: number;
  createdAt: string;
  updatedAt: string;
}

// Admin-specific course type
export interface AdminCourse {
  id: string;
  title: string;
  description: string;
  longDescription?: string;
  thumbnail: string;
  duration: string; // Kept for backward compatibility
  durationDetails?: CourseDuration; // New structured duration
  level: CourseLevel;
  status: 'draft' | 'published';
  lessons?: number; // Added: Total lesson count
  createdAt: string;
  updatedAt: string;
  categoryIds?: string[];
  instructor?: string;
  instructorTitle?: string;
  instructorBio?: string;
  instructorAvatar?: string;
  price?: number;
  isFree?: boolean; // Added: Flag for free courses
  trialPeriod?: string; // Added: e.g., '7 days', '1 month'
  featured?: boolean;
  whatYouWillLearn?: string[];
  requirements?: string[];
  tags?: string[];
  modulesList: string[] // Required array of module IDs - single source of truth for module count
  introVideoId?: string;
}

// Enhanced admin course interface with computed properties
export interface EnhancedAdminCourse extends AdminCourse {
  computedModuleCount: number; // Computed from modulesList.length
  computedLessonCount: number; // Computed from all lessons in all modules
  modules?: Module[]; // Optional array of full module objects
}

export interface Enrollment {
  id: string; // Document ID of the enrollment, often same as courseId if stored as users/{uid}/enrollments/{courseId}
  userId: string;
  courseId: string;
  courseName?: string;
  enrolledAt: any; // Replace 'any' with your specific timestamp type (e.g., FirestoreTimestamp, FieldValue, Date, string)
  lastAccessedAt: any; // Replace 'any' with your specific timestamp type
  status: 'active' | 'completed' | 'cancelled' | string; // string for flexibility if other statuses exist
  progress?: number; // Overall progress percentage (e.g., 0-100)
  completedLessons: string[]; // Array of completed lesson keys (e.g., "moduleId_lessonId")
  completedModules?: string[]; // Optional: Array of completed module IDs
  timeSpent?: number; // Total time spent on the course in seconds
  startDate?: any; // Replace 'any' with your specific timestamp type
  completedDate?: any | null; // Replace 'any' with your specific timestamp type, null if not completed
  lastPosition?: {
    moduleId: string;
    lessonId: string;
    timestamp?: any; // Replace 'any' with your specific timestamp type
  };
  enrolledBy?: {
    method: 'self_enrollment' | 'admin_assigned' | 'team_enrollment' | string;
    timestamp: any; // Replace 'any' with your specific timestamp type
    assignerId?: string; // ID of admin or team manager if applicable
  };
  certificateId?: string;
  notes?: Record<string, string[]>; // Notes per lesson/module
  score?: number; // If there's an overall course score
}








