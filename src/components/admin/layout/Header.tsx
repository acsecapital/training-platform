import React, {useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {useAuth } from '@/context/AuthContext';
import {useOutsideClick } from '@/hooks/useOutsideClick';

const Header: React.FC = () => {
  const {user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);

  // Set isClient to true when component mounts (client-side only)
  useEffect(() => {
    setIsClient(true);
}, []);

  useOutsideClick(userMenuRef, () => setUserMenuOpen(false));
  useOutsideClick(notificationsRef, () => setNotificationsOpen(false));

  const handleLogout = async () => {
    try {
      await logout();
  } catch (error) {
      console.error('Logout failed:', error);
  }
};

  // Mock notifications for demonstration
  const notifications = [
    {
      id: '1',
      title: 'New User Registration',
      message: 'John Doe has registered as a new student.',
      time: '5 minutes ago',
      read: false,
  },
    {
      id: '2',
      title: 'Course Completion',
      message: 'Jane Smith has completed the LIPS Sales System course.',
      time: '1 hour ago',
      read: false,
  },
    {
      id: '3',
      title: 'Quiz Results',
      message: '15 students have completed the Sales Communication quiz.',
      time: '3 hours ago',
      read: true,
  },
  ];

  return (
    <header className="bg-white border-b border-neutral-200 h-16">
      <div className="h-full px-4 flex items-center justify-between">
        <div className="flex items-center">
          <button
            type="button"
            className="text-neutral-500 hover:text-neutral-700 focus:outline-none lg:hidden"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="ml-4 lg:ml-0">
            <div className="text-lg font-semibold text-neutral-900">Training Platform</div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Link href="/" className="text-neutral-500 hover:text-neutral-700">
            <span className="hidden md:inline mr-1">View</span> Site
          </Link>

          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <button
              type="button"
              className="relative p-1 text-neutral-500 hover:text-neutral-700 focus:outline-none"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>

              {/* Notification badge - only render on client side */}
              {isClient && notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>

            {/* Notifications dropdown - only render on client side */}
            {isClient && notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-20">
                <div className="py-2">
                  <div className="px-4 py-2 border-b border-neutral-200">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-semibold text-neutral-900">Notifications</h3>
                      <button className="text-xs text-primary hover:text-primary-700">
                        Mark all as read
                      </button>
                    </div>
                  </div>

                  <div className="max-h-60 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-neutral-500">
                        No notifications
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`px-4 py-3 hover:bg-neutral-50 ${
                            !notification.read ? 'bg-blue-50' : ''
                        }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-medium text-neutral-900">
                                {notification.title}
                              </p>
                              <p className="text-xs text-neutral-500 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-neutral-400 mt-1">
                                {notification.time}
                              </p>
                            </div>
                            {!notification.read && (
                              <span className="inline-block w-2 h-2 bg-primary rounded-full"></span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="px-4 py-2 border-t border-neutral-200">
                    <Link href="/admin/notifications" className="block text-center text-xs text-primary hover:text-primary-700">
                      View all notifications
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              className="flex items-center focus:outline-none"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            >
              <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary font-medium">
                {user?.displayName?.charAt(0) || 'U'}
              </div>
              <span className="hidden md:inline-block ml-2 text-sm font-medium text-neutral-700">
                {user?.displayName || 'User'}
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* User dropdown - only render on client side */}
            {isClient && userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg overflow-hidden z-20">
                <div className="py-1">
                  <Link href="/admin/profile" className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
                    Your Profile
                  </Link>
                  <Link href="/admin/settings" className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
