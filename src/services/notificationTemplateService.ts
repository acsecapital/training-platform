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
import {
  EmailTemplate,
  EmailTemplateVariable,
  NotificationTemplate,
  NotificationTemplateType
} from '@/types/notification-templates.types';

/**
 * Get all notification templates
 */
export const getNotificationTemplates = async (): Promise<NotificationTemplate[]> => {
  try {
    const templatesRef = collection(firestore, 'notificationTemplates');
    const templatesSnapshot = await getDocs(templatesRef);

    return templatesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
  })) as NotificationTemplate[];
} catch (error) {
    console.error('Error getting notification templates:', error);
    throw error;
}
};

/**
 * Get notification template by ID
 */
export const getNotificationTemplateById = async (templateId: string): Promise<NotificationTemplate | null> => {
  try {
    const templateRef = doc(firestore, 'notificationTemplates', templateId);
    const templateSnapshot = await getDoc(templateRef);

    if (!templateSnapshot.exists()) {
      return null;
  }

    return {
      id: templateSnapshot.id,
      ...templateSnapshot.data()
  } as NotificationTemplate;
} catch (error) {
    console.error('Error getting notification template:', error);
    throw error;
}
};

/**
 * Get notification template by type
 */
export const getNotificationTemplateByType = async (type: NotificationTemplateType): Promise<NotificationTemplate | null> => {
  try {
    const templatesRef = collection(firestore, 'notificationTemplates');
    const q = query(templatesRef, where('type', '==', type), where('isActive', '==', true));
    const templatesSnapshot = await getDocs(q);

    if (templatesSnapshot.empty) {
      return null;
  }

    // Return the first active template of this type
    const templateDoc = templatesSnapshot.docs[0];
    return {
      id: templateDoc.id,
      ...templateDoc.data()
  } as NotificationTemplate;
} catch (error) {
    console.error('Error getting notification template by type:', error);
    throw error;
}
};

/**
 * Create a notification template
 */
export const createNotificationTemplate = async (template: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const templatesRef = collection(firestore, 'notificationTemplates');
    const now = new Date().toISOString();

    const docRef = await addDoc(templatesRef, {
      ...template,
      createdAt: now,
      updatedAt: now
  });

    return docRef.id;
} catch (error) {
    console.error('Error creating notification template:', error);
    throw error;
}
};

/**
 * Update a notification template
 */
export const updateNotificationTemplate = async (templateId: string, template: Partial<NotificationTemplate>): Promise<void> => {
  try {
    const templateRef = doc(firestore, 'notificationTemplates', templateId);

    await updateDoc(templateRef, {
      ...template,
      updatedAt: new Date().toISOString()
  });
} catch (error) {
    console.error('Error updating notification template:', error);
    throw error;
}
};

/**
 * Delete a notification template
 */
export const deleteNotificationTemplate = async (templateId: string): Promise<void> => {
  try {
    const templateRef = doc(firestore, 'notificationTemplates', templateId);
    await deleteDoc(templateRef);
} catch (error) {
    console.error('Error deleting notification template:', error);
    throw error;
}
};

/**
 * Get all email templates
 */
export const getEmailTemplates = async (): Promise<EmailTemplate[]> => {
  try {
    const templatesRef = collection(firestore, 'emailTemplates');
    const templatesSnapshot = await getDocs(templatesRef);

    return templatesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
  })) as EmailTemplate[];
} catch (error) {
    console.error('Error getting email templates:', error);
    throw error;
}
};

/**
 * Get email template by ID
 */
export const getEmailTemplateById = async (templateId: string): Promise<EmailTemplate | null> => {
  try {
    const templateRef = doc(firestore, 'emailTemplates', templateId);
    const templateSnapshot = await getDoc(templateRef);

    if (!templateSnapshot.exists()) {
      return null;
  }

    return {
      id: templateSnapshot.id,
      ...templateSnapshot.data()
  } as EmailTemplate;
} catch (error) {
    console.error('Error getting email template:', error);
    throw error;
}
};

/**
 * Get email template by type
 */
export const getEmailTemplateByType = async (type: NotificationTemplateType): Promise<EmailTemplate | null> => {
  try {
    const templatesRef = collection(firestore, 'emailTemplates');
    const q = query(templatesRef, where('type', '==', type), where('isActive', '==', true));
    const templatesSnapshot = await getDocs(q);

    if (templatesSnapshot.empty) {
      return null;
  }

    // Return the first active template of this type
    const templateDoc = templatesSnapshot.docs[0];
    return {
      id: templateDoc.id,
      ...templateDoc.data()
  } as EmailTemplate;
} catch (error) {
    console.error('Error getting email template by type:', error);
    throw error;
}
};

/**
 * Create an email template
 */
export const createEmailTemplate = async (template: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const templatesRef = collection(firestore, 'emailTemplates');
    const now = new Date().toISOString();

    // Check if version is provided, otherwise set to 1
    const version = template.version || 1;

    // Ensure category is set
    const category = template.category || 'System';

    // Create history entry for new template
    const history = template.history || [];
    history.push({
      versionNumber: version,
      changedBy: 'system', // This should be replaced with actual user ID
      changedAt: now,
      changeDescription: 'Initial creation'
  });

    const docRef = await addDoc(templatesRef, {
      ...template,
      version,
      category,
      history,
      stats: {
        sent: 0,
        opened: 0,
        clicked: 0,
        bounced: 0
    },
      createdAt: now,
      updatedAt: now
  });

    return docRef.id;
} catch (error) {
    console.error('Error creating email template:', error);
    throw error;
}
};

/**
 * Update an email template
 */
export const updateEmailTemplate = async (
  templateId: string,
  template: Partial<EmailTemplate>,
  options?: {
    incrementVersion?: boolean;
    changeDescription?: string;
    changedBy?: string;
}
): Promise<void> => {
  try {
    const templateRef = doc(firestore, 'emailTemplates', templateId);
    const templateSnapshot = await getDoc(templateRef);

    if (!templateSnapshot.exists()) {
      throw new Error(`Template with ID ${templateId} not found`);
  }

    const existingTemplate = templateSnapshot.data() as EmailTemplate;
    const now = new Date().toISOString();

    // Handle versioning
    let version = existingTemplate.version || 1;
    if (options?.incrementVersion) {
      version += 1;
  }

    // Update history
    const history = existingTemplate.history || [];
    if (options?.incrementVersion || options?.changeDescription) {
      history.push({
        versionNumber: version,
        changedBy: options?.changedBy || 'system',
        changedAt: now,
        changeDescription: options?.changeDescription || 'Template updated'
    });
  }

    await updateDoc(templateRef, {
      ...template,
      version,
      history,
      updatedAt: now
  });
} catch (error) {
    console.error('Error updating email template:', error);
    throw error;
}
};

/**
 * Delete an email template
 */
export const deleteEmailTemplate = async (templateId: string): Promise<void> => {
  try {
    const templateRef = doc(firestore, 'emailTemplates', templateId);
    await deleteDoc(templateRef);
} catch (error) {
    console.error('Error deleting email template:', error);
    throw error;
}
};

/**
 * Render an email template with variables
 */
export const renderEmailTemplate = (
  template: EmailTemplate,
  variables: Record<string, string>
): {subject: string; htmlContent: string; textContent: string; previewText?: string } => {
  let subject = template.subject;
  let htmlContent = template.htmlContent;
  let textContent = template.textContent;
  let previewText = template.previewText;

  // Replace variables in the template
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    subject = subject.replace(regex, value);
    htmlContent = htmlContent.replace(regex, value);
    textContent = textContent.replace(regex, value);
    if (previewText) {
      previewText = previewText.replace(regex, value);
  }
});

  return {
    subject,
    htmlContent,
    textContent,
    previewText
};
};

/**
 * Get all template categories
 */
export const getEmailTemplateCategories = async (): Promise<string[]> => {
  try {
    const templatesRef = collection(firestore, 'emailTemplates');
    const templatesSnapshot = await getDocs(templatesRef);

    // Extract unique categories
    const categories = new Set<string>();

    templatesSnapshot.docs.forEach(doc => {
      const template = doc.data() as EmailTemplate;
      if (template.category) {
        categories.add(template.category);
    }
  });

    return Array.from(categories).sort();
} catch (error) {
    console.error('Error getting email template categories:', error);
    throw error;
}
};

/**
 * Get available variables for templates
 */
export const getAvailableEmailVariables = async (): Promise<EmailTemplate['variables']> => {
  try {
    const variablesRef = collection(firestore, 'emailVariables');
    const variablesSnapshot = await getDocs(variablesRef);

    if (variablesSnapshot.empty) {
      // If no variables exist in the collection, initialize with default variables
      const defaultVariables = [
        {name: 'firstName', description: 'User\'s first name', required: false, defaultValue: 'Student First Name'},
        {name: 'lastName', description: 'User\'s last name', required: false, defaultValue: 'Student Last Name'},
        {name: 'email', description: 'User\'s email address', required: false, defaultValue: 'student@example.com'},
        {name: 'fullName', description: 'User\'s full name', required: false, defaultValue: 'Student Name'},
        {name: 'userId', description: 'User\'s unique ID', required: false, defaultValue: '12345'},
        {name: 'courseName', description: 'Name of the course', required: false, defaultValue: 'Course Name'},
        {name: 'courseId', description: 'Course unique ID', required: false, defaultValue: 'course-123'},
        {name: 'courseProgress', description: 'Course progress percentage', required: false, defaultValue: '50%'},
        {name: 'completionDate', description: 'Date of course completion', required: false, defaultValue: new Date().toLocaleDateString() },
        {name: 'certificateUrl', description: 'URL to view certificate', required: false, defaultValue: 'https://example.com/certificate'},
        {name: 'platformName', description: 'Name of the platform', required: false, defaultValue: 'Training Platform'},
        {name: 'platformUrl', description: 'URL of the platform', required: false, defaultValue: 'https://example.com'},
        {name: 'currentDate', description: 'Current date', required: false, defaultValue: new Date().toLocaleDateString() },
        {name: 'unsubscribeUrl', description: 'URL to unsubscribe from emails', required: false, defaultValue: 'https://example.com/unsubscribe'},
        {name: 'supportEmail', description: 'Platform support email', required: false, defaultValue: 'support@example.com'},
        {name: 'companyName', description: 'Company name', required: false, defaultValue: 'Example Inc.'},
        {name: 'companyAddress', description: 'Company physical address', required: false, defaultValue: '123 Main St, City, Country'}
      ];

      // Initialize the collection with default variables
      await Promise.all(defaultVariables.map(variable => addDoc(variablesRef, {
        ...variable,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true
    })));

      return defaultVariables;
  }

    // Return the variables from Firestore
    return variablesSnapshot.docs
      .filter(doc => doc.data().isActive !== false) // Only return active variables
      .map(doc => {
        const data = doc.data();
        return {
          name: data.name as string,
          description: data.description as string,
          required: data.required as boolean,
          defaultValue: data.defaultValue as string,
          type: data.type as string | undefined,
          validation: data.validation as string | undefined
      } as EmailTemplateVariable;
    });
} catch (error) {
    console.error('Error getting available email variables:', error);
    throw error;
}
};

/**
 * Send a test email
 */
export const sendTestEmail = async (
  to: string,
  template: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>,
  testData?: Record<string, string>
): Promise<boolean> => {
  try {
    // Get default test data
    const defaultTestData: Record<string, string> = {
      firstName: 'Test',
      lastName: 'User',
      email: to,
      courseName: 'Sample Course',
      courseProgress: '75%',
      completionDate: new Date().toLocaleDateString(),
      certificateUrl: 'https://example.com/certificate/test',
      platformName: 'Training Platform'
  };

    // Merge with provided test data
    const mergedTestData = {
      ...defaultTestData,
      ...testData
  };

    // Render the template with test data
    const renderedTemplate = renderEmailTemplate(template as EmailTemplate, mergedTestData);

    // Send the email using your email service
    // This is a placeholder - replace with your actual email sending logic
    console.log(`Sending test email to ${to}`);
    console.log(`Subject: ${renderedTemplate.subject}`);
    console.log(`Preview: ${renderedTemplate.previewText || '(No preview text)'}`);

    // Log email sending to Firestore for tracking
    const emailLogsRef = collection(firestore, 'emailLogs');
    await addDoc(emailLogsRef, {
      to,
      subject: renderedTemplate.subject,
      templateId: 'test',
      templateType: template.type,
      templateVersion: template.version || 1,
      isTest: true,
      status: 'sent',
      sentAt: new Date().toISOString()
  });

    // In a real implementation, you would call your email service here
    // For example:
    // await sendEmail({
    //   to,
    //   subject: renderedTemplate.subject,
    //   html: renderedTemplate.htmlContent,
    //   text: renderedTemplate.textContent,
    //   previewText: renderedTemplate.previewText
    // });

    return true;
} catch (error) {
    console.error('Error sending test email:', error);
    return false;
}
};
