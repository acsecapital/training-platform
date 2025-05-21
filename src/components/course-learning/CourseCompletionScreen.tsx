import React from 'react';
import { useRouter } from 'next/router';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';

interface CourseCompletionScreenProps {
  courseId: string;
}

export default function CourseCompletionScreen({ courseId }: CourseCompletionScreenProps) {
  const router = useRouter();
  
  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircleIcon className="w-12 h-12 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold mb-4">Congratulations!</h2>
        <p className="text-lg text-neutral-600 mb-8">
          You've completed all the lessons in this course. Ready to test your knowledge?
        </p>
        
        <Button
          variant="primary"
          size="lg"
          onClick={() => router.push(`/courses/${courseId}/final-quiz`)}
          className="px-8"
        >
          Take Final Quiz
        </Button>
        
        <div className="mt-8 pt-8 border-t border-neutral-200">
          <Button
            variant="outline"
            onClick={() => router.push('/my-learning')}
          >
            Return to My Learning
          </Button>
        </div>
      </div>
    </div>
  );
}