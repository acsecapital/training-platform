import React, {useState, useEffect } from 'react';
import {useRouter } from 'next/router';
import MainLayout from '@/components/layout/MainLayout';
import {useAuth } from '@/context/AuthContext';
import {useNotifications } from '@/contexts/NotificationContext';
import Button from '@/components/ui/Button';
import NotificationItem from '@/components/notifications/NotificationItem';

const NotificationsPage: React.FC = () => {
  const router = useRouter();
  const {user } = useAuth();
  const {
    notifications,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification, // Assuming this is stable from context
    refreshNotifications // Assuming this is stable from context (useCallback)
} = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  // Redirect if not authenticated
  useEffect(() => {
    if (!user && !loading) { // `loading` here is from useAuth
      void router.push('/login?redirect=/notifications');
  }
}, [user, loading, router]);

  // Refresh notifications when user is available or refreshNotifications function changes
  useEffect(() => {
    // Only refresh if we have a user
    if (user) {
      void refreshNotifications(); // Handle promise
  }
}, [user, refreshNotifications]); // Correct dependencies

  // Filter notifications
  const filteredNotifications = filter === 'all'
    ? notifications
    : notifications.filter(notification => !notification.isRead);

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    void await markAllAsRead(); // Handle promise, or simply `void markAllAsRead()` if await isn't strictly needed here
};

  if (!user) {
    return (
      <MainLayout title="Notifications">
        <div className="container mx-auto px-6 sm:px-12 lg:px-24 xl:px-32 py-12 text-center">
          <p>Loading...</p>
        </div>
      </MainLayout>
    ); // Will redirect in useEffect
}

  return (
    <MainLayout title="Notifications">
      <div className="bg-gradient-primary py-20 text-white">
        <div className="container mx-auto px-6 sm:px-12 lg:px-24 xl:px-32">
          <h1 className="text-3xl font-bold mt-6 mb-4">Notifications</h1>
          <p className="text-lg opacity-90 max-w-3xl">Stay updated with your course progress and announcements</p>
        </div>
      </div>

      <div className="container mx-auto px-6 sm:px-12 lg:px-24 xl:px-32 py-12">
        {/* Filters and Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="flex space-x-2">
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'unread'
                  ? 'bg-primary text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
              onClick={() => setFilter('unread')}
            >
              Unread
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => void handleMarkAllAsRead()}
            disabled={!notifications.some(n => !n.isRead)}
          >
            Mark All as Read
          </Button>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="flex justify-center py-12"> {/* `loading` here is from useNotifications */}
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100 text-neutral-400 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-neutral-900 mb-2">
              {filter === 'all' ? 'No notifications' : 'No unread notifications'}
            </h2>
            <p className="text-neutral-600 mb-6">
              {filter === 'all'
                ? 'You don\'t have any notifications yet. Start exploring courses to receive updates!'
                : 'You\'ve read all your notifications. Check back later for new updates.'}
            </p>
            <Button
              href="/courses"
              variant="primary"
            >
              Explore Courses
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
            <ul className="divide-y divide-neutral-200">
              {filteredNotifications.map((notification) => (
                <li key={notification.id} className="p-0">
                  <NotificationItem
                    notification={notification}
                    onMarkAsRead={(notificationId) => void markAsRead(notificationId)}
                    onDelete={(notificationId) => void deleteNotification(notificationId)}
                    expanded
                  />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default NotificationsPage;
