import React from 'react';
import { GetServerSideProps, GetServerSidePropsContext } from 'next';
import Layout from '@/components/layout/Layout';
import UserCertificates from '@/components/certificates/UserCertificates';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import {useAuth } from '@/context/AuthContext';
import {withAuth } from '@/utils/withAuth';

const UserCertificatesPage: React.FC = () => {
  const {user } = useAuth();

  return (
    <Layout title="My Certificates">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-1">My Certificates</h1>
            <p className="text-neutral-600">
              View and download your earned certificates.
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Link href="/profile" passHref>
              <Button variant="outline">
                Back to Profile
              </Button>
            </Link>
          </div>
        </div>

        {user && <UserCertificates userId={user.uid} />}
      </div>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = withAuth(
  async (context: GetServerSidePropsContext) => {
    // context is available here if needed (e.g., context.req, context.query)
    // Even if not used, its presence and the async keyword satisfy the type signature.
    return {
      props: {},
    };
  }
);

export default UserCertificatesPage;
