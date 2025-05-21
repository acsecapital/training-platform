import React, {useState } from 'react';
import Link from 'next/link';
import {useRouter } from 'next/router';
import {motion } from 'framer-motion';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
},
  {
    name: 'Users',
    href: '/admin/users',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    children: [
      {
        name: 'All Users',
        href: '/admin/users',
        icon: null,
    },
      {
        name: 'Create User',
        href: '/admin/users/create',
        icon: null,
    },
      {
        name: 'Roles',
        href: '/admin/users/roles',
        icon: null,
    },
      {
        name: 'Bulk Operations',
        href: '/admin/users/bulk',
        icon: null,
    },
      {
        name: 'Progress Tracking',
        href: '/admin/users/progress',
        icon: null,
    },
    ],
},
  {
    name: 'Companies',
    href: '/admin/companies',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    children: [
      {
        name: 'Company Dashboard',
        href: '/admin/companies?view=dashboard',
        icon: null,
    },
      {
        name: 'All Companies',
        href: '/admin/companies?view=list',
        icon: null,
    },
      {
        name: 'Create Company',
        href: '/admin/companies/create',
        icon: null,
    },
    ],
},
  {
    name: 'Teams & Departments',
    href: '/admin/teams',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    children: [
      {
        name: 'Teams',
        href: '/admin/teams',
        icon: null,
    },
      {
        name: 'Departments',
        href: '/admin/departments',
        icon: null,
    },
    ],
},
  {
    name: 'Courses',
    href: '/admin/courses',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    children: [
      {
        name: 'All Courses',
        href: '/admin/courses',
        icon: null,
    },
      {
        name: 'Create Course',
        href: '/admin/courses/create',
        icon: null,
    },
      {
        name: 'Categories',
        href: '/admin/courses/categories',
        icon: null,
    },
    ],
},
  {
    name: 'Enrollments',
    href: '/admin/enrollments',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
},
  {
    name: 'Quizzes',
    href: '/admin/quizzes',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    children: [
      {
        name: 'All Quizzes',
        href: '/admin/quizzes',
        icon: null,
    },
      {
        name: 'Create Quiz',
        href: '/admin/quizzes/create',
        icon: null,
    },
      {
        name: 'Results',
        href: '/admin/quizzes/results',
        icon: null,
    },
    ],
},
  {
    name: 'Media',
    href: '/admin/media',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
},
  {
    name: 'Certificates',
    href: '/admin/certificates',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
},
  {
    name: 'Notifications',
    href: '/admin/notifications',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
    children: [
      {
        name: 'Dashboard',
        href: '/admin/notifications',
        icon: null,
    },
      {
        name: 'Email Templates',
        href: '/admin/notifications/templates',
        icon: null,
    },
      {
        name: 'Schedules',
        href: '/admin/notifications/schedules',
        icon: null,
    },
      {
        name: 'Test Tool',
        href: '/admin/notifications/test',
        icon: null,
    },
    ],
},
  {
    name: 'Reports',
    href: '/admin/reports',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    children: [
      {
        name: 'Course Completion',
        href: '/admin/reports/course-completion',
        icon: null,
    },
      {
        name: 'Quiz Performance',
        href: '/admin/reports/quiz-performance',
        icon: null,
    },
      {
        name: 'User Activity',
        href: '/admin/reports/user-activity',
        icon: null,
    },
      {
        name: 'Company Progress',
        href: '/admin/reports/company-progress',
        icon: null,
    },
    ],
},
  {
    name: 'User Feedback',
    href: '/admin/feedback',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
      </svg>
    ),
},
  {
    name: 'Reviews',
    href: '/admin/reviews',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
},
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    children: [
      {
        name: 'General',
        href: '/admin/settings',
        icon: null,
    },
      {
        name: 'Media',
        href: '/admin/settings?tab=1',
        icon: null,
    },
      {
        name: 'Cloudflare',
        href: '/admin/settings?tab=2',
        icon: null,
    },
    ],
},
  {
    name: 'Utilities',
    href: '/admin/utilities',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    children: [
      {
        name: 'Fix Module Counts',
        href: '/admin/utilities/fix-module-counts',
        icon: null,
    },
      {
        name: 'Fix Category Counts',
        href: '/admin/utilities/fix-category-counts',
        icon: null,
    },
    ],
},
];

const Sidebar: React.FC = () => {
  const router = useRouter();
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleExpand = (name: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [name]: !prev[name]
  }));
};

  const isActive = (href: string) => {
    return router.pathname === href || router.pathname.startsWith(`${href}/`);
};

  return (
    <div className="h-full w-64 bg-white border-r border-neutral-200 overflow-y-auto">
      <div className="p-4 border-b border-neutral-200">
        <Link href="/admin" className="flex items-center">
          <span className="text-xl font-bold text-primary">Admin Panel</span>
        </Link>
      </div>

      <nav className="mt-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.name}>
              {item.children ? (
                <div>
                  <button
                    onClick={() => toggleExpand(item.name)}
                    className={`w-full flex items-center justify-between px-4 py-2 text-sm font-medium rounded-md ${
                      isActive(item.href)
                        ? 'text-primary bg-primary-50'
                        : 'text-neutral-700 hover:text-primary hover:bg-neutral-50'
                  }`}
                  >
                    <div className="flex items-center">
                      <span className="mr-3">{item.icon}</span>
                      {item.name}
                    </div>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-4 w-4 transition-transform ${
                        expandedItems[item.name] ? 'transform rotate-180' : ''
                    }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {expandedItems[item.name] && (
                    <motion.ul
                      initial={{height: 0, opacity: 0 }}
                      animate={{height: 'auto', opacity: 1 }}
                      exit={{height: 0, opacity: 0 }}
                      transition={{duration: 0.2 }}
                      className="ml-8 mt-1 space-y-1"
                    >
                      {item.children.map((child) => (
                        <li key={child.name}>
                          <Link
                            href={child.href}
                            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                              isActive(child.href)
                                ? 'text-primary bg-primary-50'
                                : 'text-neutral-700 hover:text-primary hover:bg-neutral-50'
                          }`}
                          >
                            {child.name}
                          </Link>
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </div>
              ) : (
                <Link
                  href={item.href}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                    isActive(item.href)
                      ? 'text-primary bg-primary-50'
                      : 'text-neutral-700 hover:text-primary hover:bg-neutral-50'
                }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.name}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
