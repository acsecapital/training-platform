import React, {useState } from 'react';

interface StarRatingProps {
  initialRating?: number;
  totalStars?: number;
  size?: 'sm' | 'md' | 'lg';
  readOnly?: boolean;
  onChange?: (rating: number) => void;
  className?: string;
}

const StarRating: React.FC<StarRatingProps> = ({
  initialRating = 0,
  totalStars = 5,
  size = 'md',
  readOnly = false,
  onChange,
  className = '',
}) => {
  const [rating, setRating] = useState(initialRating);
  const [hoverRating, setHoverRating] = useState(0);

  // Size classes
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
};

  // Handle star click
  const handleStarClick = (selectedRating: number) => {
    if (readOnly) return;
    
    setRating(selectedRating);
    if (onChange) {
      onChange(selectedRating);
  }
};

  // Handle mouse enter
  const handleMouseEnter = (hoveredRating: number) => {
    if (readOnly) return;
    setHoverRating(hoveredRating);
};

  // Handle mouse leave
  const handleMouseLeave = () => {
    if (readOnly) return;
    setHoverRating(0);
};

  // Determine the current display rating (either hovered or selected)
  const displayRating = hoverRating || rating;

  return (
    <div className={`flex items-center ${className}`}>
      {[...Array(totalStars)].map((_, index) => {
        const starValue = index + 1;
        
        return (
          <button
            key={index}
            type="button"
            className={`${readOnly ? 'cursor-default' : 'cursor-pointer'} focus:outline-none p-0.5`}
            onClick={() => handleStarClick(starValue)}
            onMouseEnter={() => handleMouseEnter(starValue)}
            onMouseLeave={handleMouseLeave}
            disabled={readOnly}
            aria-label={`${starValue} star${starValue !== 1 ? 's' : ''}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`${sizeClasses[size]} ${
                starValue <= displayRating ? 'text-yellow-400' : 'text-neutral-300'
            } transition-colors duration-150`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        );
    })}
    </div>
  );
};

export default StarRating;
