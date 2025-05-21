import {useState, useEffect, useRef } from 'react';

interface ScrollPosition {
  x: number;
  y: number;
}

// Create a singleton for scroll event management to prevent multiple listeners
class ScrollManager {
  private static instance: ScrollManager;
  private listeners: Map<string, (position: ScrollPosition) => void> = new Map();
  private position: ScrollPosition = {x: 0, y: 0 };
  private ticking: boolean = false;
  private timeoutId: NodeJS.Timeout | null = null;
  private throttleTime: number = 500; // Increased throttle time to reduce events

  private constructor() {
    if (typeof window !== 'undefined') {
      // Set initial position
      this.updatePosition();

      // Add a single scroll listener for all hook instances
      window.addEventListener('scroll', this.handleScroll);
  }
}

  public static getInstance(): ScrollManager {
    if (!ScrollManager.instance) {
      ScrollManager.instance = new ScrollManager();
  }
    return ScrollManager.instance;
}

  private updatePosition = (): void => {
    if (typeof window === 'undefined') return;

    this.position = {
      x: window.scrollX,
      y: window.scrollY,
  };

    // Notify all listeners with the new position
    this.listeners.forEach(callback => callback(this.position));
    this.ticking = false;
};

  private handleScroll = (): void => {
    if (this.ticking) return;

    this.ticking = true;

    // Use a longer throttle time to reduce the number of updates
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
  }

    this.timeoutId = setTimeout(() => {
      window.requestAnimationFrame(() => {
        this.updatePosition();
        this.timeoutId = null;
        this.ticking = false;
    });
  }, this.throttleTime);
};

  public subscribe(id: string, callback: (position: ScrollPosition) => void): ScrollPosition {
    this.listeners.set(id, callback);
    return this.position; // Return current position immediately
}

  public unsubscribe(id: string): void {
    this.listeners.delete(id);

    // If no more listeners, clean up the global listener
    if (this.listeners.size === 0 && typeof window !== 'undefined') {
      window.removeEventListener('scroll', this.handleScroll);
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
    }
      ScrollManager.instance = null as any;
  }
}

  public setThrottleTime(ms: number): void {
    this.throttleTime = ms;
}
}

/**
 * Custom hook for tracking scroll position with optimized performance
 * @param throttleMs Throttle time in milliseconds (default: 200)
 * @returns Current scroll position {x, y}
 */
export function useScrollPosition(throttleMs = 200): ScrollPosition {
  const [scrollPosition, setScrollPosition] = useState<ScrollPosition>({x: 0, y: 0 });
  const idRef = useRef<string>(`scroll-hook-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    // Avoid running on the server
    if (typeof window === 'undefined') {
      return;
  }

    const scrollManager = ScrollManager.getInstance();
    scrollManager.setThrottleTime(throttleMs);

    // Subscribe to scroll events
    const initialPosition = scrollManager.subscribe(idRef.current, (position) => {
      setScrollPosition(position);
  });

    // Set initial position
    setScrollPosition(initialPosition);

    // Clean up on unmount
    return () => {
      scrollManager.unsubscribe(idRef.current);
  };
}, [throttleMs]);

  return scrollPosition;
}

/**
 * Custom hook to detect if the user has scrolled past a certain point
 * @param threshold Scroll threshold in pixels (default: 100)
 * @returns Boolean indicating if the user has scrolled past the threshold
 */
export function useScrolledPast(threshold = 100): boolean {
  const {y } = useScrollPosition(300); // Use a higher throttle for this simpler use case
  return y > threshold;
}
