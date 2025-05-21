import React, {useState, useEffect } from 'react';
import {SvgIconProps } from '@mui/material';

interface ClientOnlyIconProps {
  icon: React.ComponentType<SvgIconProps>;
  props?: SvgIconProps;
}

/**
 * A component that only renders MUI icons on the client side
 * This prevents "Cannot read properties of null (reading 'useContext')" errors
 */
const ClientOnlyIcon: React.FC<ClientOnlyIconProps> = ({icon: Icon, props }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Use a timeout to ensure the component is mounted in the client
    const timer = setTimeout(() => {
      setIsMounted(true);
  }, 100); // Small delay to ensure client-side rendering

    return () => clearTimeout(timer);
}, []);

  if (!isMounted) {
    // Return a placeholder with the same dimensions
    return <span style={{display: 'inline-block', width: '1em', height: '1em'}} />;
}

  return <Icon {...props} />;
};

export default ClientOnlyIcon;
