import React from 'react';
import {motion } from 'framer-motion';
import Link from 'next/link';

export type NotificationType =
  | 'course_completion'
  | 'certificate_issued'
  | 'quiz_passed'
  | 'new_course'
  | 'reminder'
  | 'system';

export type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  link?: string;
  data?: Record<string, any>;
};

type NotificationItemProps = {
  notification: Notification;
  onMarkAsRead: (notificationId: string) => void;
  onDelete: (notificationId: string) => void;
  expanded?: boolean;
};

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onDelete,
  expanded = false,
}) => {
  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
  } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  } else {
      return date.toLocaleDateString();
  }
};

  // Get icon based on notification type
  const getIcon = () => {
    switch (notification.type) {
      case 'course_completion':
        return (
          <div className="bg-green-100 p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'certificate_issued':
        return (
          <div className="bg-blue-100 p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
        );
      case 'quiz_passed':
        return (
          <div className="bg-purple-100 p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
        );
      case 'new_course':
        return (
          <div className="bg-yellow-100 p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        );
      case 'reminder':
        return (
          <div className="bg-red-100 p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="bg-neutral-100 p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
  }
};

  // Handle mark as read
  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
  }
};

  // Handle delete
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(notification.id);
};

  // Notification content
  const content = (
    <div
      className={`flex p-4 hover:bg-neutral-50 transition-colors duration-200 ${
        !notification.isRead ? 'bg-blue-50' : ''
    } ${expanded ? 'border-b border-neutral-100' : ''}`}
      onClick={handleMarkAsRead}
    >
      {/* Icon */}
      <div className="flex-shrink-0 mr-3">
        {getIcon()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <h4 className={`text-sm font-medium ${!notification.isRead ? 'text-neutral-900' : 'text-neutral-700'}`}>
            {notification.title}
          </h4>
          <span className="text-xs text-neutral-500 whitespace-nowrap ml-2">
            {formatTimestamp(notification.timestamp)}
          </span>
        </div>

        <p className={`text-sm mt-1 ${!notification.isRead ? 'text-neutral-800' : 'text-neutral-600'} ${expanded ? 'whitespace-normal' : 'line-clamp-2'}`}>
          {notification.message}
        </p>

        {/* Actions */}
        <div className="mt-2 flex justify-between items-center">
          {!notification.isRead && (
            <button
              onClick={handleMarkAsRead}
              className="text-xs text-primary hover:text-primary-700 transition-colors duration-200"
            >
              Mark as read
            </button>
          )}

          <button
            onClick={handleDelete}
            className="text-xs text-neutral-500 hover:text-neutral-700 transition-colors duration-200"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );

  // Wrap in Link if link is provided
  if (notification.link) {
    return (
      <Link href={notification.link}>
        <motion.div
          initial={{opacity: 0 }}
          animate={{opacity: 1 }}
          exit={{opacity: 0 }}
          transition={{duration: 0.2 }}
          className="cursor-pointer"
        >
          {content}
        </motion.div>
      </Link>
    );
}

  // Otherwise return as is
  return (
    <motion.div
      initial={{opacity: 0 }}
      animate={{opacity: 1 }}
      exit={{opacity: 0 }}
      transition={{duration: 0.2 }}
    >
      {content}
    </motion.div>
  );
};

export default NotificationItem;
