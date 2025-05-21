import React, {useState, useEffect } from 'react';
import {EditorState, convertToRaw, ContentState } from 'draft-js';
import {Editor } from 'react-draft-wysiwyg';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  height?: number;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Enter content here...',
  height = 300,
}) => {
  const [editorState, setEditorState] = useState(() => EditorState.createEmpty());
  const [initialized, setInitialized] = useState(false);

  // Initialize editor with HTML content
  useEffect(() => {
    if (value) {
      const contentBlock = htmlToDraft(value);
      if (contentBlock) {
        const contentState = ContentState.createFromBlockArray(contentBlock.contentBlocks);
        const editorState = EditorState.createWithContent(contentState);
        setEditorState(editorState);
    }
  }
    setInitialized(true);
}, [value]);

  // Handle editor state changes
  const handleEditorStateChange = (state: EditorState) => {
    setEditorState(state);

    const htmlContent = draftToHtml(convertToRaw(state.getCurrentContent()));
    onChange(htmlContent);
};

  return (
    <div className="border border-neutral-300 rounded-md overflow-hidden">
      <Editor
        editorState={editorState}
        onEditorStateChange={handleEditorStateChange}
        wrapperClassName="rich-text-wrapper"
        editorClassName="rich-text-editor px-3 py-2"
        toolbarClassName="rich-text-toolbar border-b border-neutral-300"
        placeholder={placeholder}
        editorStyle={{minHeight: height, maxHeight: height * 2, overflowY: 'auto'}}
        toolbar={{
          options: ['inline', 'blockType', 'list', 'textAlign', 'link', 'embedded', 'image', 'history'],
          inline: {
            options: ['bold', 'italic', 'underline', 'strikethrough'],
        },
          blockType: {
            options: ['Normal', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'Blockquote', 'Code'],
        },
          list: {
            options: ['unordered', 'ordered'],
        },
          textAlign: {
            options: ['left', 'center', 'right', 'justify'],
        },
          link: {
            options: ['link', 'unlink'],
        },
          image: {
            uploadEnabled: true,
            alignmentEnabled: true,
            previewImage: true,
            inputAccept: 'image/gif,image/jpeg,image/jpg,image/png,image/svg',
            alt: {present: true, mandatory: false },
            defaultSize: {
              height: 'auto',
              width: 'auto',
          },
        },
      }}
      />
    </div>
  );
};

export default RichTextEditor;
