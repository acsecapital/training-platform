import React, {useState, useEffect } from 'react';
import {UserProfile, UserRole } from '@/types/user.types';
import {getUserById, updateUserProfile } from '@/services/userService';
import {Shield, AlertCircle, Check, X } from 'lucide-react';

interface UserRoleManagerProps {
  userId: string;
  onRoleUpdate?: (userId: string, roles: UserRole) => void;
}

const UserRoleManager: React.FC<UserRoleManagerProps> = ({userId, onRoleUpdate }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [roles, setRoles] = useState<UserRole>({
    admin: false,
    instructor: false,
    student: false,
    manager: false,
});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
      setRoles(userData.roles || {
        admin: false,
        instructor: false,
        student: true,
        manager: false,
    });
  } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to load user data. Please try again.');
  } finally {
      setLoading(false);
  }
};

  const handleRoleToggle = (role: keyof UserRole) => {
    setRoles((prev) => ({
      ...prev,
      [role]: !prev[role],
  }));
};

  const handleSaveRoles = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      await updateUserProfile(userId, {roles });
      
      setSuccess('User roles updated successfully');
      
      if (onRoleUpdate) {
        onRoleUpdate(userId, roles);
    }
  } catch (err) {
      console.error('Error updating user roles:', err);
      setError('Failed to update user roles. Please try again.');
  } finally {
      setSaving(false);
  }
};

  if (loading) {
    return (
      <div className="p-4 flex justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
}

  if (!user) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">User not found</p>
          </div>
        </div>
      </div>
    );
}

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b border-neutral-200">
        <div className="flex items-center">
          <Shield className="h-5 w-5 text-primary mr-2" />
          <h3 className="text-lg leading-6 font-medium text-neutral-900">User Role Management</h3>
        </div>
        <p className="mt-1 max-w-2xl text-sm text-neutral-500">
          Manage roles and permissions for {user.displayName || user.email}
        </p>
      </div>
      
      {error && (
        <div className="px-4 py-3 bg-red-50 border-b border-red-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <X className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {success && (
        <div className="px-4 py-3 bg-green-50 border-b border-green-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <Check className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="px-4 py-5 sm:p-6">
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-medium text-neutral-900">Assigned Roles</h4>
            <p className="text-sm text-neutral-500 mt-1">
              Select the roles that should be assigned to this user
            </p>
            <div className="mt-4 space-y-4">
              <div className="relative flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="admin"
                    name="admin"
                    type="checkbox"
                    className="focus:ring-primary h-4 w-4 text-primary border-neutral-300 rounded"
                    checked={roles.admin || false}
                    onChange={() => handleRoleToggle('admin')}
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="admin" className="font-medium text-neutral-700">
                    Administrator
                  </label>
                  <p className="text-neutral-500">
                    Full access to all platform features and settings
                  </p>
                </div>
              </div>
              
              <div className="relative flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="instructor"
                    name="instructor"
                    type="checkbox"
                    className="focus:ring-primary h-4 w-4 text-primary border-neutral-300 rounded"
                    checked={roles.instructor || false}
                    onChange={() => handleRoleToggle('instructor')}
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="instructor" className="font-medium text-neutral-700">
                    Instructor
                  </label>
                  <p className="text-neutral-500">
                    Can create and manage courses, quizzes, and view student progress
                  </p>
                </div>
              </div>
              
              <div className="relative flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="student"
                    name="student"
                    type="checkbox"
                    className="focus:ring-primary h-4 w-4 text-primary border-neutral-300 rounded"
                    checked={roles.student || false}
                    onChange={() => handleRoleToggle('student')}
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="student" className="font-medium text-neutral-700">
                    Student
                  </label>
                  <p className="text-neutral-500">
                    Can enroll in courses, take quizzes, and earn certificates
                  </p>
                </div>
              </div>
              
              <div className="relative flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="manager"
                    name="manager"
                    type="checkbox"
                    className="focus:ring-primary h-4 w-4 text-primary border-neutral-300 rounded"
                    checked={roles.manager || false}
                    onChange={() => handleRoleToggle('manager')}
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="manager" className="font-medium text-neutral-700">
                    Manager
                  </label>
                  <p className="text-neutral-500">
                    Can manage team members, view team progress, and generate reports
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-neutral-200 pt-5">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveRoles}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                ) : (
                  <Shield className="h-4 w-4 mr-2" />
                )}
                Save Role Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserRoleManager;
