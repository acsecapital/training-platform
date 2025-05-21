import React, {useState, useEffect } from 'react';
import {MediaItem } from './MediaManager';
import {doc, updateDoc } from 'firebase/firestore';
import {firestore } from '@/services/firebase';

interface MediaEditModalProps {
  item: MediaItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedItem: MediaItem) => void;
}

const MediaEditModal: React.FC<MediaEditModalProps> = ({item, isOpen, onClose, onUpdate }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'logo' | 'course' | 'general' | 'signature'>('general');
  const [usage, setUsage] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form values when item changes
  useEffect(() => {
    if (item) {
      setName(item.name);
      setCategory(item.category || 'general');
      setUsage(item.usage || '');
  }
}, [item]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!item) return;

    setLoading(true);
    setError(null);

    try {
      // Update in Firestore
      const mediaRef = doc(firestore, 'media', item.id);
      await updateDoc(mediaRef, {
        name,
        category,
        usage,
        updatedAt: new Date().toISOString(),
    });

      // Update in local state
      const updatedItem: MediaItem = {
        ...item,
        name,
        category,
        usage,
    };

      onUpdate(updatedItem);
      onClose();
  } catch (err: any) {
      console.error('Error updating media item:', err);
      setError(err.message || 'Failed to update media item. Please try again.');
  } finally {
      setLoading(false);
  }
};

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-neutral-500 opacity-75"></div>
        </div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-neutral-900 mb-4">
                    Edit Media Item
                  </h3>

                  {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
                      {error}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-1">
                        File Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-neutral-700 mb-1">
                        Category
                      </label>
                      <select
                        id="category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value as 'logo' | 'course' | 'general' | 'signature')}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="general">General</option>
                        <option value="logo">Logo</option>
                        <option value="course">Course</option>
                        <option value="signature">Signature</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="usage" className="block text-sm font-medium text-neutral-700 mb-1">
                        Usage
                      </label>
                      <select
                        id="usage"
                        value={usage}
                        onChange={(e) => setUsage(e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="">None (Regular Media)</option>
                        <option value="site-logo">Site Logo</option>
                        <option value="certificate-signature">Certificate Signature</option>
                        <option value="course-thumbnail">Course Thumbnail</option>
                      </select>
                      {category === 'signature' && usage !== 'certificate-signature' && (
                        <p className="mt-1 text-xs text-amber-600">
                          Tip: For signature images, select "Certificate Signature" usage for best results.
                        </p>
                      )}
                      {usage === 'certificate-signature' && category !== 'signature' && (
                        <p className="mt-1 text-xs text-amber-600">
                          Tip: For certificate signatures, select "Signature" category for better organization.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-neutral-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-neutral-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-neutral-700 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MediaEditModal;
