import React, {forwardRef } from 'react';
import dynamic from 'next/dynamic';
import type ReactQuill from 'react-quill'; // Import the ReactQuill instance type

// Import ReactQuill dynamically to avoid SSR issues
const DynamicReactQuill = dynamic(() => import('react-quill'), {ssr: false });
import 'react-quill/dist/quill.snow.css';

interface QuillEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  modules?: any;
  formats?: string[];
  className?: string;
}

// Use forwardRef to pass the ref down to ReactQuill
const QuillEditor = forwardRef<ReactQuill, QuillEditorProps>(( // Use the ReactQuill instance type
  {
    value,
    onChange,
    placeholder,
    modules,
    formats,
    className
},
  ref // Receive the ref here
) => {
    // Only render the editor on the client side
    const [isMounted, setIsMounted] = React.useState(false);

    React.useEffect(() => {
      setIsMounted(true);
  }, []);

    if (!isMounted) {
      return (
        <div className={`border border-neutral-300 rounded-md p-4 ${className || ''}`}>
          <div className="animate-pulse h-32 bg-neutral-100 rounded"></div>
        </div>
      );
  }

    return (
      <DynamicReactQuill
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        modules={modules}
        formats={formats}
        className={className}
        theme="snow"
      />
    );
});

QuillEditor.displayName = 'QuillEditor';

export default QuillEditor;
