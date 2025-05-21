import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

const SimpleAdminDashboard: React.FC = () => {
  return (
    <>
      <Head>
        <title>Admin Dashboard | Training Platform</title>
      </Head>
      
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Quiz Management</h2>
            <p className="mb-4">Create and manage quizzes for your courses.</p>
            <Link 
              href="/admin/quizzes" 
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Manage Quizzes
            </Link>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Course Management</h2>
            <p className="mb-4">Create and manage your training courses.</p>
            <Link 
              href="/admin/courses" 
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Manage Courses
            </Link>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">User Management</h2>
            <p className="mb-4">Manage users and their permissions.</p>
            <Link 
              href="/admin/users" 
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Manage Users
            </Link>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <Link 
              href="/admin/quizzes/create" 
              className="inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Create Quiz
            </Link>
            <Link 
              href="/admin/courses/create" 
              className="inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Create Course
            </Link>
            <Link 
              href="/admin/users/create" 
              className="inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Add User
            </Link>
          </div>
        </div>
        
        <Link 
          href="/" 
          className="inline-block px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Back to Site
        </Link>
      </div>
    </>
  );
};

export default SimpleAdminDashboard;
