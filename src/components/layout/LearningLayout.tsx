import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {useRouter } from 'next/router';
import {useAuth } from '@/context/AuthContext';
import {motion } from 'framer-motion';
import {HomeIcon, BookOpenIcon, AcademicCapIcon, UserIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

interface LearningLayoutProps {
  children: React.ReactNode;
  title?: string;
  courseTitle?: string;
}

export default function LearningLayout({children, title = 'Learning Platform'}: LearningLayoutProps) {
  const router = useRouter();
  const {user, logout } = useAuth();
  const courseId = router.query.id as string;

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>

      <div className="flex h-screen bg-neutral-50">
        {/* Left Sidebar Navigation */}
        <div className="w-16 bg-primary-900 text-white flex flex-col items-center py-6 hidden md:flex">
          <Link href="/my-learning" className="mb-8">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
              <img src="/logo-icon.svg" alt="Logo" className="w-5 h-5" />
            </div>
          </Link>

          <nav className="flex flex-col items-center space-y-6 flex-1">
            <Link href="/my-learning">
              <div className="w-10 h-10 rounded-md flex items-center justify-center hover:bg-primary-800 transition-colors">
                <HomeIcon className="w-5 h-5 text-white" />
              </div>
            </Link>

            <Link href={`/courses/${courseId}`}>
              <div className="w-10 h-10 rounded-md flex items-center justify-center bg-primary-800 transition-colors">
                <BookOpenIcon className="w-5 h-5 text-white" />
              </div>
            </Link>

            <Link href="/my-learning/certificates">
              <div className="w-10 h-10 rounded-md flex items-center justify-center hover:bg-primary-800 transition-colors">
                <AcademicCapIcon className="w-5 h-5 text-white" />
              </div>
            </Link>
          </nav>

          <div className="mt-auto">
            <Link href="/profile">
              <div className="w-10 h-10 rounded-md flex items-center justify-center hover:bg-primary-800 transition-colors">
                <UserIcon className="w-5 h-5 text-white" />
              </div>
            </Link>
          </div>
        </div>

        {/* Mobile Top Navigation */}
        <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-neutral-200 z-10">
          <div className="flex items-center p-4">
            <button
              onClick={() => router.push('/my-learning')}
              className="p-2 rounded-md hover:bg-neutral-100"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>

            <div className="flex-1 text-center">
              <h1 className="text-lg font-medium truncate">{title}</h1>
            </div>

            <div className="flex items-center space-x-2">
              <Link href={`/courses/${courseId}`}>
                <div className="p-2 rounded-md hover:bg-neutral-100">
                  <BookOpenIcon className="h-5 w-5" />
                </div>
              </Link>

              <Link href="/my-learning/certificates">
                <div className="p-2 rounded-md hover:bg-neutral-100">
                  <AcademicCapIcon className="h-5 w-5" />
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 z-10">
          <div className="flex items-center justify-around py-2">
            <Link href="/my-learning">
              <div className="flex flex-col items-center p-2">
                <HomeIcon className="h-6 w-6 text-primary-800" />
                <span className="text-xs mt-1 text-neutral-600">Home</span>
              </div>
            </Link>

            <Link href={`/courses/${courseId}`}>
              <div className="flex flex-col items-center p-2">
                <BookOpenIcon className="h-6 w-6 text-primary-800" />
                <span className="text-xs mt-1 text-neutral-600">Course</span>
              </div>
            </Link>

            <Link href="/my-learning/certificates">
              <div className="flex flex-col items-center p-2">
                <AcademicCapIcon className="h-6 w-6 text-neutral-600" />
                <span className="text-xs mt-1 text-neutral-600">Certificates</span>
              </div>
            </Link>

            <Link href="/profile">
              <div className="flex flex-col items-center p-2">
                <UserIcon className="h-6 w-6 text-neutral-600" />
                <span className="text-xs mt-1 text-neutral-600">Profile</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden md:pt-0 pt-16 pb-16 md:pb-0">
          {children}
        </div>
      </div>
    </>
  );
}
