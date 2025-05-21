import React, {useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import UserRoleManager from '@/components/admin/users/UserRoleManager';
import {UserProfile, UserRole } from '@/types/user.types';
import {getUsers } from '@/services/userService';
import {useRouter } from 'next/router';
import {useAuth } from '@/context/AuthContext';
import {NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import {ArrowLeft, Search, Filter } from 'lucide-react';

const UserRolesPage: NextPage = () => {
  const router = useRouter();
  const {user, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Redirect if user is not admin
  React.useEffect(() => {
    if (!authLoading && user && !user.roles?.admin) {
      void router.push('/dashboard');
  }
}, [user, authLoading, router]);

  useEffect(() => {
    void fetchUsers();
}, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const fetchedUsers = await getUsers();
      setUsers(fetchedUsers);
      setFilteredUsers(fetchedUsers);
  } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again.');
  } finally {
      setLoading(false);
  }
};

  useEffect(() => {
    // Apply search and role filter
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => {
        if (!user.roles) return false;

        switch (roleFilter) {
          case 'admin':
            return user.roles.admin;
          case 'instructor':
            return user.roles.instructor;
          case 'student':
            return user.roles.student;
          case 'manager':
            return user.roles.manager;
          default:
            return true;
      }
    });
  }

    setFilteredUsers(filtered);
}, [searchTerm, roleFilter, users]);

  const handleRoleUpdate = (userId: string, roles: UserRole) => {
    // Update the user in the local state
    setUsers(prevUsers =>
      prevUsers.map(u =>
        u.uid === userId ? {...u, roles } : u
      )
    );

    // If the selected user is the one being updated, update it too
    if (selectedUser && selectedUser.uid === userId) {
      setSelectedUser(prev => prev ? {...prev, roles } : null);
  }
};

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
}

  if (!user || !user.roles?.admin) {
    return null; // Will redirect
}

  return (
    <AdminLayout>
      <Head>
        <title>User Roles | Admin</title>
      </Head>

      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex items-center mb-4">
            <Link
              href="/admin/users"
              className="inline-flex items-center text-sm text-primary-600 hover:text-primary-900"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Users
            </Link>
          </div>

          <h1 className="text-2xl font-semibold text-neutral-900">User Roles Management</h1>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 bg-white shadow-sm rounded-lg overflow-hidden">
                <div className="p-4 border-b border-neutral-200">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-neutral-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search users..."
                      className="block w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div className="p-4 border-b border-neutral-200">
                  <div className="relative">
                    <select
                      className="appearance-none block w-full pl-3 pr-10 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                    >
                      <option value="all">All Roles</option>
                      <option value="admin">Admins</option>
                      <option value="instructor">Instructors</option>
                      <option value="student">Students</option>
                      <option value="manager">Managers</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <Filter className="h-5 w-5 text-neutral-400" />
                    </div>
                  </div>
                </div>

                <div className="overflow-y-auto max-h-96">
                  <ul className="divide-y divide-neutral-200">
                    {filteredUsers.length === 0 ? (
                      <li className="px-4 py-3 text-center text-sm text-neutral-500">
                        No users found
                      </li>
                    ) : (
                      filteredUsers.map((user) => (
                        <li
                          key={user.uid}
                          className={`px-4 py-3 hover:bg-neutral-50 cursor-pointer ${
                            selectedUser?.uid === user.uid ? 'bg-primary-50' : ''
                        }`}
                          onClick={() => setSelectedUser(user)}
                        >
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {user.photoURL ? (
                                <img
                                  className="h-10 w-10 rounded-full object-cover"
                                  src={user.photoURL}
                                  alt={user.displayName || user.email}
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-800 font-medium">
                                  {user.displayName?.[0] || user.email[0].toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-neutral-900">
                                {user.displayName || user.email}
                              </p>
                              <p className="text-xs text-neutral-500">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </div>

              <div className="md:col-span-2">
                {selectedUser ? (
                  <UserRoleManager
                    userId={selectedUser.uid}
                    onRoleUpdate={handleRoleUpdate}
                  />
                ) : (
                  <div className="bg-white shadow-sm rounded-lg p-8 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-neutral-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-neutral-900">Select a user</h3>
                    <p className="mt-1 text-sm text-neutral-500">
                      Select a user from the list to manage their roles.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default UserRolesPage;
