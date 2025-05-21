import React, {useState, useEffect } from 'react';
import RichTextEditor from './RichTextEditor';
import MediaSelector from './MediaSelector';
import {uploadEditorImage } from '@/services/mediaUploadService';
import {Tab } from '@headlessui/react';
import Button from './Button';

interface ContentEditorProps {
  initialValue: string;
  onChange: (content: string) => void;
  height?: number;
  placeholder?: string;
  editorType?: 'basic' | 'standard' | 'advanced';
  storagePath?: string;
}

const ContentEditor: React.FC<ContentEditorProps> = ({
  initialValue,
  onChange,
  height = 400,
  placeholder = 'Enter content here...',
  editorType = 'standard',
  storagePath = 'editor-images'
}) => {
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [editorContent, setEditorContent] = useState(initialValue || '');

  // Update editor content when initialValue changes
  useEffect(() => {
    setEditorContent(initialValue || '');
}, [initialValue]);

  // Handle image upload for the editor
  const handleImageUpload = async (file: File): Promise<string> => {
    return await uploadEditorImage(file, storagePath);
};

  // Handle media selection from the MediaSelector
  const handleMediaSelect = (url: string) => {
    // Insert the image into the editor content
    const imgHtml = `<img src="${url}" alt="Uploaded image" />`;
    const newContent = editorContent ? `${editorContent}${imgHtml}` : imgHtml;
    setEditorContent(newContent);
    onChange(newContent);
    setShowMediaSelector(false);
};

  return (
    <div className="border border-neutral-300 rounded-md overflow-hidden">
      {/* Editor Toolbar */}
      <div className="bg-neutral-50 border-b border-neutral-300 p-2 flex justify-between items-center">
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMediaSelector(!showMediaSelector)}
          >
            {showMediaSelector ? 'Hide Media Selector' : 'Add Media'}
          </Button>
        </div>

        <div className="flex space-x-2">
          <Tab.Group>
            <Tab.List className="flex space-x-1 rounded-md bg-neutral-200 p-1">
              <Tab
                className={({selected }) =>
                  `px-3 py-1 text-sm font-medium rounded-md ${
                    selected
                      ? 'bg-white text-neutral-900 shadow'
                      : 'text-neutral-700 hover:bg-neutral-100'
                }`
              }
                onClick={() => setPreviewMode(false)}
              >
                Edit
              </Tab>
              <Tab
                className={({selected }) =>
                  `px-3 py-1 text-sm font-medium rounded-md ${
                    selected
                      ? 'bg-white text-neutral-900 shadow'
                      : 'text-neutral-700 hover:bg-neutral-100'
                }`
              }
                onClick={() => setPreviewMode(true)}
              >
                Preview
              </Tab>
            </Tab.List>
          </Tab.Group>
        </div>
      </div>

      {/* Media Selector */}
      {showMediaSelector && (
        <div className="p-4 bg-neutral-50 border-b border-neutral-300">
          <MediaSelector
            onSelect={handleMediaSelect}
            storagePath={storagePath}
          />
        </div>
      )}

      {/* Editor / Preview */}
      <div className="relative">
        {previewMode ? (
          <div
            className="p-4 prose max-w-none"
            style={{height, overflowY: 'auto'}}
            dangerouslySetInnerHTML={{__html: editorContent || '<p>No content to preview</p>'}}
          />
        ) : (
          <RichTextEditor
            initialValue={editorContent}
            onChange={(content) => {
              setEditorContent(content);
              onChange(content);
          }}
            height={height}
            placeholder={placeholder}
            editorType={editorType}
            onImageUpload={handleImageUpload}
          />
        )}
      </div>
    </div>
  );
};

export default ContentEditor;
