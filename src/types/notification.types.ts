export type NotificationType =
  | 'course_completion'
  | 'certificate_issued'
  | 'quiz_passed'
  | 'new_course'
  | 'reminder'
  | 'system'
  | 'achievement'
  | 'team_update'
  | 'deadline'
  | 'message';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  createdAt?: string; // Added for compatibility with notification service
  isRead: boolean;
  link?: string;
  data?: Record<string, unknown>;
  expiresAt?: string;
  priority?: 'low' | 'medium' | 'high';
  sender?: {
    id: string;
    name: string;
    avatar?: string;
};
}

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

export interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  sendNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => Promise<void>;
}
