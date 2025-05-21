import React, {useState } from 'react';
import {useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const PasswordForm: React.FC = () => {
  const {updatePassword } = useAuth();
  const [formData, setFormData] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
  }));
};

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords
    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match.');
      return;
  }
    
    if (formData.newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
  }
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      
      // Update password
      await updatePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
    });
      
      // Reset form
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
      
      setSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
    }, 3000);
  } catch (err: any) {
      console.error('Error updating password:', err);
      setError(err.message || 'Failed to update password. Please try again.');
  } finally {
      setLoading(false);
  }
};

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
      <h2 className="text-xl font-semibold text-neutral-900 mb-4">Change Password</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Current Password */}
        <div>
          <label htmlFor="currentPassword" className="block text-sm font-medium text-neutral-700 mb-1">
            Current Password
          </label>
          <input
            type="password"
            id="currentPassword"
            name="currentPassword"
            value={formData.currentPassword}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
          />
        </div>
        
        {/* New Password */}
        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-neutral-700 mb-1">
            New Password
          </label>
          <input
            type="password"
            id="newPassword"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
            minLength={8}
          />
          <p className="text-xs text-neutral-500 mt-1">
            Password must be at least 8 characters long.
          </p>
        </div>
        
        {/* Confirm New Password */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700 mb-1">
            Confirm New Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
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
            Password updated successfully!
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
            Update Password
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PasswordForm;
