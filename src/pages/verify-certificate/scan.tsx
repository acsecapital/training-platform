import React from 'react';
import {useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import QRCodeVerifier from '@/components/certificates/QRCodeVerifier';
import Link from 'next/link';
import Button from '@/components/ui/Button';

const ScanQRCodePage: React.FC = () => {
  const router = useRouter();

  // Handle verification
  const handleVerify = (code: string) => {
    void router.push(`/verify-certificate/${code}`);
};

  return (
    <Layout title="Scan Certificate QR Code">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">Scan Certificate QR Code</h1>
            <p className="text-neutral-600">
              Use your device's camera to scan a certificate QR code for instant verification
            </p>
          </div>

          <div className="mb-8">
            <QRCodeVerifier onVerify={handleVerify} />
          </div>

          <div className="text-center">
            <p className="text-neutral-600 mb-4">
              Don't have a QR code to scan? You can also verify a certificate using the verification code.
            </p>
            <Link href="/verify-certificate" passHref>
              <Button variant="outline">
                Enter Verification Code
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ScanQRCodePage;
