import React, {useState, useEffect } from 'react';
import {useAuth } from '@/context/AuthContext';
import {getUserReminderSettings, updateUserReminderSettings, ReminderSettings as ReminderSettingsType } from '@/services/reminderService';
import Button from '@/components/ui/Button';

const ReminderSettings: React.FC = () => {
  const {user } = useAuth();
  const [settings, setSettings] = useState<ReminderSettingsType>({
    enabled: true,
    frequency: 'weekly',
});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch user reminder settings
  useEffect(() => {
    const fetchSettings = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const userSettings = await getUserReminderSettings(user.uid);
        setSettings(userSettings);
    } catch (err) {
        console.error('Error fetching reminder settings:', err);
        setError('Failed to load reminder settings. Please try again.');
    } finally {
        setLoading(false);
    }
  };
    
    fetchSettings();
}, [user]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);
      
      await updateUserReminderSettings(user.uid, settings);
      
      setSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
    }, 3000);
  } catch (err) {
      console.error('Error updating reminder settings:', err);
      setError('Failed to update reminder settings. Please try again.');
  } finally {
      setSaving(false);
  }
};

  // Handle toggle change
  const handleToggleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings(prev => ({
      ...prev,
      enabled: e.target.checked,
  }));
};

  // Handle frequency change
  const handleFrequencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSettings(prev => ({
      ...prev,
      frequency: e.target.value as 'daily' | 'weekly' | 'monthly',
  }));
};

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
      <h2 className="text-xl font-semibold text-neutral-900 mb-4">Reminder Settings</h2>
      
      {loading ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {/* Enable/Disable Reminders */}
          <div className="mb-6">
            <div className="flex items-center">
              <div className="form-control">
                <label className="cursor-pointer label flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings.enabled}
                    onChange={handleToggleChange}
                    className="checkbox checkbox-primary"
                  />
                  <span className="label-text text-base font-medium">Enable course reminders</span>
                </label>
              </div>
            </div>
            <p className="text-sm text-neutral-500 mt-1 ml-10">
              Receive reminders about your course progress and inactivity
            </p>
          </div>
          
          {/* Reminder Frequency */}
          {settings.enabled && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Reminder Frequency
              </label>
              <select
                value={settings.frequency}
                onChange={handleFrequencyChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={!settings.enabled}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
              <p className="text-sm text-neutral-500 mt-1">
                How often you want to receive reminders about your courses
              </p>
            </div>
          )}
          
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
              {error}
            </div>
          )}
          
          {/* Success Message */}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md">
              Reminder settings updated successfully!
            </div>
          )}
          
          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              isLoading={saving}
              disabled={saving}
            >
              Save Settings
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ReminderSettings;
