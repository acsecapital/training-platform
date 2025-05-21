import React, {createContext, useContext, useState, useEffect } from 'react';
import {Timestamp } from 'firebase/firestore'; // Import Timestamp
import {Notification, NotificationContextType, NotificationState, NotificationType } from '@/types/notification.types';
import {NotificationTemplateType } from '@/types/notification-templates.types';
import {useAuth } from './AuthContext';
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification as deleteNotificationService,
  deleteAllNotifications,
  createNotification
} from '@/services/notificationService';

// Helper function to map NotificationType to NotificationTemplateType
const mapNotificationTypeToTemplateType = (type: NotificationType): NotificationTemplateType => {
  // Map notification types to template types
  switch (type) {
    case 'course_completion':
      return 'course_completion';
    case 'certificate_issued':
      return 'certificate_expiration'; // Closest match
    case 'quiz_passed':
      return 'quiz_completion';
    case 'new_course':
      return 'new_course_available';
    case 'reminder':
      return 'inactivity_reminder';
    case 'achievement':
      return 'achievement_unlocked';
    case 'team_update':
    case 'deadline':
    case 'message':
    case 'system':
    default:
      return 'welcome_message'; // Default fallback
}
};

// Initial notification state
const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
};

// Create the notification context
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({children }) => {
  const {user } = useAuth();
  const [state, setState] = useState<NotificationState>(initialState);

  // Fetch notifications when user changes
  useEffect(() => {
    if (user) {
      fetchNotifications();
  } else {
      setState(initialState);
  }
}, [user]);

  // Fetch notifications
  const fetchNotifications = async (): Promise<void> => {
    if (!user) {
      return;
  }

    setState(prev => ({...prev, loading: true, error: null }));

    try {
      // Use the notification service to get notifications
      const serviceNotifications = await getUserNotifications(user.id, 50);

      // Convert service notifications to app notifications, ensuring Timestamps are converted to strings
      const notifications: Notification[] = serviceNotifications.map(notification => {
        // Convert null priority to undefined to match Notification type
        const priority = notification.priority === null ? undefined : notification.priority;
        const createdAtTimestamp = notification.createdAt;
        const expiresAtTimestamp = notification.expiresAt;

        // Convert Timestamps to ISO strings if they exist
        const createdAtString = createdAtTimestamp instanceof Timestamp
          ? createdAtTimestamp.toDate().toISOString()
          : typeof createdAtTimestamp === 'string' ? createdAtTimestamp : undefined;

        const expiresAtString = expiresAtTimestamp instanceof Timestamp
          ? expiresAtTimestamp.toDate().toISOString()
          : typeof expiresAtTimestamp === 'string' ? expiresAtTimestamp : undefined;

        return {
          id: notification.id,
          userId: notification.userId,
          type: notification.type as unknown as NotificationType, // Keep type assertion for now
          title: notification.title,
          message: notification.message,
          timestamp: createdAtString || new Date().toISOString(), // Use converted string, fallback to now
          createdAt: createdAtString, // Store the converted string
          isRead: notification.isRead,
          link: notification.link,
          data: notification.data,
          expiresAt: expiresAtString, // Store the converted string
          priority: priority, // Using the properly converted priority value
          sender: notification.sender
      };
    });

      // Check if notifications is an array (even if empty)
      if (Array.isArray(notifications)) {
        // No need for further formatting here as conversion is done above
        const unreadCount = notifications.filter(notification => !notification.isRead).length;

        setState({
          notifications: notifications, // Use the correctly typed notifications
          unreadCount,
          loading: false,
          error: null,
      });
    } else {
        // Handle case where notifications is not an array
        setState(prev => ({
          ...prev,
          notifications: [],
          unreadCount: 0,
          loading: false,
          error: null,
      }));
    }
  } catch (error: any) {
      console.error('Error fetching notifications:', error);
      // Don't show error to user, just set empty notifications
      setState(prev => ({
        ...prev,
        notifications: [],
        unreadCount: 0,
        loading: false,
        error: null, // Don't show error to user
    }));
  }
};

  // Mark notification as read
  const markAsRead = async (notificationId: string): Promise<void> => {
    if (!user) {
      return;
  }

    setState(prev => ({...prev, loading: true, error: null }));

    try {
      // Use the notification service to mark as read
      await markNotificationAsRead(notificationId);

      // Update local state
      setState(prev => {
        const updatedNotifications = prev.notifications.map(notification =>
          notification.id === notificationId
            ? {...notification, isRead: true }
            : notification
        );

        const unreadCount = updatedNotifications.filter(notification => !notification.isRead).length;

        return {
          notifications: updatedNotifications,
          unreadCount,
          loading: false,
          error: null,
      };
    });
  } catch (error: any) {
      console.error('Error marking notification as read:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to mark notification as read',
    }));
  }
};

  // Mark all notifications as read
  const markAllAsRead = async (): Promise<void> => {
    if (!user || state.unreadCount === 0) {
      return;
  }

    setState(prev => ({...prev, loading: true, error: null }));

    try {
      // Use the notification service to mark all as read
      await markAllNotificationsAsRead(user.id);

      // Update local state
      setState(prev => ({
        notifications: prev.notifications.map(notification => ({
          ...notification,
          isRead: true,
      })),
        unreadCount: 0,
        loading: false,
        error: null,
    }));
  } catch (error: any) {
      console.error('Error marking all notifications as read:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to mark all notifications as read',
    }));
  }
};

  // Delete notification
  const deleteNotification = async (notificationId: string): Promise<void> => {
    if (!user) {
      return;
  }

    setState(prev => ({...prev, loading: true, error: null }));

    try {
      // Use the notification service to delete notification
      await deleteNotificationService(notificationId);

      // Update local state
      setState(prev => {
        const wasUnread = prev.notifications.find(
          notification => notification.id === notificationId && !notification.isRead
        );

        const updatedNotifications = prev.notifications.filter(
          notification => notification.id !== notificationId
        );

        return {
          notifications: updatedNotifications,
          unreadCount: wasUnread ? prev.unreadCount - 1 : prev.unreadCount,
          loading: false,
          error: null,
      };
    });
  } catch (error: any) {
      console.error('Error deleting notification:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to delete notification',
    }));
  }
};

  // Clear all notifications
  const clearAllNotifications = async (): Promise<void> => {
    if (!user || state.notifications.length === 0) {
      return;
  }

    setState(prev => ({...prev, loading: true, error: null }));

    try {
      // Use the notification service to delete all notifications
      await deleteAllNotifications(user.id);

      // Update local state
      setState({
        notifications: [],
        unreadCount: 0,
        loading: false,
        error: null,
    });
  } catch (error: any) {
      console.error('Error clearing all notifications:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to clear all notifications',
    }));
  }
};

  // Send notification
  const sendNotification = async (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>): Promise<void> => {
    if (!user) {
      return;
  }

    setState(prev => ({...prev, loading: true, error: null }));

    try {
      // Prepare notification data and convert type to NotificationTemplateType
      const notificationData = {
        userId: user.id,
        title: notification.title,
        message: notification.message,
        // Convert NotificationType to NotificationTemplateType
        type: mapNotificationTypeToTemplateType(notification.type),
        link: notification.link,
        data: notification.data,
        // Convert expiresAt string to Timestamp if it exists
        expiresAt: notification.expiresAt ? Timestamp.fromDate(new Date(notification.expiresAt)) : undefined,
        priority: notification.priority,
        sender: notification.sender
    };

      // Use the notification service to create notification
      const notificationId = await createNotification(notificationData);

      // Create a complete notification object for the local state
      // Convert back to NotificationType for local state
      const newNotification: Notification = {
        id: notificationId,
        userId: user.id,
        type: notification.type, // Use original NotificationType
        title: notification.title,
        message: notification.message,
        timestamp: new Date().toISOString(), // Use current time for new notification
        createdAt: new Date().toISOString(), // Also set createdAt for consistency
        isRead: false,
        link: notification.link,
        data: notification.data,
        expiresAt: notification.expiresAt, // Keep original string format in local state
        priority: notification.priority,
        sender: notification.sender
    };

      // Update local state
      setState(prev => ({
        notifications: [
          newNotification,
          ...prev.notifications,
        ],
        unreadCount: prev.unreadCount + 1,
        loading: false,
        error: null,
    }));
  } catch (error: any) {
      console.error('Error sending notification:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to send notification',
    }));
  }
};

  const contextValue: NotificationContextType = {
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    loading: state.loading,
    error: state.error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    fetchNotifications,
    sendNotification,
};

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

// Create a hook to use the notification context
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
}
  return context;
};
