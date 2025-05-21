import React, {useState, useEffect } from 'react';
import Head from 'next/head';
import {useAuth } from '@/context/AuthContext';

const AdminLoginPage: React.FC = () => {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {user, loginWithGoogle, loading } = useAuth();
  // No need for router since we're using window.location.href

  // Redirect if already logged in and has admin privileges
  useEffect(() => {
    if (user && user.roles?.admin) {
      // Use window.location for navigation to avoid Cross-Origin-Opener-Policy issues
      window.location.href = '/admin';
  }
}, [user]);

  const handleGoogleLogin = async () => {
    setError(null);
    setIsGoogleLoading(true);

    try {
      const userProfile = await loginWithGoogle();

      if (userProfile.roles?.admin) {
        // Use window.location for navigation to avoid Cross-Origin-Opener-Policy issues
        window.location.href = '/admin';
    } else {
        setError('You do not have admin privileges. Please contact the system administrator.');
    }
  } catch (err: any) {
      console.error('Google login error:', err);
      setError(err.message || 'Failed to login with Google');
  } finally {
      setIsGoogleLoading(false);
  }
};

  return (
    <>
      <Head>
        <title>Admin Login | Training Platform</title>
      </Head>

      <div className="flex min-h-screen bg-neutral-50">
        <div className="flex flex-col justify-center flex-1 px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
          <div className="w-full max-w-sm mx-auto lg:w-96">
            <div>
              <h2 className="mt-6 text-3xl font-extrabold text-neutral-900">Admin Login</h2>
              <p className="mt-2 text-sm text-neutral-600">
                Please sign in to access the admin panel.
              </p>
            </div>

            {error && (
              <div className="p-3 mt-6 text-sm text-red-700 bg-red-100 rounded-md">
                {error}
              </div>
            )}

            <div className="mt-8">
              <div className="mt-6">
                <div className="space-y-6">
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isGoogleLoading || loading}
                    className="flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGoogleLoading ? (
                      <>
                        <svg className="w-5 h-5 mr-3 -ml-1 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Signing in...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                            <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                            <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                            <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                            <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                          </g>
                        </svg>
                        Sign in with Google
                      </>
                    )}
                  </button>

                  <div className="text-sm text-center">
                    <p className="text-neutral-600">
                      Only authorized administrators can access this area.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative flex-1 hidden w-0 lg:block">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-700 to-primary-900">
            <div className="absolute inset-0 bg-opacity-50 bg-neutral-900">
              <div className="flex flex-col items-start justify-center h-full px-12">
                <h2 className="text-4xl font-bold text-white">Admin Panel</h2>
                <p className="mt-4 text-xl text-white">Manage your training platform content, users, and settings.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminLoginPage;
