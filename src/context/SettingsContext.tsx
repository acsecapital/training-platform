import React, {createContext, useContext, useState, useEffect } from 'react';
import {doc, getDoc } from 'firebase/firestore';
import {firestore } from '@/services/firebase';

interface Logo {
  url: string;
  path: string;
  updatedAt: string;
}

interface SiteSettings {
  defaultStudentName: string;
  certificatePreviewTitle: string;
  logo?: Logo;
  footerLogo?: Logo;
  defaultPreviewName?: string;
  defaultCourseName?: string;
  organizationName?: string;
  defaultIssuerTitle?: string;
  previewDescription?: string;
  previewDataTitle?: string;
  certificateHandler?: (pdfUrl: string) => Promise<void>;
}

const defaultSettings: SiteSettings = {
  defaultStudentName: '',
  certificatePreviewTitle: 'Certificate Preview',
  defaultPreviewName: '',
  defaultCourseName: '',
  organizationName: '',
  defaultIssuerTitle: '',
  previewDescription: '',
  previewDataTitle: 'Preview Data'
};

const SettingsContext = createContext<{
  settings: SiteSettings;
  loading: boolean;
  error: string | null;
}>({
  settings: defaultSettings,
  loading: true,
  error: null
});

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider: React.FC<{children: React.ReactNode }> = ({children }) => {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Use a one-time query instead of a real-time listener
    const fetchSettings = async () => {
      try {
        // Check if we have cached settings
        const cachedSettings = localStorage.getItem('site_settings');
        const cacheTimestamp = localStorage.getItem('site_settings_timestamp');

        // Use cache if it's less than 15 minutes old
        if (cachedSettings && cacheTimestamp) {
          const timestamp = parseInt(cacheTimestamp);
          const now = Date.now();
          const fifteenMinutes = 15 * 60 * 1000;

          if (now - timestamp < fifteenMinutes) {
            setSettings({
              ...defaultSettings,
              ...JSON.parse(cachedSettings)
          });
            setLoading(false);
            return;
        }
      }

        // Fetch from Firestore if no valid cache
        const settingsRef = doc(firestore, 'settings', 'site');
        const docSnapshot = await getDoc(settingsRef);

        if (docSnapshot.exists()) {
          const settingsData = docSnapshot.data() as SiteSettings;
          setSettings({
            ...defaultSettings,
            ...settingsData
        });

          // Cache the settings
          localStorage.setItem('site_settings', JSON.stringify(settingsData));
          localStorage.setItem('site_settings_timestamp', Date.now().toString());
      }

        setLoading(false);
    } catch (error: any) {
        console.error('Error fetching settings:', error);
        setError(error.message);
        setLoading(false);

        // Try to use cached settings even if they're older
        const cachedSettings = localStorage.getItem('site_settings');
        if (cachedSettings) {
          setSettings({
            ...defaultSettings,
            ...JSON.parse(cachedSettings)
        });
      }
    }
  };

    fetchSettings();
}, []);

  return (
    <SettingsContext.Provider value={{settings, loading, error }}>
      {children}
    </SettingsContext.Provider>
  );
};

