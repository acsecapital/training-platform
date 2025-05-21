import React, {useState, useEffect } from 'react';
import {useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import Image from 'next/image';
import {useAuth } from '@/context/AuthContext';
import {isValidEmail } from '@/utils/validation';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<{email?: string; password?: string; general?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {user, login, loading } = useAuth();
  const router = useRouter();
  const {redirect } = router.query;

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      console.log('User authenticated:', user);
      console.log('User roles:', user.roles);

      // Default to my-learning for regular users, admin for admins
      const defaultPath = user.roles?.admin ? '/admin' : '/my-learning';
      const redirectPath = typeof redirect === 'string' ? redirect : defaultPath;

      console.log('Redirecting to:', redirectPath);

      // Use window.location for navigation to avoid Cross-Origin-Opener-Policy issues
      // This is a more direct approach that doesn't rely on Next.js router
      window.location.href = redirectPath;
  }
}, [user, loading, redirect]);

  const validateForm = (): boolean => {
    const newErrors: {email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = 'Email is required';
  } else if (!isValidEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
  }

    if (!password) {
      newErrors.password = 'Password is required';
  } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
  }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login form submitted');

    if (!validateForm()) {
      console.log('Form validation failed');
      return;
  }

    setIsSubmitting(true);
    setErrors({});

    try {
      console.log('Attempting to login with:', email);
      const userProfile = await login({
        email,
        password,
        remember: rememberMe
    });
      console.log('Login successful, user profile:', userProfile);
      console.log('User roles:', userProfile.roles);

      // Redirect will happen automatically due to the useEffect above
  } catch (error) {
      console.error('Login error:', error);

      // Handle specific Firebase auth errors
      let errorCode = '';
      let errorMessage = 'An error occurred during login. Please try again.';

      if (error && typeof error === 'object') {
        if ('code' in error) {
          errorCode = (error as { code: string }).code;
        }
        if ('message' in error) {
          console.error('Error message:', (error as { message: string }).message);
        }
      }

      if (errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password';
    } else if (errorCode === 'auth/too-many-requests') {
        errorMessage = 'Too many failed login attempts. Please try again later.';
    } else if (errorCode === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled. Please contact support.';
    }

      setErrors({general: errorMessage });
  } finally {
      setIsSubmitting(false);
  }
};

  // If still checking auth state, show loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-2 text-neutral-600">Loading...</p>
        </div>
      </div>
    );
}

  // If already logged in, don't render the form (will redirect via useEffect)
  if (user) {
    return null;
}

  return (
    <>
      <Head>
        <title>Login | Training Platform</title>
      </Head>

      <div className="flex min-h-screen bg-neutral-50">
        <div className="flex flex-col justify-center flex-1 px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
          <div className="w-full max-w-sm mx-auto lg:w-96">
            <div>
              {/* LIPS Logo */}
              <div className="flex justify-center">
                <Image
                  src="/api/get-lips-logo"
                  alt="LIPS Sales System Logo"
                  width={150}
                  height={96}
                  className="object-contain"
                />
              </div>
              <h2 className="mt-6 text-3xl font-extrabold text-neutral-900 text-center">Sign in to your account</h2>
              <p className="mt-2 text-sm text-neutral-600 text-center">
                Or{' '}
                <Link href="/register" className="font-medium text-primary hover:text-primary-700">
                  create a new account
                </Link>
              </p>
            </div>

            <div className="mt-8">
              {errors.general && (
                <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-md">
                  {errors.general}
                </div>
              )}

              <div className="mt-6">
                {/* Google Sign-In Button */}
                <div className="mb-6">
                  <GoogleSignInButton
                    onError={(error) => setErrors({general: error.message })}
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-neutral-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 text-neutral-500 bg-neutral-50">Or continue with</span>
                  </div>
                </div>

                <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
                      Email address
                    </label>
                    <div className="mt-1">
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`block w-full px-3 py-2 placeholder-neutral-400 border ${
                          errors.email ? 'border-red-300' : 'border-neutral-300'
                      } rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-neutral-700">
                      Password
                    </label>
                    <div className="mt-1">
                      <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`block w-full px-3 py-2 placeholder-neutral-400 border ${
                          errors.password ? 'border-red-300' : 'border-neutral-300'
                      } rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                      />
                      {errors.password && (
                        <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        id="remember-me"
                        name="remember-me"
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 text-primary border-neutral-300 rounded focus:ring-primary-500"
                      />
                      <label htmlFor="remember-me" className="block ml-2 text-sm text-neutral-700">
                        Remember me
                      </label>
                    </div>

                    <div className="text-sm">
                      <Link href="/forgot-password" className="font-medium text-primary hover:text-primary-700">
                        Forgot your password?
                      </Link>
                    </div>
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="w-5 h-5 mr-3 -ml-1 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Signing in...
                        </>
                      ) : (
                        'Sign in'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        <div className="relative flex-1 hidden w-0 lg:block">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-700 to-primary-900">
            <div className="absolute inset-0 bg-opacity-50 bg-neutral-900">
              <div className="flex flex-col items-start justify-center h-full px-10 py-12 overflow-y-auto">
                <h2 className="text-3xl font-bold text-white mb-3 tracking-tight w-full">LIPS Sales System</h2>

                <div className="space-y-5 w-full">
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-2 border-b border-white pb-1 tracking-tight">The LIPS Methodology</h4>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="text-white mr-2" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <div>
                          <p className="text-base text-white font-medium leading-tight tracking-tight"><strong>Lock</strong> Attention</p>
                          <p className="text-xs text-gray-300 leading-tight">Secure prospect attention</p>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="text-white mr-2" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <div>
                          <p className="text-base text-white font-medium leading-tight tracking-tight"><strong>Investigate</strong> Problems</p>
                          <p className="text-xs text-gray-300 leading-tight">Uncover customer needs</p>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="text-white mr-2" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                        <div>
                          <p className="text-base text-white font-medium leading-tight tracking-tight"><strong>Present</strong> Solutions</p>
                          <p className="text-xs text-gray-300 leading-tight">Offer tailored solutions</p>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="text-white mr-2" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <div>
                          <p className="text-base text-white font-medium leading-tight tracking-tight"><strong>State</strong> Benefits</p>
                          <p className="text-xs text-gray-300 leading-tight">Articulate value and ROI</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-white mb-2 border-b border-white pb-1 tracking-tight">Platform Benefits</h4>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="text-white mr-2" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                        <p className="text-sm text-white leading-tight tracking-tight">Interactive courses</p>
                      </div>

                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="text-white mr-2" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                        <p className="text-sm text-white leading-tight tracking-tight">AI-powered role-playing</p>
                      </div>

                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="text-white mr-2" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                        <p className="text-sm text-white leading-tight tracking-tight">Progress tracking</p>
                      </div>

                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="text-white mr-2" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                        <p className="text-sm text-white leading-tight tracking-tight">Earn certificates</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-1">
                    <p className="text-xs text-gray-300 italic leading-tight">"The LIPS Sales System transformed our sales team's performance, increasing close rates by 37% in just three months."</p>
                    <p className="text-xs text-white mt-1 leading-tight">— John Davis, Sales Director</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
