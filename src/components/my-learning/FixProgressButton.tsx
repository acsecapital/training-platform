import React, {useState } from 'react';
import {fixEnrollmentProgress } from '@/utilities/fixEnrollmentProgress';
import {toast } from 'sonner';
import Button from '@/components/ui/Button';

interface FixProgressButtonProps {
  userId: string;
  courseId: string;
  courseName: string;
  onSuccess?: () => void;
  className?: string;
}

const FixProgressButton: React.FC<FixProgressButtonProps> = ({
  userId,
  courseId,
  courseName,
  onSuccess,
  className = ''
}) => {
  const [isFixing, setIsFixing] = useState(false);

  const handleFix = async () => {
    if (isFixing) return;

    try {
      setIsFixing(true);
      toast.loading(`Fixing progress for ${courseName}...`, {id: `fix-${courseId}` });

      const success = await fixEnrollmentProgress(userId, courseId);

      if (success) {
        toast.success(`Successfully fixed progress for ${courseName}. Refreshing...`, {id: `fix-${courseId}` });
        
        // If onSuccess callback is provided, call it
        if (onSuccess) {
          onSuccess();
      } else {
          // Force page reload if no callback provided
          window.location.reload();
      }
    } else {
        toast.error(`Failed to fix progress for ${courseName}.`, {id: `fix-${courseId}` });
    }
  } catch (error: any) {
      console.error('Error fixing progress:', error);
      toast.error(`Error: ${error.message || 'Unknown error'}`, {id: `fix-${courseId}` });
  } finally {
      setIsFixing(false);
  }
};

  return (
    <Button
      onClick={handleFix}
      disabled={isFixing}
      variant="primary"
      size="sm"
      className={className}
    >
      {isFixing ? 'Fixing...' : 'Fix Progress'}
    </Button>
  );
};

export default FixProgressButton;
