import React from 'react';
import Link from 'next/link';
import {motion } from 'framer-motion';

type ButtonProps = {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg' | 'xs' | 'icon';
  href?: string;
  onClick?: (event?: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
};

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  href,
  onClick,
  className = '',
  disabled = false,
  type = 'button',
  fullWidth = false,
  icon,
  iconPosition = 'left',
  isLoading = false,
}) => {
  // Base classes
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-all duration-200 ease-in-out';

  // Size classes
  const sizeClasses = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
    icon: 'p-2 text-base',
};

  // Variant classes
  const variantClasses = {
    primary: 'bg-gradient-to-r from-primary to-primary-600 text-white hover:shadow-lg hover:from-primary-600 hover:to-primary-700',
    secondary: 'bg-gradient-to-r from-secondary to-secondary-600 text-white hover:shadow-lg hover:from-secondary-600 hover:to-secondary-700',
    outline: 'border border-primary text-primary hover:bg-primary-50',
    ghost: 'text-primary hover:bg-primary-50',
    danger: 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:shadow-lg hover:from-red-700 hover:to-red-800',
    success: 'bg-gradient-to-r from-success-600 to-success text-white shadow-[0_0_10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_15px_rgba(255,255,255,0.4)] hover:from-primary hover:to-primary-600',
    warning: 'bg-gradient-to-r from-warning to-warning-600 text-white hover:shadow-lg hover:from-warning-600 hover:to-warning-700',
};

  // Disabled classes
  const disabledClasses = 'opacity-50 cursor-not-allowed';

  // Full width class
  const fullWidthClass = fullWidth ? 'w-full' : '';

  // Loading state
  const loadingContent = (
    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  // Combine all classes
  const buttonClasses = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${disabled ? disabledClasses : ''} ${fullWidthClass} ${className}`;

  // Content with icon
  const content = (
    <>
      {isLoading && loadingContent}
      {!isLoading && icon && iconPosition === 'left' && <span className="mr-2">{icon}</span>}
      {children}
      {!isLoading && icon && iconPosition === 'right' && <span className="ml-2">{icon}</span>}
    </>
  );

  // Render as link if href is provided
  if (href) {
    return (
      <Link href={href} className={buttonClasses} onClick={onClick}>
        {content}
      </Link>
    );
}

  // Otherwise render as button
  return (
    <motion.button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled || isLoading}
      whileTap={{scale: disabled ? 1 : 0.98 }}
    >
      {content}
    </motion.button>
  );
};

export default Button;



