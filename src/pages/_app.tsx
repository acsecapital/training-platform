import '@/styles/globals.css';
import type {AppProps } from 'next/app';
import React, {useEffect } from 'react';
import {Inter, Montserrat, JetBrains_Mono } from 'next/font/google';
import {Toaster } from 'react-hot-toast';
import {ThemeProvider, createTheme, responsiveFontSizes, StyledEngineProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import {CacheProvider, EmotionCache } from '@emotion/react';
import createEmotionCache from '@/utils/createEmotionCache';
import {AuthProvider } from '@/context/AuthContext';
import {CourseProvider } from '@/context/CourseContext';
import {NotificationProvider } from '@/contexts/NotificationContext';
import {SettingsProvider } from '@/context/SettingsContext';
import {QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {ReactQueryDevtools } from '@tanstack/react-query-devtools';
import {createQueryClient } from '@/utils/queryClient';

// Font configuration
const inter = Inter({subsets: ['latin'], variable: '--font-inter'});
const montserrat = Montserrat({subsets: ['latin'], variable: '--font-montserrat'});
const jetbrainsMono = JetBrains_Mono({subsets: ['latin'], variable: '--font-jetbrains-mono'});

// Client-side cache
const clientSideEmotionCache = createEmotionCache();

// Create MUI theme
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

interface MyAppProps extends AppProps {
  emotionCache?: EmotionCache;
}

export default function App({
  Component,
  pageProps,
  emotionCache = clientSideEmotionCache
}: MyAppProps) {
  // Create the query client - only once when the component mounts
  // Using lazy initialization to ensure it only runs on the client side
  const [queryClient, setQueryClient] = React.useState<QueryClient | null>(null);

  // Initialize the query client on the client side only
  useEffect(() => {
    // Create the query client only on the client side
    setQueryClient(createQueryClient());

    // Remove the server-side injected CSS
    const jssStyles = document.querySelector('#jss-server-side');
    if (jssStyles?.parentElement) {
      jssStyles.parentElement.removeChild(jssStyles);
  }
}, []);

  // Don't render the app until the query client is initialized on the client side
  // This prevents hydration errors and ensures Firestore persistence is properly set up
  if (!queryClient) {
    // Return a minimal loading state that won't cause hydration issues
    return (
      <CacheProvider value={emotionCache}>
        <div style={{visibility: 'hidden'}}>Loading...</div>
      </CacheProvider>
    );
}

  // Once the query client is initialized, render the full app
  return (
    <CacheProvider value={emotionCache}>
      <QueryClientProvider client={queryClient}>
        <StyledEngineProvider injectFirst>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <AuthProvider>
              <SettingsProvider>
                <CourseProvider>
                  <NotificationProvider>
                    <main className={`${inter.variable} ${montserrat.variable} ${jetbrainsMono.variable}`}>
                      <Component {...pageProps} />
                      <Toaster position="top-right" />
                    </main>
                  </NotificationProvider>
                </CourseProvider>
              </SettingsProvider>
            </AuthProvider>
          </ThemeProvider>
        </StyledEngineProvider>
        {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
      </QueryClientProvider>
    </CacheProvider>
  );
}

