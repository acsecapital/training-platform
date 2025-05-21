import React, {useEffect, useState } from 'react';
import {ThemeProvider, createTheme, responsiveFontSizes, StyledEngineProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import {CacheProvider } from '@emotion/react';
import createEmotionCache from '@/utils/createEmotionCache';

// Create a theme instance that matches the one in _app.tsx
const theme = responsiveFontSizes(createTheme({
  palette: {
    primary: {
      main: '#3f51b5',
  },
    secondary: {
      main: '#f50057',
  },
},
  typography: {
    fontFamily: 'var(--font-inter), sans-serif',
    h1: {
      fontFamily: 'var(--font-montserrat), sans-serif',
  },
    h2: {
      fontFamily: 'var(--font-montserrat), sans-serif',
  },
    h3: {
      fontFamily: 'var(--font-montserrat), sans-serif',
  },
    h4: {
      fontFamily: 'var(--font-montserrat), sans-serif',
  },
    h5: {
      fontFamily: 'var(--font-montserrat), sans-serif',
  },
    h6: {
      fontFamily: 'var(--font-montserrat), sans-serif',
  },
},
  components: {
    MuiButtonBase: {
      defaultProps: {
        disableRipple: true,
    },
  },
},
}));

interface ClientSideMuiProviderProps {
  children: React.ReactNode;
}

const ClientSideMuiProvider: React.FC<ClientSideMuiProviderProps> = ({children }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
}, []);

  if (!isMounted) {
    return null;
}

  // Create a client-side cache
  const clientSideEmotionCache = createEmotionCache();

  return (
    <CacheProvider value={clientSideEmotionCache}>
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </StyledEngineProvider>
    </CacheProvider>
  );
};

export default ClientSideMuiProvider;
