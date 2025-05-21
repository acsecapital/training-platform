import {useEffect, RefObject } from 'react';

/**
 * Custom hook for detecting clicks outside of a specified element
 * @param ref Reference to the element to monitor
 * @param callback Function to call when a click outside is detected
 * @param excludeRefs Optional array of refs to exclude from outside click detection
 */
export function useOutsideClick(
  ref: RefObject<HTMLElement>,
  callback: () => void,
  excludeRefs: RefObject<HTMLElement>[] = []
): void {
  useEffect(() => {
    // Only run on the client side
    if (typeof window === 'undefined') {
      return;
  }

    // Function to handle clicks
    const handleClickOutside = (event: MouseEvent) => {
      // Check if the click was outside the ref element and not in any excluded elements
      if (
        ref.current &&
        !ref.current.contains(event.target as Node) &&
        !excludeRefs.some(
          excludeRef => excludeRef.current && excludeRef.current.contains(event.target as Node)
        )
      ) {
        callback();
    }
  };

    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);

    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
  };
}, [ref, callback, excludeRefs]);
}
