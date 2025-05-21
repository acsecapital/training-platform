import React, {useState, useEffect } from 'react';
import Head from 'next/head';
import {useRouter } from 'next/router';
import Header from './Header';
import Sidebar from './Sidebar';
import {useAuth } from '@/context/AuthContext';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  requireAuth?: boolean;
  requireAdmin?: boolean;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  title = 'Admin Panel',
  requireAuth = true,
  requireAdmin = true,
}) => {
  const {user, loading, initialized } = useAuth();
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Check if we're on the client side
  useEffect(() => {
    setIsClient(true);

    // Check if mobile on client side
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 1024);
  };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);

    return () => {
      window.removeEventListener('resize', checkIfMobile);
  };
}, []);

  // Handle authentication and authorization
  useEffect(() => {
    if (initialized && !loading) {
      if (requireAuth && !user) {
        window.location.href = '/admin/login';
    } else if (requireAdmin && user && !user.roles?.admin) {
        window.location.href = '/admin/login';
    }
  }
}, [user, loading, initialized, requireAuth, requireAdmin]);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
  }
}, [router.pathname, isMobile]);

  // Set sidebar open state based on screen size
  useEffect(() => {
    setSidebarOpen(!isMobile);
}, [isMobile]);

  // Show loading state
  if (loading || (requireAuth && !user) || (requireAdmin && user && !user.roles?.admin)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-2 text-neutral-600">Loading...</p>
        </div>
      </div>
    );
}

  return (
    <>
      <Head>
        <title>{title} | Training Platform</title>
      </Head>

      <div className="flex h-screen bg-neutral-50">
        {/* Mobile sidebar backdrop - only render on client side */}
        {isClient && isMobile && sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black bg-opacity-50 transition-opacity lg:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

        {/* Sidebar - conditionally apply transform classes only on client side */}
        <div
          className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-white transition duration-200 ease-in-out lg:static lg:inset-0 lg:translate-x-0 ${
            isClient ? (sidebarOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0 lg:translate-x-0'
        }`}
        >
          <Sidebar />
        </div>

        {/* Main content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header />

          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {/* Page header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-neutral-900">{title}</h1>
            </div>

            {/* Page content */}
            {children}
          </main>
        </div>
      </div>
    </>
  );
};

export default AdminLayout;
