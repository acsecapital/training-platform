import React, {useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {useRouter } from 'next/router';
import {useAuth } from '@/context/AuthContext';
import {Notification, getUserNotifications, getUnreadNotificationsCount, markNotificationAsRead, markAllNotificationsAsRead } from '@/services/notificationService';
import {NotificationType } from './NotificationItem';

interface NotificationCenterProps {
  maxNotifications?: number;
}

// Convert system notification to UI notification format
const convertToUINotification = (notification: Notification): any => {
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

  return {
    id: notification.id,
    type: uiType,
    title: notification.title,
    message: notification.message,
    timestamp: notification.createdAt,
    isRead: notification.isRead,
    link: notification.link,
    data: notification.data
};
};

const NotificationCenterNew: React.FC<NotificationCenterProps> = ({maxNotifications = 5 }) => {
  const {user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications and unread count
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        const [fetchedNotifications, count] = await Promise.all([
          getUserNotifications(user.id, maxNotifications),
          getUnreadNotificationsCount(user.id)
        ]);

        // Convert to UI notifications
        const uiNotifications = fetchedNotifications.map(convertToUINotification);

        setNotifications(uiNotifications);
        setUnreadCount(count);
    } catch (error) {
        console.error('Error fetching notifications:', error);
    } finally {
        setLoading(false);
    }
  };

    // Only fetch notifications when the component mounts
    fetchNotifications();
}, [user, maxNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
    }
  };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
}, []);

  // Handle notification click
  const handleNotificationClick = async (notification: any) => {
    try {
      // Mark as read
      if (!notification.isRead) {
        await markNotificationAsRead(notification.id);

        // Update local state
        setNotifications(prev =>
          prev.map(n =>
            n.id === notification.id
              ? {...n, isRead: true }
              : n
          )
        );

        setUnreadCount(prev => Math.max(0, prev - 1));
    }

      // Navigate to link if provided
      if (notification.link) {
        router.push(notification.link);
    }

      // Close dropdown
      setIsOpen(false);
  } catch (error) {
      console.error('Error handling notification click:', error);
  }
};

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    if (!user?.id) return;

    try {
      await markAllNotificationsAsRead(user.id);

      // Update local state
      setNotifications(prev =>
        prev.map(n => ({...n, isRead: true }))
      );

      setUnreadCount(0);
  } catch (error) {
      console.error('Error marking all notifications as read:', error);
  }
};

  // Format notification time
  const formatNotificationTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) {
      return 'just now';
  } else if (diffMins < 60) {
      return `${diffMins}m ago`;
  } else if (diffHours < 24) {
      return `${diffHours}h ago`;
  } else if (diffDays < 7) {
      return `${diffDays}d ago`;
  } else {
      return date.toLocaleDateString();
  }
};

  if (!user) {
    return null;
}

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="relative p-2 text-neutral-600 hover:text-primary focus:outline-none rounded-full hover:bg-neutral-100 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full min-w-[18px] min-h-[18px]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-neutral-200 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-neutral-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                className="text-xs text-primary hover:text-primary-dark font-medium"
                onClick={handleMarkAllAsRead}
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-3 text-center text-sm text-neutral-500">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-neutral-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <p className="text-sm text-neutral-500">No notifications yet</p>
              </div>
            ) : (
              <div>
                {notifications.map(notification => (
                  <button
                    key={notification.id}
                    className={`w-full text-left px-4 py-3 border-b border-neutral-100 hover:bg-neutral-50 transition-colors ${
                      !notification.isRead ? 'bg-blue-50' : ''
                  }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${!notification.isRead ? 'text-neutral-900' : 'text-neutral-700'}`}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-neutral-500 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-neutral-400 mt-1">
                          {formatNotificationTime(notification.timestamp)}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <span className="h-2 w-2 bg-primary rounded-full mt-1"></span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="px-4 py-3 border-t border-neutral-200 bg-neutral-50">
            <Link
              href="/notifications"
              className="block text-center text-xs text-primary hover:text-primary-dark font-medium"
              onClick={() => setIsOpen(false)}
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenterNew;
