import React, {useState, useEffect } from 'react';
import {collection, getDocs, query, where } from 'firebase/firestore';
import {firestore } from '@/services/firebase';
import {MediaItem } from '../media/MediaManager';

interface CourseImageSelectorProps {
  value: string;
  onChange: (url: string) => void;
  courseId?: string;
}

const CourseImageSelector: React.FC<CourseImageSelectorProps> = ({value, onChange, courseId }) => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUrl, setSelectedUrl] = useState<string>(value || '');
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [cloudflareEnabled, setCloudflareEnabled] = useState(false);
  const [cloudflareVideoId, setCloudflareVideoId] = useState('');
  const [useCloudflare, setUseCloudflare] = useState(false);

  // Fetch course images from Firestore
  const fetchMediaItems = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get media items from Firestore
      const mediaCollection = collection(firestore, 'media');
      const mediaQuery = query(mediaCollection, where('category', '==', 'course'));
      const mediaSnapshot = await getDocs(mediaQuery);
      
      const items: MediaItem[] = [];
      
      // Process each document
      mediaSnapshot.docs.forEach(doc => {
        const data = doc.data() as MediaItem;
        items.push({
          id: doc.id,
          name: data.name,
          url: data.url,
          path: data.path,
          type: data.type,
          size: data.size,
          createdAt: data.createdAt,
          category: data.category,
          metadata: data.metadata,
      });
    });
      
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

  // Update the selected URL when the value prop changes
  useEffect(() => {
    setSelectedUrl(value || '');
    
    // Check if the URL is a Cloudflare Stream URL
    if (value && value.includes('cloudflarestream.com')) {
      setUseCloudflare(true);
      // Extract the video ID from the URL
      const match = value.match(/\/([a-zA-Z0-9]+)\/thumbnail/);
      if (match && match[1]) {
        setCloudflareVideoId(match[1]);
    }
  } else {
      setUseCloudflare(false);
  }
}, [value]);

  // Handle image selection
  const handleImageSelect = (url: string) => {
    setSelectedUrl(url);
    onChange(url);
    setShowMediaLibrary(false);
};

  // Handle Cloudflare Stream thumbnail selection
  const handleCloudflareSelect = () => {
    if (!cloudflareVideoId) return;
    
    // Construct the Cloudflare Stream thumbnail URL
    const thumbnailUrl = `https://cloudflarestream.com/${cloudflareVideoId}/thumbnail.jpg`;
    setSelectedUrl(thumbnailUrl);
    onChange(thumbnailUrl);
    setShowMediaLibrary(false);
};

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-neutral-900">Course Image</h3>
        <div className="flex space-x-2">
          <button
            type="button"
            className="px-3 py-1 text-sm border border-neutral-300 rounded-md hover:bg-neutral-50"
            onClick={() => setShowMediaLibrary(!showMediaLibrary)}
          >
            {showMediaLibrary ? 'Hide Media Library' : 'Browse Media Library'}
          </button>
          <button
            type="button"
            className="px-3 py-1 text-sm border border-neutral-300 rounded-md hover:bg-neutral-50"
            onClick={() => setUseCloudflare(!useCloudflare)}
          >
            {useCloudflare ? 'Use Uploaded Image' : 'Use Cloudflare Thumbnail'}
          </button>
        </div>
      </div>
      
      {useCloudflare ? (
        <div className="space-y-4">
          <div className="flex space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Cloudflare Stream Video ID
              </label>
              <input
                type="text"
                value={cloudflareVideoId}
                onChange={(e) => setCloudflareVideoId(e.target.value)}
                placeholder="Enter Cloudflare Stream Video ID"
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                onClick={handleCloudflareSelect}
                disabled={!cloudflareVideoId}
              >
                Use Thumbnail
              </button>
            </div>
          </div>
          
          <div className="text-sm text-neutral-500">
            <p>
              Enter the Cloudflare Stream Video ID to use its thumbnail as the course image.
              The Video ID is the alphanumeric string in the video URL.
            </p>
            <p className="mt-1">
              Example: For <code>https://cloudflarestream.com/abc123/watch</code>, the ID is <code>abc123</code>.
            </p>
          </div>
          
          {selectedUrl && useCloudflare && (
            <div className="mt-4">
              <p className="text-sm font-medium text-neutral-700 mb-2">Preview:</p>
              <div className="relative aspect-video bg-neutral-100 rounded-md overflow-hidden">
                <img
                  src={selectedUrl}
                  alt="Course thumbnail"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiPkltYWdlPC90ZXh0Pjwvc3ZnPg==';
                }}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          {selectedUrl && (
            <div className="mt-4">
              <p className="text-sm font-medium text-neutral-700 mb-2">Selected Image:</p>
              <div className="relative aspect-video bg-neutral-100 rounded-md overflow-hidden">
                <img
                  src={selectedUrl}
                  alt="Course thumbnail"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiPkltYWdlPC90ZXh0Pjwvc3ZnPg==';
                }}
                />
              </div>
            </div>
          )}
          
          {showMediaLibrary && (
            <div className="mt-4">
              <h4 className="text-md font-medium text-neutral-900 mb-2">Media Library</h4>
              
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : error ? (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  {error}
                </div>
              ) : mediaItems.length === 0 ? (
                <div className="bg-neutral-50 border border-neutral-200 text-neutral-700 px-4 py-8 rounded-md text-center">
                  <p>No course images found. Upload some images in the Media section.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {mediaItems.map((item) => (
                    <div
                      key={item.id}
                      className={`cursor-pointer rounded-md overflow-hidden border ${
                        selectedUrl === item.url
                          ? 'border-primary-500 ring-2 ring-primary-200'
                          : 'border-neutral-200 hover:border-primary-300'
                    }`}
                      onClick={() => handleImageSelect(item.url)}
                    >
                      <div className="aspect-video bg-neutral-50 relative">
                        <img
                          src={item.url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiPkltYWdlPC90ZXh0Pjwvc3ZnPg==';
                        }}
                        />
                      </div>
                      <div className="p-2">
                        <p className="text-xs text-neutral-900 truncate" title={item.name}>
                          {item.name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-md hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2"
                  onClick={() => setShowMediaLibrary(false)}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CourseImageSelector;
