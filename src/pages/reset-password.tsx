import React, {useState, useEffect } from 'react';
import {useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import {useAuth } from '@/context/AuthContext';
import {validatePassword } from '@/utils/validation';

const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{password?: string; confirmPassword?: string; general?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [oobCode, setOobCode] = useState<string | null>(null);
  
  const {confirmPasswordReset } = useAuth();
  const router = useRouter();
  
  // Get the oobCode from the URL
  useEffect(() => {
    const {oobCode } = router.query;
    if (typeof oobCode === 'string') {
      setOobCode(oobCode);
  }
}, [router.query]);
  
  const validateForm = (): boolean => {
    const newErrors: {password?: string; confirmPassword?: string } = {};
    
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.message;
  }
    
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
  }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
};
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !oobCode) {
      return;
  }
    
    setIsSubmitting(true);
    setErrors({});
    
    try {
      await confirmPasswordReset(oobCode, password);
      setIsSuccess(true);
  } catch (error: unknown) {
      console.error('Password reset error:', error);
      
      // Handle specific Firebase auth errors
      let errorMessage = 'An error occurred. Please try again.';
      let specificErrorField: 'password' | 'general' = 'general';

      if (typeof error === 'object' && error !== null && 'code' in error) {
        const errorCode = (error as { code: string }).code;
        if (errorCode === 'auth/expired-action-code' || errorCode === 'auth/invalid-action-code') {
          errorMessage = 'The password reset link has expired or is invalid. Please request a new one.';
      } else if (errorCode === 'auth/weak-password') {
          errorMessage = 'The password is too weak. Please choose a stronger password.';
          specificErrorField = 'password';
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

      if (specificErrorField === 'password') {
        setErrors({ password: errorMessage });
      } else {
        setErrors({general: errorMessage });
    }
  } finally {
      setIsSubmitting(false);
  }
};
  
  // If no oobCode is provided, show an error
  if (!oobCode && typeof window !== 'undefined') {
    return (
      <>
        <Head>
          <title>Reset Password | Training Platform</title>
        </Head>
        
        <div className="flex items-center justify-center min-h-screen bg-neutral-50">
          <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-neutral-900">Invalid Reset Link</h2>
              <p className="mt-2 text-neutral-600">
                The password reset link is invalid or has expired. Please request a new one.
              </p>
              <div className="mt-6">
                <Link
                  href="/forgot-password"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Request New Link
                </Link>
              </div>
            </div>
          </div>
        </div>
      </>
    );
}
  
  return (
    <>
      <Head>
        <title>Reset Password | Training Platform</title>
      </Head>
      
      <div className="flex min-h-screen bg-neutral-50">
        <div className="flex flex-col justify-center flex-1 px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
          <div className="w-full max-w-sm mx-auto lg:w-96">
            <div>
              <h2 className="mt-6 text-3xl font-extrabold text-neutral-900">Reset your password</h2>
              <p className="mt-2 text-sm text-neutral-600">
                Enter your new password below.
              </p>
            </div>
            
            <div className="mt-8">
              {isSuccess ? (
                <div className="p-4 rounded-md bg-green-50">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">Password reset successful</h3>
                      <div className="mt-2 text-sm text-green-700">
                        <p>
                          Your password has been reset successfully. You can now log in with your new password.
                        </p>
                      </div>
                      <div className="mt-4">
                        <Link
                          href="/login"
                          className="text-sm font-medium text-green-600 hover:text-green-500"
                        >
                          Go to login
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {errors.general && (
                    <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-md">
                      {errors.general}
                    </div>
                  )}
                  
                  <div className="mt-6">
                    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
                      <div>
                        <label htmlFor="password" className="block text-sm font-medium text-neutral-700">
                          New password
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
                          Confirm new password
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
                              Resetting password...
                            </>
                          ) : (
                            'Reset password'
                          )}
                        </button>
                      </div>
                      
                      <div className="text-sm text-center">
                        <Link href="/login" className="font-medium text-primary hover:text-primary-700">
                          Back to login
                        </Link>
                      </div>
                    </form>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="relative flex-1 hidden w-0 lg:block">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-700 to-primary-900">
            <div className="absolute inset-0 bg-opacity-50 bg-neutral-900">
              <div className="flex flex-col items-start justify-center h-full px-12">
                <h2 className="text-4xl font-bold text-white">Training Platform</h2>
                <p className="mt-4 text-xl text-white">Reset your password to secure your account.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ResetPasswordPage;
