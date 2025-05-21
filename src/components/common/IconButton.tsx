import React from 'react';
import {SimpleIconProps } from '../ui/SimpleIcons';

interface IconButtonProps {
  icon: string;
  onClick?: () => void;
  className?: string;
  'aria-label': string;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'ghost' | 'outline';
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onClick,
  className = '',
  'aria-label': ariaLabel,
  disabled = false,
  size = 'medium',
  variant = 'default'
}) => {
  const sizeClasses = {
    small: 'p-1',
    medium: 'p-2',
    large: 'p-3'
};

  const variantClasses = {
    default: 'bg-primary hover:bg-primary-600 text-white',
    ghost: 'hover:bg-neutral-100 text-neutral-700',
    outline: 'border border-neutral-200 hover:bg-neutral-50 text-neutral-700'
};

  const baseClasses = `
    inline-flex 
    items-center 
    justify-center 
    rounded-md 
    transition-colors 
    duration-200
    disabled:opacity-50 
    disabled:cursor-not-allowed
  `;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        ${baseClasses}
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
      aria-label={ariaLabel}
      disabled={disabled}
    >
      {/* Use SimpleIcons if icon name matches, otherwise fallback to a span */}
      <span className="w-5 h-5">
        {icon === 'menu' ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        ) : (
          <span>{icon}</span>
        )}
      </span>
    </button>
  );
};