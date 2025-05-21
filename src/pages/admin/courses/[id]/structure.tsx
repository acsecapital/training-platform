import React from 'react';
import {GetServerSideProps } from 'next';
import {useRouter } from 'next/router';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import CourseStructureVisualizer from '@/components/admin/courses/CourseStructureVisualizer';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import {withAdminAuth } from '@/utils/withAdminAuth';

const CourseStructurePage: React.FC = () => {
  const router = useRouter();
  const {id } = router.query;

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-neutral-900">Course Structure</h1>
          <div className="flex space-x-2">
            <Link href={`/admin/courses/${id}/modules`} passHref>
              <Button variant="primary">
                Manage Modules
              </Button>
            </Link>
            <Link href={`/admin/courses/${id}/preview`} passHref>
              <Button variant="outline">
                Course Preview
              </Button>
            </Link>
            <Link href="/admin/courses" passHref>
              <Button variant="outline">
                Back to Courses
              </Button>
            </Link>
          </div>
        </div>

        {id && typeof id === 'string' && (
          <CourseStructureVisualizer courseId={id} />
        )}
      </div>
    </AdminLayout>
  );
};

export const getServerSideProps: GetServerSideProps = withAdminAuth(async (context) => {
  return {
    props: {}
};
});

export default CourseStructurePage;
