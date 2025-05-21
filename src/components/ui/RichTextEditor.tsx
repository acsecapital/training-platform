import React, {useState, useEffect, useRef } from 'react';
import {Editor } from '@tinymce/tinymce-react';
import {toast } from 'sonner';

interface RichTextEditorProps {
  initialValue: string;
  onChange: (content: string) => void;
  height?: number;
  placeholder?: string;
  editorType?: 'basic' | 'standard' | 'advanced';
  inline?: boolean;
  disabled?: boolean;
  onImageUpload?: (file: File) => Promise<string>;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  initialValue,
  onChange,
  height = 400,
  placeholder = 'Enter content here...',
  editorType = 'standard',
  inline = false,
  disabled = false,
  onImageUpload,
}) => {
  const [editorContent, setEditorContent] = useState(initialValue);
  const editorRef = useRef<any>(null);

  // Update editor content when initialValue changes
  useEffect(() => {
    setEditorContent(initialValue);
}, [initialValue]);

  // Handle editor content change
  const handleEditorChange = (content: string) => {
    setEditorContent(content);
    onChange(content);
};

  // Handle image upload
  const handleImageUpload = async (blobInfo: any, progress: (percent: number) => void): Promise<string> => {
    if (!onImageUpload) {
      toast.error('Image upload is not configured');
      return Promise.reject('Image upload not configured');
  }

    try {
      const file = blobInfo.blob();
      progress(10);

      // Use the provided onImageUpload function to upload the image
      const imageUrl = await onImageUpload(file);
      progress(100);

      return imageUrl;
  } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image. Please try again.');
      return Promise.reject(error);
  }
};

  // Get plugins based on editor type
  const getPlugins = () => {
    const basicPlugins = ['autolink', 'lists', 'link', 'image', 'charmap', 'preview'];
    const standardPlugins = [
      ...basicPlugins,
      'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
      'insertdatetime', 'media', 'table', 'help', 'wordcount'
    ];
    const advancedPlugins = [
      ...standardPlugins,
      'hr', 'pagebreak', 'nonbreaking', 'template', 'toc', 'importcss',
      'quickbars', 'emoticons', 'textpattern', 'codesample'
    ];

    switch (editorType) {
      case 'basic':
        return basicPlugins;
      case 'advanced':
        return advancedPlugins;
      case 'standard':
      default:
        return standardPlugins;
  }
};

  // Get toolbar based on editor type
  const getToolbar = () => {
    const basicToolbar = 'undo redo | formatselect | bold italic | bullist numlist | link image';

    const standardToolbar = [
      'undo redo | formatselect | bold italic backcolor | alignleft aligncenter alignright alignjustify',
      'bullist numlist outdent indent | link image media table | removeformat | help'
    ].join(' | ');

    const advancedToolbar = [
      'undo redo | formatselect | bold italic underline strikethrough | forecolor backcolor | alignleft aligncenter alignright alignjustify',
      'bullist numlist outdent indent | link image media table codesample | pagebreak nonbreaking | removeformat | help',
      'blocks fontfamily fontsize styles | hr emoticons'
    ].join(' | ');

    switch (editorType) {
      case 'basic':
        return basicToolbar;
      case 'advanced':
        return advancedToolbar;
      case 'standard':
      default:
        return standardToolbar;
  }
};

  return (
    <Editor
      apiKey='xgm63oka2dpjs3mb6noaceim7ewh93fmfyoh9a0xkkhoe133'
      onInit={(evt: any, editor: any) => editorRef.current = editor}
      value={editorContent}
      onEditorChange={handleEditorChange}
      disabled={disabled}
      inline={inline}
      init={{
        height,
        menubar: editorType === 'advanced',
        plugins: getPlugins(),
        toolbar: getToolbar(),
        placeholder,
        inline,
        branding: false,
        promotion: false,
        statusbar: editorType !== 'basic',
        resize: editorType !== 'basic',
        images_upload_handler: onImageUpload ? handleImageUpload : undefined,
        file_picker_types: 'image',
        paste_data_images: !!onImageUpload,
        content_style: `
          body {
            font-family: -apple-system, BlinkMacSystemFont, San Francisco, Segoe UI, Roboto, Helvetica Neue, sans-serif;
            font-size: 14px;
            padding: ${inline ? '0' : '10px'};
        }
          .mce-content-body[data-mce-placeholder]:not(.mce-visualblocks)::before {
            color: rgba(0,0,0,0.4);
            font-style: italic;
        }
        `,
        // Educational content specific styles
        style_formats: [
          {title: 'Headers', items: [
            {title: 'Header 1', format: 'h1'},
            {title: 'Header 2', format: 'h2'},
            {title: 'Header 3', format: 'h3'},
            {title: 'Header 4', format: 'h4'},
            {title: 'Header 5', format: 'h5'},
            {title: 'Header 6', format: 'h6'}
          ]},
          {title: 'Inline', items: [
            {title: 'Bold', format: 'bold'},
            {title: 'Italic', format: 'italic'},
            {title: 'Underline', format: 'underline'},
            {title: 'Strikethrough', format: 'strikethrough'},
            {title: 'Superscript', format: 'superscript'},
            {title: 'Subscript', format: 'subscript'},
            {title: 'Code', format: 'code'}
          ]},
          {title: 'Blocks', items: [
            {title: 'Paragraph', format: 'p'},
            {title: 'Blockquote', format: 'blockquote'},
            {title: 'Div', format: 'div'},
            {title: 'Pre', format: 'pre'}
          ]},
          {title: 'Educational', items: [
            {title: 'Note Box', block: 'div', classes: 'note-box', wrapper: true },
            {title: 'Warning Box', block: 'div', classes: 'warning-box', wrapper: true },
            {title: 'Info Box', block: 'div', classes: 'info-box', wrapper: true },
            {title: 'Definition', block: 'dl', wrapper: true },
            {title: 'Example', block: 'div', classes: 'example', wrapper: true }
          ]}
        ],
        // Add custom CSS for educational content
        content_css: [
          // Add path to your custom CSS file if needed
          // '/path/to/educational-content.css'
        ],
        setup: (editor: any) => {
          editor.on('init', () => {
            // Add custom CSS for educational content boxes directly
            const customCSS = `
              .note-box {background-color: #f0f7fb; border-left: 5px solid #3498db; padding: 15px; margin: 15px 0; }
              .warning-box {background-color: #fff8f0; border-left: 5px solid #e67e22; padding: 15px; margin: 15px 0; }
              .info-box {background-color: #f0fff0; border-left: 5px solid #2ecc71; padding: 15px; margin: 15px 0; }
              .example {background-color: #f9f9f9; border: 1px solid #ddd; padding: 15px; margin: 15px 0; }
              dl {background-color: #f9f9f9; padding: 15px; margin: 15px 0; }
              dt {font-weight: bold; }
              dd {margin-left: 20px; margin-bottom: 10px; }
            `;

            // Add the styles to the editor
            const head = editor.getDoc().head;
            const style = editor.getDoc().createElement('style');
            head.appendChild(style);
            style.innerHTML = customCSS;
        });
      }
    }}
    />
  );
};

export default RichTextEditor;
