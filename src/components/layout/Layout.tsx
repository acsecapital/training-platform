import React, {ReactNode } from 'react';
import Head from 'next/head';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  title = 'Training Platform',
  description = 'Learn and grow with our comprehensive training platform'
}) => {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <div className="min-h-screen bg-neutral-50 flex flex-col">
        <header className="bg-white shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="text-xl font-bold text-primary-600">Training Platform</div>
              <nav className="flex space-x-4">
                <a href="/dashboard" className="text-neutral-600 hover:text-primary-600">Dashboard</a>
                <a href="/courses" className="text-neutral-600 hover:text-primary-600">Courses</a>
                <a href="/profile" className="text-neutral-600 hover:text-primary-600">Profile</a>
              </nav>
            </div>
          </div>
        </header>
        
        <main className="flex-grow">
          {children}
        </main>
        
        <footer className="bg-white border-t border-neutral-200 py-6">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-neutral-500 text-sm mb-4 md:mb-0">
                &copy; {new Date().getFullYear()} Training Platform. All rights reserved.
              </div>
              <div className="flex space-x-4">
                <a href="/terms" className="text-neutral-500 hover:text-primary-600 text-sm">Terms</a>
                <a href="/privacy" className="text-neutral-500 hover:text-primary-600 text-sm">Privacy</a>
                <a href="/contact" className="text-neutral-500 hover:text-primary-600 text-sm">Contact</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Layout;
