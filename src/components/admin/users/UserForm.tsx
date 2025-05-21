import React, {useState, useEffect } from 'react';
import {UserProfile, UserRole } from '@/types/user.types';
import {getUserById, updateUserProfile } from '@/services/userService';
import {useRouter } from 'next/router';
import {Save, X, User, Mail, Phone, Building, Briefcase, MapPin } from 'lucide-react';

interface UserFormProps {
  userId?: string;
  onCancel?: () => void;
  onSave?: (user: UserProfile) => void;
  isCreating?: boolean;
}

const UserForm: React.FC<UserFormProps> = ({
  userId,
  onCancel,
  onSave,
  isCreating = false,
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    displayName: '',
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    company: '',
    jobTitle: '',
    department: '',
    location: '',
    roles: {
      admin: false,
      instructor: false,
      student: true,
      manager: false,
  },
});

  useEffect(() => {
    if (userId && !isCreating) {
      fetchUserData();
  }
}, [userId, isCreating]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!userId) {
        setError('User ID is required');
        return;
    }

      const userData = await getUserById(userId);

      if (!userData) {
        setError('User not found');
        return;
    }

      setFormData({
        ...userData,
        // Ensure roles object is complete
        roles: {
          admin: userData.roles?.admin || false,
          instructor: userData.roles?.instructor || false,
          student: userData.roles?.student || true,
          manager: userData.roles?.manager || false,
      },
    });
  } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to load user data. Please try again.');
  } finally {
      setLoading(false);
  }
};

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const {name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
  }));
};

  const handleRoleChange = (role: keyof UserRole) => {
    setFormData((prev) => ({
      ...prev,
      roles: {
        ...prev.roles || {
          admin: false,
          instructor: false,
          student: true,
          manager: false,
      },
        [role]: !(prev.roles && prev.roles[role]),
    },
  }));
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      if (isCreating) {
        // Handle user creation (to be implemented)
        console.log('Creating user:', formData);
    } else if (userId) {
        // Update existing user
        await updateUserProfile(userId, formData);
    } else {
        setError('User ID is required for updates');
        return;
    }

      if (onSave && formData.uid) {
        onSave(formData as UserProfile);
    } else {
        router.push('/admin/users');
    }
  } catch (err) {
      console.error('Error saving user data:', err);
      setError('Failed to save user data. Please try again.');
  } finally {
      setLoading(false);
  }
};

  if (loading && !isCreating) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
}

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-lg overflow-hidden">
      <div className="px-8 py-5 border-b border-neutral-200 flex justify-between items-center">
        <h2 className="text-xl font-medium text-neutral-900">
          {isCreating ? 'Create New User' : 'Edit User'}
        </h2>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center px-4 py-2 border border-neutral-300 rounded-md text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </button>
        )}
      </div>

      {error && (
        <div className="px-8 py-4 bg-red-50 border-b border-red-200">
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

      <div className="px-8 py-6 space-y-8">
        {/* Personal Information Section */}
        <div>
          <h3 className="text-base font-medium text-neutral-800 mb-5">Personal Information</h3>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-neutral-700 mb-2">
                First Name
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  type="text"
                  name="firstName"
                  id="firstName"
                  className="focus:ring-primary focus:border-primary block w-full pl-10 py-3 text-sm border-neutral-300 rounded-md"
                  placeholder="First Name"
                  value={formData.firstName || ''}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-neutral-700 mb-2">
                Last Name
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  type="text"
                  name="lastName"
                  id="lastName"
                  className="focus:ring-primary focus:border-primary block w-full pl-10 py-3 text-sm border-neutral-300 rounded-md"
                  placeholder="Last Name"
                  value={formData.lastName || ''}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information Section */}
        <div className="pt-2">
          <h3 className="text-base font-medium text-neutral-800 mb-5">Contact Information</h3>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
                Email
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  id="email"
                  className={`focus:ring-primary focus:border-primary block w-full pl-10 py-3 text-sm border-neutral-300 rounded-md ${
                    !isCreating ? 'bg-neutral-50' : ''
                }`}
                  placeholder="Email Address"
                  value={formData.email || ''}
                  onChange={handleInputChange}
                  required
                  readOnly={!isCreating}
                />
              </div>
              {!isCreating && (
                <p className="mt-2 text-xs text-neutral-500">
                  Email cannot be changed after user creation
                </p>
              )}
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-neutral-700 mb-2">
                Phone Number
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  type="tel"
                  name="phoneNumber"
                  id="phoneNumber"
                  className="focus:ring-primary focus:border-primary block w-full pl-10 py-3 text-sm border-neutral-300 rounded-md"
                  placeholder="Phone Number"
                  value={formData.phoneNumber || ''}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Employment Information Section */}
        <div className="pt-2">
          <h3 className="text-base font-medium text-neutral-800 mb-5">Employment Information</h3>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-neutral-700 mb-2">
                Company
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  type="text"
                  name="company"
                  id="company"
                  className="focus:ring-primary focus:border-primary block w-full pl-10 py-3 text-sm border-neutral-300 rounded-md"
                  placeholder="Company"
                  value={formData.company || ''}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="jobTitle" className="block text-sm font-medium text-neutral-700 mb-2">
                Job Title
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Briefcase className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  type="text"
                  name="jobTitle"
                  id="jobTitle"
                  className="focus:ring-primary focus:border-primary block w-full pl-10 py-3 text-sm border-neutral-300 rounded-md"
                  placeholder="Job Title"
                  value={formData.jobTitle || ''}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="department" className="block text-sm font-medium text-neutral-700 mb-2">
                Department
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  type="text"
                  name="department"
                  id="department"
                  className="focus:ring-primary focus:border-primary block w-full pl-10 py-3 text-sm border-neutral-300 rounded-md"
                  placeholder="Department"
                  value={formData.department || ''}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-neutral-700 mb-2">
                Location
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  type="text"
                  name="location"
                  id="location"
                  className="focus:ring-primary focus:border-primary block w-full pl-10 py-3 text-sm border-neutral-300 rounded-md"
                  placeholder="Location"
                  value={formData.location || ''}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>
        </div>

        {/* User Roles Section */}
        <div className="pt-2">
          <h3 className="text-base font-medium text-neutral-800 mb-5">User Roles</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 bg-neutral-50 p-6 rounded-lg">
            <div className="relative flex items-start p-4 bg-white rounded-md shadow-sm">
              <div className="flex items-center h-5">
                <input
                  id="role-admin"
                  name="role-admin"
                  type="checkbox"
                  className="focus:ring-primary h-5 w-5 text-primary border-neutral-300 rounded"
                  checked={formData.roles?.admin || false}
                  onChange={() => handleRoleChange('admin')}
                />
              </div>
              <div className="ml-3">
                <label htmlFor="role-admin" className="font-medium text-neutral-700">
                  Admin
                </label>
                <p className="text-neutral-500 text-sm mt-1">Full access to all features</p>
              </div>
            </div>

            <div className="relative flex items-start p-4 bg-white rounded-md shadow-sm">
              <div className="flex items-center h-5">
                <input
                  id="role-instructor"
                  name="role-instructor"
                  type="checkbox"
                  className="focus:ring-primary h-5 w-5 text-primary border-neutral-300 rounded"
                  checked={formData.roles?.instructor || false}
                  onChange={() => handleRoleChange('instructor')}
                />
              </div>
              <div className="ml-3">
                <label htmlFor="role-instructor" className="font-medium text-neutral-700">
                  Instructor
                </label>
                <p className="text-neutral-500 text-sm mt-1">Can create and manage courses</p>
              </div>
            </div>

            <div className="relative flex items-start p-4 bg-white rounded-md shadow-sm">
              <div className="flex items-center h-5">
                <input
                  id="role-student"
                  name="role-student"
                  type="checkbox"
                  className="focus:ring-primary h-5 w-5 text-primary border-neutral-300 rounded"
                  checked={formData.roles?.student || false}
                  onChange={() => handleRoleChange('student')}
                />
              </div>
              <div className="ml-3">
                <label htmlFor="role-student" className="font-medium text-neutral-700">
                  Student
                </label>
                <p className="text-neutral-500 text-sm mt-1">Can enroll in courses</p>
              </div>
            </div>

            <div className="relative flex items-start p-4 bg-white rounded-md shadow-sm">
              <div className="flex items-center h-5">
                <input
                  id="role-manager"
                  name="role-manager"
                  type="checkbox"
                  className="focus:ring-primary h-5 w-5 text-primary border-neutral-300 rounded"
                  checked={formData.roles?.manager || false}
                  onChange={() => handleRoleChange('manager')}
                />
              </div>
              <div className="ml-3">
                <label htmlFor="role-manager" className="font-medium text-neutral-700">
                  Manager
                </label>
                <p className="text-neutral-500 text-sm mt-1">Can manage team members</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-5 bg-neutral-50 border-t border-neutral-200 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center px-5 py-2.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
          ) : (
            <Save className="h-5 w-5 mr-2" />
          )}
          {isCreating ? 'Create User' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
};

export default UserForm;
