import React, {useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import {Course } from '@/types/course.types';
import {collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import {firestore } from '@/services/firebase';

interface EmptyLearningStateProps {
  onRefresh: () => void;
  userId?: string;
  userEmail?: string;
}

const EmptyLearningState: React.FC<EmptyLearningStateProps> = ({
  onRefresh,
  userId,
  userEmail
}) => {
  const [recommendedCourses, setRecommendedCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRecommendedCourses = async () => {
      setLoading(true);
      try {
        // Fetch featured or popular courses as recommendations
        const coursesRef = collection(firestore, 'courses');
        const coursesQuery = query(
          coursesRef,
          where('status', '==', 'published'),
          orderBy('enrolledCount', 'desc'),
          limit(3)
        );
        
        const querySnapshot = await getDocs(coursesQuery);
        const courses = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
      })) as Course[];
        
        setRecommendedCourses(courses);
    } catch (error) {
        console.error('Error fetching recommended courses:', error);
    } finally {
        setLoading(false);
    }
  };
    
    fetchRecommendedCourses();
}, []);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-8">
      <div className="text-center mb-8">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-neutral-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <h2 className="text-2xl font-bold mb-2">No Courses Yet</h2>
        <p className="text-neutral-600 mb-6 max-w-lg mx-auto">
          You haven't enrolled in any courses yet. Browse our catalog to find courses that interest you or check out our recommendations below.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            href="/courses"
            variant="primary"
          >
            Browse Courses
          </Button>
          <Button
            onClick={onRefresh}
            variant="outline"
          >
            Refresh Enrollments
          </Button>
        </div>
      </div>
      
      {recommendedCourses.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4 text-center">Recommended Courses</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recommendedCourses.map(course => (
              <div key={course.id} className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
                <div className="aspect-video relative">
                  {course.thumbnail ? (
                    <Image
                      src={course.thumbnail}
                      alt={course.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-neutral-200 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                  )}
                  
                  {/* Course level badge */}
                  {course.level && (
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-neutral-800 bg-opacity-70 text-white">
                        {course.level}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  <h4 className="font-semibold mb-2">{course.title}</h4>
                  <p className="text-sm text-neutral-500 mb-4 line-clamp-2">{course.description}</p>
                  <Link href={`/courses/${course.id}`} passHref>
                    <Button variant="primary" className="w-full">
                      View Course
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="mt-6 text-xs text-neutral-500 text-center">
        <p>User ID: {userId}</p>
        <p>User Email: {userEmail}</p>
      </div>
    </div>
  );
};

export default EmptyLearningState;
