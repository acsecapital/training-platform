import React, {useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import MediaManager from '@/components/admin/media/MediaManager';

const MediaPage: React.FC = () => {
  return (
    <AdminLayout title="Media Management">
      <MediaManager />
    </AdminLayout>
  );
};

// Wrap the component with ProtectedRoute to ensure only admins can access it
export default function MediaManagementPage() {
  return (
    <ProtectedRoute adminOnly>
      <MediaPage />
    </ProtectedRoute>
  );
}
