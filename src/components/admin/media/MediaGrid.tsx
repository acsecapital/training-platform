import React from 'react';
import {MediaItem } from './MediaManager';

interface MediaGridProps {
  items: MediaItem[];
  loading: boolean;
  onSelect: (item: MediaItem) => void;
  selectedItem: MediaItem | null;
  selectedItems?: string[];
  onToggleSelect?: (itemId: string) => void;
  onSelectAll?: () => void;
  onBulkDelete?: () => void;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (pageNumber: number) => void;
}

const MediaGrid: React.FC<MediaGridProps> = ({
  items,
  loading,
  onSelect,
  selectedItem,
  selectedItems = [],
  onToggleSelect,
  onSelectAll,
  onBulkDelete,
  currentPage = 1,
  totalPages = 1,
  onPageChange
}) => {
  // Function to render the appropriate thumbnail based on file type
  const renderThumbnail = (item: MediaItem) => {
    if (item.type.startsWith('image/')) {
      return (
        <img
          src={item.url}
          alt={item.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            // If image fails to load, show a placeholder
            (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiPkltYWdlPC90ZXh0Pjwvc3ZnPg==';
            console.log('Image failed to load, using placeholder');
        }}
        />
      );
  } else if (item.type.includes('pdf')) {
      return (
        <div className="flex items-center justify-center h-full bg-red-50">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
      );
  } else if (item.type.includes('word') || item.type.includes('document')) {
      return (
        <div className="flex items-center justify-center h-full bg-blue-50">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
      );
  } else {
      return (
        <div className="flex items-center justify-center h-full bg-neutral-50">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
      );
  }
};

  // Function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-center">
          <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <p className="text-center mt-4 text-neutral-600">Loading media items...</p>
      </div>
    );
}

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="mt-4 text-neutral-600">No media items found</p>
        <p className="mt-2 text-sm text-neutral-500">Upload some files to get started</p>
      </div>
    );
}

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      {/* Bulk actions */}
      {onToggleSelect && onSelectAll && onBulkDelete && (
        <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
          <div className="flex items-center">
            <input
              type="checkbox"
              className="h-4 w-4 text-primary focus:ring-primary border-neutral-300 rounded"
              checked={items.length > 0 && selectedItems.length === items.length}
              onChange={onSelectAll}
            />
            <span className="ml-2 text-sm text-neutral-600">
              {selectedItems.length} selected
            </span>
          </div>

          {selectedItems.length > 0 && (
            <button
              type="button"
              className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              onClick={onBulkDelete}
            >
              Delete Selected
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className={`group rounded-lg overflow-hidden border ${
              selectedItem?.id === item.id
                ? 'border-primary-500 ring-2 ring-primary-200'
                : selectedItems.includes(item.id)
                ? 'border-primary-300 ring-1 ring-primary-100'
                : 'border-neutral-200 hover:border-primary-300'
          }`}
          >
            {/* Selection checkbox */}
            {onToggleSelect && (
              <div className="absolute top-2 left-2 z-10">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-primary focus:ring-primary border-neutral-300 rounded"
                  checked={selectedItems.includes(item.id)}
                  onChange={() => onToggleSelect(item.id)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}

            {/* Thumbnail */}
            <div
              className="aspect-square bg-neutral-50 relative cursor-pointer"
              onClick={() => onSelect(item)}
            >
              {renderThumbnail(item)}

              {/* Overlay with file type */}
              <div className="absolute bottom-0 right-0 bg-white bg-opacity-75 text-xs px-2 py-1 rounded-tl-md">
                {item.type.split('/')[1]?.toUpperCase() || 'FILE'}
              </div>

              {/* Category badge */}
              {item.category && (
                <div className="absolute top-0 right-0 m-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    item.category === 'logo' ? 'bg-purple-100 text-purple-800' :
                    item.category === 'course' ? 'bg-blue-100 text-blue-800' :
                    item.category === 'signature' ? 'bg-red-100 text-red-800' :
                    'bg-green-100 text-green-800'
                }`}>
                    {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                  </span>
                </div>
              )}

              {/* Site Logo badge */}
              {item.usage === 'site-logo' && (
                <div className="absolute top-0 left-0 m-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                    Site Logo
                  </span>
                </div>
              )}

              {/* Certificate Signature badge */}
              {item.usage === 'certificate-signature' && (
                <div className="absolute top-0 left-0 m-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Certificate Signature
                  </span>
                </div>
              )}
            </div>

            {/* File info */}
            <div className="p-2">
              <p className="text-sm font-medium text-neutral-900 truncate" title={item.name}>
                {item.name}
              </p>
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-neutral-500">
                  {formatFileSize(item.size)}
                </p>
                <p className="text-xs text-neutral-400">
                  {item.type.split('/')[0]}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && onPageChange && (
        <div className="flex justify-center mt-6">
          <nav className="flex items-center space-x-1">
            <button
              type="button"
              className={`px-3 py-1 rounded-md ${currentPage === 1 ? 'text-neutral-400 cursor-not-allowed' : 'text-neutral-700 hover:bg-neutral-100'}`}
              onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </button>

            {Array.from({length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                className={`px-3 py-1 rounded-md ${currentPage === page ? 'bg-primary text-white' : 'text-neutral-700 hover:bg-neutral-100'}`}
                onClick={() => onPageChange(page)}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              className={`px-3 py-1 rounded-md ${currentPage === totalPages ? 'text-neutral-400 cursor-not-allowed' : 'text-neutral-700 hover:bg-neutral-100'}`}
              onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default MediaGrid;
