import React, {useState, useEffect } from 'react';
import {useRouter } from 'next/router';
import MainLayout from '@/components/layout/MainLayout';
import {useAuth } from '@/context/AuthContext';
// Import from barrel file
import {ProfileForm, ReminderSettings, PasswordForm } from '@/components/profile';

const ProfilePage: React.FC = () => {
  const router = useRouter();
  const {user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'reminders' | 'password'>('profile');

  // Redirect if not authenticated
  useEffect(() => {
    if (!user && !loading) {
      void router.push('/login?redirect=/profile');
  }
}, [user, loading, router]);

  if (!user) {
    return null; // Will redirect in useEffect
}

  return (
    <MainLayout title="Profile">
      <div className="bg-gradient-primary py-20 text-white">
        <div className="container mx-auto px-6 sm:px-12 lg:px-24 xl:px-32">
          <h1 className="text-3xl font-bold mt-6 mb-4">Your Profile</h1>
          <p className="text-lg opacity-90 max-w-3xl">Manage your account settings and preferences</p>
        </div>
      </div>

      <div className="container mx-auto px-6 sm:px-12 lg:px-24 xl:px-32 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Tabs */}
          <div className="flex border-b border-neutral-200 mb-8">
            <button
              className={`px-6 py-3 text-sm font-medium border-b-2 -mb-px ${
                activeTab === 'profile'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
            }`}
              onClick={() => setActiveTab('profile')}
            >
              Profile Information
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium border-b-2 -mb-px ${
                activeTab === 'reminders'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
            }`}
              onClick={() => setActiveTab('reminders')}
            >
              Reminder Settings
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium border-b-2 -mb-px ${
                activeTab === 'password'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
            }`}
              onClick={() => setActiveTab('password')}
            >
              Change Password
            </button>
          </div>

          {/* Tab Content */}
          <div className="space-y-8">
            {activeTab === 'profile' && (
              <ProfileForm />
            )}

            {activeTab === 'reminders' && (
              <ReminderSettings />
            )}

            {activeTab === 'password' && (
              <PasswordForm />
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ProfilePage;
