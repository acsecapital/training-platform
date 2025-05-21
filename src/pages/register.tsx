import React, {useState, useEffect } from 'react';
import {useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import Image from 'next/image'; // Import next/image
import {useAuth } from '@/context/AuthContext';
import {isValidEmail, validatePassword } from '@/utils/validation';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';

const RegisterPage: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errors, setErrors] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    agreeTerms?: string;
    general?: string;
}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {user, register, loading } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      void router.push('/admin'); // Handle promise
  }
}, [user, loading, router]);

  const validateForm = (): boolean => {
    const newErrors: {
      firstName?: string;
      lastName?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
      agreeTerms?: string;
  } = {};

    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
  }

    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
  }

    if (!email) {
      newErrors.email = 'Email is required';
  } else if (!isValidEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
  }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.message;
  }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
  }

    if (!agreeTerms) {
      newErrors.agreeTerms = 'You must agree to the terms and conditions';
  }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
  }

    setIsSubmitting(true);
    setErrors({});

    try {
      await register({
        email,
        password,
        displayName: `${firstName} ${lastName}`,
        firstName,
        lastName,
        acceptTerms: agreeTerms
    });
      // Redirect will happen automatically due to the useEffect above
  } catch (error: unknown) {
      console.error('Registration error:', error);

      // Handle specific Firebase auth errors
      let errorMessage = 'An error occurred during registration. Please try again.';
      // specificErrorField is defined but not used in the current implementation
      // We'll keep track of it for future field-specific error handling

      if (typeof error === 'object' && error !== null && 'code' in error) {
        const errorCode = (error as { code: string }).code;
        if (errorCode === 'auth/email-already-in-use') {
          errorMessage = 'This email is already in use. Please use a different email or try logging in.';
          // Field-specific error handling would go here in the future
      } else if (errorCode === 'auth/invalid-email') {
          errorMessage = 'The email address is not valid.';
          // Field-specific error handling would go here in the future
      } else if (errorCode === 'auth/weak-password') {
          errorMessage = 'The password is too weak. Please choose a stronger password.';
          // Field-specific error handling would go here in the future
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
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
        <title>Register | Training Platform</title>
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
                  width={150} // Provide appropriate width
                  height={96}  // Provide appropriate height (h-24 is 96px)
                  className="object-contain" // Keep object-contain if needed
                /> {/* Replaced img with Image */}
              </div>
              <h2 className="mt-6 text-3xl font-extrabold text-neutral-900 text-center">Create your account</h2>
              <p className="mt-2 text-sm text-neutral-600 text-center">
                Already have an account?{' '}
                <Link href="/login" className="font-medium text-primary hover:text-primary-700">
                  Sign in
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
                    <span className="px-2 text-neutral-500 bg-neutral-50">Or register with email</span>
                  </div>
                </div>

                <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-neutral-700">
                        First name
                      </label>
                      <div className="mt-1">
                        <input
                          id="firstName"
                          name="firstName"
                          type="text"
                          autoComplete="given-name"
                          required
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className={`block w-full px-3 py-2 placeholder-neutral-400 border ${
                            errors.firstName ? 'border-red-300' : 'border-neutral-300'
                        } rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                        />
                        {errors.firstName && (
                          <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-neutral-700">
                        Last name
                      </label>
                      <div className="mt-1">
                        <input
                          id="lastName"
                          name="lastName"
                          type="text"
                          autoComplete="family-name"
                          required
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className={`block w-full px-3 py-2 placeholder-neutral-400 border ${
                            errors.lastName ? 'border-red-300' : 'border-neutral-300'
                        } rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                        />
                        {errors.lastName && (
                          <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                        )}
                      </div>
                    </div>
                  </div>

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
                        autoComplete="new-password"
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

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700">
                      Confirm password
                    </label>
                    <div className="mt-1">
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`block w-full px-3 py-2 placeholder-neutral-400 border ${
                          errors.confirmPassword ? 'border-red-300' : 'border-neutral-300'
                      } rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                      />
                      {errors.confirmPassword && (
                        <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      id="agree-terms"
                      name="agree-terms"
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className={`w-4 h-4 text-primary border-neutral-300 rounded focus:ring-primary-500 ${
                        errors.agreeTerms ? 'border-red-300' : ''
                    }`}
                    />
                    <label htmlFor="agree-terms" className="block ml-2 text-sm text-neutral-700">
                      I agree to the{' '}
                      <Link href="/terms" className="font-medium text-primary hover:text-primary-700">
                        Terms and Conditions
                      </Link>{' '}
                      and{' '}
                      <Link href="/privacy" className="font-medium text-primary hover:text-primary-700">
                        Privacy Policy
                      </Link>
                    </label>
                  </div>
                  {errors.agreeTerms && (
                    <p className="mt-1 text-sm text-red-600">{errors.agreeTerms}</p>
                  )}

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
                          Creating account...
                        </>
                      ) : (
                        'Create account'
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
                    <h4 className="text-lg font-semibold text-white mb-2 border-b border-white pb-1 tracking-tight">Why Join Our Platform?</h4>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="text-white mr-2" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <div>
                          <p className="text-base text-white font-medium leading-tight tracking-tight">Join a Community</p>
                          <p className="text-xs text-gray-300 leading-tight">Connect with sales pros</p>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="text-white mr-2" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                        <div>
                          <p className="text-base text-white font-medium leading-tight tracking-tight">Personalized Learning</p>
                          <p className="text-xs text-gray-300 leading-tight">Custom training paths</p>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="text-white mr-2" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                        </svg>
                        <div>
                          <p className="text-base text-white font-medium leading-tight tracking-tight">AI-Powered Practice</p>
                          <p className="text-xs text-gray-300 leading-tight">Risk-free simulations</p>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="text-white mr-2" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <div>
                          <p className="text-base text-white font-medium leading-tight tracking-tight">Expert Coaching</p>
                          <p className="text-xs text-gray-300 leading-tight">Professional feedback</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-white mb-2 border-b border-white pb-1 tracking-tight">What You'll Learn</h4>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="text-white mr-2" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                        <p className="text-sm text-white leading-tight tracking-tight">Prospect engagement</p>
                      </div>

                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="text-white mr-2" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                        <p className="text-sm text-white leading-tight tracking-tight">Strategic questioning</p>
                      </div>

                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="text-white mr-2" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                        <p className="text-sm text-white leading-tight tracking-tight">Solution presentation</p>
                      </div>

                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="text-white mr-2" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                        <p className="text-sm text-white leading-tight tracking-tight">Objection handling</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-1">
                    <p className="text-xs text-gray-300 italic leading-tight">"Since implementing LIPS, our average deal size increased by 42% and sales cycle shortened by 15 days."</p>
                    <p className="text-xs text-white mt-1 leading-tight">— Sarah Johnson, VP of Sales</p>
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

export default RegisterPage;
