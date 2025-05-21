import React, {useState } from 'react';
import {useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import Button from '@/components/ui/Button';
import Link from 'next/link';

const VerifyCertificatePage: React.FC = () => {
  const router = useRouter();
  const [verificationCode, setVerificationCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate verification code
    if (!verificationCode.trim()) {
      setError('Please enter a verification code');
      return;
  }
    
    // Reset error
    setError(null);
    setIsSubmitting(true);
    
    // Navigate to verification result page
    void router.push(`/verify-certificate/${verificationCode.trim()}`);
};

  return (
    <Layout title="Verify Certificate">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">Verify Certificate</h1>
            <p className="text-neutral-600">
              Enter the verification code to check the authenticity of a certificate
            </p>
          </div>

          <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-neutral-200 mb-8">
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="verificationCode" className="block text-sm font-medium text-neutral-700 mb-1">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    id="verificationCode"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter verification code (e.g., ABCD1234)"
                  />
                  {error && (
                    <p className="mt-1 text-sm text-red-600">{error}</p>
                  )}
                </div>
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Verifying...' : 'Verify Certificate'}
                  </Button>
                </div>
              </form>
            </div>
          </div>

          <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-neutral-200">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 bg-primary-100 rounded-full p-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                </div>
                <h2 className="ml-3 text-lg font-medium text-neutral-900">Scan QR Code</h2>
              </div>
              <p className="text-neutral-600 mb-4">
                You can also verify a certificate by scanning its QR code using your device's camera.
              </p>
              <Link href="/verify-certificate/scan" passHref>
                <Button variant="outline" className="w-full">
                  Scan QR Code
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default VerifyCertificatePage;
