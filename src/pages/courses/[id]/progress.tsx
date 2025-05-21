import React, {useState, useEffect } from 'react';
import {GetServerSideProps } from 'next';
import {useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import CourseProgressDetails from '@/components/courses/CourseProgressDetails';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import {useAuth } from '@/context/AuthContext';
import {withAuth } from '@/utils/withAuth';
import {getCourseProgress } from '@/services/courseProgressService';
import {doc, getDoc } from 'firebase/firestore';
import {firestore } from '@/services/firebase';
import {Course, CourseProgress } from '@/types/course.types';

const CourseProgressPage: React.FC = () => {
  const router = useRouter();
  const {id } = router.query;
  const {user } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch course and progress data
  useEffect(() => {
    const fetchData = async () => {
      if (!id || !user) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch course
        const courseRef = doc(firestore, `courses/${id}`);
        const courseSnapshot = await getDoc(courseRef);

        if (!courseSnapshot.exists()) {
          setError('Course not found');
          return;
      }

        const courseData = {
          id: courseSnapshot.id,
          ...courseSnapshot.data() as Omit<Course, 'id'>
      };

        setCourse(courseData);

        // Fetch progress
        if (user) {
          const progressData = await getCourseProgress(user.uid, typeof id === 'string' ? id : String(id));
          setProgress(progressData);
      }
    } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again.');
    } finally {
        setLoading(false);
    }
  };

    void fetchData();
}, [id, user]);

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="p-8 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        </div>
      </Layout>
    );
}

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        </div>
      </Layout>
    );
}

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-1">Course Progress</h1>
            {course && (
              <p className="text-neutral-600">{course.title}</p>
            )}
          </div>
          <div className="flex space-x-2 mt-4 md:mt-0">
            <Link href={`/courses/${typeof id === 'string' ? id : Array.isArray(id) ? id[0] : ''}`} passHref>
              <Button variant="outline">
                Back to Course
              </Button>
            </Link>
            {progress && progress.lastPosition && (
              <Link href={`/courses/${typeof id === 'string' ? id : Array.isArray(id) ? id[0] : ''}/modules/${progress.lastPosition.moduleId}/lessons/${progress.lastPosition.lessonId}`} passHref>
                <Button variant="primary">
                  Continue Learning
                </Button>
              </Link>
            )}
          </div>
        </div>

        {id && typeof id === 'string' && (
          <CourseProgressDetails courseId={id} progress={progress || undefined} />
        )}
      </div>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = withAuth(async () => {
  // Even though we don't have async operations, GetServerSideProps requires an async function
  // that returns a Promise
  return {
    props: {}
  };
});

export default CourseProgressPage;
