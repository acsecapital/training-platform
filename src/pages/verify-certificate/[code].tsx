import React from 'react';
import {GetServerSideProps } from 'next';
import {useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import CertificateVerifier from '@/components/certificates/CertificateVerifier';
import Button from '@/components/ui/Button';
import Link from 'next/link';

const VerifyCertificatePage: React.FC = () => {
  const router = useRouter();
  const {code } = router.query;

  return (
    <Layout title="Verify Certificate">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-1">Verify Certificate</h1>
            <p className="text-neutral-600">
              Verify the authenticity of a certificate issued by our platform.
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Link href="/" passHref>
              <Button variant="outline">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>

        <CertificateVerifier initialCode={code as string || ''} />
      </div>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = async () => {
  // Even though we don't have async operations, GetServerSideProps requires an async function
  // that returns a Promise
  return {
    props: {}
  };
};

export default VerifyCertificatePage;
