import React, {useState } from 'react';
import {verifyCertificate } from '@/services/certificateService';
import {trackCertificateView } from '@/services/certificateAnalyticsService';
import Button from '@/components/ui/Button';
import {formatDate } from '@/utils/formatters';

interface CertificateVerifierProps {
  initialCode?: string;
}

const CertificateVerifier: React.FC<CertificateVerifierProps> = ({
  initialCode = ''
}) => {
  const [verificationCode, setVerificationCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Handle verification
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!verificationCode.trim()) {
      setError('Please enter a verification code');
      return;
  }

    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const verificationResult = await verifyCertificate(verificationCode.trim());
      setResult(verificationResult);

      // Track certificate view if valid
      if (verificationResult.isValid && verificationResult.certificate) {
        try {
          // Get browser and device info
          const userAgent = window.navigator.userAgent;
          const isMobile = /Mobile|Android|iPhone|iPad|iPod|Windows Phone/i.test(userAgent);
          const isTablet = /Tablet|iPad/i.test(userAgent);
          const deviceType = isTablet ? 'tablet' : (isMobile ? 'mobile' : 'desktop');

          // Get browser info
          const browserInfo = {
            chrome: /Chrome/i.test(userAgent),
            firefox: /Firefox/i.test(userAgent),
            safari: /Safari/i.test(userAgent),
            edge: /Edge/i.test(userAgent),
            ie: /MSIE|Trident/i.test(userAgent),
        };

          const browser = Object.keys(browserInfo).find(key => browserInfo[key as keyof typeof browserInfo]) || 'other';

          // Track view
          await trackCertificateView(verificationResult.certificate.id, {
            userAgent,
            deviceType,
            browser,
            referrer: document.referrer
        });
      } catch (trackingError) {
          console.error('Error tracking certificate view:', trackingError);
          // Don't fail the verification if tracking fails
      }
    }
  } catch (err: any) {
      console.error('Error verifying certificate:', err);
      setError(err.message || 'Failed to verify certificate');
  } finally {
      setLoading(false);
  }
};

  return (
    <div className="space-y-6">
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-neutral-200">
        <div className="p-4 border-b border-neutral-200">
          <h2 className="text-lg font-medium text-neutral-900">Certificate Verification</h2>
        </div>
        <div className="p-6">
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label htmlFor="verificationCode" className="block text-sm font-medium text-neutral-700 mb-1">
                Verification Code
              </label>
              <div className="flex">
                <input
                  type="text"
                  id="verificationCode"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="flex-1 px-3 py-2 border border-neutral-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter certificate verification code"
                />
                <Button
                  variant="primary"
                  type="submit"
                  className="rounded-l-none"
                  disabled={loading}
                >
                  {loading ? 'Verifying...' : 'Verify'}
                </Button>
              </div>
              <div className="flex justify-between items-center mt-1">
                <p className="text-sm text-neutral-500">
                  Enter the verification code from the certificate to verify its authenticity.
                </p>
                <a href="/verify-certificate/scan" className="text-sm text-primary-600 hover:text-primary-800 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                  Scan QR Code
                </a>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error}
              </div>
            )}
          </form>
        </div>
      </div>

      {result && (
        <div className={`bg-white shadow-sm rounded-lg overflow-hidden border ${
          result.isValid ? 'border-green-200' : 'border-red-200'
      }`}>
          <div className={`p-4 border-b ${
            result.isValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
        }`}>
            <h2 className={`text-lg font-medium ${
              result.isValid ? 'text-green-800' : 'text-red-800'
          }`}>
              Verification Result
            </h2>
          </div>
          <div className="p-6">
            <div className="flex items-center mb-4">
              {result.isValid ? (
                <div className="flex items-center text-green-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">Valid Certificate</span>
                </div>
              ) : (
                <div className="flex items-center text-red-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">Invalid Certificate</span>
                </div>
              )}
            </div>

            <p className="text-neutral-600 mb-4">
              {result.message}
            </p>

            {result.certificate && (
              <div className="border border-neutral-200 rounded-md p-4 bg-neutral-50">
                <h3 className="text-md font-medium text-neutral-900 mb-2">Certificate Details</h3>
                <div className="space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <span className="text-sm font-medium text-neutral-500">Certificate ID:</span>
                      <span className="text-sm text-neutral-900 ml-2">{result.certificate.id}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-neutral-500">Issue Date:</span>
                      <span className="text-sm text-neutral-900 ml-2">{formatDate(result.certificate.issueDate)}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-neutral-500">Student Name:</span>
                      <span className="text-sm text-neutral-900 ml-2">{result.certificate.userName}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-neutral-500">Course:</span>
                      <span className="text-sm text-neutral-900 ml-2">{result.certificate.courseName}</span>
                    </div>
                    {result.certificate.expiryDate && (
                      <div>
                        <span className="text-sm font-medium text-neutral-500">Expiry Date:</span>
                        <span className="text-sm text-neutral-900 ml-2">{formatDate(result.certificate.expiryDate)}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-sm font-medium text-neutral-500">Status:</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ml-2 ${
                        result.certificate.status === 'issued'
                          ? 'bg-green-100 text-green-800'
                          : result.certificate.status === 'revoked'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                    }`}>
                        {result.certificate.status.charAt(0).toUpperCase() + result.certificate.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  {result.certificate.downloadUrl && (
                    <div className="mt-4">
                      <a
                        href={result.certificate.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download Certificate
                      </a>
                    </div>
                  )}

                  {/* Digital Signature Verification */}
                  {result.digitalSignatureVerification && (
                    <div className="mt-6 border-t border-neutral-200 pt-4">
                      <div className="flex items-center mb-2">
                        <h3 className="text-md font-medium text-neutral-900">Digital Signature</h3>
                        {result.digitalSignatureVerification.isValid ? (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Verified
                          </span>
                        ) : (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Invalid
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-neutral-600 mb-3">
                        {result.digitalSignatureVerification.message}
                      </p>
                    </div>
                  )}

                  {/* Blockchain Verification */}
                  {result.blockchainVerification && (
                    <div className="mt-6 border-t border-neutral-200 pt-4">
                      <div className="flex items-center mb-2">
                        <h3 className="text-md font-medium text-neutral-900">Blockchain Verification</h3>
                        {result.blockchainVerification.isValid ? (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Verified
                          </span>
                        ) : (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Not Verified
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-neutral-600 mb-3">
                        {result.blockchainVerification.message}
                      </p>

                      {result.blockchainVerification.isValid && (
                        <div className="bg-white rounded-md p-3 text-sm border border-neutral-200">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {result.blockchainVerification.blockchainProvider && (
                              <div>
                                <p className="text-xs font-medium text-neutral-500">Blockchain</p>
                                <p className="text-neutral-900">{result.blockchainVerification.blockchainProvider}</p>
                              </div>
                            )}
                            {result.blockchainVerification.blockchainNetwork && (
                              <div>
                                <p className="text-xs font-medium text-neutral-500">Network</p>
                                <p className="text-neutral-900">{result.blockchainVerification.blockchainNetwork}</p>
                              </div>
                            )}
                            {result.blockchainVerification.transactionId && (
                              <div className="sm:col-span-2">
                                <p className="text-xs font-medium text-neutral-500">Transaction ID</p>
                                <p className="text-neutral-900 font-mono text-xs break-all">{result.blockchainVerification.transactionId}</p>
                              </div>
                            )}
                          </div>

                          {result.blockchainVerification.verificationUrl && (
                            <div className="mt-2">
                              <a
                                href={result.blockchainVerification.verificationUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary-600 hover:text-primary-800 text-sm inline-flex items-center"
                              >
                                View on Blockchain Explorer
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mt-4 text-sm text-neutral-500">
              <p>Verification performed on: {formatDate(result.verifiedAt)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificateVerifier;
