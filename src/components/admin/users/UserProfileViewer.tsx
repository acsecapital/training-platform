import React, {useState, useEffect } from 'react';
import {UserProfile, UserStats } from '@/types/user.types';
import {getUserById } from '@/services/userService';
import {getUserStats } from '@/services/statsService';
import {formatDate } from '@/utils/formatters';
import Link from 'next/link';
import {
  User, Mail, Phone, Building, Briefcase, MapPin,
  Calendar, Award, Clock, BookOpen, BarChart2, Edit, CheckCircle
} from 'lucide-react';

interface UserProfileViewerProps {
  userId: string;
}

const UserProfileViewer: React.FC<UserProfileViewerProps> = ({userId }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserData();
}, [userId]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      const userData = await getUserById(userId);

      if (!userData) {
        setError('User not found');
        return;
    }

      setUser(userData);

      // Fetch user stats
      try {
        const userStats = await getUserStats(userId);
        setStats(userStats);
    } catch (statsErr) {
        console.error('Error fetching user stats:', statsErr);
        // Don't set error for stats, just log it
    }
  } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to load user data. Please try again.');
  } finally {
      setLoading(false);
  }
};

  const getRoleLabel = (user: UserProfile) => {
    if (!user.roles) return 'No Role';

    const roles = [];
    if (user.roles.admin) roles.push('Admin');
    if (user.roles.instructor) roles.push('Instructor');
    if (user.roles.manager) roles.push('Manager');
    if (user.roles.student) roles.push('Student');

    return roles.length > 0 ? roles.join(', ') : 'User';
};

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
}

  if (error || !user) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        {error || 'User not found'}
      </div>
    );
}

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b border-neutral-200 flex justify-between">
        <div>
          <h3 className="text-lg leading-6 font-medium text-neutral-900">User Profile</h3>
          <p className="mt-1 max-w-2xl text-sm text-neutral-500">
            Personal details and learning progress
          </p>
        </div>
        <Link
          href={`/admin/users/${userId}/edit`}
          className="inline-flex items-center px-3 py-1 border border-neutral-300 rounded-md text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Link>
      </div>

      <div className="px-4 py-5 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <div className="flex flex-col items-center">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || user.email}
                  className="h-32 w-32 rounded-full object-cover"
                />
              ) : (
                <div className="h-32 w-32 rounded-full bg-primary-100 flex items-center justify-center text-primary-800 text-4xl font-medium">
                  {user.displayName?.[0] || user.email[0].toUpperCase()}
                </div>
              )}

              <h2 className="mt-4 text-xl font-medium text-neutral-900">
                {user.displayName || `${user.firstName || ''} ${user.lastName || ''}`}
              </h2>

              <div className="mt-1 text-sm text-neutral-500">
                {getRoleLabel(user)}
              </div>

              {user.jobTitle && (
                <div className="mt-1 text-sm text-neutral-500">
                  {user.jobTitle}
                </div>
              )}

              <div className="mt-4 flex space-x-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                  Verified
                </span>

                {stats && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                )}
              </div>
            </div>

            <div className="mt-6 border-t border-neutral-200 pt-6">
              <h3 className="text-sm font-medium text-neutral-900">Contact Information</h3>

              <dl className="mt-4 space-y-4">
                <div className="flex items-start">
                  <dt className="flex-shrink-0">
                    <Mail className="h-5 w-5 text-neutral-400" />
                  </dt>
                  <dd className="ml-3 text-sm text-neutral-700">{user.email}</dd>
                </div>

                {user.phoneNumber && (
                  <div className="flex items-start">
                    <dt className="flex-shrink-0">
                      <Phone className="h-5 w-5 text-neutral-400" />
                    </dt>
                    <dd className="ml-3 text-sm text-neutral-700">{user.phoneNumber}</dd>
                  </div>
                )}

                {user.location && (
                  <div className="flex items-start">
                    <dt className="flex-shrink-0">
                      <MapPin className="h-5 w-5 text-neutral-400" />
                    </dt>
                    <dd className="ml-3 text-sm text-neutral-700">{user.location}</dd>
                  </div>
                )}

                {user.company && (
                  <div className="flex items-start">
                    <dt className="flex-shrink-0">
                      <Building className="h-5 w-5 text-neutral-400" />
                    </dt>
                    <dd className="ml-3 text-sm text-neutral-700">{user.company}</dd>
                  </div>
                )}

                {user.department && (
                  <div className="flex items-start">
                    <dt className="flex-shrink-0">
                      <Briefcase className="h-5 w-5 text-neutral-400" />
                    </dt>
                    <dd className="ml-3 text-sm text-neutral-700">{user.department}</dd>
                  </div>
                )}

                <div className="flex items-start">
                  <dt className="flex-shrink-0">
                    <Calendar className="h-5 w-5 text-neutral-400" />
                  </dt>
                  <dd className="ml-3 text-sm text-neutral-700">
                    Joined: {formatDate(user.createdAt)}
                  </dd>
                </div>

                {user.lastLoginAt && (
                  <div className="flex items-start">
                    <dt className="flex-shrink-0">
                      <Clock className="h-5 w-5 text-neutral-400" />
                    </dt>
                    <dd className="ml-3 text-sm text-neutral-700">
                      Last active: {formatDate(user.lastLoginAt)}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          <div className="md:col-span-2">
            {stats ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-neutral-900">Learning Progress</h3>

                  <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                      <div className="px-4 py-5 sm:p-6">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 bg-primary-100 rounded-md p-3">
                            <BookOpen className="h-6 w-6 text-primary-600" />
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-sm font-medium text-neutral-500 truncate">
                                Courses Enrolled
                              </dt>
                              <dd>
                                <div className="text-lg font-medium text-neutral-900">
                                  {stats.coursesEnrolled}
                                </div>
                              </dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                      <div className="px-4 py-5 sm:p-6">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-sm font-medium text-neutral-500 truncate">
                                Courses Completed
                              </dt>
                              <dd>
                                <div className="text-lg font-medium text-neutral-900">
                                  {stats.coursesCompleted}
                                </div>
                              </dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                      <div className="px-4 py-5 sm:p-6">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                            <Award className="h-6 w-6 text-yellow-600" />
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-sm font-medium text-neutral-500 truncate">
                                Certificates Earned
                              </dt>
                              <dd>
                                <div className="text-lg font-medium text-neutral-900">
                                  {stats.certificatesEarned}
                                </div>
                              </dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-neutral-900">Learning Activity</h3>

                  <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                      <div className="px-4 py-5 sm:p-6">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                            <Clock className="h-6 w-6 text-blue-600" />
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-sm font-medium text-neutral-500 truncate">
                                Total Learning Time
                              </dt>
                              <dd>
                                <div className="text-lg font-medium text-neutral-900">
                                  {Math.floor(stats.totalLearningTime / 60)} hours {stats.totalLearningTime % 60} minutes
                                </div>
                              </dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                      <div className="px-4 py-5 sm:p-6">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                            <BarChart2 className="h-6 w-6 text-purple-600" />
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-sm font-medium text-neutral-500 truncate">
                                Average Quiz Score
                              </dt>
                              <dd>
                                <div className="text-lg font-medium text-neutral-900">
                                  {stats.averageQuizScore}%
                                </div>
                              </dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {stats.achievements && stats.achievements.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-neutral-900">Achievements</h3>

                    <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {stats.achievements.map((achievement) => (
                        <li key={achievement.id} className="bg-white overflow-hidden shadow rounded-lg">
                          <div className="px-4 py-5 sm:p-6">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <img
                                  src={achievement.icon}
                                  alt={achievement.name}
                                  className="h-10 w-10"
                                />
                              </div>
                              <div className="ml-4">
                                <h4 className="text-sm font-medium text-neutral-900">
                                  {achievement.name}
                                </h4>
                                <p className="text-sm text-neutral-500">
                                  {achievement.description}
                                </p>
                                <p className="text-xs text-neutral-400 mt-1">
                                  Earned on {formatDate(achievement.earnedDate)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-6 text-center">
                <BookOpen className="h-12 w-12 text-neutral-400 mx-auto" />
                <h3 className="mt-2 text-sm font-medium text-neutral-900">No Learning Data</h3>
                <p className="mt-1 text-sm text-neutral-500">
                  This user hasn't enrolled in any courses yet.
                </p>
                <div className="mt-6">
                  <Link
                    href="/admin/courses"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    Browse Courses
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileViewer;
