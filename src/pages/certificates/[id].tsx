import React, {useState, useEffect } from 'react';
import {GetServerSideProps } from 'next';
import {useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import {formatDate } from '@/utils/formatters';
import {doc, getDoc } from 'firebase/firestore';
import {firestore } from '@/services/firebase';
import {Certificate } from '@/types/certificate.types';
import {trackCertificateView } from '@/services/certificateAnalyticsService';
import Head from 'next/head';

interface CertificateShowcaseProps {
  certificateId: string;
}

const CertificateShowcase: React.FC<CertificateShowcaseProps> = ({certificateId }) => {
  const router = useRouter();
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch certificate data
  useEffect(() => {
    const fetchCertificate = async () => {
      if (!certificateId) return;

      try {
        setLoading(true);
        setError(null);

        const certificateRef = doc(firestore, 'certificates', certificateId);
        const certificateDoc = await getDoc(certificateRef);

        if (!certificateDoc.exists()) {
          setError('Certificate not found');
          return;
      }

        const certificateData = {
          id: certificateDoc.id,
          ...certificateDoc.data()
      } as Certificate;

        // Check if certificate is revoked
        if (certificateData.status === 'revoked') {
          setError('This certificate has been revoked');
          return;
      }

        // Check if certificate is expired
        if (certificateData.status === 'expired' || (certificateData.expiryDate && new Date(certificateData.expiryDate) < new Date())) {
          setError('This certificate has expired');
          return;
      }

        setCertificate(certificateData);

        // Track certificate view
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
          await trackCertificateView(certificateData.id, {
            userAgent,
            deviceType,
            browser,
            referrer: document.referrer
        });
      } catch (trackingError) {
          console.error('Error tracking certificate view:', trackingError);
          // Don't fail the page load if tracking fails
      }
    } catch (err: any) {
        console.error('Error fetching certificate:', err);
        setError('Failed to load certificate');
    } finally {
        setLoading(false);
    }
  };

    fetchCertificate();
}, [certificateId]);

  // Generate meta tags
  const metaTitle = certificate
    ? `${certificate.userName}'s Certificate for ${certificate.courseName}`
    : 'Certificate Showcase';

  const metaDescription = certificate
    ? `View ${certificate.userName}'s certificate for completing ${certificate.courseName}. Issued on ${formatDate(certificate.issueDate)}.`
    : 'View and verify a course completion certificate.';

  return (
    <Layout title={metaTitle}>
      <Head>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        {certificate?.thumbnailUrl && (
          <meta property="og:image" content={certificate.thumbnailUrl} />
        )}
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={metaTitle} />
        <meta name="twitter:description" content={metaDescription} />
        {certificate?.thumbnailUrl && (
          <meta name="twitter:image" content={certificate.thumbnailUrl} />
        )}
      </Head>

      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <p>{error}</p>
            <div className="mt-4">
              <Link href="/" passHref>
                <Button variant="outline">
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        ) : certificate ? (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-neutral-900 mb-1">Certificate of Completion</h1>
                <p className="text-neutral-600">
                  {certificate.courseName}
                </p>
              </div>
              <div className="mt-4 md:mt-0 flex space-x-3">
                <Link href={`/verify-certificate/${certificate.verificationCode}`} passHref>
                  <Button variant="outline">
                    Verify Certificate
                  </Button>
                </Link>
                {certificate.pdfUrl && (
                  <a
                    href={certificate.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="primary">
                      Download PDF
                    </Button>
                  </a>
                )}
              </div>
            </div>

            <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-neutral-200">
              {certificate.thumbnailUrl ? (
                <div className="aspect-w-16 aspect-h-9 md:aspect-w-3 md:aspect-h-2 bg-neutral-100">
                  <img
                    src={certificate.thumbnailUrl}
                    alt="Certificate"
                    className="object-contain w-full h-full"
                  />
                </div>
              ) : (
                <div className="aspect-w-16 aspect-h-9 md:aspect-w-3 md:aspect-h-2 bg-neutral-100 flex items-center justify-center">
                  <div className="text-center p-8">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-neutral-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-neutral-500">Certificate preview not available</p>
                  </div>
                </div>
              )}

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h2 className="text-lg font-medium text-neutral-900 mb-4">Certificate Details</h2>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-neutral-500">Recipient:</span>
                        <p className="text-neutral-900">{certificate.userName}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-neutral-500">Course:</span>
                        <p className="text-neutral-900">{certificate.courseName}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-neutral-500">Issue Date:</span>
                        <p className="text-neutral-900">{formatDate(certificate.issueDate)}</p>
                      </div>
                      {certificate.expiryDate && (
                        <div>
                          <span className="text-sm font-medium text-neutral-500">Expiry Date:</span>
                          <p className="text-neutral-900">{formatDate(certificate.expiryDate)}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-sm font-medium text-neutral-500">Certificate ID:</span>
                        <p className="text-neutral-900 font-mono text-sm">{certificate.id}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-neutral-500">Verification Code:</span>
                        <p className="text-neutral-900 font-mono text-sm">{certificate.verificationCode}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-lg font-medium text-neutral-900 mb-4">Verification</h2>
                    <p className="text-neutral-600 mb-4">
                      This certificate can be verified online to ensure its authenticity. Use the verification code or click the button below to verify.
                    </p>
                    <Link href={`/verify-certificate/${certificate.verificationCode}`} passHref>
                      <Button variant="primary" className="w-full">
                        Verify Certificate
                      </Button>
                    </Link>

                    <div className="mt-6">
                      <h3 className="text-md font-medium text-neutral-900 mb-2">Share Certificate</h3>
                      <div className="flex space-x-2">
                        <a
                          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-[#0A66C2] text-white rounded-full"
                        >
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                          </svg>
                        </a>
                        <a
                          href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(`Check out this certificate for completing ${certificate.courseName}!`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-[#1DA1F2] text-white rounded-full"
                        >
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.054 10.054 0 01-3.127 1.184 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                          </svg>
                        </a>
                        <a
                          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-[#1877F2] text-white rounded-full"
                        >
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                          </svg>
                        </a>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(window.location.href);
                            alert('Link copied to clipboard');
                        }}
                          className="p-2 bg-neutral-200 text-neutral-700 rounded-full"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const {id } = context.params || {};

  if (!id || typeof id !== 'string') {
    return {
      notFound: true
  };
}

  return {
    props: {
      certificateId: id
  }
};
};

export default CertificateShowcase;
