import React, {useState, useEffect } from 'react';
import {useAuth } from '@/context/AuthContext';
import {getUserNotificationPreferences, updateUserNotificationPreferences } from '@/services/notificationSchedulerService';
import {NotificationPreference } from '@/types/notification-templates.types';
import Button from '@/components/ui/Button';

const NotificationPreferences: React.FC = () => {
  const {user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreference | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user notification preferences
  useEffect(() => {
    const fetchPreferences = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        const userPreferences = await getUserNotificationPreferences(user.id);
        setPreferences(userPreferences);
    } catch (err) {
        console.error('Error fetching notification preferences:', err);
        setError('Failed to load notification preferences');
    } finally {
        setLoading(false);
    }
  };
    
    fetchPreferences();
}, [user]);

  // Handle toggle change
  const handleToggleChange = (field: keyof NotificationPreference) => {
    if (!preferences) return;
    
    setPreferences({
      ...preferences,
      [field]: !preferences[field]
  });
};

  // Save preferences
  const handleSave = async () => {
    if (!user?.id || !preferences) return;
    
    try {
      setSaving(true);
      setError(null);
      
      await updateUserNotificationPreferences(user.id, preferences);
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
  } catch (err) {
      console.error('Error saving notification preferences:', err);
      setError('Failed to save notification preferences');
  } finally {
      setSaving(false);
  }
};

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-neutral-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            <div className="h-10 bg-neutral-200 rounded"></div>
            <div className="h-10 bg-neutral-200 rounded"></div>
            <div className="h-10 bg-neutral-200 rounded"></div>
            <div className="h-10 bg-neutral-200 rounded"></div>
            <div className="h-10 bg-neutral-200 rounded"></div>
          </div>
        </div>
      </div>
    );
}

  if (!preferences) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <p className="text-neutral-500">Unable to load notification preferences.</p>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>
    );
}

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4">Notification Preferences</h2>
      
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
          <div>
            <h3 className="font-medium">Email Notifications</h3>
            <p className="text-sm text-neutral-500">Receive notifications via email</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={preferences.email}
              onChange={() => handleToggleChange('email')}
            />
            <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>
        
        <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
          <div>
            <h3 className="font-medium">In-App Notifications</h3>
            <p className="text-sm text-neutral-500">Receive notifications within the platform</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={preferences.inApp}
              onChange={() => handleToggleChange('inApp')}
            />
            <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>
        
        <div className="pt-2 pb-4">
          <h3 className="font-medium mb-3">Notification Types</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Course Progress Updates</p>
                <p className="text-sm text-neutral-500">Updates on your course progress</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={preferences.courseProgress}
                  onChange={() => handleToggleChange('courseProgress')}
                />
                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Course Completion</p>
                <p className="text-sm text-neutral-500">Notifications when you complete a course</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={preferences.courseCompletion}
                  onChange={() => handleToggleChange('courseCompletion')}
                />
                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Certificate Expiration</p>
                <p className="text-sm text-neutral-500">Reminders when your certificates are about to expire</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={preferences.certificateExpiration}
                  onChange={() => handleToggleChange('certificateExpiration')}
                />
                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">New Course Announcements</p>
                <p className="text-sm text-neutral-500">Notifications about new courses</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={preferences.newCourseAvailable}
                  onChange={() => handleToggleChange('newCourseAvailable')}
                />
                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Inactivity Reminders</p>
                <p className="text-sm text-neutral-500">Reminders when you haven't accessed a course in a while</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={preferences.inactivityReminder}
                  onChange={() => handleToggleChange('inactivityReminder')}
                />
                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
          <div>
            {success && (
              <p className="text-green-600 text-sm">
                Preferences saved successfully!
              </p>
            )}
            {error && (
              <p className="text-red-600 text-sm">
                {error}
              </p>
            )}
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={saving}
            isLoading={saving}
          >
            Save Preferences
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotificationPreferences;
