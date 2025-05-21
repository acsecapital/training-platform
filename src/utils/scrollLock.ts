/**
 * ScrollLock utility to prevent excessive Firestore reads during scrolling
 *
 * This utility creates a global mechanism to temporarily block Firestore
 * operations while the user is scrolling to prevent quota exhaustion.
 */

/**
 * Singleton class to manage scroll locking
 */
class ScrollLockManager {
  private static instance: ScrollLockManager;
  private isScrolling = false;
  private scrollTimeout: NodeJS.Timeout | null = null;
  private scrollEndCallbacks: (() => void)[] = [];
  private scrollStartCallbacks: (() => void)[] = [];
  private lockDuration = 500; // ms to wait after scroll stops

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    if (typeof window !== "undefined") {
      // Add a single scroll listener
      window.addEventListener("scroll", this.handleScroll, {passive: true});
  }
}

  /**
   * Get the singleton instance
   * @return {ScrollLockManager} The singleton instance
   */
  public static getInstance(): ScrollLockManager {
    if (!ScrollLockManager.instance) {
      ScrollLockManager.instance = new ScrollLockManager();
  }
    return ScrollLockManager.instance;
}

  /**
   * Handle scroll events
   */
  private handleScroll = (): void => {
    // If not already scrolling, trigger scroll start
    if (!this.isScrolling) {
      this.isScrolling = true;
      this.triggerScrollStart();
  }

    // Clear any existing timeout
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
  }

    // Set a new timeout
    this.scrollTimeout = setTimeout(() => {
      this.isScrolling = false;
      this.triggerScrollEnd();
      this.scrollTimeout = null;
  }, this.lockDuration);
};

  /**
   * Trigger all scroll start callbacks
   */
  private triggerScrollStart(): void {
    this.scrollStartCallbacks.forEach((callback) => callback());
}

  /**
   * Trigger all scroll end callbacks
   */
  private triggerScrollEnd(): void {
    this.scrollEndCallbacks.forEach((callback) => callback());
}

  /**
   * Register a callback to be called when scrolling starts
   * @param {Function} callback The callback function
   * @return {Function} Unsubscribe function
   */
  public onScrollStart(callback: () => void): () => void {
    this.scrollStartCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      this.scrollStartCallbacks = this.scrollStartCallbacks.filter(
        (cb) => cb !== callback
      );
  };
}

  /**
   * Register a callback to be called when scrolling ends
   * @param {Function} callback The callback function
   * @return {Function} Unsubscribe function
   */
  public onScrollEnd(callback: () => void): () => void {
    this.scrollEndCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      this.scrollEndCallbacks = this.scrollEndCallbacks.filter(
        (cb) => cb !== callback
      );
  };
}

  /**
   * Check if the user is currently scrolling
   * @return {boolean} True if scrolling, false otherwise
   */
  public isCurrentlyScrolling(): boolean {
    return this.isScrolling;
}

  /**
   * Set the duration to wait after scrolling stops before triggering callbacks
   * @param {number} ms Duration in milliseconds
   */
  public setLockDuration(ms: number): void {
    this.lockDuration = ms;
}
}

/**
 * Hook to use the scroll lock
 * @param {number} lockDuration Duration in milliseconds to wait after scrolling stops
 * @return {Object} Object with scroll lock utilities
 */
export function useScrollLock(lockDuration = 500) {
  const scrollLock = ScrollLockManager.getInstance();
  scrollLock.setLockDuration(lockDuration);

  return {
    isScrolling: scrollLock.isCurrentlyScrolling(),
    onScrollStart: scrollLock.onScrollStart.bind(scrollLock),
    onScrollEnd: scrollLock.onScrollEnd.bind(scrollLock),
};
}

// Export the singleton instance
export const scrollLock = ScrollLockManager.getInstance();

/**
 * Function to check if we should allow a Firestore operation
 * @return {boolean} True if operation should be allowed, false otherwise
 */
export function shouldAllowFirestoreOperation(): boolean {
  return !scrollLock.isCurrentlyScrolling();
}

// Firestore operation throttling
let lastFirestoreOpTime = 0;
const MIN_TIME_BETWEEN_OPS = 300; // ms

/**
 * Function to throttle Firestore operations
 * @return {boolean} True if operation should be allowed, false otherwise
 */
export function canPerformFirestoreOperation(): boolean {
  const now = Date.now();

  // If scrolling, only allow operations with significant time gap
  if (scrollLock.isCurrentlyScrolling()) {
    if (now - lastFirestoreOpTime < MIN_TIME_BETWEEN_OPS) {
      return false;
  }
}

  lastFirestoreOpTime = now;
  return true;
}
