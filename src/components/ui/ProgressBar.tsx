import React from 'react';
import {motion } from 'framer-motion';

interface ProgressBarProps {
  progress: number;
  className?: string;
  height?: string;
  showPercentage?: boolean;
  color?: string;
  backgroundColor?: string;
  animated?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  className = '',
  height = 'h-4',
  showPercentage = false,
  color = 'bg-primary',
  backgroundColor = 'bg-neutral-200',
  animated = true,
}) => {
  // Ensure progress is between 0 and 100
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  
  return (
    <div className={`relative ${height} w-full ${backgroundColor} rounded-full overflow-hidden ${className}`}>
      {animated ? (
        <motion.div
          className={`absolute top-0 left-0 h-full ${color} rounded-full`}
          initial={{width: 0 }}
          animate={{width: `${clampedProgress}%` }}
          transition={{duration: 0.5, ease: "easeOut" }}
        />
      ) : (
        <div 
          className={`absolute top-0 left-0 h-full ${color} rounded-full`}
          style={{width: `${clampedProgress}%` }}
        />
      )}
      
      {showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-white drop-shadow-sm">
            {Math.round(clampedProgress)}%
          </span>
        </div>
      )}
    </div>
  );
};

export default ProgressBar;