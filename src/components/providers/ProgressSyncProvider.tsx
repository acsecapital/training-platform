import React, {useEffect } from 'react';
import {cleanupSyncManager } from '@/utils/progressSyncOptimizer';

/**
 * Provider component to initialize and clean up the progress sync manager
 * This helps ensure that any pending sync operations are properly handled
 * when the application unmounts
 */
const ProgressSyncProvider: React.FC<{children: React.ReactNode }> = ({children }) => {
  useEffect(() => {
    // No initialization needed as the sync manager is a singleton
    // that initializes itself on first use
    
    // Clean up the sync manager when the component unmounts
    return () => {
      cleanupSyncManager();
  };
}, []);

  // Just render the children
  return <>{children}</>;
};

export default ProgressSyncProvider;
