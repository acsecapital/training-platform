import React from 'react';
import {motion } from 'framer-motion';

type CardProps = {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
  elevation?: 'none' | 'low' | 'medium' | 'high';
  padding?: 'none' | 'small' | 'medium' | 'large';
  border?: boolean;
  rounded?: 'none' | 'small' | 'medium' | 'large' | 'full';
};

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  hover = true,
  elevation = 'medium',
  padding = 'medium',
  border = false,
  rounded = 'medium',
}) => {
  // Base classes
  const baseClasses = 'bg-white transition-all duration-200 ease-in-out';
  
  // Elevation classes
  const elevationClasses = {
    none: '',
    low: 'shadow-sm',
    medium: 'shadow-md',
    high: 'shadow-lg',
};
  
  // Padding classes
  const paddingClasses = {
    none: 'p-0',
    small: 'p-3',
    medium: 'p-5',
    large: 'p-8',
};
  
  // Rounded classes
  const roundedClasses = {
    none: 'rounded-none',
    small: 'rounded-md',
    medium: 'rounded-xl',
    large: 'rounded-3xl',
    full: 'rounded-full',
};
  
  // Hover classes
  const hoverClasses = hover ? 'hover:shadow-card' : '';
  
  // Border classes
  const borderClasses = border ? 'border border-neutral-200' : '';
  
  // Combine all classes
  const cardClasses = `${baseClasses} ${elevationClasses[elevation]} ${paddingClasses[padding]} ${roundedClasses[rounded]} ${hoverClasses} ${borderClasses} ${className}`;
  
  return (
    <motion.div
      className={cardClasses}
      onClick={onClick}
      whileHover={hover ? {y: -5 } : {}}
      transition={{type: 'spring', stiffness: 300 }}
    >
      {children}
    </motion.div>
  );
};

export default Card;
