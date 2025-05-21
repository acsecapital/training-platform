import React from 'react';
import Link from 'next/link';
import {useRouter } from 'next/router';
import {useAuth } from '@/context/AuthContext';

const SimpleSidebar: React.FC = () => {
  const router = useRouter();
  const {user } = useAuth();

  // Check if the current route matches or starts with a given path
  const isActive = (path: string) => {
    return router.pathname === path || router.pathname.startsWith(`${path}/`);
};

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-center h-16 px-4 border-b border-neutral-200">
        <Link href="/admin" className="text-xl font-bold text-primary-600">
          Admin Panel
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        <Link
          href="/admin"
          className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
            isActive('/admin') && !isActive('/admin/certificates') && !isActive('/admin/courses')
              ? 'bg-primary-50 text-primary-600'
              : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
        }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 mr-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          Dashboard
        </Link>

        <Link
          href="/admin/courses"
          className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
            isActive('/admin/courses')
              ? 'bg-primary-50 text-primary-600'
              : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
        }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 mr-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
          Courses
        </Link>

        <Link
          href="/admin/certificates"
          className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
            isActive('/admin/certificates')
              ? 'bg-primary-50 text-primary-600'
              : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
        }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 mr-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Certificates
        </Link>

        <Link
          href="/admin/users"
          className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
            isActive('/admin/users')
              ? 'bg-primary-50 text-primary-600'
              : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
        }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 mr-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
          Users
        </Link>

        <Link
          href="/admin/media"
          className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
            isActive('/admin/media')
              ? 'bg-primary-50 text-primary-600'
              : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
        }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 mr-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          Media
        </Link>

        <Link
          href="/admin/settings"
          className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
            isActive('/admin/settings')
              ? 'bg-primary-50 text-primary-600'
              : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
        }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 mr-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          Settings
        </Link>
      </nav>

      {/* User info */}
      <div className="p-4 border-t border-neutral-200">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium">
              {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-neutral-900 truncate">
              {user?.displayName || user?.email || 'Admin User'}
            </p>
            <p className="text-xs text-neutral-500 truncate">
              {user?.email || ''}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleSidebar;
