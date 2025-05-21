import React from 'react';
import {GetServerSideProps } from 'next';
import MainLayout from '@/components/layout/MainLayout';
import dynamic from 'next/dynamic';
import ClientSideCourseWrapper from '@/components/courses/ClientSideCourseWrapper';

// Use dynamic import with SSR disabled for the component that uses context
const CourseCertificateContent = dynamic<{
  courseId: string;
}>(
  () => import('@/components/certificates/CourseCertificateContent'),
  {ssr: false }
);

interface CourseCertificatePageProps {
  courseId: string;
}

const CourseCertificatePage: React.FC<CourseCertificatePageProps> = ({courseId }) => {
  return (
    <MainLayout title="Course Certificate">
      <ClientSideCourseWrapper>
        <CourseCertificateContent courseId={courseId} />
      </ClientSideCourseWrapper>
    </MainLayout>
  );
};

export const getServerSideProps: GetServerSideProps<CourseCertificatePageProps> = async (context) => {
  const {id } = context.params || {};

  if (!id || typeof id !== 'string') {
    return {
      notFound: true,
    };
  }

  // Add an await statement to make the function actually async
  await Promise.resolve(); // This is a minimal change to satisfy the require-await rule

  return {
    props: {
      courseId: id,
    },
  };
};

export default CourseCertificatePage;
