import React, {useState, useEffect } from 'react';

interface ClientOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * A component that only renders its children on the client side
 * This prevents "Cannot read properties of null (reading 'useContext')" errors
 * that occur when MUI components are rendered during server-side rendering
 */
const ClientOnly: React.FC<ClientOnlyProps> = ({children, fallback = null }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
}, []);

  if (!isMounted) {
    return <>{fallback}</>;
}

  return <>{children}</>;
};

export default ClientOnly;
