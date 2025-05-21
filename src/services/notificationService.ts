import {
  collection,
  doc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import {firestore } from '@/services/firebase';
import {NotificationTemplateType } from '@/types/notification-templates.types';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationTemplateType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Timestamp;
  link?: string;
  data?: Record<string, unknown>;
  expiresAt?: Timestamp;
  priority?: 'low' | 'medium' | 'high';
  sender?: {
    id: string;
    name: string;
    avatar?: string;
};
}

/**
 * Create a notification
 */
export const createNotification = async (notification: Omit<Notification, 'id' | 'isRead' | 'createdAt'>): Promise<string> => {
  try {
    const notificationsRef = collection(firestore, 'notifications');
    const now = serverTimestamp();

    const docRef = await addDoc(notificationsRef, {
      ...notification,
      isRead: false,
      createdAt: now
  });

    return docRef.id;
} catch (error) {
    console.error('Error creating notification:', error);
    throw error;
}
};

/**
 * Get notifications for a user
 */
export const getUserNotifications = async (userId: string, limitCount = 50): Promise<Notification[]> => {
  try {
    const notificationsRef = collection(firestore, 'notifications');

    // Try to use the composite index first
    try {
      const q = query(
        notificationsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const notificationsSnapshot = await getDocs(q);

      return notificationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    })) as Notification[];
  } catch (indexError) {
      // If we get an index error, fall back to a simpler query without ordering
      console.warn('Index error, falling back to simpler query:', indexError);

      // Fallback query without ordering
      const fallbackQuery = query(
        notificationsRef,
        where('userId', '==', userId),
        limit(limitCount)
      );

      const fallbackSnapshot = await getDocs(fallbackQuery);

      // Sort the results in memory
      const notifications = fallbackSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    })) as Notification[];

      // Sort by createdAt in descending order if the field exists
      return notifications.sort((a, b) => {
        const dateA = a.createdAt ? (a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : new Date(a.createdAt as string | number).getTime()) : 0;
        const dateB = b.createdAt ? (b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : new Date(b.createdAt as string | number).getTime()) : 0;
        return dateB - dateA;
    });
  }
} catch (error) {
    console.error('Error getting user notifications:', error);
    // Return empty array instead of throwing to prevent app crashes
    return [];
}
};

/**
 * Get unread notifications count for a user
 */
export const getUnreadNotificationsCount = async (userId: string): Promise<number> => {
  try {
    const notificationsRef = collection(firestore, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      where('isRead', '==', false)
    );

    const notificationsSnapshot = await getDocs(q);

    return notificationsSnapshot.size;
} catch (error) {
    console.error('Error getting unread notifications count:', error);
    throw error;
}
};

/**
 * Mark a notification as read
 */
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    const notificationRef = doc(firestore, 'notifications', notificationId);

    await updateDoc(notificationRef, {
      isRead: true
  });
} catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
}
};

/**
 * Mark all notifications as read for a user
 */
export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
  try {
    const notificationsRef = collection(firestore, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      where('isRead', '==', false)
    );

    const notificationsSnapshot = await getDocs(q);

    // Update each notification
    const updatePromises = notificationsSnapshot.docs.map(doc =>
      updateDoc(doc.ref, {isRead: true })
    );

    await Promise.all(updatePromises);
} catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
}
};

/**
 * Delete a notification
 */
export const deleteNotification = async (notificationId: string): Promise<void> => {
  try {
    const notificationRef = doc(firestore, 'notifications', notificationId);
    await deleteDoc(notificationRef);
} catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
}
};

/**
 * Delete all notifications for a user
 */
export const deleteAllNotifications = async (userId: string): Promise<void> => {
  try {
    const notificationsRef = collection(firestore, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId)
    );

    const notificationsSnapshot = await getDocs(q);

    // Delete each notification
    const deletePromises = notificationsSnapshot.docs.map(doc =>
      deleteDoc(doc.ref)
    );

    await Promise.all(deletePromises);
} catch (error) {
    console.error('Error deleting all notifications:', error);
    throw error;
}
};

/**
 * Delete expired notifications
 */
export const deleteExpiredNotifications = async (): Promise<number> => {
  try {
    const now = new Date().toISOString();
    const notificationsRef = collection(firestore, 'notifications');
    const q = query(
      notificationsRef,
      where('expiresAt', '<=', now)
    );

    const notificationsSnapshot = await getDocs(q);

    // Delete each expired notification
    const deletePromises = notificationsSnapshot.docs.map(doc =>
      deleteDoc(doc.ref)
    );

    await Promise.all(deletePromises);

    return notificationsSnapshot.size;
} catch (error) {
    console.error('Error deleting expired notifications:', error);
    return 0;
}
};
