import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3',
};

  return (
    <div className={`${className}`}>
      <div 
        className={`animate-spin rounded-full ${sizeClasses[size]} border-t-transparent border-primary`}
      />
    </div>
  );
};
