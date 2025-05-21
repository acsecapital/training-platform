import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  Timestamp,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import {firestore } from './firebase';

export interface ReminderSettings {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  lastSent?: Timestamp;
}

export interface Reminder {
  id: string;
  userId: string;
  courseId: string;
  courseName: string;
  type: 'progress' | 'completion' | 'inactivity';
  message: string;
  status: 'pending' | 'sent' | 'read';
  createdAt: Timestamp;
  scheduledFor: Timestamp;
  sentAt?: Timestamp;
  readAt?: Timestamp;
}

/**
 * Get reminder settings for a user
 */
export const getUserReminderSettings = async (userId: string): Promise<ReminderSettings> => {
  try {
    const userDoc = await getDoc(doc(firestore, 'users', userId));

    if (!userDoc.exists()) {
      throw new Error('User not found');
  }

    const userData = userDoc.data();

    // Return reminder settings or default values
    return {
      enabled: (userData.reminderSettings?.enabled as boolean) ?? true,
      frequency: (userData.reminderSettings?.frequency as 'daily' | 'weekly' | 'monthly') ?? 'weekly',
      lastSent: userData.reminderSettings?.lastSent as Timestamp | undefined,
  };
} catch (error) {
    console.error('Error getting user reminder settings:', error);
    // Return default settings
    return {
      enabled: true,
      frequency: 'weekly',
  };
}
};

/**
 * Update reminder settings for a user
 */
export const updateUserReminderSettings = async (
  userId: string,
  settings: Partial<ReminderSettings>
): Promise<void> => {
  try {
    const userRef = doc(firestore, 'users', userId);

    await updateDoc(userRef, {
      'reminderSettings.enabled': settings.enabled !== undefined ? settings.enabled : true,
      'reminderSettings.frequency': settings.frequency || 'weekly',
  });
} catch (error) {
    console.error('Error updating user reminder settings:', error);
    throw error;
}
};

/**
 * Get all reminders for a user
 */
export const getUserReminders = async (userId: string): Promise<Reminder[]> => {
  try {
    const remindersQuery = query(
      collection(firestore, 'reminders'),
      where('userId', '==', userId),
      where('status', 'in', ['pending', 'sent'])
    );

    const remindersSnapshot = await getDocs(remindersQuery);

    const reminders: Reminder[] = [];

    remindersSnapshot.forEach((doc) => {
      const data = doc.data();
      reminders.push({
        id: doc.id,
        userId: data.userId as string,
        courseId: data.courseId as string,
        courseName: data.courseName as string,
        type: data.type as 'progress' | 'completion' | 'inactivity',
        message: data.message as string,
        status: data.status as 'pending' | 'sent' | 'read',
        createdAt: data.createdAt as Timestamp,
        scheduledFor: data.scheduledFor as Timestamp,
        sentAt: data.sentAt as Timestamp | undefined,
        readAt: data.readAt as Timestamp | undefined,
    });
  });

    return reminders;
} catch (error) {
    console.error('Error getting user reminders:', error);
    return [];
}
};

/**
 * Mark a reminder as read
 */
export const markReminderAsRead = async (reminderId: string): Promise<void> => {
  try {
    const reminderRef = doc(firestore, 'reminders', reminderId);

    await updateDoc(reminderRef, {
      status: 'read',
      readAt: serverTimestamp(),
  });
} catch (error) {
    console.error('Error marking reminder as read:', error);
    throw error;
}
};

/**
 * Create a progress reminder for a user
 */
export const createProgressReminder = async (
  userId: string,
  courseId: string,
  courseName: string,
  progress: number
): Promise<void> => {
  try {
    // Check if user has reminder settings enabled
    const settings = await getUserReminderSettings(userId);

    if (!settings.enabled) {
      return;
  }

    // Create reminder message based on progress
    let message = '';

    if (progress < 25) {
      message = `You've started the "${courseName}" course. Continue learning to improve your skills!`;
  } else if (progress < 50) {
      message = `You're making progress in "${courseName}". Keep going to reach the halfway point!`;
  } else if (progress < 75) {
      message = `You're more than halfway through "${courseName}". Keep up the good work!`;
  } else if (progress < 100) {
      message = `You're almost done with "${courseName}". Just a little more to complete the course!`;
  }

    if (!message) {
      return;
  }

    // Calculate scheduled date based on frequency
    const now = new Date();
    const scheduledDate = new Date();

    switch (settings.frequency) {
      case 'daily':
        scheduledDate.setDate(now.getDate() + 1);
        break;
      case 'weekly':
        scheduledDate.setDate(now.getDate() + 7);
        break;
      case 'monthly':
        scheduledDate.setMonth(now.getMonth() + 1);
        break;
  }

    // Create reminder
    await addDoc(collection(firestore, 'reminders'), {
      userId,
      courseId,
      courseName,
      type: 'progress',
      message,
      status: 'pending',
      createdAt: serverTimestamp(),
      scheduledFor: Timestamp.fromDate(scheduledDate),
  });
} catch (error) {
    console.error('Error creating progress reminder:', error);
}
};

/**
 * Create an inactivity reminder for a user
 */
export const createInactivityReminder = async (
  userId: string,
  courseId: string,
  courseName: string,
  lastAccessedDays: number
): Promise<void> => {
  try {
    // Check if user has reminder settings enabled
    const settings = await getUserReminderSettings(userId);

    if (!settings.enabled) {
      return;
  }

    // Create reminder message based on inactivity
    let message = '';

    if (lastAccessedDays >= 7 && lastAccessedDays < 14) {
      message = `It's been a week since you last accessed "${courseName}". Don't lose your momentum!`;
  } else if (lastAccessedDays >= 14 && lastAccessedDays < 30) {
      message = `It's been two weeks since you last accessed "${courseName}". Continue your learning journey!`;
  } else if (lastAccessedDays >= 30) {
      message = `It's been a month since you last accessed "${courseName}". Don't forget to complete your course!`;
  }

    if (!message) {
      return;
  }

    // Calculate scheduled date (send immediately for inactivity)
    const now = new Date();

    // Create reminder
    await addDoc(collection(firestore, 'reminders'), {
      userId,
      courseId,
      courseName,
      type: 'inactivity',
      message,
      status: 'pending',
      createdAt: serverTimestamp(),
      scheduledFor: Timestamp.fromDate(now),
  });
} catch (error) {
    console.error('Error creating inactivity reminder:', error);
}
};

/**
 * Create a completion reminder for a user
 */
export const createCompletionReminder = async (
  userId: string,
  courseId: string,
  courseName: string
): Promise<void> => {
  try {
    // Create reminder message
    const message = `Congratulations! You've completed "${courseName}". Don't forget to download your certificate!`;

    // Create reminder (send immediately for completion)
    const now = new Date();

    // Create reminder
    await addDoc(collection(firestore, 'reminders'), {
      userId,
      courseId,
      courseName,
      type: 'completion',
      message,
      status: 'pending',
      createdAt: serverTimestamp(),
      scheduledFor: Timestamp.fromDate(now),
  });
} catch (error) {
    console.error('Error creating completion reminder:', error);
}
};

/**
 * Process reminders that are due to be sent
 * This would typically be called by a scheduled function
 */
export const processDueReminders = async (): Promise<number> => {
  try {
    const now = Timestamp.now();

    // Query for reminders that are due
    const remindersQuery = query(
      collection(firestore, 'reminders'),
      where('status', '==', 'pending'),
      where('scheduledFor', '<=', now)
    );

    const remindersSnapshot = await getDocs(remindersQuery);

    let count = 0;

    // Process each reminder
    for (const reminderDoc of remindersSnapshot.docs) {
      const reminderRef = doc(firestore, 'reminders', reminderDoc.id);

      // Update reminder status
      await updateDoc(reminderRef, {
        status: 'sent',
        sentAt: serverTimestamp(),
    });

      // Here you would typically send an email or push notification
      // This would be integrated with your notification service

      count++;
  }

    return count;
} catch (error) {
    console.error('Error processing due reminders:', error);
    return 0;
}
};

/**
 * Check for inactive enrollments and create reminders
 * This would typically be called by a scheduled function
 */
export const checkInactiveEnrollments = async (): Promise<number> => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const sevenDaysAgoTimestamp = Timestamp.fromDate(sevenDaysAgo);

    // Query for enrollments that haven't been accessed in a while
    const enrollmentsQuery = query(
      collection(firestore, 'enrollments'),
      where('lastAccessedAt', '<=', sevenDaysAgoTimestamp),
      where('status', '==', 'active'),
      where('progress', '<', 100)
    );

    const enrollmentsSnapshot = await getDocs(enrollmentsQuery);

    let count = 0;

    // Process each enrollment
    for (const enrollmentDoc of enrollmentsSnapshot.docs) {
      const enrollmentData = enrollmentDoc.data();

      // Calculate days since last access
      const lastAccessedAt = (enrollmentData.lastAccessedAt as Timestamp).toDate();
      const daysSinceLastAccess = Math.floor((now.getTime() - lastAccessedAt.getTime()) / (24 * 60 * 60 * 1000));

      // Create inactivity reminder
      await createInactivityReminder(
        enrollmentData.userId as string,
        enrollmentData.courseId as string,
        enrollmentData.courseName as string,
        daysSinceLastAccess
      );

      count++;
  }

    return count;
} catch (error) {
    console.error('Error checking inactive enrollments:', error);
    return 0;
}
};

/**
 * Update progress reminders for a user's enrollment
 */
export const updateProgressReminders = async (
  userId: string,
  courseId: string,
  courseName: string,
  progress: number
): Promise<void> => {
  try {
    // Only create reminders at certain progress milestones
    const milestones = [25, 50, 75, 90];

    // Find the highest milestone achieved
    const achievedMilestone = milestones.filter(milestone => progress >= milestone).pop();

    if (achievedMilestone) {
      // Check if a reminder already exists for this milestone
      const remindersQuery = query(
        collection(firestore, 'reminders'),
        where('userId', '==', userId),
        where('courseId', '==', courseId),
        where('type', '==', 'progress')
      );

      const remindersSnapshot = await getDocs(remindersQuery);

      // If no reminders exist or the most recent one is for a lower milestone, create a new one
      if (remindersSnapshot.empty) {
        await createProgressReminder(userId, courseId, courseName, progress);
    }
  }

    // If course is completed, create completion reminder
    if (progress >= 100) {
      // Check if a completion reminder already exists
      const completionRemindersQuery = query(
        collection(firestore, 'reminders'),
        where('userId', '==', userId),
        where('courseId', '==', courseId),
        where('type', '==', 'completion')
      );

      const completionRemindersSnapshot = await getDocs(completionRemindersQuery);

      // If no completion reminder exists, create one
      if (completionRemindersSnapshot.empty) {
        await createCompletionReminder(userId, courseId, courseName);
    }
  }
} catch (error) {
    console.error('Error updating progress reminders:', error);
}
};
