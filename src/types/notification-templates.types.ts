/**
 * Types for notification templates and email templates
 */

export type NotificationTemplateType =
  | 'course_progress'
  | 'course_completion'
  | 'certificate_expiration'
  | 'new_course_available'
  | 'inactivity_reminder'
  | 'enrollment_confirmation'
  | 'quiz_completion'
  | 'achievement_unlocked'
  | 'welcome_message'
  | 'team_enrollment'
  | 'team_progress'
  | 'team_completion';

export interface NotificationTemplate {
  id: string;
  type: NotificationTemplateType;
  title: string;
  message: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  version: number;
  category: string;
  tags?: string[];
  variables: NotificationTemplateVariable[];
  priority?: 'low' | 'normal' | 'high';
  icon?: string;
  actionButtons?: {
    text: string;
    url?: string;
    action?: string;
    style?: 'primary' | 'secondary' | 'danger';
}[];
  expiresAfter?: number; // Time in hours after which the notification expires
  dismissible?: boolean;
  requiresAcknowledgment?: boolean;
  metadata?: Record<string, unknown>;
  history?: {
    versionNumber: number;
    changedBy: string;
    changedAt: string;
    changeDescription?: string;
}[];
  stats?: {
    sent: number;
    read: number;
    clicked: number;
    dismissed: number;
    lastSent?: string;
};
}

export interface EmailTemplate {
  id: string;
  type: NotificationTemplateType;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  variables: EmailTemplateVariable[];
  version: number;
  category: string;
  tags?: string[];
  previewText?: string;  // Text shown in email clients as preview
  metadata?: {
    sender?: string;
    senderName?: string;
    replyTo?: string;
    category?: string;
    priority?: 'high' | 'normal' | 'low';
    trackingEnabled?: boolean;
    analytics?: {
      utmSource?: string;
      utmMedium?: string;
      utmCampaign?: string;
      utmContent?: string;
  };
};
  design?: {
    templateType: 'responsive' | 'fixed-width';
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
    headerImageUrl?: string;
    footerContent?: string;
};
  history?: {
    versionNumber: number;
    changedBy: string;
    changedAt: string;
    changeDescription?: string;
}[];
  stats?: {
    sent: number;
    opened: number;
    clicked: number;
    bounced: number;
    lastSent?: string;
};
}

export interface NotificationTemplateVariable {
  name: string;
  description: string;
  required: boolean;
  defaultValue?: string;
  type?: 'string' | 'number' | 'boolean' | 'date';
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    minValue?: number;
    maxValue?: number;
};
}

export interface EmailTemplateVariable {
  name: string;
  description: string;
  required: boolean;
  defaultValue?: string;
  type?: 'string' | 'number' | 'boolean' | 'date';
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    minValue?: number;
    maxValue?: number;
};
}

export interface NotificationSchedule {
  id: string;
  name?: string;
  templateId: string;
  templateType: NotificationTemplateType;
  frequency: 'immediately' | 'daily' | 'weekly' | 'monthly' | 'custom' | 'recurring';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastRun?: string;
  nextRun?: string;
  customSchedule?: {
    days?: number[];  // 0-6 (Sunday-Saturday)
    hours?: number[];  // 0-23
    minutes?: number[];  // 0-59
    monthDays?: number[];  // 1-31
    months?: number[];  // 1-12
};
  recurringSchedule?: {
    interval: number;  // Repeat every X units
    unit: 'minutes' | 'hours' | 'days' | 'weeks' | 'months';
    maxOccurrences?: number;  // Maximum number of times to run (null = unlimited)
    endDate?: string;  // Date after which to stop running
};
  conditions?: {
    courseProgress?: number;
    daysSinceLastActivity?: number;
    daysSinceCertificateIssued?: number;
    courseCategories?: string[];
    userGroups?: string[];  // Target specific user groups
    enrollmentStatus?: 'active' | 'completed' | 'expired' | 'all';
    completionPercentage?: {
      min?: number;  // Minimum completion percentage
      max?: number;  // Maximum completion percentage
  };
};
  metadata?: Record<string, unknown>;
  retryConfig?: {
    maxRetries: number;
    retryDelay: number;  // in minutes
    currentRetries?: number;
    lastRetryAt?: string;
};
  executionStats?: {
    totalRuns: number;
    successfulRuns: number;
    failedRuns: number;
    lastRunStatus: 'success' | 'partial_success' | 'failure';
    lastRunTime: number;  // in milliseconds
    notificationsSent: number;
};
}

export interface NotificationPreference {
  userId: string;
  email: boolean;
  inApp: boolean;
  push?: boolean;
  sms?: boolean;

  // Notification types
  courseProgress: boolean;
  courseCompletion: boolean;
  certificateExpiration: boolean;
  newCourseAvailable: boolean;
  inactivityReminder: boolean;
  enrollmentConfirmation?: boolean;
  quizCompletion?: boolean;
  achievementUnlocked?: boolean;
  welcomeMessage?: boolean;

  // Team notification types
  teamEnrollment?: boolean;
  teamProgress?: boolean;
  teamCompletion?: boolean;

  // Frequency preferences
  frequency?: {
    daily?: boolean;
    weekly?: boolean;
    monthly?: boolean;
    digest?: boolean;  // Combine multiple notifications into a digest
};

  // Time preferences
  timePreferences?: {
    preferredDays?: number[];  // 0-6 (Sunday-Saturday)
    preferredHours?: number[];  // 0-23
    timezone?: string;  // e.g., 'America/New_York'
};

  // Do not disturb
  doNotDisturb?: {
    enabled: boolean;
    startTime?: string;  // HH:MM format
    endTime?: string;    // HH:MM format
    days?: number[];     // 0-6 (Sunday-Saturday)
};

  updatedAt: string;
}
