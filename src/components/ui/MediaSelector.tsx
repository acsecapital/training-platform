import React, {useState, useRef } from 'react';
import {uploadEditorImage } from '@/services/mediaUploadService';
import Button from '@/components/ui/Button';
import {toast } from 'sonner';

interface MediaSelectorProps {
  onSelect: (url: string) => void;
  storagePath?: string;
  allowedTypes?: string[];
  maxSizeMB?: number;
}

const MediaSelector: React.FC<MediaSelectorProps> = ({
  onSelect,
  storagePath = 'editor-images',
  allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  maxSizeMB = 5
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Validate file type
    if (!allowedTypes.includes(file.type)) {
      toast.error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
      return;
  }
    
    // Validate file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      toast.error(`File size exceeds the maximum allowed size (${maxSizeMB}MB)`);
      return;
  }
    
    try {
      setIsUploading(true);
      setUploadProgress(10);
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + Math.floor(Math.random() * 10);
          return newProgress < 90 ? newProgress : 90;
      });
    }, 300);
      
      // Upload the file
      const url = await uploadEditorImage(file, storagePath);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Call the onSelect callback with the URL
      onSelect(url);
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
      
      toast.success('Media uploaded successfully');
  } catch (error) {
      console.error('Error uploading media:', error);
      toast.error('Failed to upload media. Please try again.');
  } finally {
      setIsUploading(false);
      setUploadProgress(0);
  }
};
  
  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
  }
};
  
  return (
    <div className="flex flex-col space-y-2">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={allowedTypes.join(',')}
        className="hidden"
      />
      
      <Button
        type="button"
        variant="outline"
        onClick={handleButtonClick}
        disabled={isUploading}
        className="w-full"
      >
        {isUploading ? 'Uploading...' : 'Select Media'}
      </Button>
      
      {isUploading && (
        <div className="w-full bg-neutral-200 rounded-full h-2.5">
          <div 
            className="bg-primary h-2.5 rounded-full transition-all duration-300 ease-in-out"
            style={{width: `${uploadProgress}%` }}
          ></div>
        </div>
      )}
      
      <p className="text-xs text-neutral-500">
        Allowed types: {allowedTypes.map(type => type.replace('image/', '.')).join(', ')}
        <br />
        Max size: {maxSizeMB}MB
      </p>
    </div>
  );
};

export default MediaSelector;
