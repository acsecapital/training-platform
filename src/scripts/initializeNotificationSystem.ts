import { initializeDefaultEmailTemplates } from '@/data/defaultEmailTemplates';
import {createEmailTemplate, getEmailTemplates } from '@/services/notificationTemplateService';
import {createNotificationSchedule } from '@/services/notificationSchedulerService';

/**
 * Initialize the notification system by creating default templates and schedules
 */
export const initializeNotificationSystem = async (): Promise<void> => {
  try {
    console.log('Initializing notification system...');
    
    // Check if templates already exist
    const existingTemplates = await getEmailTemplates();
    
    if (existingTemplates.length === 0) {
      console.log('No email templates found. Creating default templates...');
      
      // Create default email templates
      const templateIds = await initializeDefaultEmailTemplates(createEmailTemplate);
      console.log(`Created ${templateIds.length} default email templates`);
      
      // Create default notification schedules
      await createDefaultNotificationSchedules();
      console.log('Created default notification schedules');
  } else {
      console.log(`Found ${existingTemplates.length} existing email templates. Skipping initialization.`);
  }
    
    console.log('Notification system initialization complete');
} catch (error) {
    console.error('Error initializing notification system:', error);
    throw error;
}
};

/**
 * Create default notification schedules
 */
const createDefaultNotificationSchedules = async (): Promise<void> => {
  try {
    // Course Progress Notification Schedule
    await createNotificationSchedule({
      templateId: '', // Will be populated by the system
      templateType: 'course_progress',
      frequency: 'weekly',
      isActive: true,
      conditions: {
        courseProgress: 50 // Notify when user reaches 50% progress
    },
      customSchedule: {
        days: [1, 4], // Monday and Thursday
        hours: [10], // 10 AM
        minutes: [0] // On the hour
    }
  });
    
    // Course Completion Notification Schedule
    await createNotificationSchedule({
      templateId: '', // Will be populated by the system
      templateType: 'course_completion',
      frequency: 'immediately', // Send immediately when course is completed
      isActive: true
  });
    
    // Certificate Expiration Notification Schedule
    await createNotificationSchedule({
      templateId: '', // Will be populated by the system
      templateType: 'certificate_expiration',
      frequency: 'daily',
      isActive: true,
      conditions: {
        daysSinceCertificateIssued: 335 // Notify when certificate is about to expire (assuming 1-year validity)
    }
  });
    
    // New Course Notification Schedule
    await createNotificationSchedule({
      templateId: '', // Will be populated by the system
      templateType: 'new_course_available',
      frequency: 'immediately', // Send immediately when new course is published
      isActive: true
  });
    
    // Inactivity Reminder Schedule
    await createNotificationSchedule({
      templateId: '', // Will be populated by the system
      templateType: 'inactivity_reminder',
      frequency: 'weekly',
      isActive: true,
      conditions: {
        daysSinceLastActivity: 14 // Notify after 14 days of inactivity
    }
  });
} catch (error) {
    console.error('Error creating default notification schedules:', error);
    throw error;
}
};
