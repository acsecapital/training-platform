import React, {useState, useEffect } from 'react';
import {doc, getDoc, setDoc } from 'firebase/firestore';
import {firestore } from '@/services/firebase';

interface CloudflareSettingsProps {
  onSave?: () => void;
}

interface CloudflareConfig {
  accountId: string;
  apiToken: string;
  enabled: boolean;
}

const CloudflareSettings: React.FC<CloudflareSettingsProps> = ({onSave }) => {
  const [config, setConfig] = useState<CloudflareConfig>({
    accountId: '',
    apiToken: '',
    enabled: false,
});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch Cloudflare configuration
  const fetchConfig = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const configDocRef = doc(firestore, 'settings', 'cloudflare');
      const configDoc = await getDoc(configDocRef);
      
      if (configDoc.exists()) {
        const data = configDoc.data() as CloudflareConfig;
        setConfig({
          accountId: data.accountId || '',
          apiToken: data.apiToken || '',
          enabled: data.enabled || false,
      });
    }
  } catch (err) {
      console.error('Error fetching Cloudflare config:', err);
      setError('Failed to load Cloudflare configuration.');
  } finally {
      setLoading(false);
  }
};

  // Save Cloudflare configuration
  const saveConfig = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      const configDocRef = doc(firestore, 'settings', 'cloudflare');
      await setDoc(configDocRef, {
        accountId: config.accountId,
        apiToken: config.apiToken,
        enabled: config.enabled,
        updatedAt: new Date().toISOString(),
    });
      
      setSuccess('Cloudflare configuration saved successfully.');
      if (onSave) onSave();
  } catch (err) {
      console.error('Error saving Cloudflare config:', err);
      setError('Failed to save Cloudflare configuration.');
  } finally {
      setSaving(false);
  }
};

  // Initial fetch
  useEffect(() => {
    fetchConfig();
}, []);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveConfig();
};

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {name, value, type, checked } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
  }));
};

  return (
    <div className="bg-white shadow-sm rounded-lg p-6">
      <h2 className="text-xl font-semibold text-neutral-900 mb-6">Cloudflare Stream Configuration</h2>
      
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
              {success}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Cloudflare Account ID
            </label>
            <input
              type="text"
              name="accountId"
              value={config.accountId}
              onChange={handleChange}
              placeholder="Enter your Cloudflare Account ID"
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-neutral-500">
              Your Cloudflare Account ID can be found in the Cloudflare Dashboard.
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Cloudflare API Token
            </label>
            <input
              type="password"
              name="apiToken"
              value={config.apiToken}
              onChange={handleChange}
              placeholder="Enter your Cloudflare API Token"
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-neutral-500">
              Create an API token with Stream permissions in the Cloudflare Dashboard.
            </p>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              name="enabled"
              id="enabled"
              checked={config.enabled}
              onChange={handleChange}
              className="h-4 w-4 text-primary focus:ring-primary border-neutral-300 rounded"
            />
            <label htmlFor="enabled" className="ml-2 block text-sm text-neutral-700">
              Enable Cloudflare Stream integration
            </label>
          </div>
          
          <div className="pt-4 border-t border-neutral-200">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : 'Save Configuration'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default CloudflareSettings;
