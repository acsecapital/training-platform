import React, {useState, useEffect, useRef } from 'react';
import {ref, uploadBytes, listAll, getDownloadURL, deleteObject } from 'firebase/storage';
import {collection, addDoc, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';
import {storage, firestore } from '@/services/firebase';
import MediaUploader from './MediaUploader';
import MediaGrid from './MediaGrid';
import MediaDetails from './MediaDetails';
import MediaEditModal from './MediaEditModal';

export interface MediaItem {
  id: string;
  name: string;
  url: string;
  path: string;
  type: string;
  size: number;
  createdAt: string;
  category?: 'logo' | 'course' | 'general' | 'signature';
  usage?: string; // Legacy field - kept for backward compatibility
  usages?: string[]; // NEW: Array of usages e.g., ['site-logo', 'footer-logo', 'certificate-signature']
  metadata?: Record<string, any>;
}

const MediaManager: React.FC = () => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'images', 'documents', etc.
  const [categoryFilter, setCategoryFilter] = useState('all'); // 'all', 'logo', 'course', 'general'
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Bulk actions state
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<MediaItem | null>(null);

  // Fetch media items from Firestore
  const fetchMediaItems = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get media items from Firestore
      const mediaCollection = collection(firestore, 'media');
      const mediaSnapshot = await getDocs(mediaCollection);

      const items: MediaItem[] = [];

      // Process each document
      for (const doc of mediaSnapshot.docs) {
        const data = doc.data();

        // Convert legacy usage to usages array if needed
        let usages = data.usages || [];
        if (data.usage && !usages.includes(data.usage)) {
          usages = [...usages, data.usage];
      }

        items.push({
          id: doc.id,
          name: data.name,
          url: data.url || '',
          path: data.path,
          type: data.type,
          size: data.size,
          createdAt: data.createdAt,
          category: data.category || 'general',
          usage: data.usage, // Keep for backward compatibility
          usages: usages,
          metadata: data.metadata,
      });
    }

      // Sort by creation date (newest first)
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setMediaItems(items);
  } catch (err) {
      console.error('Error fetching media items:', err);
      setError('Failed to load media items. Please try again.');
  } finally {
      setLoading(false);
  }
};

  // Initial fetch
  useEffect(() => {
    fetchMediaItems();
}, []);

  // Handle file upload
  const handleUpload = async (files: File[], category: 'logo' | 'course' | 'general' | 'signature' = 'general') => {
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        try {
          // Create a FormData object
          const formData = new FormData();
          formData.append('file', file);
          formData.append('category', category);

          // Upload the file using our API endpoint
          const response = await fetch('/api/admin/upload', {
            method: 'POST',
            body: formData,
        });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to upload file');
        }

          const data = await response.json();

          // Add metadata to Firestore
          await addDoc(collection(firestore, 'media'), {
            name: data.file.name,
            path: data.file.path,
            type: data.file.type,
            size: data.file.size,
            url: data.file.url,
            category: category,
            createdAt: new Date().toISOString(),
        });

          // Update progress
          setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      } catch (uploadErr: any) {
          console.error(`Error uploading file ${file.name}:`, uploadErr);
          throw new Error(`Error uploading ${file.name}: ${uploadErr.message}`);
      }
    }

      // Refresh the media list
      fetchMediaItems();
  } catch (err: any) {
      console.error('Error uploading files:', err);
      setError(err.message || 'Failed to upload files. Please try again.');
  } finally {
      setIsUploading(false);
  }
};

  // Handle media item selection
  const handleSelectMedia = (item: MediaItem) => {
    setSelectedItem(item);
};

  // Handle media item deletion
  const handleDeleteItem = async (item: MediaItem) => {
    if (!confirm(`Are you sure you want to delete ${item.name}?`)) {
      return;
  }

    try {
      // Delete from Storage
      const storageRef = ref(storage, item.path);
      await deleteObject(storageRef);

      // Delete from Firestore
      await deleteDoc(doc(firestore, 'media', item.id));

      // Update state
      setMediaItems(prev => prev.filter(i => i.id !== item.id));
      if (selectedItem?.id === item.id) {
        setSelectedItem(null);
    }
  } catch (err) {
      console.error('Error deleting item:', err);
      setError('Failed to delete the item. Please try again.');
  }
};

  // Filter media items based on type, category, and search query
  // Log filter criteria for debugging
  console.log('Filtering with criteria:', {typeFilter, categoryFilter, searchQuery });
  console.log('Total items before filtering:', mediaItems.length);

  const filteredItems = mediaItems.filter(item => {
    // Filter by type
    if (typeFilter !== 'all') {
      if (typeFilter === 'images' && !item.type.startsWith('image/')) {
        return false;
    }
      if (typeFilter === 'documents' && (
        !item.type.includes('document') &&
        !item.type.includes('pdf') &&
        !item.type.includes('msword') &&
        !item.type.includes('officedocument') &&
        !item.type.includes('text/plain')
      )) {
        return false;
    }
  }

    // Filter by category
    if (categoryFilter !== 'all') {
      const itemCategory = item.category || 'general';
      if (itemCategory !== categoryFilter) {
        return false;
    }
  }

    // Filter by search query
    if (searchQuery) {
      return item.name.toLowerCase().includes(searchQuery.toLowerCase());
  }

    return true;
});

  // Log filtered results for debugging
  console.log('Filtered items:', filteredItems.length);
  if (filteredItems.length > 0) {
    console.log('Sample filtered item:', filteredItems[0]);
}

  // Calculate pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);

  // Handle page change
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
};

  // Handle bulk selection
  const handleSelectAll = () => {
    if (selectedItems.length === currentItems.length) {
      setSelectedItems([]);
  } else {
      setSelectedItems(currentItems.map(item => item.id));
  }
};

  const handleToggleSelectItem = (itemId: string) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter(id => id !== itemId));
  } else {
      setSelectedItems([...selectedItems, itemId]);
  }
};

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectedItems.length} items?`)) {
      return;
  }

    try {
      for (const itemId of selectedItems) {
        const item = mediaItems.find(i => i.id === itemId);
        if (item) {
          // Delete from Storage
          const storageRef = ref(storage, item.path);
          await deleteObject(storageRef);

          // Delete from Firestore
          await deleteDoc(doc(firestore, 'media', item.id));
      }
    }

      // Update state
      setMediaItems(prev => prev.filter(item => !selectedItems.includes(item.id)));
      setSelectedItems([]);
      if (selectedItem && selectedItems.includes(selectedItem.id)) {
        setSelectedItem(null);
    }
  } catch (err) {
      console.error('Error deleting items:', err);
      setError('Failed to delete the selected items. Please try again.');
  }
};

  // Handle edit modal
  const openEditModal = (item: MediaItem) => {
    setItemToEdit(item);
    setIsEditModalOpen(true);
};

  const closeEditModal = () => {
    setItemToEdit(null);
    setIsEditModalOpen(false);
};

  // Handle media item update
  const handleUpdateItem = (updatedItem: MediaItem) => {
    setMediaItems(prev => prev.map(item =>
      item.id === updatedItem.id ? updatedItem : item
    ));

    if (selectedItem?.id === updatedItem.id) {
      setSelectedItem(updatedItem);
  }
};

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-sm text-neutral-500">
            Manage your images, documents, and other media files
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search input */}
          <div className="relative">
            <div className="flex items-center">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search media..."
                className="w-full sm:w-64 pl-10 pr-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1); // Reset to first page when search changes
              }}
              />
            </div>
          </div>

          {/* Type Filter dropdown */}
          <select
            className="w-full sm:w-auto px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCurrentPage(1); // Reset to first page when filter changes
          }}
          >
            <option value="all">All Types</option>
            <option value="images">Images</option>
            <option value="documents">Documents</option>
          </select>

          {/* Category Filter dropdown */}
          <select
            className="w-full sm:w-auto px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1); // Reset to first page when filter changes
          }}
          >
            <option value="all">All Categories</option>
            <option value="logo">Logo</option>
            <option value="course">Course</option>
            <option value="signature">Signature</option>
            <option value="general">General</option>
          </select>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Storage Permission Fixer removed */}

      {/* Upload section */}
      <MediaUploader
        onUpload={handleUpload}
        isUploading={isUploading}
        progress={uploadProgress}
      />

      {/* Main content area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Media grid */}
        <div className="lg:col-span-2">
          <MediaGrid
            items={currentItems}
            loading={loading}
            onSelect={handleSelectMedia}
            selectedItem={selectedItem}
            selectedItems={selectedItems}
            onToggleSelect={handleToggleSelectItem}
            onSelectAll={handleSelectAll}
            onBulkDelete={handleBulkDelete}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>

        {/* Media details */}
        <div>
          <MediaDetails
            item={selectedItem}
            onDelete={handleDeleteItem}
            onEdit={openEditModal}
          />
        </div>
      </div>
      {/* Edit Modal */}
      <MediaEditModal
        item={itemToEdit}
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        onUpdate={handleUpdateItem}
      />
    </div>
  );
};

export default MediaManager;
