import React, {useState } from 'react';
import {useRouter } from 'next/router';
import {doc, updateDoc } from 'firebase/firestore';
import {firestore } from '@/services/firebase';
import {MediaItem } from './MediaManager';

// Helper function to ensure category is of the correct type
const ensureValidCategory = (category: string): 'logo' | 'course' | 'general' | 'signature' | undefined => {
  if (['logo', 'course', 'general', 'signature'].includes(category)) {
    return category as 'logo' | 'course' | 'general' | 'signature';
}
  return undefined;
};

interface MediaDetailsProps {
  item: MediaItem | null;
  onDelete: (item: MediaItem) => void;
  onEdit?: (item: MediaItem) => void;
}

const MediaDetails: React.FC<MediaDetailsProps> = ({item, onDelete, onEdit }) => {
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  // Function to format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
  });
};

  // Function to copy URL to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    },
      (err) => {
        console.error('Could not copy text: ', err);
    }
    );
};

  // Function to set as site logo
  const setAsSiteLogo = async () => {
    if (!item) return;

    try {
      console.log('Setting logo with:', {url: item.url, path: item.path });

      // Make API call to set as site logo
      const logoResponse = await fetch('/api/admin/settings/logo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
      },
        body: JSON.stringify({
          logoUrl: item.url,
          logoPath: item.path,
      }),
    });

      const logoResult = await logoResponse.json();
      console.log('Logo update response:', logoResult);

      if (!logoResponse.ok) {
        alert(`Failed to update logo: ${logoResult.error || 'Unknown error'}`);
        return;
    }

      // Then, update the media item to add 'site-logo' to usages
      const mediaRef = doc(firestore, 'media', item.id);

      // Prepare usages array
      const currentUsages = item.usages || [];
      const newUsages = currentUsages.includes('site-logo')
        ? currentUsages
        : [...currentUsages, 'site-logo'];

      await updateDoc(mediaRef, {
        category: 'logo',
        usage: 'site-logo', // Keep for backward compatibility
        usages: newUsages,
        updatedAt: new Date().toISOString(),
    });

      // Update the item in the parent component
      const updatedItem: MediaItem = {
        ...item,
        category: ensureValidCategory('logo'),
        usage: 'site-logo',
        usages: newUsages,
    };

      // If onEdit is provided, use it to update the item in the parent component
      if (onEdit) {
        onEdit(updatedItem);
    }

      alert('Logo updated successfully! The page will refresh to show the changes.');
      // Refresh the page after a short delay
      setTimeout(() => {
        router.reload();
    }, 1500);
  } catch (err) {
      console.error('Error setting logo:', err);
      alert('Failed to update logo. Please try again.');
  }
};

  // Function to set as footer logo
  const setAsFooterLogo = async () => {
    if (!item) return;

    try {
      console.log('Setting footer logo with:', {url: item.url, path: item.path });

      // Make API call to set as footer logo
      const logoResponse = await fetch('/api/admin/settings/footer-logo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
      },
        body: JSON.stringify({
          logoUrl: item.url,
          logoPath: item.path,
      }),
    });

      const logoResult = await logoResponse.json();
      console.log('Footer logo update response:', logoResult);

      if (!logoResponse.ok) {
        alert(`Failed to update footer logo: ${logoResult.error || 'Unknown error'}`);
        return;
    }

      // Then, update the media item to add 'footer-logo' to usages
      const mediaRef = doc(firestore, 'media', item.id);

      // Prepare usages array
      const currentUsages = item.usages || [];
      const newUsages = currentUsages.includes('footer-logo')
        ? currentUsages
        : [...currentUsages, 'footer-logo'];

      await updateDoc(mediaRef, {
        category: 'logo',
        usage: 'footer-logo', // Keep for backward compatibility
        usages: newUsages,
        updatedAt: new Date().toISOString(),
    });

      // Update the item in the parent component
      const updatedItem: MediaItem = {
        ...item,
        category: ensureValidCategory('logo'),
        usage: 'footer-logo',
        usages: newUsages,
    };

      // If onEdit is provided, use it to update the item in the parent component
      if (onEdit) {
        onEdit(updatedItem);
    }

      alert('Footer logo updated successfully! The page will refresh to show the changes.');
      // Refresh the page after a short delay
      setTimeout(() => {
        router.reload();
    }, 1500);
  } catch (err) {
      console.error('Error setting footer logo:', err);
      alert('Failed to update footer logo. Please try again.');
  }
};

  // Function to set as certificate signature
  const setAsCertificateSignature = async () => {
    if (!item) return;

    try {
      console.log('Setting certificate signature with:', {url: item.url, path: item.path });

      // Update the media item to add 'certificate-signature' to usages
      const mediaRef = doc(firestore, 'media', item.id);

      // Prepare usages array
      const currentUsages = item.usages || [];
      const newUsages = currentUsages.includes('certificate-signature')
        ? currentUsages
        : [...currentUsages, 'certificate-signature'];

      await updateDoc(mediaRef, {
        category: 'signature',
        usage: 'certificate-signature', // Keep for backward compatibility
        usages: newUsages,
        updatedAt: new Date().toISOString(),
    });

      // Update the item in the parent component
      const updatedItem: MediaItem = {
        ...item,
        category: ensureValidCategory('signature'),
        usage: 'certificate-signature',
        usages: newUsages,
    };

      // If onEdit is provided, use it to update the item in the parent component
      if (onEdit) {
        onEdit(updatedItem);
    }

      alert('Image set as certificate signature successfully!');
  } catch (err) {
      console.error('Error setting certificate signature:', err);
      alert('Failed to set as certificate signature. Please try again.');
  }
};

  if (!item) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <p className="text-neutral-600 text-center">
          Select a media item to view details
        </p>
      </div>
    );
}

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
      <h3 className="text-lg font-medium text-neutral-900">Media Details</h3>

      {/* Preview */}
      <div className="aspect-square bg-neutral-100 rounded-lg overflow-hidden flex items-center justify-center">
        {item.type.startsWith('image/') ? (
          <img
            src={item.url}
            alt={item.name}
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <div className="text-center p-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="mt-2 text-neutral-600">{item.type.split('/')[1]?.toUpperCase() || 'FILE'}</p>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-neutral-500">File Name</h4>
          <p className="mt-1 text-neutral-900 break-all">{item.name}</p>
        </div>

        <div>
          <h4 className="text-sm font-medium text-neutral-500">File Type</h4>
          <p className="mt-1 text-neutral-900">{item.type}</p>
        </div>

        <div>
          <h4 className="text-sm font-medium text-neutral-500">File Size</h4>
          <p className="mt-1 text-neutral-900">
            {item.size === 0 ? 'Unknown' : `${(item.size / 1024).toFixed(2)} KB`}
          </p>
        </div>

        <div>
          <h4 className="text-sm font-medium text-neutral-500">Category</h4>
          <p className="mt-1 text-neutral-900">
            {item.category ? item.category.charAt(0).toUpperCase() + item.category.slice(1) : 'General'}
          </p>
        </div>

        {/* Display usages */}
        {(item.usages && item.usages.length > 0) ? (
          <div>
            <h4 className="text-sm font-medium text-neutral-500">Usages</h4>
            <div className="mt-1 space-y-1">
              {item.usages.map((usage, index) => (
                <p key={index} className="text-neutral-900">
                  {usage === 'site-logo' ? (
                    <span className="inline-flex items-center text-yellow-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                      Site Logo
                    </span>
                  ) : usage === 'footer-logo' ? (
                    <span className="inline-flex items-center text-blue-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Footer Logo
                    </span>
                  ) : usage === 'certificate-signature' ? (
                    <span className="inline-flex items-center text-red-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      Certificate Signature
                    </span>
                  ) : usage}
                </p>
              ))}
            </div>
          </div>
        ) : item.usage ? (
          <div>
            <h4 className="text-sm font-medium text-neutral-500">Usage</h4>
            <p className="mt-1 text-neutral-900">
              {item.usage === 'site-logo' ? (
                <span className="inline-flex items-center text-yellow-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  Site Logo
                </span>
              ) : item.usage === 'certificate-signature' ? (
                <span className="inline-flex items-center text-red-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Certificate Signature
                </span>
              ) : item.usage}
            </p>
          </div>
        ) : null}

        <div>
          <h4 className="text-sm font-medium text-neutral-500">Uploaded</h4>
          <p className="mt-1 text-neutral-900">{formatDate(item.createdAt)}</p>
        </div>

        <div>
          <h4 className="text-sm font-medium text-neutral-500">URL</h4>
          <div className="mt-1 flex items-center">
            <input
              type="text"
              value={item.url}
              readOnly
              className="flex-1 text-sm text-neutral-900 bg-neutral-50 border border-neutral-200 rounded-md px-3 py-2 focus:outline-none"
            />
            <button
              type="button"
              className="ml-2 p-2 text-neutral-500 hover:text-primary-600"
              onClick={() => copyToClipboard(item.url)}
              title="Copy URL"
            >
              {copied ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="pt-4 border-t border-neutral-200 space-y-3">
        {item.type.startsWith('image/') && (
          <>
            <button
              type="button"
              className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              onClick={setAsSiteLogo}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Set as Site Logo
            </button>

            <button
              type="button"
              className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400"
              onClick={setAsFooterLogo}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Set as Footer Logo
            </button>

            <button
              type="button"
              className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400"
              onClick={setAsCertificateSignature}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Set as Certificate Signature
            </button>
          </>
        )}

        {onEdit && (
          <button
            type="button"
            className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-secondary hover:bg-secondary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-500"
            onClick={() => onEdit(item)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Details
          </button>
        )}

        <button
          type="button"
          className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          onClick={() => onDelete(item)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Delete
        </button>
      </div>
    </div>
  );
};

export default MediaDetails;
