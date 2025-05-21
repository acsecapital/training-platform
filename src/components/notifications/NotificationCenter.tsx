import React, {useState } from 'react';
import {motion, AnimatePresence } from 'framer-motion';
import NotificationItem, {Notification } from './NotificationItem';

type NotificationCenterProps = {
  notifications: Notification[];
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (notificationId: string) => void;
  className?: string;
};

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Count unread notifications
  const unreadCount = notifications.filter(notification => !notification.isRead).length;
  
  // Toggle notification panel
  const toggleNotifications = () => {
    setIsOpen(!isOpen);
};
  
  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell */}
      <button
        onClick={toggleNotifications}
        className="relative p-2 text-neutral-600 hover:text-primary transition-colors duration-200 rounded-full hover:bg-neutral-100"
        aria-label="Notifications"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      
      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop (mobile) */}
            <motion.div
              initial={{opacity: 0 }}
              animate={{opacity: 1 }}
              exit={{opacity: 0 }}
              transition={{duration: 0.2 }}
              className="fixed inset-0 bg-black bg-opacity-25 z-40 md:hidden"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Notification Panel */}
            <motion.div
              initial={{opacity: 0, y: 10, scale: 0.95 }}
              animate={{opacity: 1, y: 0, scale: 1 }}
              exit={{opacity: 0, y: 10, scale: 0.95 }}
              transition={{duration: 0.2 }}
              className="absolute right-0 mt-2 w-80 sm:w-96 max-h-[80vh] overflow-y-auto bg-white rounded-lg shadow-lg z-50"
              style={{maxHeight: 'calc(100vh - 200px)'}}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-neutral-200">
                <h3 className="text-lg font-semibold text-neutral-800">Notifications</h3>
                
                {unreadCount > 0 && (
                  <button
                    onClick={onMarkAllAsRead}
                    className="text-sm text-primary hover:text-primary-700 transition-colors duration-200"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              
              {/* Notification List */}
              <div className="divide-y divide-neutral-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-neutral-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-neutral-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={onMarkAsRead}
                      onDelete={onDelete}
                    />
                  ))
                )}
              </div>
              
              {/* Footer */}
              <div className="p-3 border-t border-neutral-200 text-center">
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-sm text-neutral-600 hover:text-neutral-800 transition-colors duration-200"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter;
