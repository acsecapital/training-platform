import {useState, useEffect } from 'react';

/**
 * Custom hook for responsive design with media queries
 * @param query The media query to match
 * @returns Boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  // Initialize with null to avoid hydration mismatch
  const [matches, setMatches] = useState<boolean>(false);
  
  useEffect(() => {
    // Avoid running on the server
    if (typeof window === 'undefined') {
      return;
  }
    
    // Create media query list
    const mediaQuery = window.matchMedia(query);
    
    // Set initial value
    setMatches(mediaQuery.matches);
    
    // Define callback for media query changes
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
  };
    
    // Add event listener
    mediaQuery.addEventListener('change', handleChange);
    
    // Clean up
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
  };
}, [query]);
  
  return matches;
}

// Predefined media query hooks
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 639px)');
}

export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 640px) and (max-width: 1023px)');
}

export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)');
}

export function useIsLargeDesktop(): boolean {
  return useMediaQuery('(min-width: 1280px)');
}
