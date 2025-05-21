import {useState, useEffect } from 'react';

/**
 * Custom hook for debouncing a value
 * @param value The value to debounce
 * @param delay The debounce delay in milliseconds (default: 500)
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    // Set a timeout to update the debounced value after the delay
    const timeoutId = setTimeout(() => {
      setDebouncedValue(value);
  }, delay);
    
    // Clean up the timeout if the value or delay changes
    return () => {
      clearTimeout(timeoutId);
  };
}, [value, delay]);
  
  return debouncedValue;
}
