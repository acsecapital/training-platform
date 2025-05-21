import {QueryClient } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { PersistedClient } from '@tanstack/query-persist-client-core';
import {persistQueryClient } from '@tanstack/react-query-persist-client';

// Define data type categories with appropriate stale times
const STALE_TIMES = {
  // Static data that rarely changes
  STATIC: 24 * 60 * 60 * 1000, // 24 hours
  // Semi-static data that changes occasionally
  SEMI_STATIC: 6 * 60 * 60 * 1000, // 6 hours
  // Dynamic data that changes frequently
  DYNAMIC: 5 * 60 * 1000, // 5 minutes
  // Real-time data that needs to be fresh
  REAL_TIME: 30 * 1000, // 30 seconds
};

export const getQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Export a singleton instance
export const queryClient = getQueryClient();

// Create a client with optimized default options
export const createQueryClient = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE_TIMES.SEMI_STATIC, // Default to 6 hours for most data
        // Set reasonable defaults for caching behavior
        gcTime: 7 * 24 * 60 * 60 * 1000, // 7 days - how long to keep unused data in cache
        retry: 2, // Retry failed queries twice
        retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    },
  },
});

  // Only run in browser environment
  if (typeof window !== 'undefined') {
    try {
      // Create a persister for the query cache using localStorage
      const localStoragePersister = createSyncStoragePersister({
        storage: window.localStorage,
        key: 'TRAINING_PLATFORM_QUERY_CACHE', // Custom key for localStorage
        throttleTime: 1000, // Throttle writes to storage to prevent excessive writes
        serialize: (client: PersistedClient) => JSON.stringify(client),
        deserialize: (data: string): PersistedClient => JSON.parse(data) as PersistedClient,
    });

      // Persist the React Query cache to localStorage
      void persistQueryClient({
        queryClient,
        persister: localStoragePersister,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours - how long to persist cache
        buster: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0', // Cache buster on app updates
    });
  } catch (error) {
      // Log any errors but don't break the application
      console.error('Error setting up React Query persistence:', error);
  }
}

  return queryClient;
};

// Export stale times for use in specific queries
export {STALE_TIMES };
