import React, {useEffect, useState } from 'react';

interface NoSSRProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * A component that prevents its children from being rendered during server-side rendering.
 * This is useful for components that rely on browser-specific APIs or cause hydration issues.
 */
const NoSSR: React.FC<NoSSRProps> = ({
  children, 
  fallback = null 
}) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
}, []);

  return isClient ? <>{children}</> : <>{fallback}</>;
};

export default NoSSR;
