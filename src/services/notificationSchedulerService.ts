import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import {firestore } from '@/services/firebase';

interface RetryConfig {
  maxRetries: number;
  retryDelay: number; // in minutes
  currentRetries?: number;
}

interface EmailLogData {
  status?: string; // Includes 'sent', 'bounced', 'failed' and other possible values
  opened?: boolean;
  clicked?: boolean;
  templateType?: string; // Includes NotificationTemplateType and other possible values
  // Add other properties from your emailLogs documents
}

interface EmailTemplateDataForStats {
  type?: string; // Includes NotificationTemplateType and other possible values
  stats?: {
    sent?: number;
    opened?: number;
    clicked?: number;
    bounced?: number;
    // Add other stats properties if they exist
  };
  // Add other properties from your emailTemplates documents
}

interface NotificationDataForSend {
  title?: string;
  message?: string;
  link?: string;
  priority?: string; // Includes 'low', 'normal', 'high' and other possible values
  courseId?: string;
  courseName?: string;
  progress?: number;
  completionDate?: string;
  certificateUrl?: string;
  expirationDate?: string;
  newCourseName?: string;
  lastActivityDate?: string;
  // For any other dynamic properties, allow them but prefer known ones
  [key: string]: unknown;
}

interface NotificationRetryData {
  userId: string;
  type: NotificationTemplateType;
  data: Record<string, unknown>;
  retryConfig: RetryConfig;
  scheduledFor: string;
  createdAt: string;
  // Add other fields if they exist in your Firestore document for retries
}
import {
  NotificationSchedule,
  NotificationTemplateType,
  NotificationPreference
} from '@/types/notification-templates.types';
import {getEmailTemplateByType, renderEmailTemplate } from './notificationTemplateService';
import {sendEmail } from './emailService';
import {getUserById } from './userService';
import {getCourseById } from './courseService';
import {createNotification } from './notificationService';

/**
 * Get all notification schedules
 */
export const getNotificationSchedules = async (): Promise<NotificationSchedule[]> => {
  try {
    const schedulesRef = collection(firestore, 'notificationSchedules');
    const schedulesSnapshot = await getDocs(schedulesRef);

    return schedulesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
  })) as NotificationSchedule[];
} catch (error) {
    console.error('Error getting notification schedules:', error);
    throw error;
}
};

/**
 * Get notification schedule by ID
 */
export const getNotificationScheduleById = async (scheduleId: string): Promise<NotificationSchedule | null> => {
  try {
    const scheduleRef = doc(firestore, 'notificationSchedules', scheduleId);
    const scheduleSnapshot = await getDoc(scheduleRef);

    if (!scheduleSnapshot.exists()) {
      return null;
  }

    return {
      id: scheduleSnapshot.id,
      ...scheduleSnapshot.data()
  } as NotificationSchedule;
} catch (error) {
    console.error('Error getting notification schedule:', error);
    throw error;
}
};

/**
 * Get notification schedules by type
 */
export const getNotificationSchedulesByType = async (type: NotificationTemplateType): Promise<NotificationSchedule[]> => {
  try {
    const schedulesRef = collection(firestore, 'notificationSchedules');
    const q = query(schedulesRef, where('templateType', '==', type), where('isActive', '==', true));
    const schedulesSnapshot = await getDocs(q);

    return schedulesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
  })) as NotificationSchedule[];
} catch (error) {
    console.error('Error getting notification schedules by type:', error);
    throw error;
}
};

/**
 * Create a notification schedule
 */
export const createNotificationSchedule = async (schedule: Omit<NotificationSchedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const schedulesRef = collection(firestore, 'notificationSchedules');
    const now = new Date().toISOString();

    // Calculate next run time if not provided
    let nextRun = schedule.nextRun;
    if (!nextRun && schedule.isActive) {
      const nextRunDate = calculateNextRunTime({
        ...schedule,
        id: 'temp',
        createdAt: now,
        updatedAt: now
    } as NotificationSchedule);

      if (nextRunDate) {
        nextRun = nextRunDate.toISOString();
    }
  }

    // Initialize execution stats
    const executionStats = {
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      lastRunStatus: 'success' as const,
      lastRunTime: 0,
      notificationsSent: 0
  };

    const docRef = await addDoc(schedulesRef, {
      ...schedule,
      nextRun,
      executionStats,
      createdAt: now,
      updatedAt: now
  });

    return docRef.id;
} catch (error) {
    console.error('Error creating notification schedule:', error);
    throw error;
}
};

/**
 * Create a recurring notification schedule
 */
export const createRecurringSchedule = async (
  templateType: NotificationTemplateType,
  recurringOptions: {
    interval: number;
    unit: 'minutes' | 'hours' | 'days' | 'weeks' | 'months';
    maxOccurrences?: number;
    endDate?: string;
},
  conditions?: NotificationSchedule['conditions'],
  metadata?: Record<string, unknown>
): Promise<string> => {
  try {
    // Create the schedule
    const schedule: Omit<NotificationSchedule, 'id' | 'createdAt' | 'updatedAt'> = {
      templateType,
      templateId: '', // Will be populated by the system
      frequency: 'recurring',
      isActive: true,
      recurringSchedule: {
        interval: recurringOptions.interval,
        unit: recurringOptions.unit,
        maxOccurrences: recurringOptions.maxOccurrences,
        endDate: recurringOptions.endDate
    },
      conditions,
      metadata,
      executionStats: {
        totalRuns: 0,
        successfulRuns: 0,
        failedRuns: 0,
        lastRunStatus: 'success',
        lastRunTime: 0,
        notificationsSent: 0
    }
  };

    return await createNotificationSchedule(schedule);
} catch (error) {
    console.error('Error creating recurring schedule:', error);
    throw error;
}
};

/**
 * Create a custom notification schedule
 */
export const createCustomSchedule = async (
  templateType: NotificationTemplateType,
  customOptions: {
    days?: number[];
    hours?: number[];
    minutes?: number[];
    monthDays?: number[];
    months?: number[];
},
  conditions?: NotificationSchedule['conditions'],
  metadata?: Record<string, unknown>
): Promise<string> => {
  try {
    // Create the schedule
    const schedule: Omit<NotificationSchedule, 'id' | 'createdAt' | 'updatedAt'> = {
      templateType,
      templateId: '', // Will be populated by the system
      frequency: 'custom',
      isActive: true,
      customSchedule: {
        days: customOptions.days,
        hours: customOptions.hours,
        minutes: customOptions.minutes,
        monthDays: customOptions.monthDays,
        months: customOptions.months
    },
      conditions,
      metadata,
      executionStats: {
        totalRuns: 0,
        successfulRuns: 0,
        failedRuns: 0,
        lastRunStatus: 'success',
        lastRunTime: 0,
        notificationsSent: 0
    }
  };

    return await createNotificationSchedule(schedule);
} catch (error) {
    console.error('Error creating custom schedule:', error);
    throw error;
}
};

/**
 * Update a notification schedule
 */
export const updateNotificationSchedule = async (scheduleId: string, schedule: Partial<NotificationSchedule>): Promise<void> => {
  try {
    const scheduleRef = doc(firestore, 'notificationSchedules', scheduleId);

    await updateDoc(scheduleRef, {
      ...schedule,
      updatedAt: new Date().toISOString()
  });
} catch (error) {
    console.error('Error updating notification schedule:', error);
    throw error;
}
};

/**
 * Delete a notification schedule
 */
export const deleteNotificationSchedule = async (scheduleId: string): Promise<void> => {
  try {
    const scheduleRef = doc(firestore, 'notificationSchedules', scheduleId);
    await deleteDoc(scheduleRef);
} catch (error) {
    console.error('Error deleting notification schedule:', error);
    throw error;
}
};

/**
 * Get user notification preferences
 */
export const getUserNotificationPreferences = async (userId: string): Promise<NotificationPreference | null> => {
  try {
    const prefRef = doc(firestore, 'users', userId, 'settings', 'notifications');
    const prefSnapshot = await getDoc(prefRef);

    if (!prefSnapshot.exists()) {
      // Return default preferences if none exist
      return {
        userId,
        email: true,
        inApp: true,
        courseProgress: true,
        courseCompletion: true,
        certificateExpiration: true,
        newCourseAvailable: true,
        inactivityReminder: true,
        updatedAt: new Date().toISOString()
    };
  }

    return {
      userId,
      ...prefSnapshot.data()
  } as NotificationPreference;
} catch (error) {
    console.error('Error getting user notification preferences:', error);
    throw error;
}
};

/**
 * Update user notification preferences
 */
export const updateUserNotificationPreferences = async (userId: string, preferences: Partial<NotificationPreference>): Promise<void> => {
  try {
    const prefRef = doc(firestore, 'users', userId, 'settings', 'notifications');

    await updateDoc(prefRef, {
      ...preferences,
      updatedAt: new Date().toISOString()
  });
} catch (error) {
    console.error('Error updating user notification preferences:', error);
    throw error;
}
};

/**
 * Create default notification preferences for a user
 */
export const createDefaultNotificationPreferences = async (userId: string): Promise<void> => {
  try {
    const prefRef = doc(firestore, 'users', userId, 'settings', 'notifications');
    const prefSnapshot = await getDoc(prefRef);

    // Only create if it doesn't exist
    if (!prefSnapshot.exists()) {
      await updateDoc(prefRef, {
        userId,
        email: true,
        inApp: true,
        courseProgress: true,
        courseCompletion: true,
        certificateExpiration: true,
        newCourseAvailable: true,
        inactivityReminder: true,
        updatedAt: new Date().toISOString()
    });
  }
} catch (error) {
    console.error('Error creating default notification preferences:', error);
    throw error;
}
};

/**
 * Handle notification delivery retry
 */
export const handleNotificationRetry = async (
  userId: string,
  type: NotificationTemplateType,
  data: Record<string, unknown>,
  retryConfig?: RetryConfig
): Promise<boolean> => {
  try {
    // Default retry config
    const config = retryConfig || {
      maxRetries: 3,
      retryDelay: 15,  // 15 minutes
      currentRetries: 0
  };

    // Increment retry count
    const currentRetries = (config.currentRetries || 0) + 1;

    // Check if we've exceeded max retries
    if (currentRetries > config.maxRetries) {
      console.error(`Max retries (${config.maxRetries}) exceeded for notification to user ${userId} of type ${type}`);
      return false;
  }

    // Schedule retry
    const retryTime = new Date();
    retryTime.setMinutes(retryTime.getMinutes() + config.retryDelay);

    // Create a retry record in Firestore
    const retryRef = collection(firestore, 'notificationRetries');
    await addDoc(retryRef, {
      userId,
      type,
      data,
      retryConfig: {
        ...config,
        currentRetries
    },
      scheduledFor: retryTime.toISOString(),
      createdAt: new Date().toISOString()
  });

    console.log(`Scheduled retry #${currentRetries} for notification to user ${userId} of type ${type} at ${retryTime.toISOString()}`);
    return true;
} catch (error) {
    console.error('Error scheduling notification retry:', error);
    return false;
}
};

/**
 * Process notification retries
 */
export const processNotificationRetries = async (): Promise<number> => {
  try {
    const now = new Date();

    // Get all retries that are due
    const retriesRef = collection(firestore, 'notificationRetries');
    const q = query(
      retriesRef,
      where('scheduledFor', '<=', now.toISOString())
    );

    const retriesSnapshot = await getDocs(q);
    let successCount = 0;

    for (const retryDoc of retriesSnapshot.docs) {
      const retry = retryDoc.data() as NotificationRetryData;

      try {
        // Attempt to send the notification
        const success = await sendNotificationByType(
          retry.userId,
          retry.type,
          retry.data
        );

        if (success) {
          // If successful, delete the retry record
          await deleteDoc(retryDoc.ref);
          successCount++;
      } else {
          // If failed, schedule another retry if possible
          const retryScheduled = await handleNotificationRetry(
            retry.userId,
            retry.type,
            retry.data,
            retry.retryConfig
          );

          if (!retryScheduled) {
            // If no more retries possible, delete the retry record
            await deleteDoc(retryDoc.ref);
        }
      }
    } catch (error) {
        console.error(`Error processing retry for notification to user ${retry.userId}:`, error);

        // Schedule another retry if possible
        const retryScheduled = await handleNotificationRetry(
          retry.userId,
          retry.type,
          retry.data,
          retry.retryConfig
        );

        if (!retryScheduled) {
          // If no more retries possible, delete the retry record
          await deleteDoc(retryDoc.ref);
      }
    }
  }

    return successCount;
} catch (error) {
    console.error('Error processing notification retries:', error);
    return 0;
}
};

/**
 * Get notification statistics
 */
export const getNotificationStats = async (): Promise<{
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  byType: Record<string, {sent: number; opened: number }>;
}> => {
  try {
    // Get email logs
    const logsRef = collection(firestore, 'emailLogs');
    const logsSnapshot = await getDocs(logsRef);

    // Get template stats
    const templatesRef = collection(firestore, 'emailTemplates');
    const templatesSnapshot = await getDocs(templatesRef);

    // Initialize stats
    let totalSent = 0;
    let totalOpened = 0;
    let totalClicked = 0;
    let totalBounced = 0;
    const byType: Record<string, {sent: number; opened: number }> = {};

    // Process email logs
    logsSnapshot.docs.forEach(doc => {
      const log = doc.data() as EmailLogData;

      if (log.status === 'sent') {
        totalSent++;
    }

      if (log.opened) {
        totalOpened++;
    }

      if (log.clicked) {
        totalClicked++;
    }

      if (log.status === 'bounced') {
        totalBounced++;
    }

      // Track by type
      if (log.templateType && typeof log.templateType === 'string') {
        if (!byType[log.templateType]) {
          byType[log.templateType] = {sent: 0, opened: 0 };
      }

        if (log.status === 'sent') {
          byType[log.templateType].sent++;
      }

        if (log.opened) {
          byType[log.templateType].opened++;
      }
    }
  });

    // Add template stats
    templatesSnapshot.docs.forEach(doc => {
      const template = doc.data() as EmailTemplateDataForStats;

      if (template.stats) {
        totalSent += template.stats.sent || 0;
        totalOpened += template.stats.opened || 0;
        totalClicked += template.stats.clicked || 0;
        totalBounced += template.stats.bounced || 0;

        // Track by type
        if (template.type && typeof template.type === 'string' && template.stats) {
          if (!byType[template.type]) {
            byType[template.type] = {sent: 0, opened: 0 };
        }

          byType[template.type].sent += template.stats.sent || 0;
          byType[template.type].opened += template.stats.opened || 0;
      }
    }
  });

    return {
      totalSent,
      totalOpened,
      totalClicked,
      totalBounced,
      byType
  };
} catch (error) {
    console.error('Error getting notification stats:', error);
    // Return empty stats on error
    return {
      totalSent: 0,
      totalOpened: 0,
      totalClicked: 0,
      totalBounced: 0,
      byType: {}
  };
}
};

/**
 * Check if notification should respect do not disturb settings
 */
export const shouldRespectDoNotDisturb = (type: NotificationTemplateType): boolean => {
  // Some notification types should always be sent regardless of DND settings
  const alwaysSendTypes = [
    'course_completion',
    'certificate_expiration',
    'enrollment_confirmation'
  ];

  return !alwaysSendTypes.includes(type);
};

/**
 * Check if current time is within do not disturb period
 */
export const isInDoNotDisturbPeriod = (doNotDisturb: NotificationPreference['doNotDisturb']): boolean => {
  if (!doNotDisturb || !doNotDisturb.enabled) {
    return false;
}

  const now = new Date();
  const currentDay = now.getDay(); // 0-6, Sunday-Saturday

  // Check if current day is in DND days
  if (doNotDisturb.days && doNotDisturb.days.length > 0) {
    if (!doNotDisturb.days.includes(currentDay)) {
      return false;
  }
}

  // If no time range specified, DND applies to the whole day
  if (!doNotDisturb.startTime || !doNotDisturb.endTime) {
    return true;
}

  // Parse DND time range
  const [startHour, startMinute] = doNotDisturb.startTime.split(':').map(Number);
  const [endHour, endMinute] = doNotDisturb.endTime.split(':').map(Number);

  const startTime = new Date(now);
  startTime.setHours(startHour, startMinute, 0, 0);

  const endTime = new Date(now);
  endTime.setHours(endHour, endMinute, 0, 0);

  // Handle overnight DND periods
  if (endTime < startTime) {
    // If end time is before start time, it spans overnight
    return now >= startTime || now <= endTime;
} else {
    // Normal time range within the same day
    return now >= startTime && now <= endTime;
}
};

/**
 * Send a notification based on type and data
 */
export const sendNotificationByType = async (
  userId: string,
  type: NotificationTemplateType,
  data: NotificationDataForSend,
  options?: {
    bypassPreferences?: boolean;
    bypassDoNotDisturb?: boolean;
    retryOnFailure?: boolean;
}
): Promise<boolean> => {
  try {
    const opts = options || {
      bypassPreferences: false,
      bypassDoNotDisturb: false,
      retryOnFailure: true
  };

    // Get user preferences
    const preferences = await getUserNotificationPreferences(userId);
    if (!preferences) {
      console.error('User notification preferences not found');
      return false;
  }

    // Check if this notification type is enabled for the user
    if (!opts.bypassPreferences) {
      // Convert snake_case to camelCase for preference lookup
      const preferenceName = type.replace(/_([a-z])/g, (_g, letter) => letter.toUpperCase());

      // Check if the preference exists and is set to false
      if (preferences[preferenceName as keyof NotificationPreference] === false) {
        console.log(`Notification type ${type} is disabled for user ${userId}`);
        return false;
    }

      // Check do not disturb settings
      if (!opts.bypassDoNotDisturb &&
          shouldRespectDoNotDisturb(type) &&
          preferences.doNotDisturb &&
          isInDoNotDisturbPeriod(preferences.doNotDisturb)) {
        console.log(`Do not disturb is active for user ${userId}`);

        // Schedule a retry for after the DND period if retry is enabled
        if (opts.retryOnFailure) {
          // Calculate retry time - default to 8 hours later if we can't determine end of DND
          const retryTime = new Date();
          retryTime.setHours(retryTime.getHours() + 8);

          // If DND end time is specified, use that instead
          if (preferences.doNotDisturb?.endTime) {
            const [endHour, endMinute] = preferences.doNotDisturb.endTime.split(':').map(Number);
            retryTime.setHours(endHour, endMinute + 5, 0, 0); // Add 5 minutes after DND ends

            // If the calculated time is in the past, add a day
            if (retryTime < new Date()) {
              retryTime.setDate(retryTime.getDate() + 1);
          }
        }

          // Create a retry record
          const retryRef = collection(firestore, 'notificationRetries');
          await addDoc(retryRef, {
            userId,
            type,
            data,
            retryConfig: {
              maxRetries: 3,
              retryDelay: 60, // 1 hour
              currentRetries: 0
          },
            scheduledFor: retryTime.toISOString(),
            createdAt: new Date().toISOString(),
            reason: 'do_not_disturb'
        });

          console.log(`Scheduled notification for after DND period at ${retryTime.toISOString()}`);
      }

        return false;
    }
  }

    // Get user data
    const user = await getUserById(userId);
    if (!user) {
      console.error('User not found');
      return false;
  }

    // Prepare variables for template
    // Convert all values to strings to ensure compatibility with Firestore
    const variables: Record<string, string> = {
      firstName: user.firstName || user.displayName?.split(' ')[0] || 'Student',
      lastName: user.lastName || user.displayName?.split(' ').slice(1).join(' ') || '',
      email: user.email || '',
      // Convert all data values to strings to ensure they're compatible with Record<string, string>
      ...Object.entries(data).reduce((acc, [key, value]) => {
        // Skip undefined values as Firestore doesn't support them
        if (value !== undefined) {
          // Convert all values to strings
          if (value === null) {
            acc[key] = '';
          } else if (typeof value === 'object') {
            acc[key] = JSON.stringify(value);
          } else {
            acc[key] = String(value);
          }
        }
        return acc;
      }, {} as Record<string, string>)
    };

    let inAppSuccess = true;
    let emailSuccess = true;
    let pushSuccess = true;
    let smsSuccess = true;

    // Send in-app notification if enabled
    if (preferences.inApp) {
      try {
        await createNotification({
          userId,
          type,
          title: data.title || getDefaultTitle(type),
          message: data.message || getDefaultMessage(type, variables),
          link: data.link,
          data: data as Record<string, unknown>, // Cast for now, as createNotification expects Record<string, unknown>
          priority: data.priority === 'high' ? 'high' : data.priority === 'low' ? 'low' : 'medium'
      });
    } catch (error) {
        console.error('Error sending in-app notification:', error);
        inAppSuccess = false;
    }
  }

    // Send email notification if enabled
    if (preferences.email) {
      try {
        const emailTemplate = await getEmailTemplateByType(type);
        if (emailTemplate) {
          const renderedTemplate = renderEmailTemplate(emailTemplate, variables);

          await sendEmail({
            to: user.email,
            subject: renderedTemplate.subject,
            html: renderedTemplate.htmlContent,
            text: renderedTemplate.textContent,
            metadata: {
              notificationType: type,
              userId
          }
        });
      } else {
          console.warn(`Email template for type ${type} not found`);
          emailSuccess = false;
      }
    } catch (error) {
        console.error('Error sending email notification:', error);
        emailSuccess = false;
    }
  }

    // Send push notification if enabled
    if (preferences.push) {
      // Push notification implementation would go here
      // For now, we'll just mark it as successful
      pushSuccess = true;
  }

    // Send SMS notification if enabled
    if (preferences.sms) {
      // SMS notification implementation would go here
      // For now, we'll just mark it as successful
      smsSuccess = true;
  }

    // Check if all enabled channels were successful
    const allSuccess =
      (!preferences.inApp || inAppSuccess) &&
      (!preferences.email || emailSuccess) &&
      (!preferences.push || pushSuccess) &&
      (!preferences.sms || smsSuccess);

    // If any channel failed and retry is enabled, schedule a retry
    if (!allSuccess && opts.retryOnFailure) {
      await handleNotificationRetry(userId, type, data);
  }

    // Log notification attempt
    await addDoc(collection(firestore, 'notificationLogs'), {
      userId,
      type,
      channels: {
        inApp: preferences.inApp ? (inAppSuccess ? 'success' : 'failure') : 'disabled',
        email: preferences.email ? (emailSuccess ? 'success' : 'failure') : 'disabled',
        push: preferences.push ? (pushSuccess ? 'success' : 'failure') : 'disabled',
        sms: preferences.sms ? (smsSuccess ? 'success' : 'failure') : 'disabled'
    },
      timestamp: new Date().toISOString(),
      data: {
        title: data.title || getDefaultTitle(type),
        link: data.link
    } as Record<string, unknown> // Ensure this object matches Record<string, unknown>
  });

    return allSuccess;
} catch (error) {
    console.error('Error sending notification:', error);

    // If retry is enabled, schedule a retry
    if (options?.retryOnFailure !== false) {
      await handleNotificationRetry(userId, type, data);
    }

    return false;
  }
};

/**
 * Check if a schedule is due to run
 */
export const isScheduleDue = (schedule: NotificationSchedule): boolean => {
  try {
    const now = new Date();

    // If schedule has never run, it's due
    if (!schedule.lastRun) {
      return true;
  }

    const lastRun = new Date(schedule.lastRun);

    // If nextRun is specified and it's in the future, not due yet
    if (schedule.nextRun) {
      const nextRun = new Date(schedule.nextRun);
      if (nextRun > now) {
        return false;
    }
  }

    // Check based on frequency
    switch (schedule.frequency) {
      case 'immediately': {
        // Immediately schedules run once and are then marked inactive
        return !schedule.lastRun;
      }

      case 'daily': {
        // Check if last run was yesterday or earlier
        const oneDayAgo = new Date(now);
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        return lastRun <= oneDayAgo;
      }

      case 'weekly': {
        // Check if last run was 7 days ago or earlier
        const oneWeekAgo = new Date(now);
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        return lastRun <= oneWeekAgo;
      }

      case 'monthly': {
        // Check if last run was in a previous month
        const oneMonthAgo = new Date(now);
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        return lastRun <= oneMonthAgo;
      }

      case 'recurring': {
        if (!schedule.recurringSchedule) {
          return false;
        }

        // Check if recurring schedule is due
        const {interval, unit, endDate, maxOccurrences } = schedule.recurringSchedule;

        // Check if schedule has reached max occurrences
        if (maxOccurrences && schedule.executionStats && schedule.executionStats.totalRuns >= maxOccurrences) {
          return false;
        }

        // Check if schedule has reached end date
        if (endDate && new Date(endDate) < now) {
          return false;
        }

        // Calculate next run time based on interval and unit
        const nextRunTime = new Date(lastRun);
        switch (unit) {
          case 'minutes':
            nextRunTime.setMinutes(nextRunTime.getMinutes() + interval);
            break;
          case 'hours':
            nextRunTime.setHours(nextRunTime.getHours() + interval);
            break;
          case 'days':
            nextRunTime.setDate(nextRunTime.getDate() + interval);
            break;
          case 'weeks':
            nextRunTime.setDate(nextRunTime.getDate() + (interval * 7));
            break;
          case 'months':
            nextRunTime.setMonth(nextRunTime.getMonth() + interval);
            break;
        }
        return now >= nextRunTime;
      }

      case 'custom': {
        if (!schedule.customSchedule) {
          return false;
        }

        // For custom schedules, check if current time matches any of the specified times
        const {days, hours, minutes, monthDays, months } = schedule.customSchedule;

        // Check day of week (0-6, Sunday-Saturday)
        if (days && days.length > 0 && !days.includes(now.getDay())) {
          return false;
        }

        // Check hour (0-23)
        if (hours && hours.length > 0 && !hours.includes(now.getHours())) {
          return false;
        }

        // Check minute (0-59)
        if (minutes && minutes.length > 0 && !minutes.includes(now.getMinutes())) {
          return false;
        }

        // Check day of month (1-31)
        if (monthDays && monthDays.length > 0 && !monthDays.includes(now.getDate())) {
          return false;
        }

        // Check month (1-12)
        if (months && months.length > 0 && !months.includes(now.getMonth() + 1)) {
          return false;
        }

        // If we've made it this far, check if it's been at least 1 hour since last run
        // This prevents custom schedules from running multiple times in the same time slot
        const oneHourAgo = new Date(now);
        oneHourAgo.setHours(oneHourAgo.getHours() - 1);
        return lastRun <= oneHourAgo;
      }

      default: {
        return false;
      }
  }
} catch (error) {
    console.error('Error checking if schedule is due:', error);
    return false;
}
};

/**
 * Calculate the next run time for a schedule
 */
export const calculateNextRunTime = (schedule: NotificationSchedule): Date | null => {
  try {
    const now = new Date();

    switch (schedule.frequency) {
      case 'immediately': {
        // Immediately schedules don't have a next run
        return null;
      }

      case 'daily': {
        // Next run is tomorrow at the same time
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        // Reset to the beginning of the hour
        tomorrow.setMinutes(0);
        tomorrow.setSeconds(0);
        tomorrow.setMilliseconds(0);
        return tomorrow;
      }

      case 'weekly': {
        // Next run is 7 days from now
        const nextWeek = new Date(now);
        nextWeek.setDate(nextWeek.getDate() + 7);
        // Reset to the beginning of the hour
        nextWeek.setMinutes(0);
        nextWeek.setSeconds(0);
        nextWeek.setMilliseconds(0);
        return nextWeek;
      }

      case 'monthly': {
        // Next run is next month on the same day
        const nextMonth = new Date(now);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        // Reset to the beginning of the hour
        nextMonth.setMinutes(0);
        nextMonth.setSeconds(0);
        nextMonth.setMilliseconds(0);
        return nextMonth;
      }

      case 'recurring': {
        if (!schedule.recurringSchedule) {
          return null;
      }

        // Calculate next run time based on last run and interval
        const lastRun = schedule.lastRun ? new Date(schedule.lastRun) : now;
        const {interval, unit } = schedule.recurringSchedule;

        const nextRun = new Date(lastRun);
        switch (unit) {
          case 'minutes':
            nextRun.setMinutes(nextRun.getMinutes() + interval);
            break;
          case 'hours':
            nextRun.setHours(nextRun.getHours() + interval);
            break;
          case 'days':
            nextRun.setDate(nextRun.getDate() + interval);
            break;
          case 'weeks':
            nextRun.setDate(nextRun.getDate() + (interval * 7));
            break;
          case 'months':
            nextRun.setMonth(nextRun.getMonth() + interval);
            break;
        }
        return nextRun;
      }

      case 'custom': {
        if (!schedule.customSchedule) {
          return null;
        }
        const {days, hours, minutes, monthDays, months } = schedule.customSchedule;

        // Start with current time and iterate until we find a matching time
        const nextCustomRun = new Date(now);
        nextCustomRun.setSeconds(0);
        nextCustomRun.setMilliseconds(0);

        // Add one minute to start from the next minute
        nextCustomRun.setMinutes(nextCustomRun.getMinutes() + 1);

        // Maximum iterations to prevent infinite loop
        const MAX_ITERATIONS = 10000;
        let iterations = 0;

        while (iterations < MAX_ITERATIONS) {
          iterations++;

          // Check all conditions
          let matches = true;

          // Check day of week
          if (days && days.length > 0 && !days.includes(nextCustomRun.getDay())) {
            matches = false;
        }

          // Check hour
          if (hours && hours.length > 0 && !hours.includes(nextCustomRun.getHours())) {
            matches = false;
        }

          // Check minute
          if (minutes && minutes.length > 0 && !minutes.includes(nextCustomRun.getMinutes())) {
            matches = false;
        }

          // Check day of month
          if (monthDays && monthDays.length > 0 && !monthDays.includes(nextCustomRun.getDate())) {
            matches = false;
        }

          // Check month
          if (months && months.length > 0 && !months.includes(nextCustomRun.getMonth() + 1)) {
            matches = false;
        }

          if (matches) {
            return nextCustomRun;
        }

          // Increment by one minute and try again
          nextCustomRun.setMinutes(nextCustomRun.getMinutes() + 1);
      }

        // If we couldn't find a match, default to 24 hours from now
        const oneDayFromNow = new Date(now);
        oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);
        return oneDayFromNow;
      }

      default:
        return null;
    }
} catch (error) {
    console.error('Error calculating next run time:', error);
    return null;
}
};

/**
 * Update schedule after execution
 */
export const updateScheduleAfterExecution = async (
  scheduleId: string,
  executionStats: {
    success: boolean;
    notificationsSent: number;
    executionTime: number;
}
): Promise<void> => {
  try {
    const scheduleRef = doc(firestore, 'notificationSchedules', scheduleId);
    const scheduleSnapshot = await getDoc(scheduleRef);

    if (!scheduleSnapshot.exists()) {
      throw new Error(`Schedule with ID ${scheduleId} not found`);
  }

    const schedule = {
      id: scheduleId,
      ...scheduleSnapshot.data()
  } as NotificationSchedule;

    const now = new Date();
    const nextRun = calculateNextRunTime(schedule);

    // Update execution stats
    const currentStats = schedule.executionStats || {
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      lastRunStatus: 'success',
      lastRunTime: 0,
      notificationsSent: 0
  };

    const updatedStats = {
      totalRuns: currentStats.totalRuns + 1,
      successfulRuns: executionStats.success ? currentStats.successfulRuns + 1 : currentStats.successfulRuns,
      failedRuns: executionStats.success ? currentStats.failedRuns : currentStats.failedRuns + 1,
      lastRunStatus: executionStats.success ? 'success' : 'failure',
      lastRunTime: executionStats.executionTime,
      notificationsSent: currentStats.notificationsSent + executionStats.notificationsSent
  };

    // For immediately schedules, mark as inactive after running
    const isActive = schedule.frequency === 'immediately' ? false : schedule.isActive;

    // Update the schedule
    await updateDoc(scheduleRef, {
      lastRun: now.toISOString(),
      nextRun: nextRun ? nextRun.toISOString() : null,
      isActive,
      executionStats: updatedStats,
      updatedAt: now.toISOString()
  });

} catch (error) {
    console.error('Error updating schedule after execution:', error);
    throw error;
}
};

/**
 * Process due notifications based on schedules
 */
export const processDueNotifications = async (): Promise<number> => {
  try {
    // Get all active notification schedules
    const schedulesRef = collection(firestore, 'notificationSchedules');
    const q = query(schedulesRef, where('isActive', '==', true));
    const schedulesSnapshot = await getDocs(q);

    let processedCount = 0;
    const processingErrors: {scheduleId: string; error: string }[] = [];

    for (const scheduleDoc of schedulesSnapshot.docs) {
      const schedule = {
        id: scheduleDoc.id,
        ...scheduleDoc.data()
    } as NotificationSchedule;

      // Check if schedule is due to run
      if (!isScheduleDue(schedule)) {
        continue;
    }

      const startTime = Date.now();
      let notificationsSent = 0;
      let success = true;

      try {
        // Process based on schedule type
        switch (schedule.templateType) {
          case 'course_progress': {
            notificationsSent = await processCourseProgressNotifications(schedule);
            break;
          }
          case 'course_completion': {
            notificationsSent = await processCourseCompletionNotifications(schedule);
            break;
          }
          case 'certificate_expiration': {
            notificationsSent = await processCertificateExpirationNotifications(schedule);
            break;
          }
          case 'new_course_available': {
            notificationsSent = await processNewCourseNotifications(schedule);
            break;
          }
          case 'inactivity_reminder': {
            notificationsSent = await processInactivityNotifications(schedule);
            break;
          }
          default: {
            console.warn(`Unknown notification template type: ${schedule.templateType}`);
            break;
          }
      }

        processedCount += notificationsSent;
    } catch (error) {
        success = false;
        processingErrors.push({
          scheduleId: schedule.id,
          error: error instanceof Error ? error.message : String(error)
      });
        console.error(`Error processing schedule ${schedule.id}:`, error);
    }

      // Update schedule after execution
      const executionTime = Date.now() - startTime;
      await updateScheduleAfterExecution(schedule.id, {
        success,
        notificationsSent,
        executionTime
    });
  }

    // Log any errors that occurred during processing
    if (processingErrors.length > 0) {
      console.error(`Errors occurred while processing notifications:`, processingErrors);
  }

    return processedCount;
} catch (error) {
    console.error('Error processing due notifications:', error);
    return 0;
}
};

/**
 * Process course progress notifications
 */
const processCourseProgressNotifications = async (schedule: NotificationSchedule): Promise<number> => {
  try {
    // Get course progress records that match the conditions
    const progressThreshold = schedule.conditions?.courseProgress || 50;
    const progressRef = collection(firestore, 'courseProgress');
    const q = query(
      progressRef,
      where('progress', '>=', progressThreshold - 5), // Within 5% of threshold
      where('progress', '<=', progressThreshold + 5),
      where('completed', '==', false),
      where('notified', '==', false)
    );

    const progressSnapshot = await getDocs(q);
    let count = 0;

    for (const progressDoc of progressSnapshot.docs) {
      const progress = progressDoc.data();
      const userId = progress.userId as string;
      const courseId = progress.courseId as string;

      // Get course details
      const course = await getCourseById(courseId);
      if (!course || !course.title) continue;

      // Send notification
      const success = await sendNotificationByType(userId, 'course_progress', {
        courseId,
        courseName: course.title,
        progress: progress.progress as number,
        link: `/courses/${courseId}/learn`,
        title: `You're making great progress in ${course.title}!`,
        message: `You've completed ${progress.progress as number}% of "${course.title}". Keep up the good work!`
    });

      if (success) {
        // Mark as notified
        await updateDoc(progressDoc.ref, {notified: true });
        count++;
    }
  }

    return count;
} catch (error) {
    console.error('Error processing course progress notifications:', error);
    return 0;
}
};

/**
 * Process course completion notifications
 */
const processCourseCompletionNotifications = async (_schedule: NotificationSchedule): Promise<number> => {
  try {
    // Get course progress records that are completed but not notified
    const progressRef = collection(firestore, 'courseProgress');
    const q = query(
      progressRef,
      where('completed', '==', true),
      where('completionNotified', '==', false)
    );

    const progressSnapshot = await getDocs(q);
    let count = 0;

    for (const progressDoc of progressSnapshot.docs) {
      const progress = progressDoc.data();
      const userId = progress.userId as string;
      const courseId = progress.courseId as string;

      // Get course details
      const course = await getCourseById(courseId);
      if (!course || !course.title) continue;

      // Send notification
      const success = await sendNotificationByType(userId, 'course_completion', {
        courseId,
        courseName: course.title,
        completionDate: new Date(progress.completedAt as string | number | Date).toLocaleDateString(),
        link: `/courses/${courseId}/certificate`,
        title: `Congratulations on completing ${course.title}!`,
        message: `You've successfully completed "${course.title}". Don't forget to download your certificate!`
    });

      if (success) {
        // Mark as notified
        await updateDoc(progressDoc.ref, {completionNotified: true });
        count++;
    }
  }

    return count;
} catch (error) {
    console.error('Error processing course completion notifications:', error);
    return 0;
}
};

/**
 * Process certificate expiration notifications
 */
const processCertificateExpirationNotifications = async (_schedule: NotificationSchedule): Promise<number> => {
  try {
    // Get certificates that are about to expire
    const daysBeforeExpiration = 30; // Default to 30 days
    const now = new Date();
    const expirationDate = new Date();
    expirationDate.setDate(now.getDate() + daysBeforeExpiration);

    const certificatesRef = collection(firestore, 'certificates');
    const q = query(
      certificatesRef,
      where('expirationDate', '<=', expirationDate.toISOString()),
      where('expirationDate', '>', now.toISOString()),
      where('expirationNotified', '==', false)
    );

    const certificatesSnapshot = await getDocs(q);
    let count = 0;

    for (const certificateDoc of certificatesSnapshot.docs) {
      const certificate = certificateDoc.data();
      const userId = certificate.userId as string;
      const courseId = certificate.courseId as string;

      // Get course details
      const course = await getCourseById(courseId);
      if (!course || !course.title) continue;

      // Calculate days until expiration
      const expirationDate = new Date(certificate.expirationDate as string | number | Date);
      const daysUntilExpiration = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Send notification
      const success = await sendNotificationByType(userId, 'certificate_expiration', {
        courseId,
        courseName: course.title,
        certificateId: certificate.id as string,
        expirationDate: expirationDate.toLocaleDateString(),
        daysUntilExpiration: daysUntilExpiration.toString(),
        link: `/courses/${courseId}/certificate`,
        title: `Your certificate for ${course.title} is expiring soon`,
        message: `Your certificate for "${course.title}" will expire in ${daysUntilExpiration} days. Consider renewing your certification.`
    });

      if (success) {
        // Mark as notified
        await updateDoc(certificateDoc.ref, {expirationNotified: true });
        count++;
    }
  }

    return count;
} catch (error) {
    console.error('Error processing certificate expiration notifications:', error);
    return 0;
}
};

/**
 * Process new course notifications
 */
const processNewCourseNotifications = async (_schedule: NotificationSchedule): Promise<number> => {
  try {
    // Get courses that were recently published
    const daysThreshold = 7; // Consider courses published in the last 7 days
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);

    const coursesRef = collection(firestore, 'courses');
    const q = query(
      coursesRef,
      where('status', '==', 'published'),
      where('publishedAt', '>=', thresholdDate.toISOString()),
      where('newCourseNotificationSent', '==', false)
    );

    const coursesSnapshot = await getDocs(q);
    let count = 0;

    for (const courseDoc of coursesSnapshot.docs) {
      const courseData = courseDoc.data();
      const course = {
        id: courseDoc.id,
        title: courseData.title || 'New Course',
        description: courseData.description || 'Check out our new course!'
    };

      // Get all users
      const usersRef = collection(firestore, 'users');
      const usersSnapshot = await getDocs(usersRef);

      for (const userDoc of usersSnapshot.docs) {
        const user = {
          id: userDoc.id,
          ...userDoc.data()
      };

        // Send notification
        const success = await sendNotificationByType(user.id, 'new_course_available', {
          courseId: course.id,
          courseName: course.title,
          courseDescription: course.description,
          link: `/courses/${course.id}`,
          title: `New Course Available: ${course.title}`,
          message: `We've just published a new course: "${course.title}". Check it out and enhance your skills!`
      });

        if (success) {
          count++;
      }
    }

      // Mark course as notified
      await updateDoc(courseDoc.ref, {newCourseNotificationSent: true });
  }

    return count;
} catch (error) {
    console.error('Error processing new course notifications:', error);
    return 0;
}
};

/**
 * Process inactivity notifications
 */
const processInactivityNotifications = async (schedule: NotificationSchedule): Promise<number> => {
  try {
    // Get course enrollments with inactivity
    const daysThreshold = schedule.conditions?.daysSinceLastActivity || 14; // Default to 14 days
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);

    const enrollmentsRef = collection(firestore, 'enrollments');
    const q = query(
      enrollmentsRef,
      where('lastAccessedAt', '<=', thresholdDate.toISOString()),
      where('completed', '==', false),
      where('inactivityNotified', '==', false)
    );

    const enrollmentsSnapshot = await getDocs(q);
    let count = 0;

    for (const enrollmentDoc of enrollmentsSnapshot.docs) {
      const enrollment = enrollmentDoc.data();
      const userId = enrollment.userId as string;
      const courseId = enrollment.courseId as string;

      // Get course details
      const course = await getCourseById(courseId);
      if (!course || !course.title) continue;

      // Calculate days of inactivity
      const lastAccessDate = new Date(enrollment.lastAccessedAt as string | number | Date);
      const daysInactive = Math.floor((new Date().getTime() - lastAccessDate.getTime()) / (1000 * 60 * 60 * 24));

      // Send notification
      const success = await sendNotificationByType(userId, 'inactivity_reminder', {
        courseId,
        courseName: course.title,
        daysInactive: daysInactive.toString(),
        lastAccessDate: lastAccessDate.toLocaleDateString(),
        link: `/courses/${courseId}/learn`,
        title: `Continue your learning journey with ${course.title}`,
        message: `It's been ${daysInactive} days since you last accessed "${course.title}". Don't lose your momentum!`
    });

      if (success) {
        // Mark as notified
        await updateDoc(enrollmentDoc.ref, {inactivityNotified: true });
        count++;
    }
  }

    return count;
} catch (error) {
    console.error('Error processing inactivity notifications:', error);
    return 0;
}
};

/**
 * Get default notification title based on type
 */
const getDefaultTitle = (type: NotificationTemplateType): string => {
  switch (type) {
    case 'course_progress':
      return 'Course Progress Update';
    case 'course_completion':
      return 'Course Completed';
    case 'certificate_expiration':
      return 'Certificate Expiring Soon';
    case 'new_course_available':
      return 'New Course Available';
    case 'inactivity_reminder':
      return 'Continue Your Learning';
    case 'enrollment_confirmation':
      return 'Enrollment Confirmed';
    case 'quiz_completion':
      return 'Quiz Completed';
    case 'achievement_unlocked':
      return 'Achievement Unlocked';
    case 'welcome_message':
      return 'Welcome to Closer College';
    default:
      return 'Notification';
}
};

/**
 * Get default notification message based on type
 */
const getDefaultMessage = (type: NotificationTemplateType, variables: Record<string, string>): string => {
  const firstName = variables.firstName || 'Student';

  switch (type) {
    case 'course_progress':
      return `Hi ${firstName}, you're making great progress in your course!`;
    case 'course_completion':
      return `Congratulations ${firstName}! You've completed your course.`;
    case 'certificate_expiration':
      return `Hi ${firstName}, your certificate is expiring soon.`;
    case 'new_course_available':
      return `Hi ${firstName}, we've just published a new course you might be interested in.`;
    case 'inactivity_reminder':
      return `Hi ${firstName}, we noticed you haven't accessed your course recently.`;
    case 'enrollment_confirmation':
      return `Hi ${firstName}, your enrollment has been confirmed.`;
    case 'quiz_completion':
      return `Great job ${firstName}! You've completed a quiz.`;
    case 'achievement_unlocked':
      return `Congratulations ${firstName}! You've unlocked a new achievement.`;
    case 'welcome_message':
      return `Welcome to Closer College, ${firstName}! We're excited to have you on board.`;
    default:
      return `Hi ${firstName}, you have a new notification.`;
}
};
