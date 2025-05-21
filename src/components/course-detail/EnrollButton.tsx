import React, {useState } from 'react';
import {useRouter } from 'next/router';
import {collection, addDoc, serverTimestamp } from 'firebase/firestore';
import {firestore } from '@/services/firebase';
import {useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';

interface EnrollButtonProps {
  courseId: string;
  courseName: string;
  price?: number;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
}

const EnrollButton: React.FC<EnrollButtonProps> = ({
  courseId,
  courseName,
  price,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
}) => {
  const {user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEnroll = async () => {
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=/courses/${courseId}`);
      return;
  }

    try {
      setIsEnrolling(true);
      setError(null);

      // Create enrollment record in Firestore
      await addDoc(collection(firestore, `users/${user?.uid}/enrollments`), {
        courseId,
        courseName,
        enrolledAt: serverTimestamp(),
        progress: 0,
        completedLessons: [],
        lastAccessedAt: serverTimestamp(),
        status: 'active',
    });

      // Redirect to the learning page
      router.push(`/courses/${courseId}/learn`);
  } catch (err: any) {
      console.error('Error enrolling in course:', err);
      setError('Failed to enroll in course. Please try again.');
  } finally {
      setIsEnrolling(false);
  }
};

  const buttonText = price
    ? `Enroll Now - $${price}${price % 1 === 0 ? '' : '0'}/month`
    : 'Enroll Now';

  return (
    <>
      <Button
        variant={variant}
        size={size}
        fullWidth={fullWidth}
        className={className}
        onClick={handleEnroll}
        disabled={isEnrolling}
      >
        {isEnrolling ? 'Enrolling...' : buttonText}
      </Button>

      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}
    </>
  );
};

export default EnrollButton;
