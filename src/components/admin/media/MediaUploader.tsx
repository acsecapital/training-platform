import React, {useState, useRef } from 'react';
import {useRouter } from 'next/router';

interface MediaUploaderProps {
  onUpload: (files: File[], category?: 'logo' | 'course' | 'general' | 'signature') => void;
  isUploading: boolean;
  progress: number;
  defaultCategory?: 'logo' | 'course' | 'general' | 'signature';
}

const MediaUploader: React.FC<MediaUploaderProps> = ({onUpload, isUploading, progress, defaultCategory = 'general'}) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<'logo' | 'course' | 'general' | 'signature'>(defaultCategory);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Handle drag events
  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
  } else if (e.type === 'dragleave') {
      setDragActive(false);
  }
};

  // Handle drop event
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError(null);

    try {
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        console.log('Dropped files:', e.dataTransfer.files);
        const filesArray = Array.from(e.dataTransfer.files);
        onUpload(filesArray, category);
    }
  } catch (err: any) {
      console.error('Error handling dropped files:', err);
      setError(err.message || 'Error uploading files');
  }
};

  // Handle file input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setError(null);

    try {
      if (e.target.files && e.target.files.length > 0) {
        console.log('Selected files:', e.target.files);
        const filesArray = Array.from(e.target.files);
        onUpload(filesArray, category);
    }
  } catch (err: any) {
      console.error('Error handling selected files:', err);
      setError(err.message || 'Error uploading files');
  }
};

  // Handle button click
  const handleButtonClick = () => {
    fileInputRef.current?.click();
};

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-6 text-center ${
        dragActive ? 'border-primary-500 bg-primary-50' : 'border-neutral-300'
    }`}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleChange}
        disabled={isUploading}
      />

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
          <p className="font-medium">Error:</p>
          <p>{error}</p>
          {error.includes('permission') && (
            <p className="mt-2 text-sm">Try clicking the "Update Storage Rules" button above and then try again.</p>
          )}
        </div>
      )}

      {isUploading ? (
        <div className="space-y-3">
          <div className="flex justify-center">
            <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-neutral-700">Uploading... {progress}%</p>
          <div className="w-full bg-neutral-200 rounded-full h-2.5">
            <div className="bg-primary h-2.5 rounded-full" style={{width: `${progress}%` }}></div>
          </div>
        </div>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="mt-2 text-sm text-neutral-600">
            Drag and drop files here, or{' '}
            <button
              type="button"
              className="text-primary hover:text-primary-700 font-medium"
              onClick={handleButtonClick}
            >
              browse
            </button>
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            Supported file types: PNG, JPG, GIF, PDF, DOC, DOCX
          </p>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-neutral-700">Category</label>
              <div className="relative group">
                <button
                  type="button"
                  className="text-neutral-400 hover:text-neutral-600 focus:outline-none"
                  aria-label="Category information"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                <div className="absolute z-10 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-300 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-neutral-800 text-white text-xs rounded shadow-lg">
                  <p><strong>Why categorize files?</strong></p>
                  <p className="mt-1">Categorizing files helps organize your media library:</p>
                  <ul className="mt-1 list-disc list-inside">
                    <li><strong>Logo</strong>: For site logos and branding</li>
                    <li><strong>Course</strong>: For course thumbnails and materials</li>
                    <li><strong>Signature</strong>: For certificate signatures</li>
                    <li><strong>General</strong>: For all other media files</li>
                  </ul>
                  <div className="absolute bottom-[-6px] left-1/2 transform -translate-x-1/2 w-3 h-3 bg-neutral-800 rotate-45"></div>
                </div>
              </div>
            </div>
            <select
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={category}
              onChange={(e) => setCategory(e.target.value as 'logo' | 'course' | 'general' | 'signature')}
              aria-label="Select a category for the uploaded files"
            >
              <option value="general">General</option>
              <option value="logo">Logo</option>
              <option value="course">Course</option>
              <option value="signature">Signature</option>
            </select>
            <p className="mt-1 text-xs text-neutral-500">
              Choose a category to organize your uploaded files for easier management.
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default MediaUploader;
