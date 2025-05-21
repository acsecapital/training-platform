import React, {useState, useEffect } from 'react';
import {useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';

interface ProfileFormData {
  displayName: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  jobTitle: string;
  bio: string;
}

const ProfileForm: React.FC = () => {
  const {user, updateProfile } = useAuth();
  const [formData, setFormData] = useState<ProfileFormData>({
    displayName: '',
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    jobTitle: '',
    bio: '',
});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.displayName || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        company: user.company || '',
        jobTitle: user.jobTitle || '',
        bio: user.bio || '',
    });
  }
}, [user]);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const {name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
  }));
};

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      
      // Update user profile
      await updateProfile({
        displayName: formData.displayName,
        firstName: formData.firstName,
        lastName: formData.lastName,
        company: formData.company,
        jobTitle: formData.jobTitle,
        bio: formData.bio,
    });
      
      setSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
    }, 3000);
  } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile. Please try again.');
  } finally {
      setLoading(false);
  }
};

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
      <h2 className="text-xl font-semibold text-neutral-900 mb-4">Profile Information</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Display Name */}
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-neutral-700 mb-1">
            Display Name
          </label>
          <input
            type="text"
            id="displayName"
            name="displayName"
            value={formData.displayName}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
          />
        </div>
        
        {/* First Name & Last Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-neutral-700 mb-1">
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-neutral-700 mb-1">
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
        
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            className="w-full px-3 py-2 border border-neutral-300 rounded-md bg-neutral-50 text-neutral-500 cursor-not-allowed"
            disabled
          />
          <p className="text-xs text-neutral-500 mt-1">
            Email cannot be changed. Contact support if you need to update your email.
          </p>
        </div>
        
        {/* Company & Job Title */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="company" className="block text-sm font-medium text-neutral-700 mb-1">
              Company
            </label>
            <input
              type="text"
              id="company"
              name="company"
              value={formData.company}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="jobTitle" className="block text-sm font-medium text-neutral-700 mb-1">
              Job Title
            </label>
            <input
              type="text"
              id="jobTitle"
              name="jobTitle"
              value={formData.jobTitle}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
        
        {/* Bio */}
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-neutral-700 mb-1">
            Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            rows={4}
            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Tell us a bit about yourself..."
          />
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        {/* Success Message */}
        {success && (
          <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-md">
            Profile updated successfully!
          </div>
        )}
        
        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            isLoading={loading}
            disabled={loading}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProfileForm;
