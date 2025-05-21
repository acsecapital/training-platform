import React, {useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {useRouter } from 'next/router';
import {useAuth } from '@/context/AuthContext';

interface SimpleHeaderProps {
  toggleSidebar: () => void;
}

const SimpleHeader: React.FC<SimpleHeaderProps> = ({toggleSidebar }) => {
  const {user, logout } = useAuth();
  const router = useRouter();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
    }
  };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
  };
}, []);

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
  } catch (error) {
      console.error('Error logging out:', error);
  }
};

  return (
    <header className="bg-white border-b border-neutral-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Mobile menu button */}
          <div className="flex items-center">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-neutral-400 hover:text-neutral-500 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 lg:hidden"
              onClick={toggleSidebar}
            >
              <span className="sr-only">Open sidebar</span>
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>

          {/* Right side - User menu */}
          <div className="flex items-center">
            {/* View site link */}
            <Link
              href="/"
              className="mr-4 text-sm text-neutral-500 hover:text-neutral-700"
              target="_blank"
            >
              <span className="hidden sm:inline">View Site</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 sm:hidden"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </Link>

            {/* User dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <span className="sr-only">Open user menu</span>
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium">
                  {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </div>
              </button>

              {/* Dropdown menu */}
              {userMenuOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-neutral-100">
                  <div className="py-1">
                    <div className="px-4 py-2">
                      <p className="text-sm font-medium text-neutral-900 truncate">
                        {user?.displayName || user?.email || 'Admin User'}
                      </p>
                      <p className="text-xs text-neutral-500 truncate">
                        {user?.email || ''}
                      </p>
                    </div>
                  </div>
                  <div className="py-1">
                    <Link
                      href="/admin/profile"
                      className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Your Profile
                    </Link>
                    <Link
                      href="/admin/settings"
                      className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Settings
                    </Link>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default SimpleHeader;
