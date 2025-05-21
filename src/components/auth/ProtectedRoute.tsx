import React, {useEffect } from 'react';
import {useRouter } from 'next/router';
import {useAuth } from '@/context/AuthContext';
import {UserRole } from '@/types/user.types';

// Define valid role keys
type RoleKey = keyof UserRole;

// Helper function to check if a user has a specific role
const hasRole = (user: {roles?: UserRole }, role: RoleKey): boolean => {
  return !!user.roles?.[role];
};

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  instructorOnly?: boolean;
  allowedRoles?: RoleKey[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  adminOnly = false,
  instructorOnly = false,
  allowedRoles = [],
}) => {
  const {user, loading, initialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('ProtectedRoute effect running');
    console.log('Loading:', loading, 'Initialized:', initialized);
    console.log('User:', user);
    console.log('Admin only:', adminOnly, 'Instructor only:', instructorOnly, 'Allowed roles:', allowedRoles);
    console.log('Current path:', router.asPath);

    if (!loading && initialized) {
      if (!user) {
        // Redirect to login if not authenticated
        console.log('User not authenticated, redirecting to login');
        window.location.href = `/login?redirect=${encodeURIComponent(router.asPath)}`;
    } else if (adminOnly && !hasRole(user, 'admin')) {
        // Redirect to admin login if not an admin
        console.log('Admin access required but user is not an admin');
        console.log('User roles:', user.roles);
        window.location.href = '/admin/login';
    } else if (instructorOnly && !hasRole(user, 'instructor') && !hasRole(user, 'admin')) {
        // Redirect to home if not an instructor or admin
        console.log('Instructor access required but user is not an instructor or admin');
        console.log('User roles:', user.roles);
        window.location.href = '/';
    } else if (allowedRoles.length > 0 && !allowedRoles.some(role => hasRole(user, role))) {
        // Redirect to home if user doesn't have any of the allowed roles
        console.log('User does not have any of the required roles:', allowedRoles);
        console.log('User roles:', user.roles);
        window.location.href = '/';
    } else {
        console.log('Access granted to protected route');
    }
  }
}, [user, loading, initialized, router, adminOnly, instructorOnly, allowedRoles]);

  // Show loading state while checking authentication
  if (loading || !initialized) {
    console.log('Showing loading state: still initializing');
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-2 text-neutral-600">Loading...</p>
        </div>
      </div>
    );
}

  // Check for authentication
  if (!user) {
    console.log('Showing loading state: user not authenticated');
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-2 text-neutral-600">Checking authentication...</p>
        </div>
      </div>
    );
}

  // Check for authorization
  if ((adminOnly && !hasRole(user, 'admin')) ||
      (instructorOnly && !hasRole(user, 'instructor') && !hasRole(user, 'admin')) ||
      (allowedRoles.length > 0 && !allowedRoles.some(role => hasRole(user, role)))) {
    console.log('Showing loading state: user not authorized');
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-2 text-neutral-600">Checking authorization...</p>
        </div>
      </div>
    );
}

  // Render children if authenticated and authorized
  return <>{children}</>;
};

export default ProtectedRoute;
