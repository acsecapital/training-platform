import React from 'react';
import Link from 'next/link';
import {formatDate } from '@/utils/date';

interface Activity {
  id: string;
  type: 'enrollment' | 'completion' | 'quiz' | 'certificate' | 'login';
  user: {
    id: string;
    name: string;
    avatar?: string;
};
  course?: {
    id: string;
    title: string;
};
  quiz?: {
    id: string;
    title: string;
    score: number;
};
  timestamp: string;
}

interface RecentActivityProps {
  activities: Activity[];
  loading?: boolean;
}

const RecentActivity: React.FC<RecentActivityProps> = ({activities, loading = false }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Recent Activity</h2>
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="flex items-start">
              <div className="h-10 w-10 rounded-full bg-neutral-200"></div>
              <div className="ml-3 flex-1">
                <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-neutral-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
}

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'enrollment':
        return (
          <div className="p-2 rounded-full bg-blue-100 text-blue-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
        );
      case 'completion':
        return (
          <div className="p-2 rounded-full bg-green-100 text-green-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'quiz':
        return (
          <div className="p-2 rounded-full bg-purple-100 text-purple-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        );
      case 'certificate':
        return (
          <div className="p-2 rounded-full bg-yellow-100 text-yellow-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
        );
      case 'login':
        return (
          <div className="p-2 rounded-full bg-neutral-100 text-neutral-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="p-2 rounded-full bg-neutral-100 text-neutral-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
  }
};

  const getActivityText = (activity: Activity) => {
    switch (activity.type) {
      case 'enrollment':
        return (
          <>
            <Link href={`/admin/users/${activity.user.id}`} className="font-medium text-neutral-900 hover:text-primary">
              {activity.user.name}
            </Link>{' '}
            enrolled in{' '}
            <Link href={`/admin/courses/${activity.course?.id}`} className="font-medium text-neutral-900 hover:text-primary">
              {activity.course?.title}
            </Link>
          </>
        );
      case 'completion':
        return (
          <>
            <Link href={`/admin/users/${activity.user.id}`} className="font-medium text-neutral-900 hover:text-primary">
              {activity.user.name}
            </Link>{' '}
            completed{' '}
            <Link href={`/admin/courses/${activity.course?.id}`} className="font-medium text-neutral-900 hover:text-primary">
              {activity.course?.title}
            </Link>
          </>
        );
      case 'quiz':
        return (
          <>
            <Link href={`/admin/users/${activity.user.id}`} className="font-medium text-neutral-900 hover:text-primary">
              {activity.user.name}
            </Link>{' '}
            scored {activity.quiz?.score}% on{' '}
            <Link href={`/admin/quizzes/${activity.quiz?.id}`} className="font-medium text-neutral-900 hover:text-primary">
              {activity.quiz?.title}
            </Link>
          </>
        );
      case 'certificate':
        return (
          <>
            <Link href={`/admin/users/${activity.user.id}`} className="font-medium text-neutral-900 hover:text-primary">
              {activity.user.name}
            </Link>{' '}
            earned a certificate for{' '}
            <Link href={`/admin/courses/${activity.course?.id}`} className="font-medium text-neutral-900 hover:text-primary">
              {activity.course?.title}
            </Link>
          </>
        );
      case 'login':
        return (
          <>
            <Link href={`/admin/users/${activity.user.id}`} className="font-medium text-neutral-900 hover:text-primary">
              {activity.user.name}
            </Link>{' '}
            logged in to the platform
          </>
        );
      default:
        return 'Unknown activity';
  }
};

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-neutral-900">Recent Activity</h2>
        <Link href="/admin/reports/user-activity" className="text-sm text-primary hover:text-primary-700">
          View all
        </Link>
      </div>
      
      {activities.length === 0 ? (
        <div className="text-center py-6 text-neutral-500">
          No recent activity
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start">
              {getActivityIcon(activity.type)}
              
              <div className="ml-3">
                <p className="text-sm text-neutral-700">
                  {getActivityText(activity)}
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  {formatDate(activity.timestamp, 'relative')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentActivity;
