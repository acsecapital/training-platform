import React, {useState, useEffect } from 'react';
import {useAuth } from '@/context/AuthContext';
import Head from 'next/head';
import Link from 'next/link'; // Import Link

// Define an interface for the expected API response
interface AdminApiResponse {
  error?: string;
  message?: string; // Assuming a success message might also be present
}

const PromoteToAdminPage: React.FC = () => {
  const {user } = useAuth();
  const [adminSecret, setAdminSecret] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user?.roles?.admin) {
      setMessage({text: 'You are already an admin!', type: 'success'});
  }
}, [user]);

  const handlePromoteToAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setMessage({text: 'You must be logged in to perform this action', type: 'error'});
      return;
  }
    
    setIsLoading(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/create-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
      },
        body: JSON.stringify({
          userId: user.id,
          adminSecret,
      }),
    });
      
      const data = await response.json() as AdminApiResponse;
      
      if (response.ok) {
        setMessage({text: 'Successfully promoted to admin! Please log out and log back in for changes to take effect.', type: 'success'});
    } else {
        setMessage({text: data?.error || 'Failed to promote to admin', type: 'error'});
    }
  } catch (error: unknown) {
      console.error('Error promoting to admin:', error);
      let errorMessage = 'An error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      setMessage({text: errorMessage, type: 'error'});
  } finally {
      setIsLoading(false);
  }
};
  
  return (
    <>
      <Head>
        <title>Promote to Admin</title>
      </Head>
      
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Promote to Admin</h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Enter the admin secret to promote yourself to admin
            </p>
          </div>
          
          {message && (
            <div className={`p-4 rounded-md ${
              message.type === 'success' ? 'bg-green-100 text-green-700' : 
              message.type === 'error' ? 'bg-red-100 text-red-700' : 
              'bg-blue-100 text-blue-700'
          }`}>
              {message.text}
            </div>
          )}
          
          {!user && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">You must be logged in to promote yourself to admin.</span>
            </div>
          )}
          
          {user && !user.roles?.admin && (
            <form className="mt-8 space-y-6" onSubmit={(e) => void handlePromoteToAdmin(e)}>
              <div>
                <label htmlFor="admin-secret" className="block text-sm font-medium text-gray-700">
                  Admin Secret
                </label>
                <input
                  id="admin-secret"
                  name="admin-secret"
                  type="password"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={adminSecret}
                  onChange={(e) => setAdminSecret(e.target.value)}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Hint: Try "training-platform-secret" for development
                </p>
              </div>
              
              <div>
                <button
                  type="submit"
                  disabled={isLoading || !user}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {isLoading ? 'Processing...' : 'Promote to Admin'}
                </button>
              </div>
            </form>
          )}
          
          <div className="text-center mt-4">
            <Link href="/" className="text-sm text-indigo-600 hover:text-indigo-500">
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default PromoteToAdminPage;
