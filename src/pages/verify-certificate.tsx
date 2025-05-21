import React, {useState, useEffect } from 'react';
import {useRouter } from 'next/router';
import {collection, query, where, getDocs } from 'firebase/firestore';
import {firestore } from '@/services/firebase';
import MainLayout from '@/components/layout/MainLayout';
import Button from '@/components/ui/Button';

interface VerificationResult {
  isValid: boolean;
  studentName?: string;
  courseName?: string;
  completionDate?: string;
  message?: string;
}

// Define an interface for the expected structure of certificate data from Firestore
interface CertificateDocumentData {
  studentName?: string;
  courseName?: string;
  completionDate?: string | number | { seconds: number; nanoseconds: number }; // Can be ISO string, timestamp number, or Firestore Timestamp object
}

const VerifyCertificatePage: React.FC = () => {
  const router = useRouter();
  const [certificateId, setCertificateId] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);

  // Check for certificate ID in URL query parameters
  useEffect(() => {
    const {id } = router.query;
    if (id && typeof id === 'string') {
      setCertificateId(id);
      // Auto-verify if ID is provided in URL
      void handleVerify(null, id); // Handle promise
  }
}, [router.query]);

  // Handle certificate verification
  const handleVerify = async (e: React.FormEvent | null, idToVerify?: string) => {
    if (e) e.preventDefault();

    const idToCheck = idToVerify || certificateId;
    if (!idToCheck.trim()) return;

    setIsVerifying(true);
    setResult(null);

    try {
      // Query certificates collection for the given ID
      const certificatesRef = collection(firestore, 'certificates');
      const q = query(certificatesRef, where('certificateId', '==', idToCheck.trim()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setResult({
          isValid: false,
          message: 'Certificate not found. Please check the ID and try again.',
      });
        return;
    }

      // Get certificate data
      const certificateData = querySnapshot.docs[0].data() as CertificateDocumentData;

      let formattedCompletionDate: string | undefined;
      if (certificateData.completionDate) {
        if (typeof certificateData.completionDate === 'object' && 'seconds' in certificateData.completionDate && typeof certificateData.completionDate.seconds === 'number') {
          // Firestore Timestamp object
          formattedCompletionDate = new Date(certificateData.completionDate.seconds * 1000).toLocaleDateString();
        } else if (typeof certificateData.completionDate === 'string' || typeof certificateData.completionDate === 'number') {
          // ISO string or numeric timestamp
          formattedCompletionDate = new Date(certificateData.completionDate).toLocaleDateString();
        }
      }

      // Verify certificate
      setResult({
        isValid: true,
        studentName: certificateData.studentName || 'N/A',
        courseName: certificateData.courseName || 'N/A',
        completionDate: formattedCompletionDate,
    });
  } catch (error) {
      console.error('Error verifying certificate:', error);
      setResult({
        isValid: false,
        message: 'An error occurred while verifying the certificate. Please try again.',
    });
  } finally {
      setIsVerifying(false);
  }
};

  return (
    <MainLayout title="Verify Certificate">
      <div className="bg-gradient-primary py-20 text-white">
        <div className="container mx-auto px-6 sm:px-12 lg:px-24 xl:px-32">
          <h1 className="text-3xl font-bold mt-6 mb-4">Certificate Verification</h1>
          <p className="text-lg opacity-90 max-w-3xl">Verify the authenticity of a Closer College certificate</p>
        </div>
      </div>

      <div className="container mx-auto px-6 sm:px-12 lg:px-24 xl:px-32 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-8">
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-2">Verify a Certificate</h2>
              <p className="text-neutral-600">
                Enter the certificate ID to verify its authenticity. The certificate ID can be found at the bottom of the certificate.
              </p>
            </div>

            <form onSubmit={(e) => void handleVerify(e)} className="mb-8">
              <div className="mb-4">
                <label htmlFor="certificateId" className="block text-sm font-medium text-neutral-700 mb-1">
                  Certificate ID
                </label>
                <input
                  type="text"
                  id="certificateId"
                  value={certificateId}
                  onChange={(e) => setCertificateId(e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter certificate ID (e.g., CERT-ABC123XYZ)"
                  required
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                isLoading={isVerifying}
                disabled={isVerifying || !certificateId.trim()}
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
              }
              >
                Verify Certificate
              </Button>
            </form>

            {result && (
              <div className={`p-6 rounded-lg ${
                result.isValid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
                <div className="flex items-start">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    result.isValid ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                }`}>
                    {result.isValid ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>

                  <div className="ml-4 flex-1">
                    <h3 className={`text-lg font-medium ${
                      result.isValid ? 'text-green-800' : 'text-red-800'
                  }`}>
                      {result.isValid ? 'Valid Certificate' : 'Invalid Certificate'}
                    </h3>

                    {result.isValid ? (
                      <div className="mt-2 space-y-2">
                        <p className="text-green-700">
                          This certificate has been verified as authentic.
                        </p>

                        <div className="mt-4 p-4 bg-white rounded-md border border-green-200">
                          <h4 className="font-medium text-neutral-900 mb-2">Certificate Details</h4>
                          <div className="space-y-2">
                            <div className="flex">
                              <span className="font-medium w-32">Student Name:</span>
                              <span>{result.studentName}</span>
                            </div>
                            <div className="flex">
                              <span className="font-medium w-32">Course:</span>
                              <span>{result.courseName}</span>
                            </div>
                            <div className="flex">
                              <span className="font-medium w-32">Completion Date:</span>
                              <span>{result.completionDate}</span>
                            </div>
                            <div className="flex">
                              <span className="font-medium w-32">Certificate ID:</span>
                              <span>{certificateId}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-2 text-red-700">
                        {result.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 bg-neutral-50 rounded-lg p-6 border border-neutral-200">
            <h3 className="text-lg font-medium mb-2">About Certificate Verification</h3>
            <p className="text-neutral-600 mb-4">
              All certificates issued by Closer College include a unique Certificate ID that can be used to verify their authenticity.
              Employers and other third parties can use this verification tool to confirm that a certificate was legitimately issued.
            </p>
            <p className="text-neutral-600">
              If you have any questions about certificate verification, please contact us at <a href="mailto:support@closercollegett.com" className="text-primary hover:underline">support@closercollegett.com</a>.
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default VerifyCertificatePage;
