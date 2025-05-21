import React, {useState } from 'react';
import {useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link'; // Import Link
import {useAuth } from '@/context/AuthContext';

const TestLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const {login, loginWithGoogle } = useAuth();
  const router = useRouter();
  
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Attempting to login with:', email, password);
      await login({email, password });
      console.log('Login successful');
      void router.push('/admin'); // Handle promise
  } catch (err: unknown) {
      console.error('Login error:', err);
      if (err instanceof Error) {
        setError(err.message || 'Login failed');
      } else {
        setError('An unknown login error occurred');
      }
  } finally {
      setIsLoading(false);
  }
};
  
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Attempting to login with Google');
      await loginWithGoogle();
      console.log('Google login successful');
      void router.push('/admin'); // Handle promise
  } catch (err: unknown) {
      console.error('Google login error:', err);
      if (err instanceof Error) {
        setError(err.message || 'Google login failed');
      } else {
        setError('An unknown Google login error occurred');
      }
  } finally {
      setIsLoading(false);
  }
};
  
  return (
    <>
      <Head>
        <title>Test Login</title>
      </Head>
      
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Test Login Page</h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              This is a simplified login page for testing
            </p>
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          
          <form className="mt-8 space-y-6" onSubmit={(e) => void handleEmailLogin(e)}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email-address" className="sr-only">Email address</label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {isLoading ? 'Logging in...' : 'Sign in with Email'}
              </button>
            </div>
          </form>
          
          <div>
            <button
              onClick={() => void handleGoogleLogin()}
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isLoading ? 'Logging in...' : 'Sign in with Google'}
            </button>
          </div>
          
          <div className="text-center mt-4">
            <Link href="/login" className="text-sm text-indigo-600 hover:text-indigo-500">
              Back to regular login
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default TestLoginPage;
