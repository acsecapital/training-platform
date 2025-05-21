import React, {useState, useEffect } from 'react';
import FeedbackModal from './FeedbackModal';

interface FeedbackButtonProps {
  source: string;
  metadata?: Record<string, any>;
  className?: string;
  variant?: 'fixed' | 'inline';
  label?: string;
}

const FeedbackButton: React.FC<FeedbackButtonProps> = ({
  source,
  metadata = {},
  className = '',
  variant = 'fixed',
  label = 'Feedback',
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Handle scroll position to show/hide the button
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout | null = null;

    const handleScroll = () => {
      // Skip if we already have a pending update
      if (scrollTimeout) return;

      // Use requestAnimationFrame for better performance
      scrollTimeout = setTimeout(() => {
        // Calculate 66% threshold of the total scrollable content height
        const scrollThreshold = (document.documentElement.scrollHeight - window.innerHeight) * 0.66;

        // Show button when user has scrolled past the threshold
        setIsVisible(window.scrollY > scrollThreshold);

        scrollTimeout = null;
    }, 200); // Throttle to once every 200ms
  };

    // Add scroll event listener with passive option for better performance
    window.addEventListener('scroll', handleScroll, {passive: true });

    // Initial check
    handleScroll();

    // Clean up
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
    }
  };
}, []);

  // Open feedback modal
  const openFeedbackModal = () => {
    setIsModalOpen(true);
};

  // Close feedback modal
  const closeFeedbackModal = () => {
    setIsModalOpen(false);
};

  if (variant === 'fixed') {
    return (
      <>
        <button
          onClick={openFeedbackModal}
          className={`fixed right-0 top-1/2 transform -translate-y-1/2 bg-primary text-white px-3 py-6 rounded-l-lg shadow-lg hover:bg-primary-dark z-50
            transition-all duration-500 ease-in-out ${className} ${
            isVisible || isModalOpen
              ? 'opacity-100 translate-x-0'
              : 'opacity-0 translate-x-full pointer-events-none'
        }`}
          style={{writingMode: 'vertical-rl', textOrientation: 'mixed'}}
        >
          {label}
        </button>

        <FeedbackModal
          isOpen={isModalOpen}
          onClose={closeFeedbackModal}
          source={source}
          metadata={metadata}
        />
      </>
    );
}

  // For inline variant, always show regardless of scroll position
  return (
    <>
      <button
        onClick={openFeedbackModal}
        className={`inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${className}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
        {label}
      </button>

      <FeedbackModal
        isOpen={isModalOpen}
        onClose={closeFeedbackModal}
        source={source}
        metadata={metadata}
      />
    </>
  );
};

export default FeedbackButton;
