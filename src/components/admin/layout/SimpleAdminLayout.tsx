import React, {useState, useEffect } from 'react';
import Head from 'next/head';
import {useRouter } from 'next/router';
import SimpleSidebar from './SimpleSidebar';
import SimpleHeader from './SimpleHeader';

interface SimpleAdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const SimpleAdminLayout: React.FC<SimpleAdminLayoutProps> = ({
  children,
  title = 'Admin Panel',
}) => {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile on client side
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 1024);
  };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
  };
}, []);

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

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
};

  return (
    <>
      <Head>
        <title>{title} | Training Platform</title>
      </Head>
      
      <div className="flex h-screen bg-neutral-50">
        {/* Mobile sidebar backdrop */}
        {isMobile && sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black bg-opacity-50 transition-opacity lg:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}
        
        {/* Sidebar */}
        <div
          className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-white transition duration-200 ease-in-out lg:static lg:inset-0 lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        >
          <SimpleSidebar />
        </div>
        
        {/* Main content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <SimpleHeader toggleSidebar={toggleSidebar} />
          
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

export default SimpleAdminLayout;
