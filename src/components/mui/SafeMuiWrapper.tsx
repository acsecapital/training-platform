import React from 'react';
import {ThemeProvider, createTheme, StyledEngineProvider } from '@mui/material/styles';
import {CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';

// Create a theme instance
const theme = createTheme();

// Create a client-side cache
const createEmotionCache = () => {
  return createCache({key: 'css', prepend: true });
};

// Create a singleton cache for client-side
const clientSideEmotionCache = typeof window !== 'undefined' ? createEmotionCache() : null;

interface SafeMuiWrapperProps {
  children: React.ReactNode;
}

/**
 * A wrapper component that ensures MUI components have access to the necessary context
 * This is used to prevent the "Cannot read properties of null (reading 'useContext')" error
 */
const SafeMuiWrapper: React.FC<SafeMuiWrapperProps> = ({children }) => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
}, []);

  // Only render children on the client side
  if (!mounted) {
    return null;
}

  // If we're on the server or the cache isn't available, just render the children
  if (!clientSideEmotionCache) {
    return <>{children}</>;
}

  return (
    <CacheProvider value={clientSideEmotionCache}>
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={theme}>
          {children}
        </ThemeProvider>
      </StyledEngineProvider>
    </CacheProvider>
  );
};

export default SafeMuiWrapper;
