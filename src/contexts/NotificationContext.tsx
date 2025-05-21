import React, {createContext, useContext, useState, useEffect, useCallback } from 'react';
import {Timestamp } from 'firebase/firestore'; // Import Timestamp
import {useAuth } from '@/context/AuthContext';
import {Notification as UINotification, NotificationType } from '@/components/notifications/NotificationItem';
import {
  Notification,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification as deleteNotif
} from '@/services/notificationService';

// Define the shape of our UI notification (used by the NotificationCenter component)
interface NotificationUI {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  link?: string;
  data?: Record<string, any>;
  priority?: 'low' | 'medium' | 'high' | undefined;
}

interface NotificationContextType {
  notifications: NotificationUI[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
}
  return context;
};

export const NotificationProvider: React.FC<{children: React.ReactNode }> = ({children }) => {
  const {user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationUI[]>([]);
  const [loading, setLoading] = useState(false);

  // Convert system notification to UI notification format
  const convertToUINotification = useCallback((notification: Notification): NotificationUI => {
    // Map notification type to UI notification type
    let uiType: NotificationType = 'system';

    switch (notification.type) {
      case 'course_progress':
        uiType = 'reminder';
        break;
      case 'course_completion':
        uiType = 'course_completion';
        break;
      case 'certificate_expiration':
        uiType = 'reminder';
        break;
      case 'new_course_available':
        uiType = 'new_course';
        break;
      case 'inactivity_reminder':
        uiType = 'reminder';
        break;
      case 'enrollment_confirmation':
        uiType = 'system';
        break;
      case 'quiz_completion':
        uiType = 'quiz_passed';
        break;
      case 'achievement_unlocked':
        uiType = 'system';
        break;
      case 'welcome_message':
        uiType = 'system';
        break;
      default:
        uiType = 'system';
  }

    // Convert Firestore Timestamp to ISO string if it exists
    const timestampString = notification.createdAt instanceof Timestamp
      ? notification.createdAt.toDate().toISOString()
      : typeof notification.createdAt === 'string'
      ? notification.createdAt
      : new Date().toISOString(); // Fallback to current time if undefined

    return {
      id: notification.id,
      type: uiType,
      title: notification.title,
      message: notification.message,
      timestamp: timestampString,
      isRead: notification.isRead,
      link: notification.link,
      data: notification.data,
      priority: notification.priority === null || notification.priority === undefined ? undefined : notification.priority
  };
}, []);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) {
      setNotifications([]);
      return;
  }

    setLoading(true);

    try {
      // Fetch notifications from Firestore
      const systemNotifications = await getUserNotifications(user.id, 50);

      // Convert to UI notifications
      const uiNotifications = systemNotifications.map(convertToUINotification);

      // Sort notifications by timestamp (newest first)
      uiNotifications.sort((a, b) => {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

      setNotifications(uiNotifications);
  } catch (error) {
      console.error('Error fetching notifications:', error);
  } finally {
      setLoading(false);
  }
}, [user, convertToUINotification]);

  // Fetch notifications when user changes
  useEffect(() => {
    fetchNotifications();
}, [user]);

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      // Update in Firestore
      await markNotificationAsRead(notificationId);

      // Update local state
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? {...notification, isRead: true }
            : notification
        )
      );
  } catch (error) {
      console.error('Error marking notification as read:', error);
  }
};

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!user?.id) return;

    try {
      // Update in Firestore
      await markAllNotificationsAsRead(user.id);

      // Update local state
      setNotifications(prev =>
        prev.map(notification => ({...notification, isRead: true }))
      );
  } catch (error) {
      console.error('Error marking all notifications as read:', error);
  }
};

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    try {
      // Delete from Firestore
      await deleteNotif(notificationId);

      // Remove from local state
      setNotifications(prev =>
        prev.filter(notification => notification.id !== notificationId)
      );
  } catch (error) {
      console.error('Error deleting notification:', error);
  }
};

  // Calculate unread count
  const unreadCount = notifications.filter(notification => !notification.isRead).length;

  // Context value
  const value = {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications: fetchNotifications,
};

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
